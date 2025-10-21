"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let DatabaseService = class DatabaseService {
    pgClient;
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    async createConfig(config) {
        const query = `
    INSERT INTO config (
      msg_fam, 
      transaction_type, 
      endpoint_path, 
      version, 
      content_type, 
      schema, 
      mapping, 
      functions, 
      status, 
      tenant_id, 
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id
  `;
        const values = [
            config.msgFam,
            config.transactionType,
            config.endpointPath,
            config.version,
            config.contentType,
            JSON.stringify(config.schema),
            config.mapping ? JSON.stringify(config.mapping) : null,
            config.functions ? JSON.stringify(config.functions) : null,
            'IN_PROGRESS',
            config.tenantId,
            config.createdBy,
        ];
        const result = await this.pgClient.query(query, values);
        return result.rows[0].id;
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], DatabaseService);
//# sourceMappingURL=database.service.js.map