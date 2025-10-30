import { SchemaField } from '../interfaces/schema.interfaces';
import { FieldType, ContentType } from '../interfaces/core.interfaces';
import { JSONSchema } from '../interfaces/json-schema.interfaces';
import { SchemaValidationResultDto, AdjustFieldDto } from '../dtos/schema-workflow.dto';
import { convertToJSONSchema } from '../schemas/json-schema-converter.service';
import * as xml2js from 'xml2js';

export interface PayloadParsingResult {
  success: boolean;
  jsonSchema: JSONSchema;
  sourceFields: SchemaField[];
  metadata: {
    totalFields: number;
    requiredFields: number;
    optionalFields: number;
    nestedLevels: number;
    originalSize: number;
    processingTime: number;
  };
  validation: SchemaValidationResultDto;
}
export const parsePayloadToSchema = async (
  payload: string,
  contentType: ContentType,
  _filename?: string,
): Promise<PayloadParsingResult | undefined> => {
  const startTime = Date.now();
  try {
    const structureValidation = await validatePayloadStructure(payload, contentType);
    if (!structureValidation.success) {
      return {
        success: false,
        jsonSchema: createEmptyJSONSchema(),
        sourceFields: [],
        metadata: createEmptyMetadata(payload, Date.now() - startTime),
        validation: structureValidation,
      };
    }
    const parsedData = await parsePayloadToObject(payload, contentType);
    const sourceFields = generateHierarchicalSchema(parsedData, '');
    const validation = validateGeneratedSchema(sourceFields);
    const metadata = calculateSchemaMetadata(sourceFields, payload, Date.now() - startTime);
    const jsonSchema = convertToJSONSchema(sourceFields, 'Generated Schema');
    return {
      success: true,
      jsonSchema,
      sourceFields,
      metadata,
      validation,
    };
  } catch {
    // Error handling - silently fail for invalid content
  }
};

export const applyFieldAdjustments = (
  sourceFields: SchemaField[],
  adjustments: AdjustFieldDto[],
): SchemaField[] => {
  if (!adjustments || adjustments.length === 0) {
    return sourceFields;
  }
  const adjustmentMap = new Map(adjustments.map((adj) => [adj.path, adj]));
  return applyAdjustmentsRecursively(sourceFields, adjustmentMap);
};

export const validatePayloadStructure = async (
  payload: string,
  contentType: ContentType,
): Promise<SchemaValidationResultDto> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!payload || payload.trim().length === 0) {
    errors.push('Payload is empty. Please provide a valid JSON or XML payload.');
    return { success: false, errors, warnings };
  }
  const sizeInMB = payload.length / (1024 * 1024);
  if (sizeInMB > 10) {
    warnings.push(
      `Payload size is ${sizeInMB.toFixed(1)}MB. Processing may be slow for payloads over 10MB.`,
    );
  } else if (sizeInMB > 5) {
    warnings.push(
      `Payload size is ${sizeInMB.toFixed(1)}MB. Consider optimizing for better performance.`,
    );
  }
  try {
    if (contentType === ContentType.JSON) {
      const parsed = JSON.parse(payload);
      validateJsonStructure(parsed, errors, warnings);
    } else if (contentType === ContentType.XML) {
      await xml2js.parseStringPromise(payload);
      validateXmlStructure(payload, errors, warnings);
    } else {
      errors.push(
        `Unsupported content type: ${String(contentType)}. Supported types are: application/json, application/xml`,
      );
    }
  } catch (error) {
    addStructureError(error, contentType, errors);
  }
  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
};

export const addStructureError = (error: any, contentType: ContentType, errors: string[]): void => {
  const errorMessage = error.message || 'Unknown parsing error';
  if (contentType === ContentType.JSON) {
    if (errorMessage.includes('Unexpected token')) {
      const match = errorMessage.match(/Unexpected token (.) in JSON at position (\d+)/);
      if (match) {
        const [, token, position] = match;
        errors.push(
          `Invalid JSON: Unexpected character '${token}' at position ${position}. Check for missing quotes, commas, or brackets.`,
        );
      } else {
        errors.push(`Invalid JSON structure: ${errorMessage}. Please verify JSON syntax.`);
      }
    } else if (errorMessage.includes('Unexpected end of JSON input')) {
      errors.push(
        'Invalid JSON: Incomplete JSON structure. Check for missing closing brackets or braces.',
      );
    } else {
      errors.push(`Invalid JSON: ${errorMessage}. Please ensure valid JSON syntax.`);
    }
  } else if (contentType === ContentType.XML) {
    if (errorMessage.includes('Non-whitespace before first tag')) {
      errors.push(
        'Invalid XML: Content found before root element. XML must start with an element tag.',
      );
    } else if (errorMessage.includes('Unclosed tag')) {
      errors.push('Invalid XML: Unclosed tag found. Ensure all XML tags are properly closed.');
    } else {
      errors.push(`Invalid XML: ${errorMessage}. Please ensure valid XML syntax.`);
    }
  }
};

