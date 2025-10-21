"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const database_config_1 = require("../config/database.config");
const databaseFactory_1 = require("../database/databaseFactory");
class DatabaseService {
    dbClient;
    constructor() {
        databaseFactory_1.DatabaseFactory.initializeDatabase(database_config_1.databaseConfig);
        this.dbClient = databaseFactory_1.DatabaseFactory.getPool();
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
            'IN_PROGRESS',
            config.tenantId,
            config.createdBy,
        ];
        const result = await this.dbClient.query(query, values);
        return result.rows[0].id;
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map