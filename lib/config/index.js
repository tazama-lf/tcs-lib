"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const validateConfig = (config, schema) => {
    const { error, value } = schema.validate(config, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
    });
    if (error) {
        throw new Error(`Database configuration validation error: ${error.message}`);
    }
    return value;
};
exports.validateConfig = validateConfig;
//# sourceMappingURL=index.js.map