/* eslint-disable max-lines -- Database service contains comprehensive CRUD operations for multiple entities (configs, jobs, schedules) requiring significant code */
import type { Pool, PoolClient } from 'pg';

import {
  ConfigType,
  type ISuccess,
  type Job,
  JobStatus,
  type JobSummary,
  type PaginatedResult,
  type PullJobHistory,
  type PushJob,
  type Schedule,
  ScheduleStatus,
} from 'src/interfaces/enrichment.interface';
import { initializeDatabase, getPool } from '../database/databaseFactory';
import type { Config } from '../types/config.types';
import { ConfigStatus } from '../types/config.types';
import type { DatabaseConfig } from '../interfaces/database.interfaces';
import { validateTableName } from './utils';
import type { RuleEntity } from 'src/interfaces/rule.interfaces';
export type { AuditLogEntry, DatabaseConfig } from '../interfaces/database.interfaces';

export class DatabaseService {
  private readonly dbClient: Pool;

  constructor(config?: DatabaseConfig) {
    if (config) {
      void initializeDatabase(config);
    }

    this.dbClient = getPool();
  }

  getPool(): Pool {
    return this.dbClient;
  }

  async getClient(): Promise<PoolClient> {
    return await this.dbClient.connect();
  }

  // ==================== CONFIG CRUD OPERATIONS ====================

