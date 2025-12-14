// Interfaces - Core
export * from './interfaces/core.interfaces';
export type * from './interfaces/schema.interfaces';
export * from './interfaces/json-schema.interfaces';
export type * from './interfaces/database.interfaces';
export type * from './interfaces/multi-field-mapping.interfaces';
export * from './interfaces/enrichment.interface';

export type * from './interfaces/iMappingConfiguration';
export type * from './interfaces/iMappingResult';
export type * from './interfaces/iTransactionDetails';

export type { Config, FunctionDefinition, AllowedFunctionName } from './types/config.types';
export { ConfigStatus } from './types/config.types';

export type * from './types/data-model.types';
export type * from './types/data-model-handler.types';

export * from './interfaces/Endpoint';

// Services
export { DatabaseService } from './services/database.service';
export { initializeDatabase, getPool } from './database/databaseFactory';


export * from './template/email-templates';

export * from './tcs-dryrun-simulation';
