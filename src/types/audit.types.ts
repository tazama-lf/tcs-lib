export enum AuditStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  PENDING = "PENDING",
}

export enum AuditAction {
  DEPLOY_PACKAGE = "DEPLOY_PACKAGE",
  CREATE_ENTITY = "CREATE_ENTITY",
  UPDATE_ENTITY = "UPDATE_ENTITY",
  DELETE_ENTITY = "DELETE_ENTITY",
  ACCESS_RESOURCE = "ACCESS_RESOURCE",
  AUTHENTICATE = "AUTHENTICATE",
  AUTHORIZE = "AUTHORIZE",
  TRANSACTION_PROCESS = "TRANSACTION_PROCESS",
  CONFIGURATION_UPDATE = "CONFIGURATION_UPDATE",
  SYSTEM_EVENT = "SYSTEM_EVENT",
}

export enum AuditLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  CRITICAL = "CRITICAL",
}

export interface AuditMetadata {
  version?: string;
  hash?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  requestId?: string;
  source?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  actor: string;
  tenantId: string;
  action: AuditAction;
  entity: string;
  status: AuditStatus;
  level?: AuditLevel;
  message?: string;
  metadata?: AuditMetadata;
  createdAt?: Date;
}

export interface AuditLoggerConfig {
  serviceName: string;
  version?: string;
  environment?: string;
  defaultTenantId?: string;
  enableConsoleOutput?: boolean;
  enableFileOutput?: boolean;
  logFilePath?: string;
  logLevel?: AuditLevel;
}
