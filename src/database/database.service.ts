import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Config } from '../interfaces/Endpoint';

@Injectable()
export class DatabaseService {
  constructor(@Inject('PG_POOL') private readonly pgClient: Pool) {}

  async createConfig(config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    //   this.logger.log(
    //     `Creating config for ${config.msgFam} - ${config.transactionType}`,
    //   );

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

    const result = await this.pgClient.query(query, values);
    return result.rows[0].id;
  }
}