export const validateJsonStructure = (parsed: any, errors: string[], warnings: string[]): void => {
  if (parsed === null) {
    errors.push('JSON payload cannot be null. Please provide a valid object or array.');
    return;
  }
  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
    warnings.push(
      'JSON payload is a primitive value. Consider wrapping in an object for better schema generation.',
    );
  }
  if (Array.isArray(parsed) && parsed.length === 0) {
    warnings.push('JSON array is empty. Schema generation will be limited without sample data.');
  }
  if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
    warnings.push('JSON object is empty. Schema generation will be limited without properties.');
  }
  const maxDepth = calculateObjectDepth(parsed);
  if (maxDepth > 10) {
    warnings.push(
      `JSON structure is deeply nested (${maxDepth} levels). Consider flattening for better performance.`,
    );
  }
};

export const validateXmlStructure = (
  xmlString: string,
  errors: string[],
  warnings: string[],
): void => {
  if (xmlString.includes('<!DOCTYPE')) {
    warnings.push('XML contains DOCTYPE declaration. DTD validation is not performed.');
  }
  if (xmlString.includes('xmlns:')) {
    warnings.push('XML contains namespaces. Namespace prefixes will be included in field names.');
  }
  const elementCount = (xmlString.match(/<\w+/g) || []).length;
  if (elementCount > 1000) {
    warnings.push(
      `XML contains ${elementCount} elements. Processing may be slow for complex XML structures.`,
    );
  }
};

export const calculateObjectDepth = (obj: any, currentDepth = 0): number => {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  if (Array.isArray(obj)) {
    return obj.reduce(
      (maxDepth: number, item: any) =>
        Math.max(maxDepth, calculateObjectDepth(item, currentDepth + 1)),
      currentDepth,
    );
  }
  let maxChildDepth = currentDepth;
  for (const value of Object.values(obj)) {
    const childDepth = calculateObjectDepth(value, currentDepth + 1);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }
  return maxChildDepth;
};

export const parsePayloadToObject = async (
  payload: string,
  contentType: ContentType,
): Promise<any> => {
  if (contentType === ContentType.JSON) {
    return JSON.parse(payload);
  } else if (contentType === ContentType.XML) {
    const result = await xml2js.parseStringPromise(payload, {
      explicitArray: false,
      mergeAttrs: true,
      explicitRoot: false,
    });
    return result;
  } else {
    throw new Error(`Unsupported content type: ${String(contentType)}`);
  }
};

export const generateHierarchicalSchema = (
  obj: any,
  parentPath: string,
  level: number = 0,
): SchemaField[] => {
  const fields: SchemaField[] = [];
  if (obj === null || obj === undefined) {
    return fields;
  }
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const elementSchema = generateHierarchicalSchema(obj[0], parentPath, level);
      return elementSchema;
    }
    return fields;
  }
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const field = createSchemaField(key, fieldPath, value, level);
      if (field) {
        fields.push(field);
      }
    }
  }
  return fields;
};

export const createSchemaField = (
  name: string,
  path: string,
  value: any,
  level: number,
): SchemaField | null => {
  if (value === null || value === undefined) {
    return {
      name,
      path,
      type: FieldType.STRING,
      isRequired: false,
    };
  }
  if (Array.isArray(value)) {
    const children = value.length > 0 ? generateHierarchicalSchema(value[0], path, level + 1) : [];
    return {
      name,
      path,
      type: FieldType.ARRAY,
      isRequired: true,
      children: children.length > 0 ? children : undefined,
      arrayElementType: inferArrayElementType(value),
    };
  }
  if (typeof value === 'object') {
    const children = generateHierarchicalSchema(value, path, level + 1);
    return {
      name,
      path,
      type: FieldType.OBJECT,
      isRequired: true,
      children: children.length > 0 ? children : undefined,
    };
  }
  return {
    name,
    path,
    type: inferPrimitiveType(value),
    isRequired: true,
  };
};

export const inferPrimitiveType = (value: any): FieldType => {
  if (typeof value === 'string') {
    return FieldType.STRING;
  } else if (typeof value === 'number') {
    return FieldType.NUMBER;
  } else if (typeof value === 'boolean') {
    return FieldType.BOOLEAN;
  } else {
    return FieldType.STRING;
  }
};

