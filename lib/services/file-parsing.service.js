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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParsingService = void 0;
const common_1 = require("@nestjs/common");
const core_interfaces_1 = require("../interfaces/core.interfaces");
const audit_service_1 = require("../audit/audit.service");
let FileParsingService = class FileParsingService {
    _auditService;
    constructor(_auditService) {
        this._auditService = _auditService;
    }
    parseUploadedFile(file, expectedContentType) {
        if (!file) {
            this._auditService.logError('SYSTEM', 'default-tenant', 'No file uploaded', 'File upload failed');
            throw new common_1.BadRequestException('No file uploaded');
        }
        const content = file.buffer.toString('utf8');
        const isValidFile = this.validateFileType(file, expectedContentType, content);
        if (!isValidFile.isValid) {
            this._auditService.logError('SYSTEM', 'default-tenant', isValidFile.error || 'Unknown validation error', 'File validation failed');
            throw new common_1.BadRequestException(isValidFile.error);
        }
        const result = {
            content,
            contentType: expectedContentType,
            originalName: file.originalname,
            size: file.size,
        };
        this._auditService.logAction({
            entityType: 'FILE_PARSING',
            action: 'PARSE_FILE',
            actor: 'SYSTEM',
            tenantId: 'default-tenant',
            details: `Parsed file: ${file.originalname} (${file.size} bytes, ${expectedContentType})`,
            status: 'SUCCESS',
            severity: 'LOW',
        });
        return result;
    }
    validateFileType(file, expectedContentType, content) {
        const filename = file.originalname.toLowerCase();
        if (expectedContentType === core_interfaces_1.ContentType.JSON) {
            if (!filename.endsWith('.json')) {
                return {
                    isValid: false,
                    error: 'File must have .json extension for JSON content type',
                };
            }
            try {
                JSON.parse(content);
            }
            catch (error) {
                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                return {
                    isValid: false,
                    error: `Invalid JSON format: ${errorMessage}`,
                };
            }
        }
        else if (expectedContentType === core_interfaces_1.ContentType.XML) {
            if (!filename.endsWith('.xml')) {
                return {
                    isValid: false,
                    error: 'File must have .xml extension for XML content type',
                };
            }
            if (!content.trim().startsWith('<') || !content.trim().endsWith('>')) {
                return {
                    isValid: false,
                    error: 'Invalid XML format: must start with < and end with >',
                };
            }
        }
        return { isValid: true };
    }
    detectContentType(file) {
        const filename = file.originalname.toLowerCase();
        const content = file.buffer.toString('utf8').trim();
        if (filename.endsWith('.json')) {
            return core_interfaces_1.ContentType.JSON;
        }
        if (filename.endsWith('.xml')) {
            return core_interfaces_1.ContentType.XML;
        }
        if (content.startsWith('{') || content.startsWith('[')) {
            return core_interfaces_1.ContentType.JSON;
        }
        if (content.startsWith('<')) {
            return core_interfaces_1.ContentType.XML;
        }
        return core_interfaces_1.ContentType.JSON;
    }
    static getAllowedMimeTypes() {
        return [
            'application/json',
            'text/json',
            'application/xml',
            'text/xml',
            'text/plain',
        ];
    }
};
exports.FileParsingService = FileParsingService;
exports.FileParsingService = FileParsingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], FileParsingService);
//# sourceMappingURL=file-parsing.service.js.map