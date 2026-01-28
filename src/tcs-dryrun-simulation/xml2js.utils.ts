import type { LoggerService } from '@tazama-lf/frms-coe-lib';
import type { Request } from 'express';
import type { ReturnArrayFieldsFromSchema } from '../interfaces/iXml2js.interfaces';

/**
 * Utility functions for XML2JS processing and schema-based transformations
 */

/**
 * Analyzes a JSON schema to extract field paths that should be arrays or strings
 * @param schema The JSON schema to analyze
 * @param loggerService Logger service for error logging
 * @returns Object containing arrays of field paths for arrays and strings
 */
export function returnArrayFieldsFromSchema(
  schema: Record<string, unknown> | null | undefined,
  loggerService?: LoggerService,
): ReturnArrayFieldsFromSchema {
  try {
    // Handle null/undefined schema
    if (schema === null || schema === undefined) {
      if (loggerService) {
        loggerService.error('Schema is null or undefined');
      }
      throw new Error('Schema cannot be null or undefined');
    }

    const arrayFields: string[] = [];
    const stringFields: string[] = [];
    const visited = new Set(); // Circular reference detection

    // eslint-disable-next-line complexity -- Schema traversal requires handling multiple JSON Schema constructs (anyOf, oneOf, allOf, nested objects, arrays)
    const traverseSchema = (obj: Record<string, unknown> | null | undefined, path = ''): void => {
      if (obj === null || obj === undefined || typeof obj !== 'object') {
        return;
      }

      // Circular reference detection using object reference
      if (visited.has(obj)) {
        return;
      }
      visited.add(obj);

      // Check if properties exist before trying to iterate
      if (obj.properties && typeof obj.properties === 'object') {
        for (const [key, value] of Object.entries(obj.properties)) {
          const currentPath = path ? `${path}.${key}` : key;
          const property = value as Record<string, unknown>;

          // Ensure property is an object before accessing its type
          if (typeof property !== 'object') {
            continue;
          }

          // Check if this property is an array
          if (property.type === 'array') {
            arrayFields.push(currentPath);
          }

          // Check if this property is a string
          if (property.type === 'string') {
            stringFields.push(currentPath);
          }

          // Recursively check nested objects
          if (property.type === 'object' && property.properties) {
            traverseSchema(property, currentPath);
          }

          // Handle array items that might contain objects
          if (property.type === 'array' && property.items) {
            const items = property.items as Record<string, unknown>;
            if (items.type === 'object' && items.properties) {
              traverseSchema(items, currentPath);
            }
          }

          // Handle anyOf, oneOf, allOf schemas
          if (property.anyOf ?? property.oneOf ?? property.allOf) {
            const schemaVariants = (property.anyOf ?? property.oneOf ?? property.allOf) as Array<
              Record<string, unknown>
            >;
            schemaVariants.forEach((variant) => {
              if (variant.type === 'object' && variant.properties) {
                traverseSchema(variant, currentPath);
              }
            });
          }
        }
      }

      // Handle root level anyOf, oneOf, allOf
      if (obj.anyOf ?? obj.oneOf ?? obj.allOf) {
        const schemaVariants = (obj.anyOf ?? obj.oneOf ?? obj.allOf) as Array<
          Record<string, unknown>
        >;
        schemaVariants.forEach((variant) => {
          if (variant.properties) {
            traverseSchema(variant, path);
          }
        });
      }

      visited.delete(obj);
    };

    traverseSchema(schema);
    return { arrayFields, stringFields };
  } catch (error) {
    if (loggerService) {
      loggerService.error(
        `Error in returnArrayFieldsFromSchema: ${String(error)}. Schema path or field causing issue: ${(error as Error).stack ?? 'Unknown'}`,
      );
    }
    throw error;
  }
}

/**
 * Replaces objects with arrays for fields that are marked as arrays in the schema
 * and converts numbers back to strings for fields that should be strings
 * @param payload The payload to modify
 * @param arrayFields Array of dot-notation paths that should be arrays
 * @param stringFields Array of dot-notation paths that should be strings
 * @param loggerService Optional logger service for logging conversions
 * @returns Modified payload with objects converted to arrays and numbers converted to strings where needed
 */
export function replaceObjectsWithArrays(
  payload: Record<string, unknown> | null | undefined,
  arrayFields: string[],
  stringFields: string[],
  loggerService?: LoggerService,
): Record<string, unknown> {
  try {
    // Handle null/undefined payload by throwing
    if (payload === null || payload === undefined) {
      throw new Error('Payload cannot be null or undefined');
    }

    // Create a deep copy to avoid mutating the original payload
    const modifiedPayload = structuredClone(payload);

    // Handle array conversions
    arrayFields.forEach((fieldPath) => {
      convertObjectToArrayAtPath(modifiedPayload, fieldPath, loggerService);
    });

    // Handle number to string conversions
    stringFields.forEach((fieldPath) => {
      convertNumberToStringAtPath(modifiedPayload, fieldPath, loggerService);
    });

    return modifiedPayload;
  } catch (error) {
    if (loggerService) {
      loggerService.error(
        `Error in replaceObjectsWithArrays: ${String(error)}. Field paths: arrays=${arrayFields.join(',')}, strings=${stringFields.join(',')}`,
      );
    }
    throw error;
  }
}

