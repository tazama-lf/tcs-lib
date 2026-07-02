import type { ContentType, TransactionType } from '../interfaces/core.interfaces';
import type { JSONSchema } from '../interfaces/json-schema.interfaces';
import type { FieldMapping } from '../interfaces/schema.interfaces';

export enum ConfigStatus {
  IN_PROGRESS = 'STATUS_01_IN_PROGRESS',
  ON_HOLD = 'STATUS_02_ON_HOLD',
  UNDER_REVIEW = 'STATUS_03_UNDER_REVIEW',
  APPROVED = 'STATUS_04_APPROVED',
  REJECTED = 'STATUS_05_REJECTED',
  EXPORTED = 'STATUS_06_EXPORTED',
  READY_FOR_DEPLOYMENT = 'STATUS_07_READY_FOR_DEPLOYMENT',
  DEPLOYED = 'STATUS_08_DEPLOYED',
}

export type AllowedFunctionName =
  | 'addAccountHolder'
  | 'addEntity'
  | 'addAccount'
  | 'saveTransactionDetails'
  | 'transactionRelationship';

export interface FunctionDefinition {
  params?: string[];
  columns?: Array<Record<string, string>>;
  tableName?: string;
  functionName: AllowedFunctionName;
}

export interface Config {
  id: number;
  msgFam: string;
  transactionType: TransactionType;
  endpointPath: string;
  version: string;
  contentType: ContentType;
  schema: JSONSchema;
  payload?: string | Record<string, unknown>; // JSONB payload field from database
  mapping?: FieldMapping[];
  functions?: FunctionDefinition[];
  status?: ConfigStatus;
  tenantId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: string;
  publishing_status?: 'active' | 'inactive';
  related_transaction?: string;
}
