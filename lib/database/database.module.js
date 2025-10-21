"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const database_service_1 = require("./database.service");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot()],
        providers: [
            {
                provide: 'PG_OPTIONS',
                inject: [config_1.ConfigService],
                useFactory: async (config) => {
                    console.log('Database config:', {
                        host: config.get('CONFIGURATION_DATABASE_URL'),
                        database: config.get('CONFIGURATION_DATABASE'),
                        user: config.get('CONFIGURATION_DATABASE_USER'),
                        password: config.get('CONFIGURATION_DATABASE_PASSWORD'),
                    });
                    return {
                        host: config.get('CONFIGURATION_DATABASE_URL'),
                        database: config.get('CONFIGURATION_DATABASE'),
                        user: config.get('CONFIGURATION_DATABASE_USER'),
                        password: config.get('CONFIGURATION_DATABASE_PASSWORD'),
                    };
                },
            },
            {
                provide: 'PG_POOL',
                inject: ['PG_OPTIONS'],
                useFactory: async (options) => {
                    return new pg_1.Pool(options);
                },
            },
            database_service_1.DatabaseService,
        ],
        exports: ['PG_POOL', database_service_1.DatabaseService],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map