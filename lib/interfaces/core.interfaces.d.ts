export type TransactionType = string;
export declare enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}
export declare enum ContentType {
  JSON = 'application/json',
  XML = 'application/xml',
}
export declare enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  DATE = 'DATE',
}
export declare enum EndpointStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  UNDER_REVIEW = 'UNDER_REVIEW',
  READY_FOR_DEPLOYMENT = 'READY_FOR_DEPLOYMENT',
  DEPLOYED = 'DEPLOYED',
  SUSPENDED = 'SUSPENDED',
  PUBLISHED = 'PUBLISHED',
}
