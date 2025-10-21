"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const schema_workflow_dto_1 = require("./schema-workflow.dto");
const core_interfaces_1 = require("../interfaces/core.interfaces");
describe('ParsePayloadDto', () => {
    it('should create a valid parse payload DTO', () => {
        const dto = new schema_workflow_dto_1.ParsePayloadDto();
        dto.payload = '{"test": "data"}';
        dto.contentType = core_interfaces_1.ContentType.JSON;
        expect(dto.payload).toBe('{"test": "data"}');
        expect(dto.contentType).toBe(core_interfaces_1.ContentType.JSON);
    });
    it('should validate required fields', async () => {
        const dto = new schema_workflow_dto_1.ParsePayloadDto();
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
    it('should validate with all required fields', async () => {
        const dto = new schema_workflow_dto_1.ParsePayloadDto();
        dto.payload = '<root><test>data</test></root>';
        dto.contentType = core_interfaces_1.ContentType.XML;
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
    it('should accept optional filename', async () => {
        const dto = new schema_workflow_dto_1.ParsePayloadDto();
        dto.payload = '{"test": "data"}';
        dto.contentType = core_interfaces_1.ContentType.JSON;
        dto.filename = 'test.json';
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
        expect(dto.filename).toBe('test.json');
    });
});
describe('AdjustFieldDto', () => {
    it('should create a valid adjust field DTO', () => {
        const dto = new schema_workflow_dto_1.AdjustFieldDto();
        dto.path = 'root.testField';
        dto.type = core_interfaces_1.FieldType.STRING;
        dto.isRequired = true;
        expect(dto.path).toBe('root.testField');
        expect(dto.type).toBe(core_interfaces_1.FieldType.STRING);
        expect(dto.isRequired).toBe(true);
    });
    it('should validate required fields', async () => {
        const dto = new schema_workflow_dto_1.AdjustFieldDto();
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
    it('should validate with all fields', async () => {
        const dto = new schema_workflow_dto_1.AdjustFieldDto();
        dto.path = 'root.field';
        dto.type = core_interfaces_1.FieldType.NUMBER;
        dto.isRequired = false;
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
});
//# sourceMappingURL=schema-workflow.dto.spec.js.map