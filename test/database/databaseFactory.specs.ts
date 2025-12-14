import { Pool } from 'pg';
import { initializeDatabase, getPool } from '../../src/database/databaseFactory';
import type { DatabaseConfig } from '../../src/interfaces/DatabaseConfig';

// 🔹 Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mPool),
  };
});

describe('databaseFactory', () => {
  const mockConfig: DatabaseConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('should create a new Pool with provided config and connect', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);

      // @ts-expect-error – mocked Pool instance
      (Pool as jest.Mock).mockImplementation(() => ({
        connect: mockConnect,
      }));

      await initializeDatabase(mockConfig);

      expect(Pool).toHaveBeenCalledWith({
        host: mockConfig.host,
        port: mockConfig.port,
        database: mockConfig.database,
        user: mockConfig.user,
        password: mockConfig.password,
      });

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should throw error if pool connection fails', async () => {
      const mockError = new Error('Connection failed');

      // @ts-expect-error – mocked Pool instance
      (Pool as jest.Mock).mockImplementation(() => ({
        connect: jest.fn().mockRejectedValue(mockError),
      }));

      await expect(initializeDatabase(mockConfig)).rejects.toThrow(
        'Connection failed',
      );
    });
  });

  describe('getPool', () => {
    it('should return the initialized pool', async () => {
      const mockPoolInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
      };

      // @ts-expect-error – mocked Pool constructor
      (Pool as jest.Mock).mockImplementation(() => mockPoolInstance);

      await initializeDatabase(mockConfig);

      const pool = getPool();

      expect(pool).toBe(mockPoolInstance);
    });

    it('should return undefined if initializeDatabase was not called', () => {
      const pool = getPool();
      expect(pool).toBeUndefined();
    });
  });

 
  it('should initialize pgPool and connect successfully', async () => {
    const mockConnect = jest.fn().mockResolvedValue(undefined);

    // @ts-expect-error – mocked Pool implementation
    (Pool as jest.Mock).mockImplementation(() => ({
      connect: mockConnect,
    }));

    await initializeDatabase(mockConfig);

    expect(Pool).toHaveBeenCalledWith({
      host: mockConfig.host,
      port: mockConfig.port,
      database: mockConfig.database,
      user: mockConfig.user,
      password: mockConfig.password,
    });

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

 
  it('should throw error if pgPool.connect fails', async () => {
    const error = new Error('connection failed');

    // @ts-expect-error – mocked Pool implementation
    (Pool as jest.Mock).mockImplementation(() => ({
      connect: jest.fn().mockRejectedValue(error),
    }));

    await expect(initializeDatabase(mockConfig)).rejects.toThrow(
      'connection failed',
    );
  });

  
  it('should return initialized pgPool via getPool()', async () => {
    const mockPoolInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
    };

    // @ts-expect-error – mocked Pool constructor
    (Pool as jest.Mock).mockImplementation(() => mockPoolInstance);

    await initializeDatabase(mockConfig);

    const pool = getPool();

    expect(pool).toBe(mockPoolInstance);
  });

  
  it('should return undefined if getPool is called before initialization', () => {
    const pool = getPool();
    expect(pool).toBeUndefined();
  });
});

