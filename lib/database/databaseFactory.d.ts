import type { Pool } from 'pg';
import type { DatabaseConfig } from 'src/interfaces/DatabaseConfig';
export declare class DatabaseFactory {
    private static readonly pgPool;
    static initializeDatabase(config: DatabaseConfig): Promise<void>;
    static getPool(): Pool;
}
