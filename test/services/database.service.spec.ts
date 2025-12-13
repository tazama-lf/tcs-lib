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
});
