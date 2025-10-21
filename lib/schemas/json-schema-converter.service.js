"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToJSONSchema = void 0;
const convertToJSONSchema = (fields, title) => {
    return {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title,
        type: 'object',
        properties: {},
        additionalProperties: false,
    };
};
exports.convertToJSONSchema = convertToJSONSchema;
//# sourceMappingURL=json-schema-converter.service.js.map