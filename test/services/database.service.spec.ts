import { DatabaseService } from '../../src/services/database.service';
import { initializeDatabase, getPool } from '../../src/database/databaseFactory';
import type { Pool, PoolClient } from 'pg';
import { ConfigStatus } from '../../src/types/config.types';
import { ConfigType, IngestMode, JobStatus, ScheduleStatus } from '../../src/interfaces/enrichment.interface';
import type { Config } from '../../src/types/config.types';

// Mock the database factory
jest.mock('../../src/database/databaseFactory');

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Create mock pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Pool>;

    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient>;

    // Setup getPool mock
    (getPool as jest.Mock).mockReturnValue(mockPool);
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);

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

      const result = await databaseService.createDestinationType(
        'json',
        'Account',
        5,
        'tenant-1',
      );

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
      await expect(
        databaseService.createTransactionTypeTable('invalid-name'),
      ).rejects.toThrow();
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
      await expect(
        databaseService.createTransactionTypeTable('invalid-name'),
      ).rejects.toThrow();
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

      await expect(databaseService.createPushJob(jobData)).rejects.toThrow(
        'Failed to create job',
      );
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

      await expect(databaseService.createPullJob(jobData)).rejects.toThrow(
        'Failed to create job',
      );
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

      await expect(
        databaseService.findJobById('job-123', 'push_jobs'),
      ).rejects.toThrow('Failed to find job');
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

      const result = await databaseService.getJobsByStatus(
        'tenant-1',
        JobStatus.APPROVED,
        1,
        10,
      );

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

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['tenant-1', JobStatus.REJECTED, 20, 40],
      );
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
      await expect(databaseService.updateJob('job-123', {} as any, ConfigType.PUSH)).rejects.toThrow(
        'No fields provided to update',
      );
    });

    it('should throw error if job not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      await expect(
        databaseService.updateJob('nonexistent', { status: JobStatus.APPROVED } as any, ConfigType.PUSH),
      ).rejects.toThrow('Job with id "nonexistent" not found');
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateJob('job-123', { status: JobStatus.APPROVED } as any, ConfigType.PUSH),
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_jobs'),
        [ScheduleStatus.ACTIVE, 'job-123'],
      );
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_jobs'),
        [JobStatus.APPROVED, 'job-123'],
      );
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pull_jobs'),
        [JobStatus.REVIEW, 'job-456'],
      );
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('comments = $2'),
        [JobStatus.REJECTED, 'Invalid configuration', 'job-123'],
      );
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

      await expect(
        databaseService.updateSchedule('nonexistent', { name: 'Test' }),
      ).rejects.toThrow('No cron job found with id: nonexistent');
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

      await databaseService.getAllSchedule(
        10,
        0,
        { status: JobStatus.APPROVED },
        'tenant-1',
      );

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

      await databaseService.getAllSchedule(
        10,
        0,
        { name: 'sync' },
        'tenant-1',
      );

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

      await databaseService.getAllSchedule(
        10,
        0,
        { createdAt: '2025-12-15' },
        'tenant-1',
      );

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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tenant_id = $1'),
        ['tenant-1', JobStatus.APPROVED, 10, 0],
      );
    });

    it('should calculate offset correctly for different pages', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await databaseService.getScheduleByStatus('tenant-1', JobStatus.REJECTED, 2, 15);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['tenant-1', JobStatus.REJECTED, 15, 15],
      );
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cron_jobs'),
        [JobStatus.APPROVED, 'tenant-1', 'schedule-123'],
      );
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('comments = $2'),
        [JobStatus.REJECTED, 'Invalid cron expression', 'schedule-123'],
      );
    });

    it('should throw error if schedule not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      await expect(
        databaseService.updateScheduleByStatus(
          JobStatus.APPROVED,
          'nonexistent',
          'tenant-1',
        ),
      ).rejects.toThrow('No cron job found with id: nonexistent');
    });

    it('should throw error on database error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.updateScheduleByStatus(
          JobStatus.APPROVED,
          'schedule-123',
          'tenant-1',
        ),
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

      await expect(
        databaseService.getJobHistory(10, 0, 'tenant-1', {}),
      ).rejects.toThrow('Error fetching job_history');
    });

    it('should handle query errors with detailed message', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Connection timeout'),
      );

      await expect(
        databaseService.getJobHistory(10, 0, 'tenant-1', {}),
      ).rejects.toThrow('Connection timeout');
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

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test_table'],
      );
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

      await expect(
        databaseService.validateActive('test_table', ConfigType.PUSH),
      ).rejects.toThrow('Deactivate jobs with the table name used');
    });

    it('should throw error if active pull jobs exist', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '1' }],
        rowCount: 1,
      });

      await expect(
        databaseService.validateActive('test_table', ConfigType.PULL),
      ).rejects.toThrow('Deactivate jobs with the table name used');
    });

    it('should query pull_jobs table for PULL type', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      await databaseService.validateActive('test_table', ConfigType.PULL);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM pull_jobs'),
        ['test_table'],
      );
    });

    it('should query push_jobs table for PUSH type', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      await databaseService.validateActive('test_table', ConfigType.PUSH);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM push_jobs'),
        ['test_table'],
      );
    });

    it('should handle database errors', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.validateActive('test_table', ConfigType.PUSH),
      ).rejects.toThrow('Failed to validate active jobs');
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
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('_key text PRIMARY KEY'),
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('data jsonb NOT NULL'),
      );
    });

    it('should validate table name before creating table', async () => {
      await expect(
        databaseService.createTazamaDataModelTable('invalid-table-name!'),
      ).rejects.toThrow('Invalid table name');
    });

    it('should handle database errors during table creation', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.createTazamaDataModelTable('test_table'),
      ).rejects.toThrow('Database error');
    });
  });

});
