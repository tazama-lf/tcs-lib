export interface JSONSchema {
  $schema?: string;
  $id?: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  title?: string;
  description?: string;
  properties?: { [key: string]: JSONSchemaProperty };
  required?: string[];
  items?: JSONSchemaProperty;
  additionalProperties?: boolean | JSONSchemaProperty;
  definitions?: { [key: string]: JSONSchemaProperty };
  examples?: any[];
}
export interface JSONSchemaProperty {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer' | 'null';
  description?: string;
  title?: string;
  properties?: { [key: string]: JSONSchemaProperty };
  items?: JSONSchemaProperty;
  required?: string[];
  enum?: any[];
  const?: any;
  default?: any;
  examples?: any[];
  format?: string; // e.g., "date-time", "email", "uri"
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalProperties?: boolean | JSONSchemaProperty;
  oneOf?: JSONSchemaProperty[];
  anyOf?: JSONSchemaProperty[];
  allOf?: JSONSchemaProperty[];
  not?: JSONSchemaProperty;
}
export interface SourceSchemaJSON {
  schema: JSONSchema;
  version: number;
  lastUpdated: Date;
  createdBy: string;
  metadata?: {
    originalFormat?: string; // e.g., "JSON", "XML"
    parsedAt?: Date;
    fieldCount?: number;
  };
}
export interface JSONSchemaValidationResult {
  valid: boolean;
  errors: Array<{
    instancePath: string;
    schemaPath: string;
    keyword: string;
    message: string;
    params?: any;
  }>;
  warnings?: string[];
}
/* eslint-disable no-unused-vars */
export enum JSONSchemaType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  NULL = 'null',
}
export enum JSONSchemaFormat {
  DATE_TIME = 'date-time',
  DATE = 'date',
  TIME = 'time',
  EMAIL = 'email',
  HOSTNAME = 'hostname',
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
  URI = 'uri',
  UUID = 'uuid',
}
/* eslint-enable no-unused-vars */
