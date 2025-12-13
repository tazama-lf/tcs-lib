import { Pool } from 'pg';
import type { DatabaseConfig } from 'src/interfaces/DatabaseConfig';

let pgPool: Pool;

export async function initializeDatabase(config: DatabaseConfig): Promise<void> {
  pgPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
  });

  await pgPool.connect();
}

export function getPool(): Pool {
  return pgPool;
}
