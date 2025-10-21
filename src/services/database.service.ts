import { Pool } from 'pg';
import { databaseConfig } from 'src/config/database.config';
import { DatabaseFactory } from 'src/database/databaseFactory';
import { Config } from 'src/interfaces/Endpoint';

export class DatabaseService {
  private readonly dbClient: Pool;

  constructor() {
    DatabaseFactory.initializeDatabase(databaseConfig);
    this.dbClient = DatabaseFactory.getPool();
  }

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
      'IN_PROGRESS',
      config.tenantId,
      config.createdBy,
    ];

    const result = await this.dbClient.query(query, values);
    return result.rows[0].id;
  }
}
