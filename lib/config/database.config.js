"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = exports.DatabaseConfigSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const _1 = require(".");
exports.DatabaseConfigSchema = joi_1.default.object({
    CONFIGURATION_DATABASE_HOST: joi_1.default.string().required(),
    CONFIGURATION_DATABASE_PORT: joi_1.default.number().default(5432),
    CONFIGURATION_DATABASE: joi_1.default.string().required(),
    CONFIGURATION_DATABASE_USER: joi_1.default.string().required(),
    CONFIGURATION_DATABASE_PASSWORD: joi_1.default.string().required(),
});
exports.databaseConfig = {
    host: (0, _1.validateConfig)(process.env.CONFIGURATION_DATABASE_HOST, exports.DatabaseConfigSchema),
    port: (0, _1.validateConfig)(process.env.CONFIGURATION_DATABASE_PORT, exports.DatabaseConfigSchema),
    database: (0, _1.validateConfig)(process.env.CONFIGURATION_DATABASE, exports.DatabaseConfigSchema),
    user: (0, _1.validateConfig)(process.env.CONFIGURATION_DATABASE_USER, exports.DatabaseConfigSchema),
    password: (0, _1.validateConfig)(process.env.CONFIGURATION_DATABASE_PASSWORD, exports.DatabaseConfigSchema),
};
//# sourceMappingURL=database.config.js.map