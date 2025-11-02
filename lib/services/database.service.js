"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const databaseFactory_1 = require("../database/databaseFactory");
const Endpoint_1 = require("../interfaces/Endpoint");
const crypto_1 = require("crypto");
const user_email_cache_service_1 = require("./user-email-cache.service");
class DatabaseService {
    dbClient;
    constructor(config) {
        if (config) {
            databaseFactory_1.DatabaseFactory.initializeDatabase(config);
        }
        this.dbClient = databaseFactory_1.DatabaseFactory.getPool();
    }
    getPool() {
        return this.dbClient;
    }
    async getClient() {
        return await this.dbClient.connect();
    }
    async executeRawQuery(query, values) {
        return await this.dbClient.query(query, values);
    }
    async createConfig(config) {
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
            config.status || Endpoint_1.ConfigStatus.IN_PROGRESS,
            config.tenantId,
            config.createdBy,
        ];
        const result = await this.dbClient.query(query, values);
        return result.rows[0].id;
    }
    async findConfigById(id, tenantId) {
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
    async findConfigByEndpoint(endpointPath, version, tenantId) {
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
    async findConfigsByTenant(tenantId) {
        const query = `
      SELECT * FROM config 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC
    `;
        const result = await this.dbClient.query(query, [tenantId]);
        return result.rows.map((row) => this.mapRowToConfig(row));
    }
    async findConfigsByTransactionType(transactionType, tenantId) {
        const query = `
      SELECT * FROM config 
      WHERE transaction_type = $1 AND tenant_id = $2 
      ORDER BY created_at DESC
    `;
        const result = await this.dbClient.query(query, [transactionType, tenantId]);
        return result.rows.map((row) => this.mapRowToConfig(row));
    }
    async findConfigByVersionAndTransactionType(version, transactionType, tenantId) {
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
    async findConfigByMsgFamVersionAndTransactionType(msgFam, version, transactionType, tenantId) {
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
    async findConfigsByStatus(status, tenantId) {
        const query = `
      SELECT * FROM config 
      WHERE status = $1 AND tenant_id = $2 
      ORDER BY created_at DESC
    `;
        const result = await this.dbClient.query(query, [status, tenantId]);
        return result.rows.map((row) => this.mapRowToConfig(row));
    }
    async updateConfig(id, tenantId, updates) {
        const updateFields = [];
        const values = [];
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
            values.push(updates.status);
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
        await this.dbClient.query(query, values);
    }
    async deleteConfig(id, tenantId) {
        const query = `
      DELETE FROM config 
      WHERE id = $1 AND tenant_id = $2
    `;
        await this.dbClient.query(query, [id, tenantId]);
    }
    async logAction(entry) {
        const query = `
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, actor, actor_email, endpoint_name, 
        mapping_name, version, tenant_id, details, old_values, new_values,
        ip_address, user_agent, session_id, severity, status, error_message, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `;
        const values = [
            (0, crypto_1.randomUUID)(),
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
        }
        catch (error) {
            console.error('Failed to log audit entry:', error);
            console.error('Entry data:', entry);
        }
    }
    async getAuditLogs(tenantId, entityType, actor, startDate, endDate, limit = 100) {
        let query = `
      SELECT * FROM audit_logs 
      WHERE tenant_id = $1
    `;
        const values = [tenantId];
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
    async getAuditLogsByName(name, tenantId, limit = 100) {
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
    async cacheUserEmail(tenantId, userId, email, roles, fullName) {
        try {
            user_email_cache_service_1.userEmailCache.cacheUser(tenantId, userId, email, roles, fullName);
        }
        catch (error) {
            console.error('Failed to cache user email:', error);
        }
    }
    async getEmailsByRole(tenantId, role) {
        return user_email_cache_service_1.userEmailCache.getEmailsByRole(tenantId, role);
    }
    async getEmailByUserId(tenantId, userId) {
        return user_email_cache_service_1.userEmailCache.getEmail(tenantId, userId);
    }
    async getConfigEditorEmail(configId, tenantId) {
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
    async cleanupStaleUsers(daysInactive = 90) {
        return user_email_cache_service_1.userEmailCache.cleanupStale(daysInactive);
    }
    mapRowToConfig(row) {
        return {
            id: row.id,
            msgFam: row.msg_fam,
            transactionType: row.transaction_type,
            endpointPath: row.endpoint_path,
            version: row.version,
            contentType: row.content_type,
            schema: typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema,
            mapping: row.mapping === null
                ? null
                : typeof row.mapping === 'string'
                    ? JSON.parse(row.mapping)
                    : row.mapping,
            functions: row.functions === null
                ? null
                : typeof row.functions === 'string'
                    ? JSON.parse(row.functions)
                    : row.functions,
            status: row.status,
            tenantId: row.tenant_id,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async close() {
        await this.dbClient.end();
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map