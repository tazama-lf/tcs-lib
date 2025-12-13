import { DatabaseService } from '../../src/services/database.service';
import { initializeDatabase, getPool } from '../../src/database/databaseFactory';
import type { Pool, PoolClient } from 'pg';
import { ConfigStatus } from '../../src/types/config.types';
import { JobStatus } from '../../src/interfaces/enrichment.interface';
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
});
