import { Pool, PoolClient } from 'pg';

import { ConfigType, ISuccess, Job, JobStatus, JobSummary, PaginatedResult, PullJobHistory, PushJob, Schedule, ScheduleStatus } from 'src/interfaces/enrichment.interface';
import { DatabaseFactory } from '../database/databaseFactory';
import type { Config } from '../types/config.types';
import { ConfigStatus } from '../types/config.types';
import type { DatabaseConfig } from '../interfaces/database.interfaces';
import { validateTableName } from './utils';
export type { AuditLogEntry, DatabaseConfig } from '../interfaces/database.interfaces';

export class DatabaseService {
  private dbClient: Pool;

  constructor(config?: DatabaseConfig) {
    if (config) {
      DatabaseFactory.initializeDatabase(config);
    }

    this.dbClient = DatabaseFactory.getPool();
  }



  getPool(): Pool {
    return this.dbClient;
  }


  async getClient(): Promise<PoolClient> {
    return await this.dbClient.connect();
  }

  // ==================== CONFIG CRUD OPERATIONS ====================


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

        created_by,

        publishing_status

      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)

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

      config.publishing_status || 'inactive',
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

  async updateConfigByStatus(id: string, status?: string): Promise<number | null> {
    try {
      const query = `
      UPDATE config
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id;
    `;

      const params = [status, id];

      const result = await this.dbClient.query(query, params);

      if (result.rowCount === 0) {
        throw new Error(`No config found with id: ${id}`);
      }

      return result.rowCount;
    } catch (error) {
      console.error('Error updating config status:', error);
      throw new Error(`Failed to update config status: ${(error as Error).message}`);
    }
  }
  async findConfigsByStatus(
    limit: number = 10,
    offset: number = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<{ data: Config[]; total: number; limit: number; offset: number }> {
    const { status, endpointPath, createdAt } = payload;

    const whereClauses: string[] = ["tenant_id = $1"];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;


    if (status) {
      const statusArray = status.split(",").map(s => s.trim());
      whereClauses.push(`status = ANY($${paramIndex++})`);
      queryParams.push(statusArray);
    }


    if (endpointPath) {
      whereClauses.push(`endpoint_path LIKE $${paramIndex++}`);
      queryParams.push(`%${endpointPath}%`);
    }

    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex++}`);
      queryParams.push(createdAt);
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM config
      ${whereClause}
    `;

    const countResult = await this.dbClient.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataQuery = `
      SELECT id, msg_fam, transaction_type, endpoint_path, version, content_type,
            status, tenant_id, created_by, 
             created_at, updated_at, publishing_status
      FROM config
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;


    const dataParams = [...queryParams, limit, offset * 10];

    const dataResult = await this.dbClient.query(dataQuery, dataParams);

    return {
      data: dataResult.rows.map((row) => this.mapRowToConfig(row)),
      total,
      limit,
      offset,
    };
  }

  async updateConfig(id: number, tenantId: string, updates: Partial<Config>): Promise<number | null> {
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

      values.push(updates.mapping ? JSON.stringify(updates.mapping) : null);
    }

    if (updates.functions !== undefined) {
      updateFields.push(`functions = $${paramIndex++}`);

      values.push(updates.functions ? JSON.stringify(updates.functions) : null);
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);

      values.push(this.convertStatusToDatabase(updates.status));
    }

    if (updates.createdBy !== undefined) {
      updateFields.push(`created_by = $${paramIndex++}`);

      values.push(updates.createdBy);
    }

    if (updates.comments !== undefined) {
      updateFields.push(`comments = $${paramIndex++}`);

      values.push(updates.comments);
    }

    if (updates.publishing_status !== undefined) {
      updateFields.push(`publishing_status = $${paramIndex++}`);

      values.push(updates.publishing_status);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    values.push(id, tenantId);

    const query = `

      UPDATE config

      SET ${updateFields.join(', ')}

      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}

      returning id;

    `;


    const result = await this.dbClient.query(query, values);


    return result.rows[0];
  }


  private convertStatusToDatabase(status: string): string {

    return status;
  }

  private normalizeStatusFromDatabase(dbStatus: string): ConfigStatus {

    return dbStatus as ConfigStatus;
  }

  private mapRowToConfig(row: any): Config {

    let parsedSchema;

    try {
      parsedSchema = typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema;

      if (parsedSchema && typeof parsedSchema === 'object') {
        const validateArrayFields = (schema: any, path: string = ''): boolean => {
          let hasIssues = false;

          if (Array.isArray(schema)) {
            for (const field of schema) {
              if (field.type === 'ARRAY') {
                if (!field.arrayElementType) {
                  console.warn(
                    ` Array field missing arrayElementType at path: ${path}.${field.name}`,
                  );

                  hasIssues = true;
                }

                if (field.arrayElementType === 'OBJECT' && !field.children) {
                  console.warn(` Object array missing children at path: ${path}.${field.name}`);

                  hasIssues = true;
                }
              }

              if (field.children && Array.isArray(field.children)) {
                const childPath = path ? `${path}.${field.name}` : field.name;

                if (validateArrayFields(field.children, childPath)) {
                  hasIssues = true;
                }
              }
            }
          }

          return hasIssues;
        };

        const hasArrayIssues = validateArrayFields(parsedSchema);

        if (hasArrayIssues) {
          console.error(
            `Schema integrity check failed for config ${row.id} - arrays lost metadata`,
          );

          console.error(`Schema preview: ${JSON.stringify(parsedSchema).substring(0, 500)}...`);
        }
      }
    } catch (error) {
      console.error(`Failed to parse schema for config ${row.id}:`, error);

      parsedSchema = row.schema;
    }

    return {
      id: row.id,

      msgFam: row.msg_fam,

      transactionType: row.transaction_type,

      endpointPath: row.endpoint_path,

      version: row.version,

      contentType: row.content_type,

      schema: parsedSchema,

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

      publishing_status: row.publishing_status,

      comments: row.comment || row.comments,
    };
  }


  // ==================== GENERAL DE OPERATIONS ====================

  async tableExist(tableName: string): Promise<boolean> {
    try {
      const cleanName = tableName.trim().toLowerCase();

      const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) AS exists;
    `;

      const result = await this.dbClient.query(query, [cleanName]);
      return result.rows[0]?.exists || false;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to check if table "${tableName}" exists: ${err.message}`);
    }
  }

  async validateExisting(table_name: string): Promise<boolean> {
    try {
      validateTableName(table_name);

      const jobResult = await this.dbClient.query(
        'SELECT * FROM pull_jobs WHERE table_name = $1 LIMIT 1;',
        [table_name],
      );

      const endpointResult = await this.dbClient.query(
        'SELECT * FROM push_jobs WHERE table_name = $1 LIMIT 1;',
        [table_name],
      );

      const jobExists = jobResult.rows.length > 0;
      const pushExists = endpointResult.rows.length > 0;
      const tableExists = await this.tableExist(table_name);

      return tableExists || jobExists || pushExists;

    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to validate existing table "${table_name}": ${err.message}`);
    }
  }

  async validateActive(tableName: string, type: ConfigType): Promise<void> {

    const targetTable = type === ConfigType.PULL ? 'pull_jobs' : 'push_jobs'
    try {
      const query = `
      SELECT COUNT(*) AS count
      FROM ${targetTable}
      WHERE table_name = $1 AND publishing_status = 'active'
    `;

      const { rows } = await this.dbClient.query(query, [tableName]);

      if (Number(rows[0].count) > 0) {
        throw new Error("Deactivate jobs with the table name used");
      }

    } catch (err) {
      const error = err as Error;
      throw new Error(
        error.message
      );
    }
  }


  // ==================== JOB OPERATIONS ====================

  async createPushJob(job: Partial<PushJob>): Promise<ISuccess> {
    try {
      const exists = await this.validateExisting(job.table_name!)

      if (job.status === JobStatus.DEPLOYED) {
        await this.validateActive(job.table_name!, ConfigType.PUSH)
      }

      const keys = Object.keys(job);
      const values = Object.values(job);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
                    INSERT INTO push_jobs (${keys.join(', ')})
                     VALUES (${placeholders})
                      RETURNING *;
                      `;
      await this.dbClient.query(insertQuery, values);


      return {
        success: true,
        message: `Push Job Created Successfully ${exists ? 'with an existing table' : ''}`
      };
    } catch (error) {
      throw new Error(`Failed to create job: ${(error as Error).message}`);
    }
  }


  async createPullJob(job: Partial<Job>): Promise<ISuccess> {
    try {
      const exists = await this.validateExisting(job.table_name!)


      if (job.status === JobStatus.DEPLOYED) {
        await this.validateActive(job.table_name!, ConfigType.PULL)
      }

      const keys = Object.keys(job);
      const values = Object.values(job);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
                    INSERT INTO pull_jobs (${keys.join(', ')})
                     VALUES (${placeholders})
                      RETURNING *;
                      `;
      await this.dbClient.query(insertQuery, values);


      return {
        success: true,
        message: `Pull Job Created Successfully ${exists ? 'with an existing table' : ''}`
      };
    } catch (error) {
      throw new Error(`Failed to create job: ${(error as Error).message}`);
    }
  }

  async getJobHistory(
    limit: number = 10,
    offset: number = 0,
    tenantId: string,
    payload: Record<string, string> = {}
  ): Promise<PaginatedResult<PullJobHistory>> {
    try {
      const { endpointName, createdAt, exception } = payload;

      const whereClauses: string[] = ["ph.tenant_id = $1"];
      const queryParams: unknown[] = [tenantId];
      let paramIndex = 2;

      if (createdAt) {
        whereClauses.push(`DATE(ph.created_at) = $${paramIndex++}`);
        queryParams.push(createdAt);
      }

      if (exception) {
        whereClauses.push(`ph.exception LIKE $${paramIndex++}`);
        queryParams.push(`%${exception}%`);
      }

      if (endpointName) {
        whereClauses.push(`pj.endpoint_name ILIKE $${paramIndex++}`);
        queryParams.push(`%${endpointName}%`);
      }

      const whereClause = `WHERE ${whereClauses.join(" AND ")}`;

      const countQuery = `
      SELECT COUNT(*) AS total
      FROM job_history ph
      LEFT JOIN pull_jobs pj ON pj.id = ph.job_id
      ${whereClause};
    `;
      const countResult = await this.dbClient.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total, 10);

      const dataQuery = `
  SELECT 
    ph.*,
    CASE 
      WHEN ph.job_type = 'pull' THEN pj.endpoint_name
      WHEN ph.job_type = 'push' THEN psh.endpoint_name
    END AS endpoint_name,
    CASE 
      WHEN ph.job_type = 'pull' THEN pj.table_name
      WHEN ph.job_type = 'push' THEN psh.table_name
    END AS table_name,
    CASE 
      WHEN ph.job_type = 'pull' THEN pj.description
      WHEN ph.job_type = 'push' THEN psh.description
    END AS description,
    CASE 
      WHEN ph.job_type = 'pull' THEN pj.version
      WHEN ph.job_type = 'push' THEN psh.version
    END AS version,
    CASE 
      WHEN ph.job_type = 'pull' THEN pj.status
      WHEN ph.job_type = 'push' THEN psh.status
    END AS status,
    CASE 
      WHEN ph.job_type = 'pull' THEN pj.publishing_status
      WHEN ph.job_type = 'push' THEN psh.publishing_status
    END AS publishing_status
  FROM job_history ph
  LEFT JOIN pull_jobs pj ON pj.id = ph.job_id AND ph.job_type = 'pull'
  LEFT JOIN push_jobs psh ON psh.id = ph.job_id AND ph.job_type = 'push'
  ${whereClause}
  ORDER BY ph.created_at DESC
  LIMIT $${paramIndex++} OFFSET $${paramIndex++};
`;
      const dataParams = [...queryParams, limit, offset * 10];
      const dataResult = await this.dbClient.query(dataQuery, dataParams);

      return {
        data: dataResult.rows as PullJobHistory[],
        total,
        limit,
        offset,
      };
    } catch (error) {
      throw new Error(
        `Error fetching job_history: ${error instanceof Error ? error.message : JSON.stringify(error)
        }`
      );
    }
  }


  async getAllJobs(
    limit: number = 10,
    offset: number = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<PaginatedResult<Job>> {
    const { status, endpointName, createdAt } = payload;
    const whereClauses: string[] = ["tenant_id = $1"];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;
    if (status) {
      const statusArray = status.split(",").map(s => s.trim());
      whereClauses.push(`status = ANY($${paramIndex++})`);
      queryParams.push(statusArray);
    }
    if (endpointName) {
      whereClauses.push(`endpoint_name LIKE $${paramIndex++}`);
      queryParams.push(`%${endpointName}%`);
    }
    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex++}`);
      queryParams.push(createdAt);
    }
    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    const countQuery = `
    SELECT SUM(count) AS total FROM (
      SELECT COUNT(*) AS count FROM push_jobs ${whereClause}
      UNION ALL
      SELECT COUNT(*) AS count FROM pull_jobs ${whereClause}
    ) AS combined_counts
  `;
    const countResult = await this.dbClient.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataQuery = `
     SELECT *
FROM (
  SELECT 
    id,
    endpoint_name,
    path,
    mode,
    table_name,
    description,
    version,
    status,
    publishing_status,
    created_at,
    updated_at,
    'push' AS type
  FROM push_jobs
  ${whereClause}

  UNION ALL

  SELECT 
    id,
    endpoint_name,
    NULL AS path,
    mode,
    table_name,
    description,
    version,
    status,
    publishing_status,
    created_at,
    updated_at,
    'pull' AS type
  FROM pull_jobs
  ${whereClause}
) AS all_jobs
ORDER BY all_jobs.updated_at DESC
LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;
    const dataParams = [...queryParams, limit, offset * 10];
    const dataResult = await this.dbClient.query(dataQuery, dataParams);
    return {
      data: dataResult.rows,
      total,
      limit,
      offset,
    };
  }

  async findJobById(id: string, tableName: string): Promise<Job | null> {
    try {

      const query = ` SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1;`;
      const result = await this.dbClient.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find job: ${(error as Error).message}`);
    }
  }

  async getJobsByStatus(
    tenant_id: string,
    status: JobStatus,
    page: number,
    limit: number
  ): Promise<JobSummary[]> {
    try {
      const offset = (page - 1) * limit;

      const query = `
      SELECT 
        id,
        endpoint_name,
        path,
        mode,
        table_name,
        description,
        version,
        status,
        publishing_status,
        created_at,
        'push' AS type
      FROM push_jobs
      WHERE tenant_id = $1 AND status = $2

      UNION ALL

      SELECT 
        id,
        endpoint_name,
        NULL AS path,
        mode,
        table_name,
        description,
        version,
        status,
        publishing_status,
        created_at,
        'pull' AS type
      FROM pull_jobs
      WHERE tenant_id = $1 AND status = $2

      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;

      const result = await this.dbClient.query<JobSummary>(query, [
        tenant_id,
        status,
        limit,
        offset,
      ]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${(error as Error).message}`);
    }
  }

  async updateJob(id: string, job: Record<string, unknown>, type: ConfigType): Promise<{ success: boolean, message: string }> {
    try {
      const tableName = type === ConfigType.PUSH ? 'push_jobs' : 'pull_jobs';

      const keys = Object.keys(job);
      const values = Object.values(job);

      if (keys.length === 0) {
        throw new Error('No fields provided to update');
      }

      const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ') + `, updated_at = NOW()`;
      const query = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE id = $${keys.length + 1};
    `;

      const result = await this.dbClient.query(query, [...values, id]);

      if (!result.rowCount) {
        throw new Error(`Job with id "${id}" not found or no changes were made`);
      }

      return {
        success: true,
        message: `Job with id "${id}" successfully updated`,
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to update job: ${err.message}`);
    }
  }


  async updateJobActivation(
    id: string,
    status: ScheduleStatus,
    type: ConfigType,
  ): Promise<Job[]> {
    try {

      const tableName = type === ConfigType.PUSH ? 'push_jobs' : 'pull_jobs'

      const job = (await this.findJobById(id, tableName) as Job)

      if (status === ScheduleStatus.ACTIVE) {
        await this.validateActive(job.table_name, type)
      }

      const query = `
                 UPDATE ${tableName}
                 SET publishing_status = $1, updated_at = NOW()
                 WHERE id = $2
                 RETURNING *;
                    `;

      const result = await this.dbClient.query(query, [status, id]);

      if (result.rows.length === 0) {
        throw new Error("Job not found or publishing_status not updated");
      }

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to update job publishing status: ${(error as Error).message}`);
    }
  }

  async updateJobByStatus(
    status: JobStatus,
    id: string,
    type: ConfigType,
    reason?: string
  ): Promise<number | null> {
    try {
      const tableName = type === ConfigType.PUSH ? 'push_jobs' : 'pull_jobs';

      const setClauses = ["status = $1", "updated_at = NOW()"];
      const params: unknown[] = [status];
      let paramIndex = 2;

      if (status === JobStatus.REJECTED || (status === JobStatus.APPROVED && reason)) {
        setClauses.push(`comments = $${paramIndex++}`);
        params.push(reason);
      }

      params.push(id);

      const query = `
      UPDATE ${tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id;
    `;

      const result = await this.dbClient.query(query, params);

      if (result.rowCount === 0) {
        throw new Error(`No job found with id: ${id}`);
      }

      return result.rowCount;
    } catch (error) {
      console.error('Error updating job status:', error);
      throw new Error(`Failed to update job status: ${(error as Error).message}`);
    }
  }



  // ==================== SCHEDULER OPERATIONS ====================

  async createSchedule(scheduleWithId: Record<string, unknown>): Promise<string> {
    try {
      const keys = Object.keys(scheduleWithId);
      const values = Object.values(scheduleWithId);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
      INSERT INTO cron_jobs (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING id;
    `;

      const result = await this.dbClient.query(insertQuery, values);
      const insertedId = result.rows[0]?.id;

      if (!insertedId) {
        throw new Error('Failed to insert schedule: No ID returned.');
      }

      return insertedId;
    } catch (error) {
      throw new Error(`Failed to create cron job: ${(error as Error).message}`);
    }
  }

  async findScheduleById(id: string): Promise<Schedule | null> {
    try {
      const query = 'SELECT * FROM cron_jobs WHERE id = $1 LIMIT 1;';
      const result = await this.dbClient.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {

      throw new Error(`Failed to find cron job: ${(error as Error).message}`);
    }
  }

  async updateSchedule(id: string, attr: Record<string, unknown>): Promise<number | null> {
    try {
      const keys = Object.keys(attr);
      const values = Object.values(attr);
      const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ') + `, updated_at = NOW()`;


      const query = `
      UPDATE cron_jobs 
      SET ${setClause} 
      WHERE id = $${keys.length + 1};
    `;

      const result = await this.dbClient.query(query, [...values, id]);

      if (result.rowCount === 0) {
        throw new Error(`No cron job found with id: ${id}`);
      }
      return result.rowCount;
    } catch (error) {

      throw new Error(`Failed to update cron job: ${(error as Error).message}`);
    }
  }


  async getAllSchedule(
    limit: number = 10,
    offset: number = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<PaginatedResult<Schedule>> {
    const { status, name, createdAt } = payload;
    const whereClauses: string[] = ["tenant_id = $1"];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;
    if (status) {
      const statusArray = status.split(",").map(s => s.trim());
      whereClauses.push(`status = ANY($${paramIndex++})`);
      queryParams.push(statusArray);
    }
    if (name) {
      whereClauses.push(`name LIKE $${paramIndex++}`);
      queryParams.push(`%${name}%`);
    }
    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex++}`);
      queryParams.push(createdAt);
    }
    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cron_jobs
      ${whereClause}
    `;
    const countResult = await this.dbClient.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataQuery = `
    SELECT * FROM cron_jobs ${whereClause}  ORDER BY updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    const dataParams = [...queryParams, limit, offset * 10];
    const dataResult = await this.dbClient.query(dataQuery, dataParams);
    return {
      data: dataResult.rows,
      total,
      limit,
      offset,
    };
  }

  async getScheduleByStatus(
    tenant_id: string,
    status: JobStatus,
    page: number,
    limit: number
  ): Promise<Schedule[]> {
    try {
      const offset = (page - 1) * limit;

      const query = `
      SELECT *
      FROM cron_jobs
      WHERE tenant_id = $1
        AND status = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;

      const result = await this.dbClient.query(query, [tenant_id, status, limit, offset]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch cron jobs: ${(error as Error).message}`);
    }
  }

  async updateScheduleByStatus(
    status: JobStatus,
    id: string,
    reason?: string
  ): Promise<number | null> {
    try {
      const setClauses = ["status = $1", "updated_at = NOW()"];
      const params: unknown[] = [status];
      let paramIndex = 2;

      if (status === JobStatus.REJECTED || (status === JobStatus.APPROVED && reason)) {
        setClauses.push(`comments = $${paramIndex++}`);
        params.push(reason);
      }

      params.push(id);

      const query = `
      UPDATE cron_jobs
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id;
    `;

      const result = await this.dbClient.query(query, params);

      if (result.rowCount === 0) {
        throw new Error(`No cron job found with id: ${id}`);
      }

      return result.rowCount;
    } catch (error) {
      console.error('Error updating cron job status:', error);
      throw new Error(`Failed to update cron job status: ${(error as Error).message}`);
    }
  }



  async getAllCollections( tenantId: string): Promise<any[]> {
    const query = `
      SELECT 
        dt.name as collection_name,
        dt.collection_type,
        dt.destination_type_id as destination_type_id,
        dt.destination_id as destination_id
      FROM destination d
      JOIN destination_type dt ON d.destination_id = dt.destination_id
      WHERE  dt.tenant_id = $1 OR dt.tenant_id = 'default'
      ORDER BY dt.name
    `;
    const result = await this.dbClient.query(query, [tenantId]);
    return result.rows;
  }
  async getCollectionFields(collectionId: number, tenantId: string): Promise<any[]> {
    const query = `
      SELECT 
        dtf.field_id,
        dtf.name as field_name,
        dtf.field_type,
        dtf.parent_id,
        dtf.serial_no,
        dtf.collection_id,
        dtf.tenant_id
      FROM destination_type_fields dtf
      WHERE dtf.collection_id = $1 AND (dtf.tenant_id = $2 OR dtf.tenant_id = 'default')
      ORDER BY dtf.serial_no, dtf.field_id
    `;
    const result = await this.dbClient.query(query, [collectionId, tenantId]);
    return result.rows;
  }
  async createDestinationType(
    collectionType: string,
    name: string,
    destinationId: number,
    tenantId: string
  ): Promise<any> {
    const query = `
      INSERT INTO destination_type (collection_type, name, destination_id, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING destination_type_id, collection_type, name, destination_id, tenant_id, created_at
    `;
    const result = await this.dbClient.query(query, [collectionType, name, destinationId, tenantId]);
    return result.rows[0];
  }

  async destinationTypeExists(destinationTypeId: number, tenantId: string): Promise<boolean> {
    const query = `SELECT destination_type_id FROM destination_type WHERE destination_type_id = $1 AND tenant_id = $2`;
    const result = await this.dbClient.query(query, [destinationTypeId, tenantId]);
    return result.rows.length > 0;
  }

  async getNextSerialNumber(destinationTypeId: number): Promise<number> {
    const query = `
      SELECT COALESCE(MAX(serial_no), 0) + 1 as next_serial
      FROM destination_type_fields
      WHERE collection_id = $1 AND parent_id IS NULL
    `;
    const result = await this.dbClient.query(query, [destinationTypeId]);
    return result.rows[0].next_serial;
  }

  async addFieldToDestinationType(
    name: string,
    fieldType: string,
    parentId: number | null,
    tenantId: string,
    serialNo: number | null,
    collectionId: number,
  ): Promise<any> {
    const query = `
      INSERT INTO destination_type_fields (name, field_type, parent_id, tenant_id, serial_no, collection_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING field_id, name as field_name, field_type, parent_id, tenant_id, serial_no, collection_id
    `;
    const result = await this.dbClient.query(query, [name, fieldType, parentId, tenantId, serialNo, collectionId]);
    return result.rows[0];
  }

  async createTransactionTypeTable(transactionType: string): Promise<void> {
    validateTableName(transactionType);
    const query = `
      CREATE TABLE IF NOT EXISTS "${transactionType}" (
        id SERIAL PRIMARY KEY,
        document JSONB NOT NULL
      )
    `;
    await this.dbClient.query(query);
  }

  async createTazamaDataModelTable(tableName: string, columns: Array<{ name: string; type: string; isPrimaryKey?: boolean | string }>): Promise<void> {
    validateTableName(tableName);
    
    const defs = columns.map((c) => `"${c.name}" ${c.type}`);
    const pks = columns
      .filter((c) => c.isPrimaryKey === true || c.isPrimaryKey === 'true')
      .map((c) => `"${c.name}"`);
    const pk = pks.length ? `, PRIMARY KEY (${pks.join(',')})` : '';
    
    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (
      ${defs.join(',')}
      ${pk}
    );`;
    
    await this.dbClient.query(query);
  }

  async close(): Promise<void> {
    await this.dbClient.end();
  }
}

