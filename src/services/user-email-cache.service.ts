// SPDX-License-Identifier: Apache-2.0


interface CachedUser {
  userId: string;
  email: string;
  roles: string[];
  fullName?: string;
  tenantId: string;
  lastSeen: Date;
}

interface CachedGroupApprovers {
  emails: string[];
  cachedAt: Date;
  ttlMs: number; // Time-to-live in milliseconds
}

class UserEmailCache {
  // Map<tenantId_userId, CachedUser>
  private cache: Map<string, CachedUser> = new Map();
  
  // Map<tenantId_role, Set<userId>>
  private roleIndex: Map<string, Set<string>> = new Map();
  
  // Map<tenantId_groupName, CachedGroupApprovers> - for tenant+group approver caching
  private groupApproversCache: Map<string, CachedGroupApprovers> = new Map();
  
  // Default TTL for group approvers cache: 5 minutes
  private readonly DEFAULT_GROUP_APPROVERS_TTL_MS = 5 * 60 * 1000;

  /**
   * Generate cache key from tenant and user IDs
   */
  private getCacheKey(tenantId: string, userId: string): string {
    return `${tenantId}_${userId}`;
  }

  /**
   * Generate role index key
   */
  private getRoleKey(tenantId: string, role: string): string {
    return `${tenantId}_${role}`;
  }

  /**
   * Cache user email and roles (called on authentication)
   */
  cacheUser(
    tenantId: string,
    userId: string,
    email: string,
    roles: string[],
    fullName?: string,
  ): void {
    const key = this.getCacheKey(tenantId, userId);
    
    // Remove from old role indexes if updating existing user
    const existing = this.cache.get(key);
    if (existing) {
      this.removeFromRoleIndexes(tenantId, userId, existing.roles);
    }

    // Store in main cache
    const cached: CachedUser = {
      userId,
      email,
      roles,
      fullName,
      tenantId,
      lastSeen: new Date(),
    };
    this.cache.set(key, cached);

    // Update role indexes
    this.addToRoleIndexes(tenantId, userId, roles);
  }

  /**
   * Get cached email by user ID
   * Returns null if not found in cache
   */
  getEmail(tenantId: string, userId: string): string | null {
    const key = this.getCacheKey(tenantId, userId);
    const cached = this.cache.get(key);
    
    if (cached) {
      // Update last seen timestamp
      cached.lastSeen = new Date();
      return cached.email;
    }
    
    return null;
  }

  /**
   * Get all emails for users with a specific role
   * Useful for sending notifications to role groups (e.g., all approvers)
   */
  getEmailsByRole(tenantId: string, role: string): string[] {
    const roleKey = this.getRoleKey(tenantId, role);
    const userIds = this.roleIndex.get(roleKey);
    
    if (!userIds || userIds.size === 0) {
      return [];
    }

    const emails: string[] = [];
    for (const userId of userIds) {
      const email = this.getEmail(tenantId, userId);
      if (email) {
        emails.push(email);
      }
    }

    return emails;
  }

  /**
   * Get cached user details
   */
  getUser(tenantId: string, userId: string): CachedUser | null {
    const key = this.getCacheKey(tenantId, userId);
    return this.cache.get(key) || null;
  }

  /**
   * Get all cached users for a tenant
   */
  getUsersByTenant(tenantId: string): CachedUser[] {
    const users: CachedUser[] = [];
    
    for (const [key, user] of this.cache.entries()) {
      if (user.tenantId === tenantId) {
        users.push(user);
      }
    }
    
    return users;
  }

  /**
   * Add user to role indexes
   */
  private addToRoleIndexes(tenantId: string, userId: string, roles: string[]): void {
    for (const role of roles) {
      const roleKey = this.getRoleKey(tenantId, role);
      let userSet = this.roleIndex.get(roleKey);
      
      if (!userSet) {
        userSet = new Set();
        this.roleIndex.set(roleKey, userSet);
      }
      
      userSet.add(userId);
    }
  }

  /**
   * Remove user from role indexes
   */
  private removeFromRoleIndexes(tenantId: string, userId: string, roles: string[]): void {
    for (const role of roles) {
      const roleKey = this.getRoleKey(tenantId, role);
      const userSet = this.roleIndex.get(roleKey);
      
      if (userSet) {
        userSet.delete(userId);
        
        // Cleanup empty sets
        if (userSet.size === 0) {
          this.roleIndex.delete(roleKey);
        }
      }
    }
  }

