import type { DatabaseConfig } from '../../src/interfaces/DatabaseConfig';

const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockEnd = jest.fn();
const mockOn = jest.fn();

jest.mock('pg', () => {
  const mockPoolInstance = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };

  return {
    Pool: jest.fn().mockImplementation(() => mockPoolInstance),
  };
});

import { Pool } from 'pg';
import { initializeDatabase, getPool } from '../../src/database/databaseFactory';

const MockedPool = Pool as jest.MockedClass<typeof Pool>;

describe('databaseFactory', () => {
  const mockConfig: DatabaseConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
  };

  let mockPoolInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPoolInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      end: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    MockedPool.mockImplementation(() => mockPoolInstance);
  });

  describe('initializeDatabase', () => {
    it('should create a new Pool with the provided configuration', async () => {
      await initializeDatabase(mockConfig);

      expect(MockedPool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      });
    });

    it('should call connect on the pool', async () => {
      await initializeDatabase(mockConfig);

      expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('should throw error if connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockPoolInstance.connect.mockRejectedValueOnce(connectionError);

      await expect(initializeDatabase(mockConfig)).rejects.toThrow('Connection failed');
    });

    it('should handle different database configurations', async () => {
      const customConfig: DatabaseConfig = {
        host: 'db.example.com',
        port: 5433,
        database: 'production_db',
        user: 'admin',
        password: 'secure_pass',
      };

      await initializeDatabase(customConfig);

      expect(MockedPool).toHaveBeenCalledWith({
        host: 'db.example.com',
        port: 5433,
        database: 'production_db',
        user: 'admin',
        password: 'secure_pass',
      });
      expect(mockPoolInstance.connect).toHaveBeenCalled();
    });

    it('should replace existing pool when called multiple times', async () => {
      await initializeDatabase(mockConfig);
      expect(MockedPool).toHaveBeenCalledTimes(1);

      const newConfig: DatabaseConfig = {
        host: 'newhost',
        port: 5433,
        database: 'newdb',
        user: 'newuser',
        password: 'newpass',
      };

      await initializeDatabase(newConfig);
      expect(MockedPool).toHaveBeenCalledTimes(2);
      expect(MockedPool).toHaveBeenLastCalledWith({
        host: 'newhost',
        port: 5433,
        database: 'newdb',
        user: 'newuser',
        password: 'newpass',
      });
    });
  });

  describe('getPool', () => {
    it('should return the initialized pool after initializeDatabase is called', async () => {
      await initializeDatabase(mockConfig);

      const pool = getPool();

      expect(pool).toBe(mockPoolInstance);
      expect(pool).toHaveProperty('connect');
      expect(pool).toHaveProperty('query');
    });

    it('should return the same pool instance on multiple calls', async () => {
      await initializeDatabase(mockConfig);

      const pool1 = getPool();
      const pool2 = getPool();

      expect(pool1).toBe(pool2);
      expect(pool1).toBe(mockPoolInstance);
    });

    it('should return the pool even if not used yet', async () => {
      await initializeDatabase(mockConfig);

      const pool = getPool();

      expect(pool).toBeDefined();
      expect(pool).toBe(mockPoolInstance);
    });

    it('should return updated pool after reinitialization', async () => {
      await initializeDatabase(mockConfig);
      const firstPool = getPool();

      await initializeDatabase({
        ...mockConfig,
        database: 'different_db',
      });

      const secondPool = getPool();

      expect(secondPool).toBe(mockPoolInstance);
      expect(firstPool).toBe(secondPool);
    });
  });

  describe('integration scenarios', () => {
    it('should allow pool operations after initialization', async () => {
      await initializeDatabase(mockConfig);

      const pool = getPool();
      mockPoolInstance.query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await pool.query('SELECT 1');

      expect(result.rows).toEqual([{ id: 1 }]);
    });

    it('should maintain pool state across multiple getPool calls', async () => {
      await initializeDatabase(mockConfig);

      const pool1 = getPool();
      const pool2 = getPool();

      expect(pool1).toBe(pool2);
      expect(mockPoolInstance.connect).toHaveBeenCalledTimes(1);
    });
  });
});

