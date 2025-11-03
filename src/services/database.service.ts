import { Pool, PoolClient } from 'pg';
import { DatabaseFactory } from '../database/databaseFactory';
import { Config, ConfigStatus } from '../interfaces/Endpoint';
import { JSONSchema } from '../interfaces/json-schema.interfaces';
import { FieldMapping } from '../interfaces/schema.interfaces';
import { FunctionDefinition } from '../interfaces/Endpoint';
import { randomUUID } from 'crypto';
import { userEmailCache } from './user-email-cache.service';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string;
  actor: string;
  actorEmail?: string;
  tenantId: string;
  endpointName?: string;
  mappingName?: string;
  version?: number;
  details?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  errorMessage?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DatabaseService {
  private dbClient: Pool;

  constructor(config?: DatabaseConfig) {
    if (config) {
      DatabaseFactory.initializeDatabase(config);
    }
    this.dbClient = DatabaseFactory.getPool();
  }

  /**
   * Get the underlying database pool
   */
  getPool(): Pool {
    return this.dbClient;
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    return await this.dbClient.connect();
  }

  // ==================== CONFIG CRUD OPERATIONS ====================

  /**
   * Create a new configuration
   */
  async createConfig(config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const query = `
      INSERT INTO config (
        msg_fam, 
        transaction_type, 
        endpoint_path, 
        version, 
        content_type, 
        schema, 
        mapping, 
        functions, 
        status, 
        tenant_id, 
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      config.msgFam,
      config.transactionType,
      config.endpointPath,
      config.version,
      config.contentType,
      JSON.stringify(config.schema),
      config.mapping ? JSON.stringify(config.mapping) : null,
      config.functions ? JSON.stringify(config.functions) : null,
      this.convertStatusToDatabase(config.status || ConfigStatus.IN_PROGRESS),
      config.tenantId,
      config.createdBy,
    ];

    const result = await this.dbClient.query(query, values);
    return result.rows[0].id;
  }

  async findConfigById(id: number, tenantId: string): Promise<Config | null> {
    const query = `
      SELECT * FROM config 
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.dbClient.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  async findConfigByEndpoint(
    endpointPath: string,
    version: string,
    tenantId: string,
  ): Promise<Config | null> {
    const query = `
      SELECT * FROM config 
      WHERE endpoint_path = $1 AND version = $2 AND tenant_id = $3
    `;
    const result = await this.dbClient.query(query, [endpointPath, version, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  async findConfigsByTenant(tenantId: string): Promise<Config[]> {
    const query = `
      SELECT * FROM config 
      WHERE tenant_id = $1 OR tenant_id IS NULL OR tenant_id = 'default'
      ORDER BY created_at DESC
    `;
    const result = await this.dbClient.query(query, [tenantId]);
    return result.rows.map((row) => this.mapRowToConfig(row));
  }

  async findConfigsByTransactionType(transactionType: string, tenantId: string): Promise<Config[]> {
    const query = `
      SELECT * FROM config 
      WHERE transaction_type = $1 AND tenant_id = $2 
      ORDER BY created_at DESC
    `;
    const result = await this.dbClient.query(query, [transactionType, tenantId]);
    return result.rows.map((row) => this.mapRowToConfig(row));
  }

  async findConfigByVersionAndTransactionType(
    version: string,
    transactionType: string,
    tenantId: string,
  ): Promise<Config | null> {
    const query = `
      SELECT * FROM config 
      WHERE version = $1 AND transaction_type = $2 AND tenant_id = $3
    `;
    const result = await this.dbClient.query(query, [version, transactionType, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  async findConfigByMsgFamVersionAndTransactionType(
    msgFam: string,
    version: string,
    transactionType: string,
    tenantId: string,
  ): Promise<Config | null> {
    const query = `
      SELECT * FROM config 
      WHERE msg_fam = $1 AND version = $2 AND transaction_type = $3 AND tenant_id = $4
    `;
    const result = await this.dbClient.query(query, [msgFam, version, transactionType, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  async findConfigsByStatus(status: ConfigStatus, tenantId: string): Promise<Config[]> {
    // The enum values are already in STATUS_XX_NAME format
    const query = `
      SELECT * FROM config 
      WHERE status = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `;
    
    const result = await this.dbClient.query(query, [status, tenantId]);
    return result.rows.map((row) => this.mapRowToConfig(row));
  }

  async updateConfig(
    id: number,
    tenantId: string,
    updates: {
      msgFam?: string;
      transactionType?: string;
      endpointPath?: string;
      version?: string;
      contentType?: string;
      schema?: JSONSchema;
      mapping?: FieldMapping[];
      functions?: FunctionDefinition[];
      status?: string;
      comments?: string; // Comments from approvers to editors (CHANGES_REQUESTED)
    },
  ): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.msgFam !== undefined) {
      updateFields.push(`msg_fam = $${paramIndex++}`);
      values.push(updates.msgFam);
    }
    if (updates.transactionType !== undefined) {
      updateFields.push(`transaction_type = $${paramIndex++}`);
      values.push(updates.transactionType);
    }
    if (updates.endpointPath !== undefined) {
      updateFields.push(`endpoint_path = $${paramIndex++}`);
      values.push(updates.endpointPath);
    }
    if (updates.version !== undefined) {
      updateFields.push(`version = $${paramIndex++}`);
      values.push(updates.version);
    }
    if (updates.contentType !== undefined) {
      updateFields.push(`content_type = $${paramIndex++}`);
      values.push(updates.contentType);
    }
    if (updates.schema !== undefined) {
      updateFields.push(`schema = $${paramIndex++}`);
      values.push(JSON.stringify(updates.schema));
    }
    if (updates.mapping !== undefined) {
      updateFields.push(`mapping = $${paramIndex++}`);
      values.push(JSON.stringify(updates.mapping));
    }
    if (updates.functions !== undefined) {
      updateFields.push(`functions = $${paramIndex++}`);
      values.push(JSON.stringify(updates.functions));
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      // Convert status to database format (STATUS_XX_NAME)
      const statusValue = this.convertStatusToDatabase(updates.status);
      console.log(`🔄 DATABASE UPDATE - Setting status to: "${statusValue}" (original: "${updates.status}")`);
      values.push(statusValue);
    }
    if (updates.comments !== undefined) {
      updateFields.push(`comments = $${paramIndex++}`);
      values.push(updates.comments);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, tenantId);

    const query = `
      UPDATE config 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    `;

    console.log(`🔍 DATABASE UPDATE QUERY:`, query);
    console.log(`🔍 DATABASE UPDATE VALUES:`, values);
    console.log(`🔍 UPDATE TARGET: id=${id}, tenantId=${tenantId}`);
    
    const result = await this.dbClient.query(query, values);
    console.log(`✅ DATABASE UPDATE RESULT: ${result.rowCount} row(s) affected`);
  }

  async deleteConfig(id: number, tenantId: string): Promise<void> {
    const query = `
      DELETE FROM config 
      WHERE id = $1 AND tenant_id = $2
    `;
    await this.dbClient.query(query, [id, tenantId]);
  }

  async logAction(entry: AuditLogEntry): Promise<void> {
    const query = `
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, actor, actor_email, endpoint_name, 
        mapping_name, version, tenant_id, details, old_values, new_values,
        ip_address, user_agent, session_id, severity, status, error_message, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `;

    const values = [
      randomUUID(),
      entry.action,
      entry.entityType,
      entry.entityId || null,
      entry.actor,
      entry.actorEmail || null,
      entry.endpointName || entry.mappingName || 'UNKNOWN',
      entry.mappingName || null,
      entry.version || null,
      entry.tenantId,
      entry.details || null,
      entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      entry.newValues ? JSON.stringify(entry.newValues) : null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.sessionId || null,
      entry.severity || 'MEDIUM',
      entry.status || 'SUCCESS',
      entry.errorMessage || null,
      new Date(),
    ];

    try {
      await this.dbClient.query(query, values);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to log audit entry:', error);
      // eslint-disable-next-line no-console
      console.error('Entry data:', entry);
    }
  }

  async getAuditLogs(
    tenantId: string,
    entityType?: string,
    actor?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<any[]> {
    let query = `
      SELECT * FROM audit_logs 
      WHERE tenant_id = $1
    `;
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (entityType) {
      query += ` AND entity_type = $${paramIndex++}`;
      values.push(entityType);
    }

    if (actor) {
      query += ` AND actor = $${paramIndex++}`;
      values.push(actor);
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await this.dbClient.query(query, values);
    return result.rows;
  }

  async getAuditLogsByName(name: string, tenantId: string, limit: number = 100): Promise<any[]> {
    const query = `
      SELECT action, actor, endpoint_name, version, timestamp 
      FROM audit_logs 
      WHERE endpoint_name = $1 AND tenant_id = $2 
      ORDER BY timestamp DESC 
      LIMIT $3
    `;
    const result = await this.dbClient.query(query, [name, tenantId, limit]);
    return result.rows;
  }

  // ==================== EMAIL CACHING FOR NOTIFICATIONS ====================

  /**
   * Cache or update user email from JWT token (called on login/auth)
   * This is non-blocking and should be called asynchronously
   * Uses in-memory cache (not database)
   */
  async cacheUserEmail(
    tenantId: string,
    userId: string,
    email: string,
    roles: string[],
    fullName?: string,
  ): Promise<void> {
    try {
      userEmailCache.cacheUser(tenantId, userId, email, roles, fullName);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to cache user email:', error);
    }
  }

  /**
   * Get all emails of users with a specific role in a tenant
   * Used for: Finding all approvers when editor submits for approval
   * Uses in-memory cache (not database)
   */
  async getEmailsByRole(tenantId: string, role: string): Promise<string[]> {
    return userEmailCache.getEmailsByRole(tenantId, role);
  }

  /**
   * Get email for a specific user by userId
   * Used for: Finding editor's email when approver requests changes
   * Uses in-memory cache (not database)
   */
  async getEmailByUserId(tenantId: string, userId: string): Promise<string | null> {
    return userEmailCache.getEmail(tenantId, userId);
  }

  /**
   * Get editor email from audit logs (find who created/last edited the config)
   * Used for: Finding the editor when approver requests changes
   */
  async getConfigEditorEmail(configId: number, tenantId: string): Promise<string | null> {
    // First try to find from audit logs with actor_email
    const auditQuery = `
      SELECT actor_email 
      FROM audit_logs 
      WHERE entity_id = $1 
        AND entity_type = 'config' 
        AND tenant_id = $2
        AND actor_email IS NOT NULL
        AND action IN ('create_config', 'update_config', 'submit_for_approval')
      ORDER BY timestamp DESC 
      LIMIT 1
    `;

    const auditResult = await this.dbClient.query(auditQuery, [configId.toString(), tenantId]);
    if (auditResult.rows.length > 0 && auditResult.rows[0].actor_email) {
      return auditResult.rows[0].actor_email;
    }

    // Fallback: Find from actor userId in audit logs, then lookup in user_emails
    const actorQuery = `
      SELECT actor 
      FROM audit_logs 
      WHERE entity_id = $1 
        AND entity_type = 'config' 
        AND tenant_id = $2
        AND action IN ('create_config', 'update_config', 'submit_for_approval')
      ORDER BY timestamp DESC 
      LIMIT 1
    `;

    const actorResult = await this.dbClient.query(actorQuery, [configId.toString(), tenantId]);
    if (actorResult.rows.length > 0) {
      const actor = actorResult.rows[0].actor;
      return await this.getEmailByUserId(tenantId, actor);
    }

    return null;
  }

  /**
   * Clean up stale user emails (users who haven't logged in for X days)
   * Optional maintenance task
   */
  /**
   * Cleanup stale cached users (not seen in X days)
   * Uses in-memory cache (not database)
   */
  async cleanupStaleUsers(daysInactive: number = 90): Promise<number> {
    return userEmailCache.cleanupStale(daysInactive);
  }

  /**
   * Convert ConfigStatus enum to database STATUS_XX_NAME format
   */
  private convertStatusToDatabase(status: string): string {
    // The enum values are already in STATUS_XX_NAME format
    // Just return as-is, this method exists for backward compatibility
    return status;
  }

  private normalizeStatusFromDatabase(dbStatus: string): ConfigStatus {
    // The enum values are already in STATUS_XX_NAME format
    // Just return as-is, this method exists for backward compatibility
    return dbStatus as ConfigStatus;
  }

  private mapRowToConfig(row: any): Config {
    return {
      id: row.id,
      msgFam: row.msg_fam,
      transactionType: row.transaction_type,
      endpointPath: row.endpoint_path,
      version: row.version,
      contentType: row.content_type,
      schema: typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema,
      mapping:
        row.mapping === null
          ? null
          : typeof row.mapping === 'string'
            ? JSON.parse(row.mapping)
            : row.mapping,
      functions:
        row.functions === null
          ? null
          : typeof row.functions === 'string'
            ? JSON.parse(row.functions)
            : row.functions,
      status: this.normalizeStatusFromDatabase(row.status),
      tenantId: row.tenant_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async close(): Promise<void> {
    await this.dbClient.end();
  }
}


