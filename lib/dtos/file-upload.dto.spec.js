"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const file_upload_dto_1 = require("./file-upload.dto");
const core_interfaces_1 = require("../interfaces/core.interfaces");
describe('FileUploadDto', () => {
    it('should create a valid file upload DTO', () => {
        const dto = new file_upload_dto_1.FileUploadDto();
        dto.contentType = core_interfaces_1.ContentType.JSON;
        expect(dto.contentType).toBe(core_interfaces_1.ContentType.JSON);
    });
    it('should validate required fields', async () => {
        const dto = new file_upload_dto_1.FileUploadDto();
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
    it('should validate with all required fields', async () => {
        const dto = new file_upload_dto_1.FileUploadDto();
        dto.contentType = core_interfaces_1.ContentType.XML;
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
    it('should accept optional description', async () => {
        const dto = new file_upload_dto_1.FileUploadDto();
        dto.contentType = core_interfaces_1.ContentType.JSON;
        dto.description = 'Test file upload';
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
        expect(dto.description).toBe('Test file upload');
    });
});
describe('ParsedFileResult', () => {
    it('should have correct structure', () => {
        const result = {
            content: '{"test": "data"}',
            contentType: core_interfaces_1.ContentType.JSON,
            originalName: 'test.json',
            size: 1024,
        };
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('contentType');
        expect(result).toHaveProperty('originalName');
        expect(result).toHaveProperty('size');
    });
});
//# sourceMappingURL=file-upload.dto.spec.js.map