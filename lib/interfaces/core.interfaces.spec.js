"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("./core.interfaces");
describe('Core Interfaces', () => {
    describe('TransactionType', () => {
        it('should have TRANSFERS type', () => {
            expect(core_interfaces_1.TransactionType.TRANSFERS).toBe('Transfers');
        });
        it('should have PAYMENTS type', () => {
            expect(core_interfaces_1.TransactionType.PAYMENTS).toBe('Payments');
        });
    });
    describe('HttpMethod', () => {
        it('should have all HTTP methods', () => {
            expect(core_interfaces_1.HttpMethod.GET).toBe('GET');
            expect(core_interfaces_1.HttpMethod.POST).toBe('POST');
            expect(core_interfaces_1.HttpMethod.PUT).toBe('PUT');
            expect(core_interfaces_1.HttpMethod.DELETE).toBe('DELETE');
            expect(core_interfaces_1.HttpMethod.PATCH).toBe('PATCH');
        });
    });
    describe('ContentType', () => {
        it('should have JSON content type', () => {
            expect(core_interfaces_1.ContentType.JSON).toBe('application/json');
        });
        it('should have XML content type', () => {
            expect(core_interfaces_1.ContentType.XML).toBe('application/xml');
        });
    });
    describe('FieldType', () => {
        it('should have all field types', () => {
            expect(core_interfaces_1.FieldType.STRING).toBe('STRING');
            expect(core_interfaces_1.FieldType.NUMBER).toBe('NUMBER');
            expect(core_interfaces_1.FieldType.BOOLEAN).toBe('BOOLEAN');
            expect(core_interfaces_1.FieldType.OBJECT).toBe('OBJECT');
            expect(core_interfaces_1.FieldType.ARRAY).toBe('ARRAY');
            expect(core_interfaces_1.FieldType.DATE).toBe('DATE');
        });
    });
    describe('EndpointStatus', () => {
        it('should have all endpoint statuses', () => {
            expect(core_interfaces_1.EndpointStatus.IN_PROGRESS).toBe('IN_PROGRESS');
            expect(core_interfaces_1.EndpointStatus.PENDING_APPROVAL).toBe('PENDING_APPROVAL');
            expect(core_interfaces_1.EndpointStatus.UNDER_REVIEW).toBe('UNDER_REVIEW');
            expect(core_interfaces_1.EndpointStatus.READY_FOR_DEPLOYMENT).toBe('READY_FOR_DEPLOYMENT');
            expect(core_interfaces_1.EndpointStatus.DEPLOYED).toBe('DEPLOYED');
            expect(core_interfaces_1.EndpointStatus.SUSPENDED).toBe('SUSPENDED');
            expect(core_interfaces_1.EndpointStatus.PUBLISHED).toBe('PUBLISHED');
        });
    });
});
//# sourceMappingURL=core.interfaces.spec.js.map