export const inferArrayElementType = (array: any[]): FieldType => {
  if (array.length === 0) return FieldType.STRING;
  const firstElement = array[0];
  if (Array.isArray(firstElement)) return FieldType.ARRAY;
  if (typeof firstElement === 'object') return FieldType.OBJECT;
  return inferPrimitiveType(firstElement);
};

export const validateGeneratedSchema = (fields: SchemaField[]): SchemaValidationResultDto => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateFields: string[] = [];
  const invalidTypes: string[] = [];
  const conflictingPaths: string[] = [];
  const allPaths = collectAllPaths(fields);
  const pathCounts = new Map<string, number>();
  allPaths.forEach((path) => {
    pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
  });
  pathCounts.forEach((count, path) => {
    if (count > 1) {
      duplicateFields.push(path);
      errors.push(`Duplicate field path: ${path}`);
    }
  });
  validateFieldsRecursively(fields, errors, warnings, invalidTypes, conflictingPaths);
  return {
    success: errors.length === 0,
    errors,
    warnings,
    duplicateFields: duplicateFields.length > 0 ? duplicateFields : undefined,
    invalidTypes: invalidTypes.length > 0 ? invalidTypes : undefined,
    conflictingPaths: conflictingPaths.length > 0 ? conflictingPaths : undefined,
  };
};

export const validateFieldsRecursively = (
  fields: SchemaField[],
  errors: string[],
  warnings: string[],
  invalidTypes: string[],
  conflictingPaths: string[],
): void => {
  for (const field of fields) {
    if (!Object.values(FieldType).includes(field.type)) {
      invalidTypes.push(field.path);
      errors.push(`Invalid field type for ${field.path}: ${field.type}`);
    }
    if (field.type === FieldType.ARRAY && field.arrayElementType === FieldType.STRING) {
      warnings.push(`Array field ${field.path} with string elements may need special handling`);
    }
    if (field.children) {
      validateFieldsRecursively(field.children, errors, warnings, invalidTypes, conflictingPaths);
    }
  }
};

export const collectAllPaths = (fields: SchemaField[]): string[] => {
  const paths: string[] = [];
  for (const field of fields) {
    paths.push(field.path);
    if (field.children) {
      paths.push(...collectAllPaths(field.children));
    }
  }
  return paths;
};

export const applyAdjustmentsRecursively = (
  fields: SchemaField[],
  adjustmentMap: Map<string, AdjustFieldDto>,
): SchemaField[] => {
  return fields.map((field) => {
    const adjustment = adjustmentMap.get(field.path);
    const adjustedField = { ...field };
    if (adjustment) {
      adjustedField.type = adjustment.type;
      adjustedField.isRequired = adjustment.isRequired;
    }
    if (field.children) {
      adjustedField.children = applyAdjustmentsRecursively(field.children, adjustmentMap);
    }
    return adjustedField;
  });
};

export const calculateSchemaMetadata = (
  fields: SchemaField[],
  originalPayload: string,
  processingTime: number,
): PayloadParsingResult['metadata'] => {
  const flatFields = flattenFields(fields);
  const requiredFields = flatFields.filter((f) => f.isRequired).length;
  const nestedLevels = calculateMaxNestedLevels(fields);
  return {
    totalFields: flatFields.length,
    requiredFields,
    optionalFields: flatFields.length - requiredFields,
    nestedLevels,
    originalSize: originalPayload.length,
    processingTime,
  };
};

export const flattenFields = (fields: SchemaField[]): SchemaField[] => {
  const flattened: SchemaField[] = [];
  for (const field of fields) {
    flattened.push(field);
    if (field.children) {
      flattened.push(...flattenFields(field.children));
    }
  }
  return flattened;
};

export const calculateMaxNestedLevels = (
  fields: SchemaField[],
  currentLevel: number = 0,
): number => {
  let maxLevel = currentLevel;
  for (const field of fields) {
    if (field.children) {
      const childLevel = calculateMaxNestedLevels(field.children, currentLevel + 1);
      maxLevel = Math.max(maxLevel, childLevel);
    }
  }
  return maxLevel;
};

export const createEmptyMetadata = (
  payload: string,
  processingTime: number,
): PayloadParsingResult['metadata'] => {
  return {
    totalFields: 0,
    requiredFields: 0,
    optionalFields: 0,
    nestedLevels: 0,
    originalSize: payload.length,
    processingTime,
  };
};

export const createEmptyJSONSchema = (): JSONSchema => {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
};
