export type TransactionType = string;

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum ContentType {
  JSON = 'application/json',
  XML = 'application/xml',
}

export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  DATE = 'DATE',
}

export enum EndpointStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  UNDER_REVIEW = 'UNDER_REVIEW',
  READY_FOR_DEPLOYMENT = 'READY_FOR_DEPLOYMENT',
  DEPLOYED = 'DEPLOYED',
  SUSPENDED = 'SUSPENDED',
  PUBLISHED = 'PUBLISHED',
}
