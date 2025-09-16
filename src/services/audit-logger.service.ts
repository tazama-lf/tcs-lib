import { v4 as uuidv4 } from "uuid";
import {
  AuditLogEntry,
  AuditLoggerConfig,
  AuditAction,
  AuditStatus,
  AuditLevel,
} from "../types/audit.types";
import { IAuditLogger } from "../interfaces/audit-logger.interface";

export class AuditLogger implements IAuditLogger {
  private logs: Map<string, AuditLogEntry> = new Map();
  private config: Required<AuditLoggerConfig>;

  constructor(config: AuditLoggerConfig) {
    this.config = {
      serviceName: config.serviceName,
      version: config.version || "1.0.0",
      environment: config.environment || "development",
      defaultTenantId: config.defaultTenantId || "default",
      enableConsoleOutput: config.enableConsoleOutput ?? true,
      enableFileOutput: config.enableFileOutput ?? false,
      logFilePath: config.logFilePath || "./audit.log",
      logLevel: config.logLevel || AuditLevel.INFO,
    };
  }

  async log(
    entry: Omit<AuditLogEntry, "id" | "timestamp" | "createdAt">
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    const auditEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: now.toISOString(),
      createdAt: now,
      tenantId: entry.tenantId || this.config.defaultTenantId,
      level: entry.level || AuditLevel.INFO,
      metadata: {
        ...entry.metadata,
        serviceName: this.config.serviceName,
        version: this.config.version,
        environment: this.config.environment,
      },
    };

    // Store the log entry
    this.logs.set(id, auditEntry);

    // Output to console if enabled
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(auditEntry);
    }

    // TODO: Add file output if needed
    if (this.config.enableFileOutput) {
      await this.outputToFile(auditEntry);
    }

    return id;
  }

  async logSuccess(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      actor,
      action,
      entity,
      status: AuditStatus.SUCCESS,
      level: AuditLevel.INFO,
      message: message || `Successfully completed ${action} on ${entity}`,
      tenantId: this.config.defaultTenantId,
      metadata,
    });
  }

  async logFailure(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      actor,
      action,
      entity,
      status: AuditStatus.FAILURE,
      level: AuditLevel.ERROR,
      message: message || `Failed to complete ${action} on ${entity}`,
      tenantId: this.config.defaultTenantId,
      metadata,
    });
  }

  async logInfo(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      actor,
      action,
      entity,
      status: AuditStatus.SUCCESS,
      level: AuditLevel.INFO,
      message: message || `${action} performed on ${entity}`,
      tenantId: this.config.defaultTenantId,
      metadata,
    });
  }

  async logWarning(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      actor,
      action,
      entity,
      status: AuditStatus.SUCCESS,
      level: AuditLevel.WARN,
      message: message || `Warning during ${action} on ${entity}`,
      tenantId: this.config.defaultTenantId,
      metadata,
    });
  }

  async logError(
    actor: string,
    action: AuditAction,
    entity: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      actor,
      action,
      entity,
      status: AuditStatus.FAILURE,
      level: AuditLevel.ERROR,
      message: message || `Error during ${action} on ${entity}`,
      tenantId: this.config.defaultTenantId,
      metadata,
    });
  }

  async getLogs(filters?: {
    actor?: string;
    tenantId?: string;
    action?: AuditAction;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogEntry[]> {
    let logs = Array.from(this.logs.values());

    if (filters) {
      logs = logs.filter((log) => {
        if (filters.actor && log.actor !== filters.actor) return false;
        if (filters.tenantId && log.tenantId !== filters.tenantId) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.status && log.status !== filters.status) return false;
        if (
          filters.startDate &&
          log.createdAt &&
          log.createdAt < filters.startDate
        )
          return false;
        if (filters.endDate && log.createdAt && log.createdAt > filters.endDate)
          return false;
        return true;
      });
    }

    // Sort by timestamp (newest first)
    return logs.sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0;
      const dateB = b.createdAt?.getTime() || 0;
      return dateB - dateA;
    });
  }

  async getLogById(id: string): Promise<AuditLogEntry | null> {
    return this.logs.get(id) || null;
  }

  private outputToConsole(entry: AuditLogEntry): void {
    const logMessage = this.formatLogMessage(entry);

    switch (entry.level) {
      case AuditLevel.ERROR:
      case AuditLevel.CRITICAL:
        console.error(logMessage);
        break;
      case AuditLevel.WARN:
        console.warn(logMessage);
        break;
      case AuditLevel.DEBUG:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  private async outputToFile(_entry: AuditLogEntry): Promise<void> {
    // TODO: Implement file output using fs module
    // For now, this is a placeholder
    // const logMessage = this.formatLogMessage(entry);
    // fs.appendFileSync(this.config.logFilePath, logMessage + '\n');
  }

  private formatLogMessage(entry: AuditLogEntry): string {
    return JSON.stringify(
      {
        id: entry.id,
        timestamp: entry.timestamp,
        level: entry.level,
        serviceName: this.config.serviceName,
        actor: entry.actor,
        tenantId: entry.tenantId,
        action: entry.action,
        entity: entry.entity,
        status: entry.status,
        message: entry.message,
        metadata: entry.metadata,
      },
      null,
      0
    );
  }

  // Utility method to get logger configuration
  getConfig(): Readonly<Required<AuditLoggerConfig>> {
    return { ...this.config };
  }

  // Method to get log statistics
  getStats(): {
    total: number;
    byStatus: Record<AuditStatus, number>;
    byLevel: Record<AuditLevel, number>;
  } {
    const logs = Array.from(this.logs.values());
    const stats = {
      total: logs.length,
      byStatus: {} as Record<AuditStatus, number>,
      byLevel: {} as Record<AuditLevel, number>,
    };

    // Initialize counters
    Object.values(AuditStatus).forEach((status) => {
      stats.byStatus[status] = 0;
    });
    Object.values(AuditLevel).forEach((level) => {
      stats.byLevel[level] = 0;
    });

    // Count entries
    logs.forEach((log) => {
      stats.byStatus[log.status]++;
      if (log.level) {
        stats.byLevel[log.level]++;
      }
    });

    return stats;
  }
}
