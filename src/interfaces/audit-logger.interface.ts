import { AuditLogEntry, AuditAction, AuditStatus } from "../types/audit.types";

export interface IAuditLogger {
  /**
   * Log an audit entry
   */
  log(
    entry: Omit<AuditLogEntry, "id" | "timestamp" | "createdAt">
  ): Promise<string>;

  /**
   * Log a successful operation
   */
  logSuccess(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Log a failed operation
   */
  logFailure(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Log an informational audit entry
   */
  logInfo(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Log a warning audit entry
   */
  logWarning(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Log an error audit entry
   */
  logError(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Retrieve audit logs by criteria
   */
  getLogs(filters?: {
    actor?: string;
    tenantId?: string;
    action?: AuditAction;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogEntry[]>;

  /**
   * Get audit log by ID
   */
  getLogById(id: string): Promise<AuditLogEntry | null>;
}
