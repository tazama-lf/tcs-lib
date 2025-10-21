"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseFactory = void 0;
const pg_1 = require("pg");
class DatabaseFactory {
    static pgPool;
    static async initializeDatabase(config) {
        this.pgPool = new pg_1.Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
        });
        await this.pgPool.connect();
    }
    static getPool() {
        return this.pgPool;
    }
}
exports.DatabaseFactory = DatabaseFactory;
//# sourceMappingURL=databaseFactory.js.map