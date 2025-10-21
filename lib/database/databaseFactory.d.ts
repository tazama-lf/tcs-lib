import { Pool } from 'pg';
import { DatabaseConfig } from 'src/interfaces/DatabaseConfig';
export declare class DatabaseFactory {
    private static pgPool;
    static initializeDatabase(config: DatabaseConfig): Promise<void>;
    static getPool(): Pool;
}
