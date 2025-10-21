"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_schema_interfaces_1 = require("./json-schema.interfaces");
describe('JSON Schema Interfaces', () => {
    describe('JSONSchemaType', () => {
        it('should have all JSON schema types', () => {
            expect(json_schema_interfaces_1.JSONSchemaType.STRING).toBe('string');
            expect(json_schema_interfaces_1.JSONSchemaType.NUMBER).toBe('number');
            expect(json_schema_interfaces_1.JSONSchemaType.INTEGER).toBe('integer');
            expect(json_schema_interfaces_1.JSONSchemaType.BOOLEAN).toBe('boolean');
            expect(json_schema_interfaces_1.JSONSchemaType.OBJECT).toBe('object');
            expect(json_schema_interfaces_1.JSONSchemaType.ARRAY).toBe('array');
            expect(json_schema_interfaces_1.JSONSchemaType.NULL).toBe('null');
        });
    });
    describe('JSONSchemaFormat', () => {
        it('should have all JSON schema formats', () => {
            expect(json_schema_interfaces_1.JSONSchemaFormat.DATE_TIME).toBe('date-time');
            expect(json_schema_interfaces_1.JSONSchemaFormat.DATE).toBe('date');
            expect(json_schema_interfaces_1.JSONSchemaFormat.TIME).toBe('time');
            expect(json_schema_interfaces_1.JSONSchemaFormat.EMAIL).toBe('email');
            expect(json_schema_interfaces_1.JSONSchemaFormat.HOSTNAME).toBe('hostname');
            expect(json_schema_interfaces_1.JSONSchemaFormat.IPV4).toBe('ipv4');
            expect(json_schema_interfaces_1.JSONSchemaFormat.IPV6).toBe('ipv6');
            expect(json_schema_interfaces_1.JSONSchemaFormat.URI).toBe('uri');
            expect(json_schema_interfaces_1.JSONSchemaFormat.UUID).toBe('uuid');
        });
    });
});
//# sourceMappingURL=json-schema.interfaces.spec.js.map