/**
 * Converts a number to a string at a specific dot-notation path
 * @param obj The object to modify
 * @param path The dot-notation path to the field
 * @param loggerService Optional logger service for logging conversions
 */
export function convertNumberToStringAtPath(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  loggerService?: LoggerService,
): void {
  try {
    // Handle null/undefined objects by throwing
    if (obj === null || obj === undefined) {
      throw new Error('Object cannot be null or undefined');
    }

    const pathParts = path.split('.');
    let current: Record<string, unknown> = obj;

    // Navigate to the parent of the target field
    for (let i = 0; i < pathParts.length - 1; i += 1) {
      const nextValue = current[pathParts[i]];
      if (
        nextValue !== null &&
        nextValue !== undefined &&
        typeof nextValue === 'object' &&
        !Array.isArray(nextValue)
      ) {
        current = nextValue as Record<string, unknown>;
      } else {
        // Path doesn't exist in the payload, skip this conversion
        return;
      }
    }

    const targetFieldName = pathParts[pathParts.length - 1];

    // Check if the target field exists and is a number
    if (current[targetFieldName] !== undefined && typeof current[targetFieldName] === 'number') {
      // Convert the number to a string
      current[targetFieldName] = String(current[targetFieldName]);

      if (loggerService) {
        loggerService.log(
          `Converted field '${path}' from number to string: ${String(current[targetFieldName])}`,
        );
      }
    }
  } catch (error) {
    if (loggerService) {
      loggerService.error(`Error in convertNumberToStringAtPath: ${String(error)}. Path: ${path}`);
    }
    throw error;
  }
}

/**
 * Converts an object to an array at a specific dot-notation path
 * @param obj The object to modify
 * @param path The dot-notation path to the field
 * @param loggerService Optional logger service for logging conversions
 */
export function convertObjectToArrayAtPath(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  loggerService?: LoggerService,
): void {
  try {
    // Handle null/undefined objects by throwing
    if (obj === null || obj === undefined) {
      throw new Error('Object cannot be null or undefined');
    }

    const pathParts = path.split('.');
    let current: Record<string, unknown> = obj;

    // Navigate to the parent of the target field
    for (let i = 0; i < pathParts.length - 1; i += 1) {
      const nextValue = current[pathParts[i]];
      if (
        nextValue !== null &&
        nextValue !== undefined &&
        typeof nextValue === 'object' &&
        !Array.isArray(nextValue)
      ) {
        current = nextValue as Record<string, unknown>;
      } else {
        // Path doesn't exist in the payload, skip this conversion
        return;
      }
    }

    const targetFieldName = pathParts[pathParts.length - 1];

    // Check if the target field exists and is an object (not already an array)
    if (
      current[targetFieldName] &&
      typeof current[targetFieldName] === 'object' &&
      !Array.isArray(current[targetFieldName])
    ) {
      // Convert the object to an array containing that object
      current[targetFieldName] = [current[targetFieldName]];

      if (loggerService) {
        loggerService.log(`Converted field '${path}' from object to array`);
      }
    }
  } catch (error) {
    if (loggerService) {
      loggerService.error(`Error in convertObjectToArrayAtPath: ${String(error)}. Path: ${path}`);
    }
    throw error;
  }
}

/**
 * Custom value processor that only converts to numbers if the field is not a string in the schema
 * @param stringFields Array of dot-notation paths that should remain as strings
 * @param loggerService Optional logger service for logging
 * @returns A function that processes values based on schema types
 */
export function createSchemaAwareNumberProcessor(stringFields: string[]) {
  const stringFieldSet = new Set(stringFields);
  return (value: unknown, name: string, path = ''): unknown => {
    const fullPath = path ? `${path}.${name}` : name;
    if (stringFieldSet.has(fullPath)) return value;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== value) {
        return value;
      }
      // Only convert if it's a valid number
      if (trimmed !== '' && !isNaN(+trimmed)) {
        return +trimmed;
      }
    }
    return value;
  };
}

export function isXmlContentType(req: Request, loggerService?: LoggerService): boolean {
  try {
    return req.headers['content-type'] === 'application/xml';
  } catch (error) {
    if (loggerService) {
      loggerService.error(`Error in isXmlContentType: ${String(error)}`);
    }
    throw error;
  }
}
