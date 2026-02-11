import { DatabaseService } from '../../src/services/database.service';
import { initializeDatabase, getPool } from '../../src/database/databaseFactory';
import type { Pool, PoolClient } from 'pg';
import { ConfigStatus } from '../../src/types/config.types';
import {
  ConfigType,
  IngestMode,
  JobStatus,
  ScheduleStatus,
} from '../../src/interfaces/enrichment.interface';
import type { Config } from '../../src/types/config.types';

// Mock the database factory
jest.mock('../../src/database/databaseFactory');

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPool: any;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Create mock pool with properly typed query
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    };

    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient>;

    // Setup getPool mock
    (getPool as jest.Mock).mockReturnValue(mockPool);
    mockPool.connect.mockResolvedValue(mockClient);

    // Set default mock return value for query to prevent undefined.rows errors
    mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

    // Initialize service
    databaseService = new DatabaseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize database with config if provided', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
      };

      new DatabaseService(config);

      expect(initializeDatabase).toHaveBeenCalledWith(config);
    });

    it('should not initialize database if no config provided', () => {
      (initializeDatabase as jest.Mock).mockClear();
      new DatabaseService();

      expect(initializeDatabase).not.toHaveBeenCalled();
    });
  });

  describe('getPool', () => {
    it('should return the database pool', () => {
      const pool = databaseService.getPool();

      expect(pool).toBe(mockPool);
    });
  });

  describe('getClient', () => {
    it('should return a database client', async () => {
      const client = await databaseService.getClient();

      expect(client).toBe(mockClient);
      expect(mockPool.connect).toHaveBeenCalled();
    });
  });

  describe('createConfig', () => {
    it('should create a config without id', async () => {
      const configData: Omit<Config, 'id' | 'createdAt' | 'updatedAt'> = {
        msgFam: 'pacs',
        transactionType: '008',
        endpointPath: '/test',
        version: '1.0',
        contentType: 'application/json' as any,
        schema: { type: 'object', properties: {} } as any,
        mapping: [],
        functions: [],
        status: ConfigStatus.IN_PROGRESS,
        createdBy: 'test-user',
        tenantId: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await databaseService.createConfig(configData);

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should create a config with specific id', async () => {
      const configData: Omit<Config, 'id' | 'createdAt' | 'updatedAt'> = {
        msgFam: 'pacs',
        transactionType: '008',
        endpointPath: '/test',
        version: '1.0',
        contentType: 'application/json' as any,
        schema: { type: 'object', properties: {} } as any,
        mapping: [],
        functions: [],
        status: ConfigStatus.IN_PROGRESS,
        createdBy: 'test-user',
        tenantId: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 100 }],
        rowCount: 1,
      });

      const result = await databaseService.createConfig(configData, 100);

      expect(result).toBe(100);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should throw error if config creation fails', async () => {
      const configData: Omit<Config, 'id' | 'createdAt' | 'updatedAt'> = {
        msgFam: 'pacs',
        transactionType: '008',
        endpointPath: '/test',
        version: '1.0',
        contentType: 'application/json' as any,
        schema: { type: 'object', properties: {} } as any,
        mapping: [],
        functions: [],
        status: ConfigStatus.IN_PROGRESS,
        createdBy: 'test-user',
        tenantId: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.createConfig(configData)).rejects.toThrow();
    });
  });

  describe('findConfigById', () => {
    it('should return config by id', async () => {
      const mockConfig = {
        id: 1,
        msg_fam: 'pacs',
        transaction_type: '008',
        endpoint_path: '/test',
        version: '1.0',
        content_type: 'application/json',
        schema: [],
        mapping: [],
        functions: [],
        status: 'ACTIVE',
        created_by: 'test-user',
        tenant_id: 'tenant-1',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockConfig],
        rowCount: 1,
      });

      const result = await databaseService.findConfigById(1, 'tenant-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [1, 'tenant-1']);
    });

    it('should handle invalid JSON in schema field gracefully', async () => {
      const mockConfig = {
        id: 1,
        msg_fam: 'pacs',
        transaction_type: '008',
        endpoint_path: '/test',
        version: '1.0',
        content_type: 'application/json',
        schema: 'invalid-json-{broken',
        mapping: null,
        functions: null,
        status: 'ACTIVE',
        created_by: 'test-user',
        tenant_id: 'tenant-1',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockConfig],
        rowCount: 1,
      });

      const result = await databaseService.findConfigById(1, 'tenant-1');

      expect(result).toBeDefined();
      expect(result?.schema).toBe('invalid-json-{broken');
    });

    it('should validate schema with ARRAY fields', async () => {
      const schemaWithArrays = [
        {
          name: 'arrayField',
          type: 'ARRAY',
          arrayElementType: 'STRING',
        },
        {
          name: 'objectArray',
          type: 'ARRAY',
          arrayElementType: 'OBJECT',
          children: [
            {
              name: 'nestedField',
              type: 'STRING',
            },
          ],
        },
      ];

      const mockConfig = {
        id: 1,
        msg_fam: 'pacs',
        transaction_type: '008',
        endpoint_path: '/test',
        version: '1.0',
        content_type: 'application/json',
        schema: JSON.stringify(schemaWithArrays),
        mapping: null,
        functions: null,
        status: 'ACTIVE',
        created_by: 'test-user',
        tenant_id: 'tenant-1',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockConfig],
        rowCount: 1,
      });

      const result = await databaseService.findConfigById(1, 'tenant-1');

      expect(result).toBeDefined();
      expect(result?.schema).toEqual(schemaWithArrays);
    });

    it('should return null if config not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await databaseService.findConfigById(999, 'tenant-1');

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.findConfigById(1, 'tenant-1')).rejects.toThrow();
    });
  });

  describe('updateConfigByStatus', () => {
    it('should update config status', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateConfigByStatus('1', ConfigStatus.UNDER_REVIEW);

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE config'),
        expect.any(Array),
      );
    });

    it('should throw error if update fails', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateConfigByStatus('1', ConfigStatus.UNDER_REVIEW),
      ).rejects.toThrow('Failed to update config status');
    });
  });
  describe('updateConfig', () => {
    it('should update provided fields only', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await databaseService.updateConfig(1, 'tenant-1', {
        endpointPath: '/updated',
        version: '2.0',
        status: ConfigStatus.APPROVED,
      });

      expect(result).toEqual({ id: 1 });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE config'),
        expect.arrayContaining(['/updated', '2.0', ConfigStatus.APPROVED, 1, 'tenant-1']),
      );
    });

    it('should update comments field', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await databaseService.updateConfig(1, 'tenant-1', {
        comments: 'Test comment',
      });

      expect(result).toEqual({ id: 1 });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('comments ='),
        expect.arrayContaining(['Test comment', 1, 'tenant-1']),
      );
    });

    it('should update publishing_status field', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await databaseService.updateConfig(1, 'tenant-1', {
        publishing_status: 'active',
      });

      expect(result).toEqual({ id: 1 });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('publishing_status ='),
        expect.arrayContaining(['active', 1, 'tenant-1']),
      );
    });

    it('should return undefined if no rows updated', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await databaseService.updateConfig(999, 'tenant-1', {
        endpointPath: '/none',
      });

      expect(result).toBeUndefined();
    });
  });
  describe('getAllCollections', () => {
    it('should return collections for tenant and default', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [
          { collection_name: 'col1', collection_type: 'json' },
          { collection_name: 'col2', collection_type: 'xml' },
        ],
      });

      const result = await databaseService.getAllCollections('tenant-1');

      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['tenant-1']);
    });
  });
  describe('getCollectionFields', () => {
    it('should return fields for collection', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            field_id: 1,
            field_name: 'amount',
            field_type: 'NUMBER',
            parent_id: null,
          },
        ],
      });

      const result = await databaseService.getCollectionFields(10, 'tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].field_name).toBe('amount');
    });
  });
  describe('createDestinationType', () => {
    it('should create destination type', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            destination_type_id: 1,
            name: 'Account',
            tenant_id: 'tenant-1',
          },
        ],
      });

      const result = await databaseService.createDestinationType('json', 'Account', 5, 'tenant-1');

      expect(result.destination_type_id).toBe(1);
    });
  });
  describe('destinationTypeExists', () => {
    it('should return true if destination type exists', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ destination_type_id: 1 }],
      });

      const exists = await databaseService.destinationTypeExists(1, 'tenant-1');

      expect(exists).toBe(true);
    });

    it('should return false if destination type does not exist', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const exists = await databaseService.destinationTypeExists(99, 'tenant-1');

      expect(exists).toBe(false);
    });
  });
  describe('getNextSerialNumber', () => {
    it('should return next serial number', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ next_serial: 4 }],
      });

      const serial = await databaseService.getNextSerialNumber(10);

      expect(serial).toBe(4);
    });
  });
  describe('addFieldToDestinationType', () => {
    it('should add field to destination type', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            field_id: 1,
            field_name: 'amount',
            field_type: 'NUMBER',
          },
        ],
      });

      const result = await databaseService.addFieldToDestinationType(
        'amount',
        'NUMBER',
        null,
        'tenant-1',
        1,
        10,
      );

      expect(result.field_name).toBe('amount');
    });
  });
  describe('createTransactionTypeTable', () => {
    it('should create transaction type table', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue(undefined);

      await databaseService.createTransactionTypeTable('pacs_008');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS'),
      );
    });

    it('should throw error for invalid table name', async () => {
      await expect(databaseService.createTransactionTypeTable('invalid-name')).rejects.toThrow();
    });
  });
  describe('createTransactionTypeTable', () => {
    it('should create transaction type table', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue(undefined);

      await databaseService.createTransactionTypeTable('pacs_008');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS'),
      );
    });

    it('should throw error for invalid table name', async () => {
      await expect(databaseService.createTransactionTypeTable('invalid-name')).rejects.toThrow();
    });
  });
  describe('findConfigsByStatus', () => {
    it('should return paginated configs by status', async () => {
      const mockConfigs = [
        {
          id: 1,
          msg_fam: 'pacs',
          transaction_type: '008',
          status: 'ACTIVE',
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '10' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: mockConfigs,
          rowCount: 1,
        });

      const result = await databaseService.findConfigsByStatus(
        10,
        0,
        { status: 'ACTIVE' },
        'tenant-1',
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.limit).toBe(10);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });
  describe('close', () => {
    it('should close database connection pool', async () => {
      (mockPool.end as jest.Mock).mockResolvedValue(undefined);

      await databaseService.close();

      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });

    it('should throw error if closing pool fails', async () => {
      (mockPool.end as jest.Mock).mockRejectedValue(new Error('Close failed'));

      await expect(databaseService.close()).rejects.toThrow('Close failed');
    });
  });

  // ==================== JOB OPERATIONS TEST CASES ====================

  describe('createPushJob', () => {
    it('should create a push job and return its id', async () => {
      const jobData = {
        endpoint_name: 'test-endpoint',
        path: '/api/test',
        mode: IngestMode.REPLACE,
        table_name: 'test_table',
        description: 'Test push job',
        version: '1.0',
        status: JobStatus.INPROGRESS,
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'job-123' }],
        rowCount: 1,
      });

      const result = await databaseService.createPushJob(jobData);

      expect(result).toEqual({
        success: true,
        message: 'Push Job Created Successfully with an existing table',
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_jobs'),
        expect.any(Array),
      );
    });

    it('should throw error if push job creation fails', async () => {
      const jobData = {
        endpoint_name: 'test-endpoint',
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.createPushJob(jobData)).rejects.toThrow('Failed to create job');
    });
  });

  describe('createPullJob', () => {
    it('should create a pull job and return its id', async () => {
      const jobData = {
        endpoint_name: 'test-endpoint',
        mode: IngestMode.REPLACE,
        table_name: 'test_table',
        description: 'Test pull job',
        version: '1.0',
        status: JobStatus.INPROGRESS,
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'job-456' }],
        rowCount: 1,
      });

      const result = await databaseService.createPullJob(jobData);

      expect(result).toEqual({
        success: true,
        message: 'Pull Job Created Successfully with an existing table',
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO pull_jobs'),
        expect.any(Array),
      );
    });

    it('should throw error if pull job creation fails', async () => {
      const jobData = {
        endpoint_name: 'test-endpoint',
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.createPullJob(jobData)).rejects.toThrow('Failed to create job');
    });
  });

  describe('getAllJobs', () => {
    it('should return paginated jobs from both push and pull tables', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          endpoint_name: 'endpoint-1',
          path: '/api/test',
          mode: IngestMode.REPLACE,
          table_name: 'table1',
          status: JobStatus.INPROGRESS,
          type: ConfigType.PUSH,
        },
        {
          id: 'job-2',
          endpoint_name: 'endpoint-2',
          mode: IngestMode.REPLACE,
          table_name: 'table2',
          status: JobStatus.APPROVED,
          type: ConfigType.PULL,
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '25' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: mockJobs,
          rowCount: 2,
        });

      const result = await databaseService.getAllJobs(10, 0, {}, 'tenant-1');

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should filter jobs by status', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '5' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      const result = await databaseService.getAllJobs(
        10,
        0,
        { status: JobStatus.APPROVED },
        'tenant-1',
      );

      expect(result.total).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = ANY'),
        expect.arrayContaining(['tenant-1', [JobStatus.APPROVED]]),
      );
    });

    it('should filter jobs by endpoint name', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '3' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      const result = await databaseService.getAllJobs(
        10,
        0,
        { endpointName: 'test-endpoint' },
        'tenant-1',
      );

      expect(result.total).toBe(3);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('endpoint_name LIKE'),
        expect.arrayContaining(['tenant-1', '%test-endpoint%']),
      );
    });

    it('should filter jobs by created date', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '2' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      const result = await databaseService.getAllJobs(
        10,
        0,
        { createdAt: '2025-12-15' },
        'tenant-1',
      );

      expect(result.total).toBe(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE(created_at) ='),
        expect.arrayContaining(['tenant-1', '2025-12-15']),
      );
    });

    it('should apply pagination correctly', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '50' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getAllJobs(20, 2, {}, 'tenant-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['tenant-1', 20, 20]),
      );
    });
  });

  describe('findJobById', () => {
    it('should return job by id from specified table', async () => {
      const mockJob = {
        id: 'job-123',
        endpoint_name: 'test-endpoint',
        status: JobStatus.INPROGRESS,
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockJob],
        rowCount: 1,
      });

      const result = await databaseService.findJobById('job-123', 'push_jobs');

      expect(result).toEqual(mockJob);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM push_jobs'),
        ['job-123'],
      );
    });

    it('should return null if job not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await databaseService.findJobById('nonexistent', 'pull_jobs');

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.findJobById('job-123', 'push_jobs')).rejects.toThrow(
        'Failed to find job',
      );
    });
  });

  describe('getJobsByStatus', () => {
    it('should return jobs filtered by status with pagination', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          endpoint_name: 'endpoint-1',
          status: JobStatus.APPROVED,
          type: ConfigType.PUSH,
        },
        {
          id: 'job-2',
          endpoint_name: 'endpoint-2',
          status: JobStatus.APPROVED,
          type: ConfigType.PULL,
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockJobs,
        rowCount: 2,
      });

      const result = await databaseService.getJobsByStatus('tenant-1', JobStatus.APPROVED, 1, 10);

      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id = $1 AND status = $2'),
        ['tenant-1', JobStatus.APPROVED, 10, 0],
      );
    });

    it('should calculate offset correctly for different pages', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await databaseService.getJobsByStatus('tenant-1', JobStatus.REJECTED, 3, 20);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        'tenant-1',
        JobStatus.REJECTED,
        20,
        40,
      ]);
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.getJobsByStatus('tenant-1', JobStatus.INPROGRESS, 1, 10),
      ).rejects.toThrow('Failed to fetch jobs');
    });
  });

  describe('updateJob', () => {
    it('should update push job and return success', async () => {
      const updates = {
        endpoint_name: 'updated-endpoint',
        description: 'Updated description',
        status: JobStatus.APPROVED,
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateJob('job-123', updates as any, ConfigType.PUSH);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully updated');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_jobs'),
        expect.arrayContaining([...Object.values(updates), 'job-123']),
      );
    });

    it('should update pull job and return success', async () => {
      const updates = {
        endpoint_name: 'updated-endpoint',
        status: JobStatus.REJECTED,
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateJob('job-456', updates as any, ConfigType.PULL);

      expect(result.success).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pull_jobs'),
        expect.any(Array),
      );
    });

    it('should throw error if no fields provided', async () => {
      await expect(
        databaseService.updateJob('job-123', {} as any, ConfigType.PUSH),
      ).rejects.toThrow('No fields provided to update');
    });

    it('should throw error if job not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      await expect(
        databaseService.updateJob(
          'nonexistent',
          { status: JobStatus.APPROVED } as any,
          ConfigType.PUSH,
        ),
      ).rejects.toThrow('Job with id "nonexistent" not found');
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateJob(
          'job-123',
          { status: JobStatus.APPROVED } as any,
          ConfigType.PUSH,
        ),
      ).rejects.toThrow('Failed to update job');
    });
  });

  describe('updateJobActivation', () => {
    it('should update job publishing status', async () => {
      const mockUpdatedJob = {
        id: 'job-123',
        publishing_status: JobStatus.APPROVED,
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockUpdatedJob],
        rowCount: 1,
      });

      const result = await databaseService.updateJobActivation(
        'job-123',
        ScheduleStatus.ACTIVE,
        ConfigType.PUSH,
      );

      expect(result).toHaveLength(1);
      expect(result[0].publishing_status).toBe(JobStatus.APPROVED);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE push_jobs'), [
        ScheduleStatus.ACTIVE,
        'job-123',
      ]);
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateJobActivation('job-123', ScheduleStatus.ACTIVE, ConfigType.PUSH),
      ).rejects.toThrow('Failed to update job publishing status');
    });
  });

  describe('updateJobByStatus', () => {
    it('should update job status for push job', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateJobByStatus(
        JobStatus.APPROVED,
        'job-123',
        ConfigType.PUSH,
      );

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE push_jobs'), [
        JobStatus.APPROVED,
        'job-123',
      ]);
    });

    it('should update job status for pull job', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateJobByStatus(
        JobStatus.REVIEW,
        'job-456',
        ConfigType.PULL,
      );

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE pull_jobs'), [
        JobStatus.REVIEW,
        'job-456',
      ]);
    });

    it('should update job with rejection reason', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateJobByStatus(
        JobStatus.REJECTED,
        'job-123',
        ConfigType.PUSH,
        'Invalid configuration',
      );

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('comments = $2'), [
        JobStatus.REJECTED,
        'Invalid configuration',
        'job-123',
      ]);
    });

    it('should throw error if job not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      await expect(
        databaseService.updateJobByStatus(JobStatus.APPROVED, 'nonexistent', ConfigType.PUSH),
      ).rejects.toThrow('No job found with id: nonexistent');
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateJobByStatus(JobStatus.APPROVED, 'job-123', ConfigType.PUSH),
      ).rejects.toThrow('Failed to update job status');
    });
  });

  // ==================== SCHEDULE OPERATIONS TEST CASES ====================

  describe('createSchedule', () => {
    it('should create a schedule and return its id', async () => {
      const scheduleData = {
        id: 'schedule-123',
        name: 'Daily sync',
        cron_expression: '0 0 * * *',
        job_id: 'job-123',
        status: JobStatus.INPROGRESS,
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'schedule-123' }],
        rowCount: 1,
      });

      const result = await databaseService.createSchedule(scheduleData);

      expect(result).toBe('schedule-123');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cron_jobs'),
        expect.any(Array),
      );
    });

    it('should throw error if schedule creation fails', async () => {
      const scheduleData = {
        name: 'Test schedule',
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(databaseService.createSchedule(scheduleData)).rejects.toThrow(
        'Failed to insert schedule: No ID returned',
      );
    });

    it('should throw error on database error', async () => {
      const scheduleData = {
        name: 'Test schedule',
        tenant_id: 'tenant-1',
      };

      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.createSchedule(scheduleData)).rejects.toThrow(
        'Failed to create cron job',
      );
    });
  });

  describe('findScheduleById', () => {
    it('should return schedule by id', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        name: 'Daily sync',
        cron_expression: '0 0 * * *',
        status: JobStatus.APPROVED,
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockSchedule],
        rowCount: 1,
      });

      const result = await databaseService.findScheduleById('schedule-123');

      expect(result).toEqual(mockSchedule);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cron_jobs'),
        ['schedule-123'],
      );
    });

    it('should return null if schedule not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await databaseService.findScheduleById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.findScheduleById('schedule-123')).rejects.toThrow(
        'Failed to find cron job',
      );
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule fields', async () => {
      const updates = {
        name: 'Updated schedule',
        cron_expression: '0 */6 * * *',
        status: JobStatus.APPROVED,
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateSchedule('schedule-123', updates);

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cron_jobs'),
        expect.arrayContaining([...Object.values(updates), 'schedule-123']),
      );
    });

    it('should throw error if schedule not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      await expect(databaseService.updateSchedule('nonexistent', { name: 'Test' })).rejects.toThrow(
        'No cron job found with id: nonexistent',
      );
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateSchedule('schedule-123', { name: 'Test' }),
      ).rejects.toThrow('Failed to update cron job');
    });
  });

  describe('getAllSchedule', () => {
    it('should return paginated schedules', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          name: 'Daily sync',
          cron_expression: '0 0 * * *',
          status: JobStatus.APPROVED,
        },
        {
          id: 'schedule-2',
          name: 'Hourly check',
          cron_expression: '0 * * * *',
          status: JobStatus.INPROGRESS,
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '20' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: mockSchedules,
          rowCount: 2,
        });

      const result = await databaseService.getAllSchedule(10, 0, {}, 'tenant-1');

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(20);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should filter schedules by status', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '5' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getAllSchedule(10, 0, { status: JobStatus.APPROVED }, 'tenant-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = ANY'),
        expect.arrayContaining(['tenant-1', [JobStatus.APPROVED]]),
      );
    });

    it('should filter schedules by name', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '3' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getAllSchedule(10, 0, { name: 'sync' }, 'tenant-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('name LIKE'),
        expect.arrayContaining(['tenant-1', '%sync%']),
      );
    });

    it('should filter schedules by created date', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '2' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getAllSchedule(10, 0, { createdAt: '2025-12-15' }, 'tenant-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE(created_at) ='),
        expect.arrayContaining(['tenant-1', '2025-12-15']),
      );
    });
  });

  describe('getScheduleByStatus', () => {
    it('should return schedules filtered by status with pagination', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          name: 'Daily sync',
          status: JobStatus.APPROVED,
        },
        {
          id: 'schedule-2',
          name: 'Hourly check',
          status: JobStatus.APPROVED,
        },
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockSchedules,
        rowCount: 2,
      });

      const result = await databaseService.getScheduleByStatus(
        'tenant-1',
        JobStatus.APPROVED,
        1,
        10,
      );

      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE tenant_id = $1'), [
        'tenant-1',
        JobStatus.APPROVED,
        10,
        0,
      ]);
    });

    it('should calculate offset correctly for different pages', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await databaseService.getScheduleByStatus('tenant-1', JobStatus.REJECTED, 2, 15);

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        'tenant-1',
        JobStatus.REJECTED,
        15,
        15,
      ]);
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.getScheduleByStatus('tenant-1', JobStatus.INPROGRESS, 1, 10),
      ).rejects.toThrow('Failed to fetch cron jobs');
    });
  });

  describe('updateScheduleByStatus', () => {
    it('should update schedule status', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateScheduleByStatus(
        JobStatus.APPROVED,
        'schedule-123',
        'tenant-1',
      );

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE cron_jobs'), [
        JobStatus.APPROVED,
        'tenant-1',
        'schedule-123',
      ]);
    });

    it('should update schedule with rejection reason', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await databaseService.updateScheduleByStatus(
        JobStatus.REJECTED,
        'schedule-123',
        'Invalid cron expression',
      );

      expect(result).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('comments = $2'), [
        JobStatus.REJECTED,
        'Invalid cron expression',
        'schedule-123',
      ]);
    });

    it('should throw error if schedule not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      await expect(
        databaseService.updateScheduleByStatus(JobStatus.APPROVED, 'nonexistent', 'tenant-1'),
      ).rejects.toThrow('No cron job found with id: nonexistent');
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateScheduleByStatus(JobStatus.APPROVED, 'schedule-123', 'tenant-1'),
      ).rejects.toThrow('Failed to update cron job status');
    });
  });

  // ==================== JOB HISTORY OPERATIONS TEST CASES ====================

  describe('getJobHistory', () => {
    it('should return paginated job history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          job_id: 'job-1',
          job_type: 'pull',
          endpoint_name: 'endpoint-1',
          table_name: 'table1',
          status: JobStatus.APPROVED,
          exception: null,
          created_at: new Date(),
        },
        {
          id: 'history-2',
          job_id: 'job-2',
          job_type: 'push',
          endpoint_name: 'endpoint-2',
          table_name: 'table2',
          status: JobStatus.INPROGRESS,
          exception: null,
          created_at: new Date(),
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '15' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: mockHistory,
          rowCount: 2,
        });

      const result = await databaseService.getJobHistory(10, 0, 'tenant-1', {});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should filter job history by endpoint name', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '3' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getJobHistory(10, 0, 'tenant-1', {
        endpointName: 'test-endpoint',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('pj.endpoint_name ILIKE'),
        expect.arrayContaining(['tenant-1', '%test-endpoint%']),
      );
    });

    it('should filter job history by created date', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '5' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getJobHistory(10, 0, 'tenant-1', {
        createdAt: '2025-12-15',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE(ph.created_at) ='),
        expect.arrayContaining(['tenant-1', '2025-12-15']),
      );
    });

    it('should filter job history by exception', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '2' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getJobHistory(10, 0, 'tenant-1', {
        exception: 'timeout',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ph.exception LIKE'),
        expect.arrayContaining(['tenant-1', '%timeout%']),
      );
    });

    it('should apply multiple filters together', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '1' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getJobHistory(10, 0, 'tenant-1', {
        endpointName: 'test-endpoint',
        createdAt: '2025-12-15',
        exception: 'error',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('pj.endpoint_name ILIKE'),
        expect.arrayContaining(['tenant-1', '2025-12-15', '%error%', '%test-endpoint%']),
      );
    });

    it('should apply pagination correctly', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '100' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getJobHistory(20, 3, 'tenant-1', {});

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['tenant-1', 20, 30]),
      );
    });

    it('should include job details from both pull and push jobs', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          job_id: 'pull-job-1',
          job_type: 'pull',
          endpoint_name: 'pull-endpoint',
          table_name: 'pull_table',
          version: '1.0',
          status: JobStatus.APPROVED,
          publishing_status: ScheduleStatus.ACTIVE,
        },
        {
          id: 'history-2',
          job_id: 'push-job-1',
          job_type: 'push',
          endpoint_name: 'push-endpoint',
          table_name: 'push_table',
          version: '2.0',
          status: JobStatus.DEPLOYED,
          publishing_status: ScheduleStatus.INACTIVE,
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '2' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: mockHistory,
          rowCount: 2,
        });

      const result = await databaseService.getJobHistory(10, 0, 'tenant-1', {});

      expect(result.data).toHaveLength(2);
    });

    it('should return empty data if no history found', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      const result = await databaseService.getJobHistory(10, 0, 'tenant-1', {});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should order results by created_at DESC', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '5' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await databaseService.getJobHistory(10, 0, 'tenant-1', {});

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY ph.created_at DESC'),
        expect.any(Array),
      );
    });

    it('should handle database errors', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.getJobHistory(10, 0, 'tenant-1', {})).rejects.toThrow(
        'Error fetching job_history',
      );
    });

    it('should handle query errors with detailed message', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(databaseService.getJobHistory(10, 0, 'tenant-1', {})).rejects.toThrow(
        'Connection timeout',
      );
    });
  });

  // ==================== GENERAL DE OPERATIONS TEST CASES ====================

  describe('tableExist', () => {
    it('should return true if table exists', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      const result = await databaseService.tableExist('test_table');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.tables'),
        ['test_table'],
      );
    });

    it('should return false if table does not exist', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ exists: false }],
        rowCount: 1,
      });

      const result = await databaseService.tableExist('nonexistent_table');

      expect(result).toBe(false);
    });

    it('should handle table names with different cases', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      await databaseService.tableExist('TEST_TABLE');

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ['test_table']);
    });

    it('should return false if query returns no rows', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await databaseService.tableExist('test_table');

      expect(result).toBe(false);
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.tableExist('test_table')).rejects.toThrow(
        'Failed to check if table "test_table" exists',
      );
    });
  });

  describe('validateExisting', () => {
    it('should return true if table exists in database', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 });

      const result = await databaseService.validateExisting('test_table');

      expect(result).toBe(true);
    });

    it('should return true if job exists in pull_jobs', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'job-id', table_name: 'test_table' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ exists: false }],
        });

      const result = await databaseService.validateExisting('test_table');

      expect(result).toBe(true);
    });

    it('should return true if job exists in push_jobs', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'job-2' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ exists: false }], rowCount: 1 });

      const result = await databaseService.validateExisting('test_table');

      expect(result).toBe(true);
    });

    it('should return false if table does not exist anywhere', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ exists: false }], rowCount: 1 });

      const result = await databaseService.validateExisting('nonexistent_table');

      expect(result).toBe(false);
    });

    it('should throw error for invalid table name', async () => {
      await expect(databaseService.validateExisting('invalid-name')).rejects.toThrow();
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.validateExisting('test_table')).rejects.toThrow(
        'Failed to validate existing table',
      );
    });
  });

  describe('validateActive', () => {
    it('should not throw error if no active jobs exist for table', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      await expect(
        databaseService.validateActive('test_table', ConfigType.PUSH),
      ).resolves.not.toThrow();
    });

    it('should throw error if active push jobs exist', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '2' }],
        rowCount: 1,
      });

      await expect(databaseService.validateActive('test_table', ConfigType.PUSH)).rejects.toThrow(
        'Deactivate jobs with the table name used',
      );
    });

    it('should throw error if active pull jobs exist', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '1' }],
        rowCount: 1,
      });

      await expect(databaseService.validateActive('test_table', ConfigType.PULL)).rejects.toThrow(
        'Deactivate jobs with the table name used',
      );
    });

    it('should query pull_jobs table for PULL type', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      await databaseService.validateActive('test_table', ConfigType.PULL);

      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM pull_jobs'), [
        'test_table',
      ]);
    });

    it('should query push_jobs table for PUSH type', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      await databaseService.validateActive('test_table', ConfigType.PUSH);

      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM push_jobs'), [
        'test_table',
      ]);
    });

    it('should handle database errors', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.validateActive('test_table', ConfigType.PUSH)).rejects.toThrow(
        'Failed to validate active jobs',
      );
    });
  });

  describe('createTazamaDataModelTable', () => {
    it('should create Tazama data model table with correct schema', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await databaseService.createTazamaDataModelTable('tazama_test_table');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tazama_test_table"'),
      );
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('_key text PRIMARY KEY'));
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('data jsonb NOT NULL'));
    });

    it('should validate table name before creating table', async () => {
      await expect(
        databaseService.createTazamaDataModelTable('invalid-table-name!'),
      ).rejects.toThrow('Invalid table name');
    });

    it('should handle database errors during table creation', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(databaseService.createTazamaDataModelTable('test_table')).rejects.toThrow(
        'Database error',
      );
    });
  });

  // -----------------Nodes----------------------
  describe('createNode', () => {
    it('should create multiple nodes and return an array of inserted rows', async () => {
      const nodeData = [
        {
          tenant_id: 'cbe',
          created_by: 'test-user',
          order: 1,
          node_json: {
            name: 'Custom Code Node',
            description: 'A node for executing custom JavaScript code.',
            type: 'custom',
            color: '#FFD700',
            category: 'Custom',
            code_template: 'return { output: "Hello, World!" };',
            handles: {
              source: true,
              target: true,
            },
            inputs: [
              {
                key: 'input1',
                label: 'Input 1',
                type: 'string',
                required: true,
              },
            ],
            default_data: {
              input1: 'default value',
            },
          },
        },
        {
          tenant_id: 'cbe',
          created_by: 'test-user',
          order: 2,
          node_json: {
            name: 'Another Node',
            description: 'Another custom node.',
            type: 'custom',
            color: '#00BFFF',
            category: 'Custom',
            code_template: 'return { result: "Done" };',
            handles: {
              source: true,
              target: false,
            },
            inputs: [],
          },
        },
      ];

      const insertedRows = nodeData.map((node, index) => ({
        id: index + 1,
        ...node,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Mock the existence check to return no existing nodes
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      // Mock the second existence check for the second node
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      // Mock the final insert query
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: insertedRows,
        rowCount: insertedRows.length,
      });

      const result = await databaseService.createNode(nodeData as any);

      expect(result).toEqual(insertedRows);
      expect(mockPool.query).toHaveBeenCalledTimes(3); // 2 existence checks + 1 insert
    });
  });

  describe('findAll (nodes)', () => {
    it('should return all nodes when no filters provided', async () => {
      const mockNodes = [
        { id: 1, name: 'n1' },
        { id: 2, name: 'n2' },
      ];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockNodes, rowCount: 2 });

      const result = await databaseService.findAllNodes({} as any);

      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('FROM nodes'), [
        'default',
      ]);
    });

    it('should apply filters for tenantId, type and category', async () => {
      const mockNodes = [{ id: 3, name: 'filtered' }];
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockNodes, rowCount: 1 });

      const result = await databaseService.findAllNodes({
        tenantId: 'default',
        type: 'basic',
        category: 'rule_builder',
      });

      expect(result).toHaveLength(1);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        'default',
        'default',
        'basic',
        'rule_builder',
      ]);
    });
  });

  describe('deleteNodeById', () => {
    it('should delete a node by its ID and tenant ID', async () => {
      const nodeId = 123;
      const tenantId = 'tenant-abc';

      // Mock a successful deletion
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      // Call the method
      await expect(databaseService.deleteNodeById(nodeId, tenantId)).resolves.toBeUndefined();

      // Verify the correct SQL query and parameters were used
      const expectedQuery = `
      DELETE FROM nodes
      WHERE id = $1 AND tenant_id = $2
    `;
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining(expectedQuery.trim()), [
        nodeId,
        tenantId,
      ]);
    });

    it('should throw an error if no node was deleted', async () => {
      const nodeId = 456;
      const tenantId = 'tenant-xyz';

      // Mock the case where no rows are affected
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      // Expect the method to throw an error
      await expect(databaseService.deleteNodeById(nodeId, tenantId)).rejects.toThrow(
        `Node with id "${nodeId}" not found for tenant "${tenantId}"`,
      );
    });
  });

  describe('createRuleFlow', () => {
    it('should create rule flow successfully', async () => {
      const flowData = {
        rule_id: '1',
        flowData: {
          flow_json_rule_builder: {
            edges: [
              {
                id: 'edge-2',
                source: 'node-2',
                target: 'node-3',
                sourceHandle: null,
              },
            ],
          },
          flow_json_test_case: {
            edges: [
              {
                id: 'edge-2',
                source: 'node-2',
                target: 'node-3',
                sourceHandle: null,
              },
            ],
          },
        },
        tenantId: 'tenant-abc',
      };
      const mockRow = {
        id: 1,
        rule_id: '1',
        flow_json_rule_builder: {
          edges: [
            {
              id: 'edge-2',
              source: 'node-2',
              target: 'node-3',
              sourceHandle: null,
            },
          ],
        },
        flow_json_test_case: {
          edges: [
            {
              id: 'edge-2',
              source: 'node-2',
              target: 'node-3',
              sourceHandle: null,
            },
          ],
        },
        tenantId: 'tenant-abc',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });

      const result = await databaseService.createRuleFlow(flowData);

      expect(Array.isArray(result)).toBe(true);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0]).toMatchObject({
        id: expect.any(Number),
        rule_id: flowData.rule_id,
        flow_json_rule_builder: flowData.flowData.flow_json_rule_builder,
        flow_json_test_case: flowData.flowData.flow_json_test_case,
        tenantId: flowData.tenantId,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trs_rule_flow'),
        [
          flowData.rule_id,
          JSON.stringify(flowData.flowData.flow_json_rule_builder),
          JSON.stringify(flowData.flowData.flow_json_test_case),
          flowData.tenantId,
        ],
      );
    });
  });

  describe('updateRuleFlow', () => {
    it('should update rule flow successfully', async () => {
      const flowData = {
        rule_id: '1',
        flowJson: { key: 'value' },
        tsFileBase64: 'base64string',
        category: 'rule_builder',
        tenantId: 'tenant-abc',
      };
      const mockRow = {
        id: 1,
        rule_id: '1',
        flow_json: { key: 'value' },
        ts_file_base64: 'base64string',
        category: 'rule_builder',
        tenantId: 'tenant-abc',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });

      const result = await databaseService.updateRuleFlow(
        flowData.rule_id,
        flowData as any,
        'tenant-abc',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1); // one row returned
      expect(result![0]).toMatchObject({
        id: expect.any(Number),
        rule_id: flowData.rule_id,
        flow_json: flowData.flowJson,
        ts_file_base64: flowData.tsFileBase64,
        tenantId: flowData.tenantId,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });

      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE trs_rule_flow'), [
        flowData.rule_id,
        JSON.stringify(flowData.flowJson),
        flowData.tsFileBase64,
        flowData.tenantId,
      ]);
    });
  });

  describe('executeSelectQuery', () => {
    it('should execute a select query and return the results', async () => {
      const query = 'SELECT * FROM users';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ id: 1, name: 'Test User' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE tenant_id = 'tenant-1' LIMIT 5",
        [],
      );
    });

    it('should throw an error for queries with forbidden keywords', async () => {
      const query = 'SELECT * FROM users; DROP TABLE users;';
      const tenantId = 'tenant-1';
      const params = [];

      await expect(databaseService.executeSelectQuery(query, tenantId, params)).rejects.toThrow(
        'Only SELECT queries are allowed.',
      );
    });

    it('should correctly append tenant_id to a query with an existing WHERE clause', async () => {
      const query = 'SELECT * FROM users WHERE name = $1';
      const tenantId = 'tenant-1';
      const params = ['Test User'];
      const mockRows = [{ id: 1, name: 'Test User' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE tenant_id = 'tenant-1' AND name = $1 LIMIT 5",
        params,
      );
    });

    it('should limit the results to 5 rows', async () => {
      const query = 'SELECT * FROM users';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
        { id: 4, name: 'User 4' },
        { id: 5, name: 'User 5' },
        { id: 6, name: 'User 6' },
      ];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows.slice(0, 5),
        rowCount: 5,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result.length).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE tenant_id = 'tenant-1' LIMIT 5",
        [],
      );
    });

    it('should handle queries ending with semicolon when adding LIMIT', async () => {
      const query = 'SELECT * FROM users;';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ id: 1, name: 'Test User' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users; WHERE tenant_id = 'tenant-1' LIMIT 5",
        [],
      );
    });

    it('should preserve existing LIMIT clause', async () => {
      const query = 'SELECT * FROM users LIMIT 10';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ id: 1, name: 'Test User' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE tenant_id = 'tenant-1' LIMIT 10",
        [],
      );
    });

    it('should add WHERE clause before ORDER BY clause', async () => {
      const query = 'SELECT * FROM users ORDER BY name';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ id: 1, name: 'Test User' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE tenant_id = 'tenant-1' ORDER BY name LIMIT 5",
        [],
      );
    });

    it('should add WHERE clause before GROUP BY clause', async () => {
      const query = 'SELECT category, COUNT(*) FROM products GROUP BY category';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ category: 'A', count: 5 }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT category, COUNT(*) FROM products WHERE tenant_id = 'tenant-1' GROUP BY category LIMIT 5",
        [],
      );
    });

    it('should handle database errors during query execution', async () => {
      const query = 'SELECT * FROM users';
      const tenantId = 'tenant-1';
      const params = [];

      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(databaseService.executeSelectQuery(query, tenantId, params)).rejects.toThrow(
        'Failed to execute query: Database connection failed',
      );
    });

    it('should handle queries with no tables detected', async () => {
      const query = 'SELECT 1 as test';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ test: 1 }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1 as test LIMIT 5', []);
    });

    it('should handle complex JOIN queries with multiple table references', async () => {
      const query = 'SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ name: 'John', title: 'Post Title' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id WHERE tenant_id = 'tenant-1' LIMIT 5",
        [],
      );
    });

    it('should handle queries with multiple tables in different positions', async () => {
      const query =
        'SELECT * FROM orders LEFT JOIN customers ON orders.customer_id = customers.id RIGHT JOIN products ON orders.product_id = products.id';
      const tenantId = 'tenant-1';
      const params = [];
      const mockRows = [{ id: 1, order_date: '2023-01-01' }];

      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await databaseService.executeSelectQuery(query, tenantId, params);

      expect(result).toEqual(mockRows);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM orders LEFT JOIN customers ON orders.customer_id = customers.id RIGHT JOIN products ON orders.product_id = products.id WHERE tenant_id = 'tenant-1' LIMIT 5",
        [],
      );
    });
  });

  // ==================== RULES (TRS) TEST CASES ====================

  describe('cloneRule', () => {
    it('should clone a rule successfully', async () => {
      const mockClonedRule = {
        id: 456,
        rule_name: 'Cloned Rule',
        description: 'Test description',
        tenant_id: 'tenant1',
        txtp: 'testTxtp',
        txtp_version: '1.0',
        version: '1.0',
        status: 'STATUS_01_IN_PROGRESS',
        publishing_status: 'ACTIVE',
        updated_by: 'testUser',
        rule_type: 'testType',
        rule_config_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock transaction queries
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({
          rows: [mockClonedRule],
          rowCount: 1,
        }) // INSERT rule
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT flow (optional)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const mockRuleRequest = {
        transaction: {
          CstmrCdtTrfInitn: {
            GrpHdr: {},
            PmtInf: {},
          },
          TxTp: 'PACS.008',
          TenantId: 'tenant1',
        },
        networkMap: {
          cfg: 'test-config',
          active: true,
          messages: [],
          tenantId: 'tenant1',
        },
        DataCache: {},
        metaData: {
          correlationId: 'test-correlation-id',
          timestamp: '2024-01-01T00:00:00Z',
          tenantId: 'tenant1',
          transactionType: 'PACS.008',
        },
      };

      const result = await databaseService.cloneRule(
        123,
        'New Rule Name',
        'testUser',
        'tenant1',
        mockRuleRequest,
      );

      expect(result).toEqual(mockClonedRule);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trs_rules'),
        ['New Rule Name', 'testUser', 123, 'tenant1'],
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw error when rule not found', async () => {
      // Mock transaction queries
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        }) // INSERT rule (returns empty - rule not found)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

      await expect(
        databaseService.cloneRule(999, 'Non-existent Rule', 'testUser', 'tenant1', undefined),
      ).rejects.toThrow('Rule not found or could not be cloned');
    });
  });

  describe('findRulesWithFilters', () => {
    it('should return filtered rules with pagination', async () => {
      const mockCountResult = { rows: [{ total: '25' }] };
      const mockDataResult = {
        rows: [
          { id: 1, rule_name: 'Rule 1', tenant_id: 'tenant1' },
          { id: 2, rule_name: 'Rule 2', tenant_id: 'tenant1' },
        ],
      };

      mockPool.query.mockResolvedValueOnce(mockCountResult).mockResolvedValueOnce(mockDataResult);

      const result = await databaseService.findRulesWithFilters(
        10,
        0,
        { status: 'active' },
        'tenant1',
      );

      expect(result).toEqual({
        data: mockDataResult.rows,
        total: 25,
        limit: 10,
        offset: 0,
      });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple filter parameters', async () => {
      const mockCountResult = { rows: [{ total: '5' }] };
      const mockDataResult = { rows: [] };

      mockPool.query.mockResolvedValueOnce(mockCountResult).mockResolvedValueOnce(mockDataResult);

      const filters = {
        status: 'active,inactive',
        ruleName: 'test',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await databaseService.findRulesWithFilters(20, 1, filters, 'tenant1');

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('findRuleById', () => {
    it('should return rule when found', async () => {
      const mockRule = { id: 1, rule_name: 'Test Rule', tenant_id: 'tenant1' };
      mockPool.query.mockResolvedValue({ rows: [mockRule] });

      const result = await databaseService.findRuleById(1, 'tenant1');

      expect(result).toEqual(mockRule);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT id, rule_name'), [
        1,
        'tenant1',
      ]);
    });

    it('should return null when rule not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.findRuleById(999, 'tenant1');

      expect(result).toBeNull();
    });
  });

  describe('getVersionsOfTransactionType', () => {
    it('should return versions array when versions exist', async () => {
      const mockVersions = { rows: [{ version: '1.0' }, { version: '2.0' }] };
      mockPool.query.mockResolvedValue(mockVersions);

      const result = await databaseService.getVersionsOfTransactionType('PACS.008', 'tenant1');

      expect(result).toEqual(['1.0', '2.0']);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT version'),
        ['PACS.008', 'tenant1'],
      );
    });

    it('should return empty array when no versions found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.getVersionsOfTransactionType('UNKNOWN', 'tenant1');

      expect(result).toEqual([]);
    });
  });

  describe('saveRuleRequest', () => {
    it('should save rule request successfully', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const ruleRequest = {
        transaction: {
          CstmrCdtTrfInitn: {
            GrpHdr: {},
            PmtInf: {},
          },
          TxTp: 'PACS.008',
          TenantId: 'tenant1',
        },
        networkMap: {
          cfg: 'test-config',
          active: true,
          messages: [],
          tenantId: 'tenant1',
        },
        DataCache: {},
        metaData: {
          correlationId: 'test-correlation-id',
          timestamp: '2024-01-01T00:00:00Z',
          tenantId: 'tenant1',
          transactionType: 'PACS.008',
        },
      };
      await databaseService.saveRuleRequest('PACS.008', 'tenant1', ruleRequest);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE\s+trs_rules\s+SET\s+rulerequest/),
        [ruleRequest, 'tenant1', 'PACS.008'],
      );
    });
  });

  describe('getGlobalVariables', () => {
    it('should return global variables when rule and config exist', async () => {
      const mockRuleResult = {
        rows: [{ rulerequest: { test: 'data' }, rule_config_id: 'config1' }],
      };
      const mockConfigResult = { rows: [{ configuration: { setting: 'value' } }] };

      mockPool.query.mockResolvedValueOnce(mockRuleResult).mockResolvedValueOnce(mockConfigResult);

      const result = await databaseService.getGlobalVariables('rule1', 'tenant1');

      expect(result).toEqual({
        ruleRequest: { test: 'data' },
        configuration: { setting: 'value' },
      });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null when rule not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.getGlobalVariables('nonexistent', 'tenant1');

      expect(result).toBeNull();
    });
  });

  describe('createRule', () => {
    it('should create rule successfully', async () => {
      const mockCreatedRule = { id: 1, rule_name: 'New Rule', tenant_id: 'tenant1' };
      mockPool.query.mockResolvedValue({ rows: [mockCreatedRule] });

      const ruleData = {
        ruleName: 'New Rule',
        description: 'Test rule',
        tenant_id: 'tenant1',
        txtp: 'PACS.008',
        version: '1.0',
        updated_by: 'user1',
        rule_type: 'SCREENING',
      };

      const mockRuleRequest = {
        transaction: {
          CstmrCdtTrfInitn: {
            GrpHdr: {},
            PmtInf: {},
          },
          TxTp: 'PACS.008',
          TenantId: 'tenant1',
        },
        networkMap: {
          cfg: 'test-config',
          active: true,
          messages: [],
          tenantId: 'tenant1',
        },
        DataCache: {},
        metaData: {
          correlationId: 'test-correlation-id',
          timestamp: '2024-01-01T00:00:00Z',
          tenantId: 'tenant1',
          transactionType: 'PACS.008',
        },
      };

      const result = await databaseService.createRule(ruleData, mockRuleRequest);

      expect(result).toEqual(mockCreatedRule);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trs_rules'),
        expect.arrayContaining(['New Rule', 'Test rule', 'tenant1']),
      );
    });

    it('should throw error when creation fails', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const ruleData = {
        ruleName: 'Test Rule',
        description: 'Test rule',
        tenant_id: 'tenant1',
        txtp: 'PACS.008',
        version: '1.0',
        updated_by: 'user1',
        rule_type: 'SCREENING',
      };

      const mockRuleRequest = {
        transaction: {
          CstmrCdtTrfInitn: {
            GrpHdr: {},
            PmtInf: {},
          },
          TxTp: 'PACS.008',
          TenantId: 'tenant1',
        },
        networkMap: {
          cfg: 'test-config',
          active: true,
          messages: [],
          tenantId: 'tenant1',
        },
        DataCache: {},
        metaData: {
          correlationId: 'test-correlation-id',
          timestamp: '2024-01-01T00:00:00Z',
          tenantId: 'tenant1',
          transactionType: 'PACS.008',
        },
      };

      await expect(databaseService.createRule(ruleData, mockRuleRequest)).rejects.toThrow(
        'Failed to create rule',
      );
    });
  });

  describe('updateRule', () => {
    it('should update rule successfully', async () => {
      const mockUpdatedRule = { id: 1, rule_name: 'Updated Rule', tenant_id: 'tenant1' };
      mockPool.query.mockResolvedValue({ rows: [mockUpdatedRule] });

      const updateData = { rule_name: 'Updated Rule', status: 'ACTIVE' };
      const result = await databaseService.updateRule('rule1', 'tenant1', updateData);

      expect(result).toEqual(mockUpdatedRule);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trs_rules'),
        expect.arrayContaining(['Updated Rule', 'ACTIVE', 'rule1', 'tenant1']),
      );
    });

    it('should return null when rule not found for update', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.updateRule('nonexistent', 'tenant1', {
        status: 'INACTIVE',
      });

      expect(result).toBeNull();
    });
  });

  describe('findAllRuleIds', () => {
    it('should return all rule IDs for tenant', async () => {
      const mockRuleIds = {
        rows: [
          { ruleid: 'rule1', rulecfg: { config: 'data1' }, tenantid: 'tenant1' },
          { ruleid: 'rule2', rulecfg: { config: 'data2' }, tenantid: 'tenant1' },
        ],
      };
      mockPool.query.mockResolvedValue(mockRuleIds);

      const result = await databaseService.findAllRuleIds('tenant1');

      expect(result).toEqual(mockRuleIds.rows);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT "ruleid", "rulecfg", "tenantid"'),
        ['tenant1'],
      );
    });
  });

  describe('updateRuleStatus', () => {
    it('should update rule status successfully', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const result = await databaseService.updateRuleStatus(
        'rule1',
        'tenant1',
        'APPROVED',
        'Approved by admin',
      );

      expect(result).toEqual({
        success: true,
        message:
          'Rule with id "rule1" successfully updated to status "APPROVED" with reason "Approved by admin"',
      });
    });

    it('should throw error when rule not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await expect(
        databaseService.updateRuleStatus('nonexistent', 'tenant1', 'APPROVED', 'reason'),
      ).rejects.toThrow('Rule with id "nonexistent" not found');
    });
  });

  describe('findRuleConfiguration', () => {
    it('should return configuration when found', async () => {
      const mockConfig = { configuration: { threshold: 100 } };
      mockPool.query.mockResolvedValue({ rows: [mockConfig] });

      const result = await databaseService.findRuleConfiguration('rule1', 'tenant1');

      expect(result).toEqual(mockConfig.configuration);
    });

    it('should return null when configuration not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.findRuleConfiguration('nonexistent', 'tenant1');

      expect(result).toBeNull();
    });
  });

  describe('findAllTransactionTypes', () => {
    it('should return approved transaction types', async () => {
      const mockTypes = {
        rows: [{ transaction_type: 'PACS.008' }, { transaction_type: 'PACS.002' }],
      };
      mockPool.query.mockResolvedValue(mockTypes);

      const result = await databaseService.findAllTransactionTypes('tenant1');

      expect(result).toEqual(['PACS.008', 'PACS.002']);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT transaction_type'),
        ['tenant1'],
      );
    });
  });

  describe('getPayloadByTransactionType', () => {
    it('should return payload for transaction type', async () => {
      const mockPayload = { payload_json: { field: 'value' } };
      mockPool.query.mockResolvedValue({ rows: [mockPayload] });

      const result = await databaseService.getPayloadByTransactionType('PACS.008', 'tenant1');

      expect(result).toEqual({ payload: mockPayload.payload_json, type: 'json' });
    });

    it('should throw error for missing parameters', async () => {
      await expect(databaseService.getPayloadByTransactionType('', 'tenant1')).rejects.toThrow(
        'Transaction type and tenant ID are required',
      );
      await expect(databaseService.getPayloadByTransactionType('PACS.008', '')).rejects.toThrow(
        'Transaction type and tenant ID are required',
      );
    });
  });

  describe('getSchemaByTransactionType', () => {
    it('should return schema and mapping for transaction type', async () => {
      const mockData = { rows: [{ schema: { fields: [] }, mapping: { map: 'data' } }] };
      mockPool.query.mockResolvedValue(mockData);

      const result = await databaseService.getSchemaByTransactionType('PACS.008', 'tenant1');

      expect(result).toEqual({
        schema: { fields: [] },
        mapping: { map: 'data' },
      });
    });

    it('should throw error for missing parameters', async () => {
      await expect(databaseService.getSchemaByTransactionType('', 'tenant1')).rejects.toThrow(
        'Transaction type and tenant ID are required',
      );
    });
  });

  describe('findActiveNetworkMap', () => {
    it('should return active network map configuration', async () => {
      const mockNetworkMap = { rows: [{ configuration: { active: 'true', nodes: [] } }] };
      mockPool.query.mockResolvedValue(mockNetworkMap);

      const result = await databaseService.findActiveNetworkMap('tenant1');

      expect(result).toEqual({ active: 'true', nodes: [] });
    });

    it('should return null when no active network map found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.findActiveNetworkMap('tenant1');

      expect(result).toBeNull();
    });

    it('should throw error when multiple active network maps found', async () => {
      const mockMultiple = { rows: [{ configuration: {} }, { configuration: {} }] };
      mockPool.query.mockResolvedValue(mockMultiple);

      await expect(databaseService.findActiveNetworkMap('tenant1')).rejects.toThrow(
        'Multiple active network maps found',
      );
    });
  });

  // Additional edge case tests for higher coverage
  describe('Edge Cases for Complete Coverage', () => {
    describe('createTransactionTypeTable - Additional Validation', () => {
      it('should throw error for table name with reserved keyword', async () => {
        await expect(databaseService.createTransactionTypeTable('select')).rejects.toThrow(
          'It is a reserved SQL keyword',
        );
      });

      it('should throw error for table name exceeding 63 characters', async () => {
        const longTableName = 'a'.repeat(64);
        await expect(databaseService.createTransactionTypeTable(longTableName)).rejects.toThrow(
          'Must not exceed 63 characters',
        );
      });

      it('should throw error for table name starting with number', async () => {
        await expect(databaseService.createTransactionTypeTable('123table')).rejects.toThrow(
          'Only letters, numbers, and underscores are allowed',
        );
      });

      it('should throw error for table name with special characters', async () => {
        await expect(databaseService.createTransactionTypeTable('table-name!')).rejects.toThrow(
          'Only letters, numbers, and underscores are allowed',
        );
      });

      it('should handle database errors during table creation', async () => {
        (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        await expect(databaseService.createTransactionTypeTable('valid_table')).rejects.toThrow(
          'Database connection failed',
        );
      });
    });

    describe('executeSelectQuery - Complex Edge Cases', () => {
      it('should handle query with existing WHERE clause and semicolon', async () => {
        const query = 'SELECT * FROM users WHERE active = true;';
        const tenantId = 'tenant-1';
        const params = [];
        const mockRows = [{ id: 1, name: 'Test User' }];

        (mockPool.query as jest.Mock).mockResolvedValue({
          rows: mockRows,
          rowCount: 1,
        });

        const result = await databaseService.executeSelectQuery(query, tenantId, params);

        expect(result).toEqual(mockRows);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT * FROM users WHERE tenant_id = 'tenant-1' AND active = true LIMIT 5;",
          [],
        );
      });

      it('should handle query with WHERE clause and LIMIT without semicolon', async () => {
        const query = 'SELECT * FROM users WHERE active = true LIMIT 10';
        const tenantId = 'tenant-1';
        const params = [];
        const mockRows = [{ id: 1, name: 'Test User' }];

        (mockPool.query as jest.Mock).mockResolvedValue({
          rows: mockRows,
          rowCount: 1,
        });

        const result = await databaseService.executeSelectQuery(query, tenantId, params);

        expect(result).toEqual(mockRows);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT * FROM users WHERE tenant_id = 'tenant-1' AND active = true LIMIT 10",
          [],
        );
      });

      it('should handle case-insensitive detection of table names', async () => {
        const query = 'SELECT * FROM USERS join ORDERS on users.id = orders.user_id';
        const tenantId = 'tenant-1';
        const params = [];
        const mockRows = [{ id: 1, name: 'Test User' }];

        (mockPool.query as jest.Mock).mockResolvedValue({
          rows: mockRows,
          rowCount: 1,
        });

        const result = await databaseService.executeSelectQuery(query, tenantId, params);

        expect(result).toEqual(mockRows);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT * FROM USERS join ORDERS on users.id = orders.user_id WHERE tenant_id = 'tenant-1' LIMIT 5",
          [],
        );
      });
    });

    describe('Database Error Handling', () => {
      it('should throw proper HttpException on database query failure', async () => {
        const query = 'SELECT * FROM users';
        const tenantId = 'tenant-1';
        const params = [];

        (mockPool.query as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

        await expect(databaseService.executeSelectQuery(query, tenantId, params)).rejects.toThrow(
          'Failed to execute query: Connection timeout',
        );
      });

      it('should handle edge case where no insertion point is found', async () => {
        const query = 'SELECT * FROM users u INNER JOIN posts p ON u.id = p.user_id';
        const tenantId = 'tenant-1';
        const params = [];
        const mockRows = [{ id: 1, name: 'Test User' }];

        (mockPool.query as jest.Mock).mockResolvedValue({
          rows: mockRows,
          rowCount: 1,
        });

        const result = await databaseService.executeSelectQuery(query, tenantId, params);

        expect(result).toEqual(mockRows);
        expect(mockPool.query).toHaveBeenCalledWith(
          "SELECT * FROM users u INNER JOIN posts p ON u.id = p.user_id WHERE tenant_id = 'tenant-1' LIMIT 5",
          [],
        );
      });
    });
  });
});
