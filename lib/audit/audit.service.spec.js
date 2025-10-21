"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const audit_service_1 = require("./audit.service");
describe('AuditService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [audit_service_1.AuditService],
        }).compile();
        service = module.get(audit_service_1.AuditService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should have log method', () => {
        expect(service.log).toBeDefined();
        expect(typeof service.log).toBe('function');
    });
    it('should have logError method', () => {
        expect(service.logError).toBeDefined();
        expect(typeof service.logError).toBe('function');
    });
    it('should have logAction method', () => {
        expect(service.logAction).toBeDefined();
        expect(typeof service.logAction).toBe('function');
    });
    it('should not throw when calling log methods', () => {
        expect(() => service.log()).not.toThrow();
        expect(() => service.logError('test', 'error')).not.toThrow();
        expect(() => service.logAction('action', 'data')).not.toThrow();
    });
});
//# sourceMappingURL=audit.service.spec.js.map