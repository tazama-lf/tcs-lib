import { Pool } from 'pg';
import { Config } from '../interfaces/Endpoint';
export declare class DatabaseService {
  private readonly pgClient;
  constructor(pgClient: Pool);
  createConfig(config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
}