  async createConfig(
    config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>,
    id?: number,
  ): Promise<number> {
    const query = id
      ? `
      INSERT INTO config (
        id, msg_fam, transaction_type, endpoint_path, version, content_type,
        schema, mapping, functions, status, tenant_id, created_by, publishing_status, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `
      : `
      INSERT INTO config (
        msg_fam, transaction_type, endpoint_path, version, content_type,
        schema, mapping, functions, status, tenant_id, created_by, publishing_status, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const values = id
      ? [
          id,
          config.msgFam,
          config.transactionType,
          config.endpointPath,
          config.version,
          config.contentType,
          JSON.stringify(config.schema),
          config.mapping ? JSON.stringify(config.mapping) : null,
          config.functions ? JSON.stringify(config.functions) : null,
          this.convertStatusToDatabase(config.status ?? ConfigStatus.IN_PROGRESS),
          config.tenantId,
          config.createdBy,
          config.publishing_status ?? 'inactive',
          JSON.stringify(config.payload),
        ]
      : [
          config.msgFam,
          config.transactionType,
          config.endpointPath,
          config.version,
          config.contentType,
          JSON.stringify(config.schema),
          config.mapping ? JSON.stringify(config.mapping) : null,
          config.functions ? JSON.stringify(config.functions) : null,
          this.convertStatusToDatabase(config.status ?? ConfigStatus.IN_PROGRESS),
          config.tenantId,
          config.createdBy,
          config.publishing_status ?? 'inactive',
          JSON.stringify(config.payload),
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
      throw new Error(`Failed to update config status: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }
  async findConfigsByStatus(
    limit = 10,
    offset = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<{ data: Config[]; total: number; limit: number; offset: number }> {
    const { status, endpointPath, createdAt } = payload;

    const whereClauses: string[] = ['tenant_id = $1'];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      const statusArray = status.split(',').map((s) => s.trim());
      whereClauses.push(`status = ANY($${paramIndex})`);
      queryParams.push(statusArray);
      paramIndex += 1;
    }

    if (endpointPath) {
      whereClauses.push(`endpoint_path LIKE $${paramIndex}`);
      queryParams.push(`%${endpointPath}%`);
      paramIndex += 1;
    }

    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex}`);
      queryParams.push(createdAt);
      paramIndex += 1;
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
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
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

  async updateConfig(
    id: number,
    tenantId: string,
    updates: Partial<Config>,
  ): Promise<number | null> {
    const updateFields: string[] = [];

    const values: any[] = [];

    let paramIndex = 1;

    if (updates.msgFam !== undefined) {
      updateFields.push(`msg_fam = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.msgFam);
    }

    if (updates.transactionType !== undefined) {
      updateFields.push(`transaction_type = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.transactionType);
    }

    if (updates.endpointPath !== undefined) {
      updateFields.push(`endpoint_path = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.endpointPath);
    }

    if (updates.version !== undefined) {
      updateFields.push(`version = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.version);
    }

    if (updates.contentType !== undefined) {
      updateFields.push(`content_type = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.contentType);
    }

    if (updates.schema !== undefined) {
      updateFields.push(`schema = $${paramIndex}`);
      paramIndex += 1;
      values.push(JSON.stringify(updates.schema));
    }

    if (updates.mapping !== undefined) {
      updateFields.push(`mapping = $${paramIndex}`);
      paramIndex += 1;
      values.push(JSON.stringify(updates.mapping));
    }

    if (updates.functions !== undefined) {
      updateFields.push(`functions = $${paramIndex}`);
      paramIndex += 1;
      values.push(JSON.stringify(updates.functions));
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      paramIndex += 1;
      values.push(this.convertStatusToDatabase(updates.status));
    }

    if (updates.createdBy !== undefined) {
      updateFields.push(`created_by = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.createdBy);
    }

    if (updates.comments !== undefined) {
      updateFields.push(`comments = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.comments);
    }

    if (updates.publishing_status !== undefined) {
      updateFields.push(`publishing_status = $${paramIndex}`);
      paramIndex += 1;
      values.push(updates.publishing_status);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    values.push(id, tenantId);

    const query = `

      UPDATE config

      SET ${updateFields.join(', ')}

      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}

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
        const validateArrayFields = (schema: any, path = ''): boolean => {
          let hasIssues = false;

          if (Array.isArray(schema)) {
            for (const field of schema) {
              if (field.type === 'ARRAY') {
                if (!field.arrayElementType) {
                  hasIssues = true;
                }

                if (field.arrayElementType === 'OBJECT' && !field.children) {
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

        validateArrayFields(parsedSchema);
      }
    } catch (error) {
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

      comments: row.comment ?? row.comments,
      payload:
        row.payload === null
          ? null
          : typeof row.payload === 'string'
            ? JSON.parse(row.payload)
            : row.payload,
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
      return result.rows[0]?.exists ?? false;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to check if table "${tableName}" exists: ${err.message}`, {
        cause: error,
      });
    }
  }

  async validateExisting(tableName: string): Promise<boolean> {
    try {
      validateTableName(tableName);

      const jobResult = await this.dbClient.query(
        'SELECT * FROM pull_jobs WHERE table_name = $1 LIMIT 1;',
        [tableName],
      );

      const endpointResult = await this.dbClient.query(
        'SELECT * FROM push_jobs WHERE table_name = $1 LIMIT 1;',
        [tableName],
      );

      const jobExists = jobResult.rows.length > 0;
      const pushExists = endpointResult.rows.length > 0;
      const tableExists = await this.tableExist(tableName);

      return tableExists || jobExists || pushExists;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to validate existing table "${tableName}": ${err.message}`, {
        cause: error,
      });
    }
  }

  async validateActive(tableName: string, type: ConfigType): Promise<void> {
    const targetTable = type === ConfigType.PULL ? 'pull_jobs' : 'push_jobs';
    try {
      const query = `
      SELECT COUNT(*) AS count
      FROM ${targetTable}
      WHERE table_name = $1 AND publishing_status = 'active'
    `;

      const { rows } = await this.dbClient.query(query, [tableName]);

      if (Number(rows[0].count) > 0) {
        throw new Error('Deactivate jobs with the table name used');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Deactivate jobs with the table name used') {
        throw err;
      }

      throw new Error(`Failed to validate active jobs for table "${tableName}"`, { cause: err });
    }
  }

  // ==================== JOB OPERATIONS ====================

  async createPushJob(job: Partial<PushJob>): Promise<ISuccess> {
    try {
      const exists = await this.validateExisting(job.table_name!);

      if (job.status === JobStatus.DEPLOYED) {
        await this.validateActive(job.table_name!, ConfigType.PUSH);
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
        message: `Push Job Created Successfully ${exists ? 'with an existing table' : ''}`,
      };
    } catch (error) {
      throw new Error(`Failed to create job: ${(error as Error).message}`, { cause: error });
    }
  }

  async createPullJob(job: Partial<Job>): Promise<ISuccess> {
    try {
      const exists = await this.validateExisting(job.table_name!);

      if (job.status === JobStatus.DEPLOYED) {
        await this.validateActive(job.table_name!, ConfigType.PULL);
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
        message: `Pull Job Created Successfully ${exists ? 'with an existing table' : ''}`,
      };
    } catch (error) {
      throw new Error(`Failed to create job: ${(error as Error).message}`, { cause: error });
    }
  }

  async getJobHistory(
    limit = 10,
    offset = 0,
    tenantId: string,
    payload: Record<string, string> = {},
  ): Promise<PaginatedResult<PullJobHistory>> {
    try {
      const { endpointName, createdAt, exception } = payload;
      const whereClauses: string[] = ['ph.tenant_id = $1'];
      const queryParams: unknown[] = [tenantId];
      let paramIndex = 2;

      if (createdAt) {
        whereClauses.push(`DATE(ph.created_at) = $${paramIndex}`);
        queryParams.push(createdAt);
        paramIndex += 1;
      }

      if (exception) {
        whereClauses.push(`ph.exception LIKE $${paramIndex}`);
        queryParams.push(`%${exception}%`);
        paramIndex += 1;
      }

      if (endpointName) {
        whereClauses.push(`pj.endpoint_name ILIKE $${paramIndex}`);
        queryParams.push(`%${endpointName}%`);
        paramIndex += 1;
      }

      const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

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
  LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 1};
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
        `Error fetching job_history: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
        { cause: error },
      );
    }
  }

  async getAllJobs(
    limit = 10,
    offset = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<PaginatedResult<Job>> {
    const { status, endpointName, createdAt } = payload;
    const whereClauses: string[] = ['tenant_id = $1'];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;
    if (status) {
      const statusArray = status.split(',').map((s) => s.trim());
      whereClauses.push(`status = ANY($${paramIndex})`);
      queryParams.push(statusArray);
      paramIndex += 1;
    }
    if (endpointName) {
      whereClauses.push(`endpoint_name LIKE $${paramIndex}`);
      queryParams.push(`%${endpointName}%`);
      paramIndex += 1;
    }
    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex}`);
      queryParams.push(createdAt);
      paramIndex += 1;
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
      pj.id,
      pj.endpoint_name,
      pj.path,
      pj.mode,
      pj.table_name,
      pj.description,
      pj.version,
      pj.status,
      pj.publishing_status,
      pj.created_at,
      pj.updated_at,
      'push' AS type,
      NULL AS cron_job_name,
      pj.tenant_id
    FROM push_jobs pj

    UNION ALL

    SELECT 
      pl.id,
      pl.endpoint_name,
      NULL AS path,
      pl.mode,
      pl.table_name,
      pl.description,
      pl.version,
      pl.status,
      pl.publishing_status,
      pl.created_at,
      pl.updated_at,
      'pull' AS type,
      cj.name AS cron_job_name,
      pl.tenant_id
    FROM pull_jobs pl
    LEFT JOIN cron_jobs cj ON cj.id = pl.schedule_id
  ) AS all_jobs
  ${whereClause}
  ORDER BY all_jobs.updated_at DESC
  LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
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
      return result.rows[0] ?? null;
    } catch (error) {
      throw new Error(`Failed to find job: ${(error as Error).message}`, { cause: error });
    }
  }

  async getJobsByStatus(
    tenantId: string,
    status: JobStatus,
    page: number,
    limit: number,
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
        tenantId,
        status,
        limit,
        offset,
      ]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${(error as Error).message}`, { cause: error });
    }
  }

  async updateJob(
    id: string,
    job: Record<string, unknown>,
    type: ConfigType,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const tableName = type === ConfigType.PUSH ? 'push_jobs' : 'pull_jobs';

      const keys = Object.keys(job);
      const values = Object.values(job);

      if (keys.length === 0) {
        throw new Error('No fields provided to update');
      }

      const setClause =
        keys.map((key, i) => `${key} = $${i + 1}`).join(', ') + ', updated_at = NOW()';
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
      throw new Error(`Failed to update job: ${err.message}`, { cause: error });
    }
  }

  async updateJobActivation(id: string, status: ScheduleStatus, type: ConfigType): Promise<Job[]> {
    try {
      const tableName = type === ConfigType.PUSH ? 'push_jobs' : 'pull_jobs';

      const job = (await this.findJobById(id, tableName))!;

      if (status === ScheduleStatus.ACTIVE) {
        await this.validateActive(job.table_name, type);
      }

      const query = `
                 UPDATE ${tableName}
                 SET publishing_status = $1, updated_at = NOW()
                 WHERE id = $2
                 RETURNING *;
                    `;

      const result = await this.dbClient.query(query, [status, id]);

      if (result.rows.length === 0) {
        throw new Error('Job not found or publishing_status not updated');
      }

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to update job publishing status: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  async updateJobByStatus(
    status: JobStatus,
    id: string,
    type: ConfigType,
    reason?: string,
  ): Promise<number | null> {
    try {
      const tableName = type === ConfigType.PUSH ? 'push_jobs' : 'pull_jobs';

      const setClauses = ['status = $1', 'updated_at = NOW()'];
      const params: unknown[] = [status];
      let paramIndex = 2;

      if (status === JobStatus.REJECTED || (status === JobStatus.APPROVED && reason)) {
        setClauses.push(`comments = $${paramIndex}`);
        params.push(reason);
        paramIndex += 1;
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
      throw new Error(`Failed to update job status: ${(error as Error).message}`, { cause: error });
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
      throw new Error(`Failed to create cron job: ${(error as Error).message}`, { cause: error });
    }
  }

  async findScheduleById(id: string): Promise<Schedule | null> {
    try {
      const query = 'SELECT * FROM cron_jobs WHERE id = $1 LIMIT 1;';
      const result = await this.dbClient.query(query, [id]);
      return result.rows[0] ?? null;
    } catch (error) {
      throw new Error(`Failed to find cron job: ${(error as Error).message}`, { cause: error });
    }
  }

  async updateSchedule(id: string, attr: Record<string, unknown>): Promise<number | null> {
    try {
      const keys = Object.keys(attr);
      const values = Object.values(attr);
      const setClause =
        keys.map((key, i) => `${key} = $${i + 1}`).join(', ') + ', updated_at = NOW()';

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
      throw new Error(`Failed to update cron job: ${(error as Error).message}`, { cause: error });
    }
  }

  async getAllSchedule(
    limit = 10,
    offset = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<PaginatedResult<Schedule>> {
    const { status, name, createdAt } = payload;
    const whereClauses: string[] = ['tenant_id = $1'];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;
    if (status) {
      const statusArray = status.split(',').map((s) => s.trim());
      whereClauses.push(`status = ANY($${paramIndex})`);
      queryParams.push(statusArray);
      paramIndex += 1;
    }
    if (name) {
      whereClauses.push(`name LIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex += 1;
    }
    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex}`);
      queryParams.push(createdAt);
      paramIndex += 1;
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
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
    tenantId: string,
    status: JobStatus,
    page: number,
    limit: number,
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

      const result = await this.dbClient.query(query, [tenantId, status, limit, offset]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch cron jobs: ${(error as Error).message}`, { cause: error });
    }
  }

  async updateScheduleByStatus(
    status: JobStatus,
    id: string,
    reason?: string,
  ): Promise<number | null> {
    try {
      const setClauses = ['status = $1', 'updated_at = NOW()'];
      const params: unknown[] = [status];
      let paramIndex = 2;

      if (status === JobStatus.REJECTED || (status === JobStatus.APPROVED && reason)) {
        setClauses.push(`comments = $${paramIndex}`);
        params.push(reason);
        paramIndex += 1;
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
      throw new Error(`Failed to update cron job status: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  async getAllCollections(tenantId: string): Promise<any[]> {
    const query = `
      SELECT 
        dt.name as collection_name,
        dt.collection_type,
        dt.destination_type_id as destination_type_id,
        dt.destination_id as destination_id
      FROM destination_type dt
      LEFT JOIN destination d ON d.destination_id = dt.destination_id
      WHERE  LOWER(dt.tenant_id) = LOWER($1) OR LOWER(dt.tenant_id) = 'default'
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
      WHERE dtf.collection_id = $1 AND (LOWER(dtf.tenant_id) = LOWER($2) OR LOWER(dtf.tenant_id) = 'default')
      ORDER BY dtf.serial_no, dtf.field_id
    `;
    const result = await this.dbClient.query(query, [collectionId, tenantId]);
    return result.rows;
  }
  async createDestinationType(
    collectionType: string,
    name: string,
    destinationId: number,
    tenantId: string,
  ): Promise<any> {
    const query = `
      INSERT INTO destination_type (collection_type, name, destination_id, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING destination_type_id, collection_type, name, destination_id, tenant_id, created_at
    `;
    const result = await this.dbClient.query(query, [
      collectionType,
      name,
      destinationId,
      tenantId,
    ]);

    return result.rows[0];
  }

  async destinationTypeExists(destinationTypeId: number, tenantId: string): Promise<boolean> {
    // eslint-disable-next-line @stylistic/quotes -- SQL queries require specific quote syntax
    const query = `SELECT destination_type_id FROM destination_type WHERE destination_type_id = $1 AND (LOWER(tenant_id) = LOWER($2) or LOWER(tenant_id)='default')`;
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
    const result = await this.dbClient.query(query, [
      name,
      fieldType,
      parentId,
      tenantId,
      serialNo,
      collectionId,
    ]);
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

  async createTazamaDataModelTable(tableName: string): Promise<void> {
    validateTableName(tableName);

    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (
      _key text PRIMARY KEY,
      data jsonb NOT NULL
    )`;

    await this.dbClient.query(query);
  }
  // ===========================TRS OPERATIONS ==========================

  async findRulesWithFilters(
    limit = 10,
    offset = 0,
    payload: Record<string, string>,
    tenantId: string,
  ): Promise<{ data: unknown; total: number; limit: number; offset: number }> {
    const {
      status,
      publishingStatus,
      createdAt,
      startDate,
      endDate,
      ruleName,
      ruleType,
      updatedBy,
    } = payload;

    const whereClauses: string[] = ['tenant_id = $1'];
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      const statusArray = status.split(',').map((s) => s.trim());
      whereClauses.push(`status = ANY($${paramIndex})`);
      queryParams.push(statusArray);
      paramIndex += 1;
    }

    if (publishingStatus) {
      whereClauses.push(`publishing_status = $${paramIndex}`);
      queryParams.push(publishingStatus.toLowerCase());
      paramIndex += 1;
    }

    if (ruleName) {
      whereClauses.push(`rule_name ILIKE $${paramIndex}`);
      queryParams.push(`%${ruleName}%`);
      paramIndex += 1;
    }

    if (ruleType) {
      whereClauses.push(`rule_type = $${paramIndex}`);
      queryParams.push(ruleType);
      paramIndex += 1;
    }

    if (updatedBy) {
      whereClauses.push(`updated_by ILIKE $${paramIndex}`);
      queryParams.push(`%${updatedBy}%`);
      paramIndex += 1;
    }

    if (createdAt) {
      whereClauses.push(`DATE(created_at) = $${paramIndex}`);
      queryParams.push(createdAt);
      paramIndex += 1;
    }

    if (startDate && endDate) {
      whereClauses.push(`DATE(created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      whereClauses.push(`DATE(created_at) >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex += 1;
    } else if (endDate) {
      whereClauses.push(`DATE(created_at) <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex += 1;
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

    const countQuery = `
    SELECT COUNT(*) AS total
    FROM trs_rules
    ${whereClause}
  `;

    const countResult = await this.dbClient.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataQuery = `
    SELECT
      id,
      rule_name,
      description,
      tenant_id,
      txtp,
      version,
      status,
      publishing_status,
      updated_by,
      created_at,
      updated_at,
      rule_type,
      rule_config_id
    FROM trs_rules
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    const dataParams = [...queryParams, limit, offset * limit];

    const dataResult = await this.dbClient.query(dataQuery, dataParams);

    return {
      data: dataResult.rows,
      total,
      limit,
      offset,
    };
  }

  async findRuleById(id: number, tenantId: string): Promise<RuleEntity | null> {
    const query = `
      SELECT id, rule_name, description, tenant_id, txtp, version, status, publishing_status, updated_by, rule_type, rule_config_id, created_at, updated_at
      FROM trs_rules
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await this.dbClient.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async getVersionsOfTransactionType(transactionType: string, tenantId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT version
      FROM config
      WHERE transaction_type = $1 and tenant_id = $2;
  `;

    const result = await this.dbClient.query(query, [transactionType, tenantId]);

    if (result.rows.length > 0) {
      return result.rows.map((row) => row.version);
    } else {
      return [];
    }
  }

  async saveRuleRequest(
    txTp: string,
    tenantId: string,
    ruleRequest: Record<string, unknown>,
  ): Promise<void> {
    const query = `
      INSERT INTO trs_rules (rulerequest)
      VALUES ($1);
      WHERE "tenantid" = $2 AND "txtp" = $3
    `;

    const values = [ruleRequest, tenantId, txTp];

    await this.dbClient.query(query, values);
  }

  async createRule(ruleData: {
    rule_name: string;
    description: string;
    tenant_id: string;
    txtp: string;
    txtp_version?: string;
    version: string;
    status?: string;
    publishing_status?: string;
    updated_by: string;
    rule_type: string;
    rule_config_id?: string;
  }): Promise<RuleEntity> {
    const query = `
    INSERT INTO trs_rules (
      rule_name,
      description,
      tenant_id,
      txtp,
      txtp_version,
      version,
      status,
      publishing_status,
      updated_by,
      rule_type,
      updated_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'STATUS_01_IN_PROGRESS'),COALESCE($8, 'ACTIVE'), $9, $10, NOW(), NOW())
    RETURNING id, rule_name, description, tenant_id, txtp, version, status, publishing_status, updated_by, rule_type, created_at, updated_at
  `;

    const values = [
      ruleData.rule_name,
      ruleData.description,
      ruleData.tenant_id,
      ruleData.txtp,
      ruleData.txtp_version,
      ruleData.version,
      ruleData.status,
      ruleData.publishing_status,
      ruleData.updated_by,
      ruleData.rule_type,
    ];

    const result = await this.dbClient.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Failed to create rule: No data returned');
    }

    return result.rows[0];
  }

  async updateRule(
    ruleId: string,
    tenantId: string,
    updateData: Partial<{
      rule_name: string;
      description: string;
      txtp: string;
      version: string;
      status: string;
      publishing_status: string;
      rule_type: string;
      rule_config_id: string;
      updated_by: string;
    }>,
  ): Promise<RuleEntity | null> {
    // Build dynamic SET clause based on provided fields
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Always update updated_at
    setClauses.push('updated_at = NOW()');

    // Dynamically add fields from updateData
    Object.entries(updateData).forEach(([key, value]) => {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex += 1;
    });

    // Add WHERE clause parameters (rule_id and tenant_id)
    const ruleIdParam = paramIndex;
    const tenantIdParam = paramIndex + 1;

    const query = `
      UPDATE trs_rules
      SET ${setClauses.join(', ')}
      WHERE id = $${ruleIdParam}
        AND tenant_id = $${tenantIdParam}
      RETURNING id, rule_name, description, tenant_id, txtp, version, status, publishing_status, updated_by, rule_type, rule_config_id, created_at, updated_at
    `;

    values.push(ruleId, tenantId);

    const result = await this.dbClient.query(query, values);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findAllRuleIds(
    tenantId: string,
  ): Promise<Array<{ ruleId: string; ruleCfg: any; tenantId: string }>> {
    const query = `
      SELECT "ruleid", "rulecfg", "tenantid"
      FROM rule
      WHERE "tenantid" = $1
      ORDER BY "ruleid"
    `;

    const result = await this.dbClient.query(query, [tenantId]);
    return result.rows;
  }

  async findRuleConfiguration(ruleId: string, tenantId: string): Promise<any> {
    const query = `
      SELECT configuration
      FROM rule
      WHERE "ruleid" = $1 AND "tenantid" = $2`;

    const result = await this.dbClient.query(query, [ruleId, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].configuration;
  }

  async findAllTransactionTypes(tenantId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT transaction_type
      FROM config
      WHERE tenant_id = $1
        AND (
          (status = 'STATUS_04_APPROVED') 
          OR 
          (status = 'STATUS_06_EXPORTED')
        )
      ORDER BY transaction_type
    `;

    const result = await this.dbClient.query(query, [tenantId]);

    return result.rows.map((row) => row.transaction_type);
  }

  async getPayloadByTransactionType(transactionType: string, tenantId: string): Promise<any> {
    if (!transactionType || !tenantId) {
      throw new Error('Transaction type and tenant ID are required');
    }

    const query = `
      SELECT payload
      FROM config
      WHERE transaction_type = $1 AND tenant_id = $2
      LIMIT 1
    `;

    try {
      const result = await this.dbClient.query(query, [transactionType, tenantId]);

      return result.rows[0].payload;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to fetch config payload: ${err.message}`, { cause: error });
    }
  }

  async getSchemaByTransactionType(
    transactionType: string,
    tenantId: string,
  ): Promise<{ schema: any; mapping: any }> {
    if (!transactionType || !tenantId) {
      throw new Error('Transaction type and tenant ID are required');
    }

    const query = `
      SELECT schema, mapping
      FROM config
      WHERE transaction_type = $1 AND tenant_id = $2
    `;

    try {
      const result = await this.dbClient.query(query, [transactionType, tenantId]);

      return { schema: result.rows[0].schema, mapping: result.rows[0].mapping };
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to fetch config schema: ${err.message}`, { cause: error });
    }
  }

  async findActiveNetworkMap(tenantId: string): Promise<any> {
    const query = `
      SELECT configuration
      FROM network_map
      WHERE tenantId = $1
        AND configuration->>'active' = 'true'
    `;

    const result = await this.dbClient.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    if (result.rows.length > 1) {
      throw new Error(
        `Multiple active network maps found for tenant ${tenantId}. Expected only one active network map.`,
      );
    }

    return result.rows[0].configuration;
  }

  async createNode(
    nodeData: Array<{
      name: string;
      description: string;
      type: string;
      color: string;
      label: string;
      category: string;
      code_template: string;
      default_data?: Record<string, unknown>;
      tenant_id: string;
      created_by: string;
    }>,
  ): Promise<
    Array<{
      name: string;
      description: string;
      type: string;
      color: string;
      label: string;
      category: string;
      code_template: string;
      default_data?: Record<string, unknown>;
      tenant_id: string;
      created_by: string;
      created_at: Date;
      updated_at: Date;
      id: number;
    }>
  > {
    const nodes = Array.isArray(nodeData) ? nodeData : [nodeData];

    if (nodes.length === 0) {
      throw new Error('No node data provided');
    }

    // Build values placeholders for batch insert (without id - auto-generated)
    const valuesPerNode = 10; // name, description, type, color, label, category, code_template, default_data, tenant_id, created_by
    const valuePlaceholders = nodes
      .map((_, index) => {
        const offset = index * valuesPerNode;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, NOW(), NOW())`;
      })
      .join(', ');

    const query = `
      INSERT INTO nodes (
        name,
        description,
        type,
        color,
        label,
        category,
        code_template,
        default_data,
        tenant_id,
        created_by,
        updated_at,
        created_at
      ) VALUES ${valuePlaceholders}
      RETURNING id, name, description, type, color, label, category, code_template, default_data, tenant_id, created_by, created_at, updated_at
    `;

    // Flatten all node data into a single array of values
    const values = nodes.flatMap((node) => [
      node.name,
      node.description,
      node.type,
      node.color,
      node.label,
      node.category,
      node.code_template,
      node.default_data ? JSON.stringify(node.default_data) : null,
      node.tenant_id,
      node.created_by,
    ]);

    const result = await this.dbClient.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Failed to create node(s): No data returned');
    }

    return result.rows;
  }

  async findAll(
    tenantId: string,
    query: { tenantId?: string; type?: string; category?: string },
  ): Promise<any[]> {
    const whereClauses: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (query.tenantId) {
      whereClauses.push(`tenant_id = $${paramIndex}`);
      queryParams.push(query.tenantId);
      paramIndex += 1;
    }

    if (query.type) {
      whereClauses.push(`type = $${paramIndex}`);
      queryParams.push(query.type);
      paramIndex += 1;
    }

    if (query.category) {
      whereClauses.push(`category = $${paramIndex}`);
      queryParams.push(query.category);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const dbquery = `
      SELECT id, name, description, type, color, label, category, code_template, default_data, tenant_id, created_by, created_at, updated_at
      FROM nodes
      ${whereClause}
      ORDER BY created_at DESC
    `;
    const result = await this.dbClient.query(dbquery, queryParams);
    return result.rows;
  }

  async createRuleFlow(ruleFlowData: {
    rule_id: string;
    flow_json: Record<string, unknown>;
  }): Promise<
    Array<{
      id: number;
      rule_id: string;
      flow_json: Record<string, unknown>;
      created_at: Date;
      updated_at: Date;
    }>
  > {
    const query = `
      INSERT INTO trs_rule_flow (
        rule_id,
        flow_json,
        updated_at,
        created_at
      ) VALUES (
        $1, $2, NOW(), NOW()
      )
      RETURNING id, rule_id, flow_json, created_at, updated_at;
    `;
    const result = await this.dbClient.query(query, [
      ruleFlowData.rule_id,
      JSON.stringify(ruleFlowData.flow_json),
    ]);

    if (result.rows.length === 0) {
      throw new Error('Failed to create rule flow: No data returned');
    }

    return result.rows;
  }

  async findRuleFlow(ruleId: string): Promise<any> {
    const query = `
      SELECT *
      FROM trs_rule_flow
      WHERE rule_id = $1
      LIMIT 1
    `;

    const result = await this.dbClient.query(query, [ruleId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async updateRuleFlow(ruleId: string, flowData: Record<string, unknown>): Promise<any> {
    const query = `
      UPDATE trs_rule_flow
      SET 
        flow_json = $2,
        updated_at = NOW()
      WHERE rule_id = $1
      RETURNING id, rule_id, flow_json, created_at, updated_at;
    `;

    const result = await this.dbClient.query(query, [ruleId, JSON.stringify(flowData)]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
  async close(): Promise<void> {
    await this.dbClient.end();
  }
}
/* eslint-enable max-lines */
