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
exports.EndpointCreationResponseDto = exports.ParsedSchemaResponseDto = exports.ReorderFieldsDto = exports.AddFieldDto = exports.ToggleFieldRequiredDto = exports.AdvancedFileUploadDto = exports.SchemaFieldDto = exports.CreateEndpointWithSourceFieldsDto = exports.GenerateSourceFieldsDto = exports.EndpointLifecycleTransitionDto = exports.SchemaValidationResultDto = exports.CreateEndpointWithSchemaDto = exports.AdjustFieldDto = exports.ParsePayloadDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const core_interfaces_1 = require("../interfaces/core.interfaces");
class ParsePayloadDto {
    payload;
    contentType;
    filename;
}
exports.ParsePayloadDto = ParsePayloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ParsePayloadDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.ContentType),
    __metadata("design:type", String)
], ParsePayloadDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParsePayloadDto.prototype, "filename", void 0);
class AdjustFieldDto {
    path;
    type;
    isRequired;
}
exports.AdjustFieldDto = AdjustFieldDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdjustFieldDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.FieldType),
    __metadata("design:type", String)
], AdjustFieldDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdjustFieldDto.prototype, "isRequired", void 0);
class CreateEndpointWithSchemaDto {
    name;
    path;
    method;
    version;
    transactionType;
    description;
    payload;
    contentType;
    fieldAdjustments;
}
exports.CreateEndpointWithSchemaDto = CreateEndpointWithSchemaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "transactionType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.ContentType),
    __metadata("design:type", String)
], CreateEndpointWithSchemaDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AdjustFieldDto),
    __metadata("design:type", Array)
], CreateEndpointWithSchemaDto.prototype, "fieldAdjustments", void 0);
class SchemaValidationResultDto {
    success;
    errors;
    warnings;
    duplicateFields;
    invalidTypes;
    conflictingPaths;
}
exports.SchemaValidationResultDto = SchemaValidationResultDto;
class EndpointLifecycleTransitionDto {
    targetStatus;
    comment;
}
exports.EndpointLifecycleTransitionDto = EndpointLifecycleTransitionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EndpointLifecycleTransitionDto.prototype, "targetStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EndpointLifecycleTransitionDto.prototype, "comment", void 0);
class GenerateSourceFieldsDto {
    payload;
    contentType;
}
exports.GenerateSourceFieldsDto = GenerateSourceFieldsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateSourceFieldsDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.ContentType),
    __metadata("design:type", String)
], GenerateSourceFieldsDto.prototype, "contentType", void 0);
class CreateEndpointWithSourceFieldsDto {
    name;
    path;
    method;
    version;
    transactionType;
    description;
    sourceFields;
    contentType;
    payload;
}
exports.CreateEndpointWithSourceFieldsDto = CreateEndpointWithSourceFieldsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "transactionType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.ContentType),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEndpointWithSourceFieldsDto.prototype, "payload", void 0);
class SchemaFieldDto {
    name;
    path;
    type;
    isRequired = false;
    children;
    arrayElementType;
}
exports.SchemaFieldDto = SchemaFieldDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchemaFieldDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SchemaFieldDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.FieldType),
    __metadata("design:type", String)
], SchemaFieldDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SchemaFieldDto.prototype, "isRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SchemaFieldDto.prototype, "children", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(core_interfaces_1.FieldType),
    __metadata("design:type", String)
], SchemaFieldDto.prototype, "arrayElementType", void 0);
class AdvancedFileUploadDto {
    expectedContentType;
    autoDetectType;
}
exports.AdvancedFileUploadDto = AdvancedFileUploadDto;
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.ContentType),
    __metadata("design:type", String)
], AdvancedFileUploadDto.prototype, "expectedContentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedFileUploadDto.prototype, "autoDetectType", void 0);
class ToggleFieldRequiredDto {
    isRequired;
}
exports.ToggleFieldRequiredDto = ToggleFieldRequiredDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleFieldRequiredDto.prototype, "isRequired", void 0);
class AddFieldDto {
    name;
    path;
    type;
    isRequired = false;
    parentFieldId;
    arrayElementType;
}
exports.AddFieldDto = AddFieldDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddFieldDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddFieldDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(core_interfaces_1.FieldType),
    __metadata("design:type", String)
], AddFieldDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddFieldDto.prototype, "isRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddFieldDto.prototype, "parentFieldId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(core_interfaces_1.FieldType),
    __metadata("design:type", String)
], AddFieldDto.prototype, "arrayElementType", void 0);
class ReorderFieldsDto {
    fieldIds;
}
exports.ReorderFieldsDto = ReorderFieldsDto;
__decorate([
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], ReorderFieldsDto.prototype, "fieldIds", void 0);
class ParsedSchemaResponseDto {
    success;
    schema;
    validation;
}
exports.ParsedSchemaResponseDto = ParsedSchemaResponseDto;
class EndpointCreationResponseDto {
    success;
    endpointId;
    message;
    validation;
    auditLogId;
}
exports.EndpointCreationResponseDto = EndpointCreationResponseDto;
//# sourceMappingURL=schema-workflow.dto.js.map