  /**
   * Remove user from cache
   */
  removeUser(tenantId: string, userId: string): boolean {
    const key = this.getCacheKey(tenantId, userId);
    const user = this.cache.get(key);
    
    if (user) {
      this.removeFromRoleIndexes(tenantId, userId, user.roles);
      this.cache.delete(key);
      return true;
    }
    
    return false;
  }

  /**
   * Cleanup stale cache entries (not seen in X days)
   * Should be called periodically via cron/interval
   */
  cleanupStale(daysInactive: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    let removed = 0;
    
    for (const [key, user] of this.cache.entries()) {
      if (user.lastSeen < cutoffDate) {
        this.removeFromRoleIndexes(user.tenantId, user.userId, user.roles);
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * Clear entire cache (for testing or forced refresh)
   */
  clear(): void {
    this.cache.clear();
    this.roleIndex.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalUsers: this.cache.size,
      totalRoleIndexes: this.roleIndex.size,
      totalGroupApproversCache: this.groupApproversCache.size,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Generate group approvers cache key
   */
  private getGroupApproversKey(tenantId: string, groupName: string): string {
    return `${tenantId}_${groupName}`;
  }

  /**
   * Cache approver emails for a specific tenant+group combination
   * This reduces Keycloak API calls by caching the results
   * 
   * @param tenantId - The tenant ID
   * @param groupName - The approver group name (e.g., 'ABL', 'FNB')
   * @param emails - Array of approver email addresses
   * @param ttlMs - Optional TTL in milliseconds (default: 5 minutes)
   */
  cacheGroupApprovers(
    tenantId: string, 
    groupName: string, 
    emails: string[], 
    ttlMs?: number
  ): void {
    const key = this.getGroupApproversKey(tenantId, groupName);
    
    const cached: CachedGroupApprovers = {
      emails,
      cachedAt: new Date(),
      ttlMs: ttlMs || this.DEFAULT_GROUP_APPROVERS_TTL_MS,
    };
    
    this.groupApproversCache.set(key, cached);
    
    console.log(`✅ Cached ${emails.length} approver(s) for tenant '${tenantId}' group '${groupName}' (TTL: ${cached.ttlMs}ms)`);
  }

  /**
   * Get cached approver emails for a tenant+group
   * Returns null if not cached or if cache has expired
   * 
   * @param tenantId - The tenant ID
   * @param groupName - The approver group name
   * @returns Array of email addresses or null if cache miss/expired
   */
  getGroupApprovers(tenantId: string, groupName: string): string[] | null {
    const key = this.getGroupApproversKey(tenantId, groupName);
    const cached = this.groupApproversCache.get(key);
    
    if (!cached) {
      console.log(`ℹ️  Cache miss for tenant '${tenantId}' group '${groupName}'`);
      return null;
    }

    // Check if cache has expired
    const now = Date.now();
    const cacheAge = now - cached.cachedAt.getTime();
    
    if (cacheAge > cached.ttlMs) {
      console.log(`⏰ Cache expired for tenant '${tenantId}' group '${groupName}' (age: ${cacheAge}ms, TTL: ${cached.ttlMs}ms)`);
      this.groupApproversCache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit for tenant '${tenantId}' group '${groupName}' (${cached.emails.length} approvers, age: ${cacheAge}ms)`);
    return cached.emails;
  }

  /**
   * Invalidate (clear) cached approvers for a specific tenant+group
   * Useful when you know the group membership has changed
   */
  invalidateGroupApprovers(tenantId: string, groupName: string): boolean {
    const key = this.getGroupApproversKey(tenantId, groupName);
    const deleted = this.groupApproversCache.delete(key);
    
    if (deleted) {
      console.log(`🗑️  Invalidated cache for tenant '${tenantId}' group '${groupName}'`);
    }
    
    return deleted;
  }

  /**
   * Clear all group approvers cache
   */
  clearGroupApproversCache(): void {
    const size = this.groupApproversCache.size;
    this.groupApproversCache.clear();
    console.log(`🗑️  Cleared ${size} group approvers cache entries`);
  }
}

// Export singleton instance
export const userEmailCache = new UserEmailCache();
