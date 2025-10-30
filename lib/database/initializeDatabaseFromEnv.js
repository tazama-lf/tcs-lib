"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabaseFromEnv = initializeDatabaseFromEnv;
const databaseFactory_1 = require("./databaseFactory");
async function initializeDatabaseFromEnv(prefix = 'CONFIGURATION_DATABASE') {
    await databaseFactory_1.DatabaseFactory.initializeDatabase({
        host: process.env[`${prefix}_HOST`] || 'localhost',
        port: parseInt(process.env[`${prefix}_PORT`] || '5432', 10),
        database: process.env[`${prefix}`] || 'configuration',
        user: process.env[`${prefix}_USER`] || 'postgres',
        password: process.env[`${prefix}_PASSWORD`] || 'password',
    });
}
//# sourceMappingURL=initializeDatabaseFromEnv.js.map