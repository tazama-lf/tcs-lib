"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedMimeTypes = exports.detectContentType = exports.validateFileType = exports.parseUploadedFile = void 0;
const core_interfaces_1 = require("../interfaces/core.interfaces");
const parseUploadedFile = (file, expectedContentType) => {
    if (!file) {
        throw new Error('File not provided');
    }
    const content = file.buffer.toString('utf8');
    const isValidFile = (0, exports.validateFileType)(file, expectedContentType, content);
    if (!isValidFile.isValid) {
        throw new Error(`Invalid file type: ${isValidFile.error}`);
    }
    const result = {
        content,
        contentType: expectedContentType,
        originalName: file.originalname,
        size: file.size,
    };
    return result;
};
exports.parseUploadedFile = parseUploadedFile;
const validateFileType = (file, expectedContentType, content) => {
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
};
exports.validateFileType = validateFileType;
const detectContentType = (file) => {
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
};
exports.detectContentType = detectContentType;
const getAllowedMimeTypes = () => {
    return [
        'application/json',
        'text/json',
        'application/xml',
        'text/xml',
        'text/plain',
    ];
};
exports.getAllowedMimeTypes = getAllowedMimeTypes;
//# sourceMappingURL=file-parsing.service.js.map