import { Pool } from 'pg';
import { DatabaseConfig } from 'src/interfaces/DatabaseConfig';

export class DatabaseFactory {
  private static pgPool: Pool;

  static async initializeDatabase(config: DatabaseConfig): Promise<void> {
    this.pgPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });

    await this.pgPool.connect();
  }

  static getPool(): Pool {
    return this.pgPool;
  }
}
