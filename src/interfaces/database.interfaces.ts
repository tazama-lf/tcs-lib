export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string;
  actor: string;
  actorEmail?: string;
  tenantId: string;
  endpointName?: string;
  mappingName?: string;
  version?: string;
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
