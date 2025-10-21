"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const endpoint_dto_1 = require("./endpoint.dto");
const core_interfaces_1 = require("../interfaces/core.interfaces");
describe('CreateEndpointDto', () => {
    it('should create a valid endpoint DTO', () => {
        const dto = new endpoint_dto_1.CreateEndpointDto();
        dto.path = '/api/test';
        dto.method = core_interfaces_1.HttpMethod.POST;
        dto.contentType = core_interfaces_1.ContentType.JSON;
        dto.transactionType = core_interfaces_1.TransactionType.PAYMENTS;
        dto.version = '1.0.0';
        dto.samplePayload = '{"test": "data"}';
        expect(dto.path).toBe('/api/test');
        expect(dto.method).toBe(core_interfaces_1.HttpMethod.POST);
    });
    it('should validate required fields', async () => {
        const dto = new endpoint_dto_1.CreateEndpointDto();
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
    it('should validate with all required fields', async () => {
        const dto = new endpoint_dto_1.CreateEndpointDto();
        dto.path = '/api/test';
        dto.method = core_interfaces_1.HttpMethod.GET;
        dto.contentType = core_interfaces_1.ContentType.JSON;
        dto.transactionType = core_interfaces_1.TransactionType.TRANSFERS;
        dto.version = '1.0.0';
        dto.samplePayload = '{"test": "data"}';
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
    it('should accept optional fields', async () => {
        const dto = new endpoint_dto_1.CreateEndpointDto();
        dto.path = '/api/test';
        dto.method = core_interfaces_1.HttpMethod.POST;
        dto.contentType = core_interfaces_1.ContentType.JSON;
        dto.transactionType = core_interfaces_1.TransactionType.PAYMENTS;
        dto.version = '1.0.0';
        dto.samplePayload = '{"test": "data"}';
        dto.description = 'Test description';
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
        expect(dto.description).toBe('Test description');
    });
});
//# sourceMappingURL=endpoint.dto.spec.js.map