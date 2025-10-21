import { Config } from 'src/interfaces/Endpoint';
export declare class DatabaseService {
    private readonly dbClient;
    constructor();
    createConfig(config: Omit<Config, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
}
