"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PayloadParsingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadParsingService = void 0;
const common_1 = require("@nestjs/common");
const core_interfaces_1 = require("../interfaces/core.interfaces");
const json_schema_converter_service_1 = require("../schemas/json-schema-converter.service");
const xml2js = __importStar(require("xml2js"));
let PayloadParsingService = PayloadParsingService_1 = class PayloadParsingService {
    _jsonSchemaConverter;
    logger = new common_1.Logger(PayloadParsingService_1.name);
    constructor(_jsonSchemaConverter) {
        this._jsonSchemaConverter = _jsonSchemaConverter;
    }
    async parsePayloadToSchema(payload, contentType, _filename) {
        const startTime = Date.now();
        try {
            this.logger.log(`Parsing ${contentType} payload for User Story #300 schema generation`);
            const structureValidation = await this.validatePayloadStructure(payload, contentType);
            if (!structureValidation.success) {
                return {
                    success: false,
                    jsonSchema: this.createEmptyJSONSchema(),
                    sourceFields: [],
                    metadata: this.createEmptyMetadata(payload, Date.now() - startTime),
                    validation: structureValidation,
                };
            }
            const parsedData = await this.parsePayloadToObject(payload, contentType);
            const sourceFields = this.generateHierarchicalSchema(parsedData, '');
            const validation = this.validateGeneratedSchema(sourceFields);
            const metadata = this.calculateSchemaMetadata(sourceFields, payload, Date.now() - startTime);
            const jsonSchema = this._jsonSchemaConverter.convertToJSONSchema(sourceFields, 'Generated Schema');
            this.logger.log(`Successfully generated schema with ${sourceFields.length} root fields`);
            return {
                success: true,
                jsonSchema,
                sourceFields,
                metadata,
                validation,
            };
        }
        catch (error) {
            let errorMessage = 'Unknown error';
            let errorStack = '';
            if (error instanceof Error) {
                errorMessage = error.message;
                errorStack = error.stack || '';
            }
            this.logger.error(`Failed to parse payload: ${errorMessage}`, errorStack);
            return {
                success: false,
                jsonSchema: this.createEmptyJSONSchema(),
                sourceFields: [],
                metadata: this.createEmptyMetadata(payload, Date.now() - startTime),
                validation: {
                    success: false,
                    errors: [`Parsing failed: ${errorMessage}`],
                    warnings: [],
                },
            };
        }
    }
    applyFieldAdjustments(sourceFields, adjustments) {
        if (!adjustments || adjustments.length === 0) {
            return sourceFields;
        }
        const adjustmentMap = new Map(adjustments.map((adj) => [adj.path, adj]));
        return this.applyAdjustmentsRecursively(sourceFields, adjustmentMap);
    }
    async validatePayloadStructure(payload, contentType) {
        const errors = [];
        const warnings = [];
        if (!payload || payload.trim().length === 0) {
            errors.push('Payload is empty. Please provide a valid JSON or XML payload.');
            return { success: false, errors, warnings };
        }
        const sizeInMB = payload.length / (1024 * 1024);
        if (sizeInMB > 10) {
            warnings.push(`Payload size is ${sizeInMB.toFixed(1)}MB. Processing may be slow for payloads over 10MB.`);
        }
        else if (sizeInMB > 5) {
            warnings.push(`Payload size is ${sizeInMB.toFixed(1)}MB. Consider optimizing for better performance.`);
        }
        try {
            if (contentType === core_interfaces_1.ContentType.JSON) {
                const parsed = JSON.parse(payload);
                this.validateJsonStructure(parsed, errors, warnings);
            }
            else if (contentType === core_interfaces_1.ContentType.XML) {
                await xml2js.parseStringPromise(payload);
                this.validateXmlStructure(payload, errors, warnings);
            }
            else {
                errors.push(`Unsupported content type: ${String(contentType)}. Supported types are: application/json, application/xml`);
            }
        }
        catch (error) {
            this.addStructureError(error, contentType, errors);
        }
        return {
            success: errors.length === 0,
            errors,
            warnings,
        };
    }
    addStructureError(error, contentType, errors) {
        const errorMessage = error.message || 'Unknown parsing error';
        if (contentType === core_interfaces_1.ContentType.JSON) {
            if (errorMessage.includes('Unexpected token')) {
                const match = errorMessage.match(/Unexpected token (.) in JSON at position (\d+)/);
                if (match) {
                    const [, token, position] = match;
                    errors.push(`Invalid JSON: Unexpected character '${token}' at position ${position}. Check for missing quotes, commas, or brackets.`);
                }
                else {
                    errors.push(`Invalid JSON structure: ${errorMessage}. Please verify JSON syntax.`);
                }
            }
            else if (errorMessage.includes('Unexpected end of JSON input')) {
                errors.push('Invalid JSON: Incomplete JSON structure. Check for missing closing brackets or braces.');
            }
            else {
                errors.push(`Invalid JSON: ${errorMessage}. Please ensure valid JSON syntax.`);
            }
        }
        else if (contentType === core_interfaces_1.ContentType.XML) {
            if (errorMessage.includes('Non-whitespace before first tag')) {
                errors.push('Invalid XML: Content found before root element. XML must start with an element tag.');
            }
            else if (errorMessage.includes('Unclosed tag')) {
                errors.push('Invalid XML: Unclosed tag found. Ensure all XML tags are properly closed.');
            }
            else {
                errors.push(`Invalid XML: ${errorMessage}. Please ensure valid XML syntax.`);
            }
        }
    }
    validateJsonStructure(parsed, errors, warnings) {
        if (parsed === null) {
            errors.push('JSON payload cannot be null. Please provide a valid object or array.');
            return;
        }
        if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
            warnings.push('JSON payload is a primitive value. Consider wrapping in an object for better schema generation.');
        }
        if (Array.isArray(parsed) && parsed.length === 0) {
            warnings.push('JSON array is empty. Schema generation will be limited without sample data.');
        }
        if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
            warnings.push('JSON object is empty. Schema generation will be limited without properties.');
        }
        const maxDepth = this.calculateObjectDepth(parsed);
        if (maxDepth > 10) {
            warnings.push(`JSON structure is deeply nested (${maxDepth} levels). Consider flattening for better performance.`);
        }
    }
    validateXmlStructure(xmlString, errors, warnings) {
        if (xmlString.includes('<!DOCTYPE')) {
            warnings.push('XML contains DOCTYPE declaration. DTD validation is not performed.');
        }
        if (xmlString.includes('xmlns:')) {
            warnings.push('XML contains namespaces. Namespace prefixes will be included in field names.');
        }
        const elementCount = (xmlString.match(/<\w+/g) || []).length;
        if (elementCount > 1000) {
            warnings.push(`XML contains ${elementCount} elements. Processing may be slow for complex XML structures.`);
        }
    }
    calculateObjectDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return currentDepth;
        }
        if (Array.isArray(obj)) {
            return obj.reduce((maxDepth, item) => Math.max(maxDepth, this.calculateObjectDepth(item, currentDepth + 1)), currentDepth);
        }
        let maxChildDepth = currentDepth;
        for (const value of Object.values(obj)) {
            const childDepth = this.calculateObjectDepth(value, currentDepth + 1);
            maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
        return maxChildDepth;
    }
    async parsePayloadToObject(payload, contentType) {
        if (contentType === core_interfaces_1.ContentType.JSON) {
            return JSON.parse(payload);
        }
        else if (contentType === core_interfaces_1.ContentType.XML) {
            const result = await xml2js.parseStringPromise(payload, {
                explicitArray: false,
                mergeAttrs: true,
                explicitRoot: false,
            });
            return result;
        }
        else {
            throw new Error(`Unsupported content type: ${String(contentType)}`);
        }
    }
    generateHierarchicalSchema(obj, parentPath, level = 0) {
        const fields = [];
        if (obj === null || obj === undefined) {
            return fields;
        }
        if (Array.isArray(obj)) {
            if (obj.length > 0) {
                const elementSchema = this.generateHierarchicalSchema(obj[0], parentPath, level);
                return elementSchema;
            }
            return fields;
        }
        if (typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                const fieldPath = parentPath ? `${parentPath}.${key}` : key;
                const field = this.createSchemaField(key, fieldPath, value, level);
                if (field) {
                    fields.push(field);
                }
            }
        }
        return fields;
    }
    createSchemaField(name, path, value, level) {
        if (value === null || value === undefined) {
            return {
                name,
                path,
                type: core_interfaces_1.FieldType.STRING,
                isRequired: false,
            };
        }
        if (Array.isArray(value)) {
            const children = value.length > 0 ? this.generateHierarchicalSchema(value[0], path, level + 1) : [];
            return {
                name,
                path,
                type: core_interfaces_1.FieldType.ARRAY,
                isRequired: true,
                children: children.length > 0 ? children : undefined,
                arrayElementType: this.inferArrayElementType(value),
            };
        }
        if (typeof value === 'object') {
            const children = this.generateHierarchicalSchema(value, path, level + 1);
            return {
                name,
                path,
                type: core_interfaces_1.FieldType.OBJECT,
                isRequired: true,
                children: children.length > 0 ? children : undefined,
            };
        }
        return {
            name,
            path,
            type: this.inferPrimitiveType(value),
            isRequired: true,
        };
    }
    inferPrimitiveType(value) {
        if (typeof value === 'string') {
            return core_interfaces_1.FieldType.STRING;
        }
        else if (typeof value === 'number') {
            return core_interfaces_1.FieldType.NUMBER;
        }
        else if (typeof value === 'boolean') {
            return core_interfaces_1.FieldType.BOOLEAN;
        }
        else {
            return core_interfaces_1.FieldType.STRING;
        }
    }
    inferArrayElementType(array) {
        if (array.length === 0)
            return core_interfaces_1.FieldType.STRING;
        const firstElement = array[0];
        if (Array.isArray(firstElement))
            return core_interfaces_1.FieldType.ARRAY;
        if (typeof firstElement === 'object')
            return core_interfaces_1.FieldType.OBJECT;
        return this.inferPrimitiveType(firstElement);
    }
    validateGeneratedSchema(fields) {
        const errors = [];
        const warnings = [];
        const duplicateFields = [];
        const invalidTypes = [];
        const conflictingPaths = [];
        const allPaths = this.collectAllPaths(fields);
        const pathCounts = new Map();
        allPaths.forEach((path) => {
            pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
        });
        pathCounts.forEach((count, path) => {
            if (count > 1) {
                duplicateFields.push(path);
                errors.push(`Duplicate field path: ${path}`);
            }
        });
        this.validateFieldsRecursively(fields, errors, warnings, invalidTypes, conflictingPaths);
        return {
            success: errors.length === 0,
            errors,
            warnings,
            duplicateFields: duplicateFields.length > 0 ? duplicateFields : undefined,
            invalidTypes: invalidTypes.length > 0 ? invalidTypes : undefined,
            conflictingPaths: conflictingPaths.length > 0 ? conflictingPaths : undefined,
        };
    }
    validateFieldsRecursively(fields, errors, warnings, invalidTypes, conflictingPaths) {
        for (const field of fields) {
            if (!Object.values(core_interfaces_1.FieldType).includes(field.type)) {
                invalidTypes.push(field.path);
                errors.push(`Invalid field type for ${field.path}: ${field.type}`);
            }
            if (field.type === core_interfaces_1.FieldType.ARRAY && field.arrayElementType === core_interfaces_1.FieldType.STRING) {
                warnings.push(`Array field ${field.path} with string elements may need special handling`);
            }
            if (field.children) {
                this.validateFieldsRecursively(field.children, errors, warnings, invalidTypes, conflictingPaths);
            }
        }
    }
    collectAllPaths(fields) {
        const paths = [];
        for (const field of fields) {
            paths.push(field.path);
            if (field.children) {
                paths.push(...this.collectAllPaths(field.children));
            }
        }
        return paths;
    }
    applyAdjustmentsRecursively(fields, adjustmentMap) {
        return fields.map((field) => {
            const adjustment = adjustmentMap.get(field.path);
            const adjustedField = { ...field };
            if (adjustment) {
                adjustedField.type = adjustment.type;
                adjustedField.isRequired = adjustment.isRequired;
                this.logger.log(`Applied adjustment to field ${field.path}: type=${adjustment.type}, required=${adjustment.isRequired}`);
            }
            if (field.children) {
                adjustedField.children = this.applyAdjustmentsRecursively(field.children, adjustmentMap);
            }
            return adjustedField;
        });
    }
    calculateSchemaMetadata(fields, originalPayload, processingTime) {
        const flatFields = this.flattenFields(fields);
        const requiredFields = flatFields.filter((f) => f.isRequired).length;
        const nestedLevels = this.calculateMaxNestedLevels(fields);
        return {
            totalFields: flatFields.length,
            requiredFields,
            optionalFields: flatFields.length - requiredFields,
            nestedLevels,
            originalSize: originalPayload.length,
            processingTime,
        };
    }
    flattenFields(fields) {
        const flattened = [];
        for (const field of fields) {
            flattened.push(field);
            if (field.children) {
                flattened.push(...this.flattenFields(field.children));
            }
        }
        return flattened;
    }
    calculateMaxNestedLevels(fields, currentLevel = 0) {
        let maxLevel = currentLevel;
        for (const field of fields) {
            if (field.children) {
                const childLevel = this.calculateMaxNestedLevels(field.children, currentLevel + 1);
                maxLevel = Math.max(maxLevel, childLevel);
            }
        }
        return maxLevel;
    }
    createEmptyMetadata(payload, processingTime) {
        return {
            totalFields: 0,
            requiredFields: 0,
            optionalFields: 0,
            nestedLevels: 0,
            originalSize: payload.length,
            processingTime,
        };
    }
    createEmptyJSONSchema() {
        return {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            properties: {},
            additionalProperties: false,
        };
    }
};
exports.PayloadParsingService = PayloadParsingService;
exports.PayloadParsingService = PayloadParsingService = PayloadParsingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [json_schema_converter_service_1.JSONSchemaConverterService])
], PayloadParsingService);
//# sourceMappingURL=payload-parsing.service.js.map