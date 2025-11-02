import { Pool, PoolClient } from 'pg';
import { Config, ConfigStatus } from '../interfaces/Endpoint';
import { JSONSchema } from '../interfaces/json-schema.interfaces';
import { FieldMapping } from '../interfaces/schema.interfaces';
import { FunctionDefinition } from '../interfaces/Endpoint';
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
export declare class DatabaseService {
    private dbClient;
    constructor(config?: DatabaseConfig);
    getPool(): Pool;
    getClient(): Promise<PoolClient>;
    executeRawQuery(query: string, values?: any[]): Promise<any>;
    createConfig(config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
    findConfigById(id: number, tenantId: string): Promise<Config | null>;
    findConfigByEndpoint(endpointPath: string, version: string, tenantId: string): Promise<Config | null>;
    findConfigsByTenant(tenantId: string): Promise<Config[]>;
    findConfigsByTransactionType(transactionType: string, tenantId: string): Promise<Config[]>;
    findConfigByVersionAndTransactionType(version: string, transactionType: string, tenantId: string): Promise<Config | null>;
    findConfigByMsgFamVersionAndTransactionType(msgFam: string, version: string, transactionType: string, tenantId: string): Promise<Config | null>;
    findConfigsByStatus(status: ConfigStatus, tenantId: string): Promise<Config[]>;
    updateConfig(id: number, tenantId: string, updates: {
        msgFam?: string;
        transactionType?: string;
        endpointPath?: string;
        version?: string;
        contentType?: string;
        schema?: JSONSchema;
        mapping?: FieldMapping[];
        functions?: FunctionDefinition[];
        status?: string;
        comments?: string;
    }): Promise<void>;
    deleteConfig(id: number, tenantId: string): Promise<void>;
    logAction(entry: AuditLogEntry): Promise<void>;
    getAuditLogs(tenantId: string, entityType?: string, actor?: string, startDate?: Date, endDate?: Date, limit?: number): Promise<any[]>;
    getAuditLogsByName(name: string, tenantId: string, limit?: number): Promise<any[]>;
    cacheUserEmail(tenantId: string, userId: string, email: string, roles: string[], fullName?: string): Promise<void>;
    getEmailsByRole(tenantId: string, role: string): Promise<string[]>;
    getEmailByUserId(tenantId: string, userId: string): Promise<string | null>;
    getConfigEditorEmail(configId: number, tenantId: string): Promise<string | null>;
    cleanupStaleUsers(daysInactive?: number): Promise<number>;
    private mapRowToConfig;
    close(): Promise<void>;
}
