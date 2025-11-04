import { ContentType, TransactionType } from './core.interfaces';
import { JSONSchema } from './json-schema.interfaces';
import { AdjustFieldDto } from 'src/dtos/schema-workflow.dto';
import { FieldMapping } from './schema.interfaces';
export interface CreateConfigDto {
    msgFam?: string;
    transactionType: TransactionType;
    version?: string;
    contentType?: ContentType;
    payload?: string | any;
    endpointPath?: string;
    mapping?: FieldMapping[];
    functions?: FunctionDefinition[];
    fieldAdjustments?: AdjustFieldDto[];
}
export interface CloneConfigDto {
    sourceConfigId: number;
    newTransactionType: TransactionType;
    newVersion?: string;
    newMsgFam?: string;
    functions?: FunctionDefinition[];
    fieldAdjustments?: AdjustFieldDto[];
}
export interface UpdateConfigDto {
    msgFam?: string;
    transactionType?: TransactionType;
    endpointPath?: string;
    version?: string;
    contentType?: ContentType;
    schema?: JSONSchema;
    mapping?: FieldMapping[];
    functions?: FunctionDefinition[];
    fieldAdjustments?: AdjustFieldDto[];
    status?: ConfigStatus;
    comments?: string;
}
export interface FunctionDefinition {
    params: string[];
    functionName: AllowedFunctionName;
}
export type AllowedFunctionName = 'addAccountHolder' | 'addEntity' | 'addAccount' | 'transactionRelationship';
export declare enum ConfigStatus {
    IN_PROGRESS = "IN_PROGRESS",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    DEPLOYED = "DEPLOYED",
    REJECTED = "REJECTED",
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
}
export interface MappingSource {
    field: string;
}
export interface MappingDestination {
    field: string;
}
export interface Config {
    id: number;
    msgFam: string;
    transactionType: TransactionType;
    endpointPath: string;
    version: string;
    contentType: ContentType;
    schema: JSONSchema;
    mapping?: FieldMapping[];
    functions?: FunctionDefinition[];
    status?: ConfigStatus;
    tenantId?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    comments?: string;
}
export interface AddMappingDto {
    source?: string;
    destination?: string;
    destinations?: string[];
    sources?: string[];
    sumFields?: string[];
    delimiter?: string;
    constantValue?: any;
    prefix?: string;
    transformation?: 'NONE' | 'CONCAT' | 'SUM' | 'SPLIT' | 'CONSTANT' | 'MATH';
    operator?: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';
}
export interface AddFunctionDto {
    params: string[];
    functionName: AllowedFunctionName;
}
export interface ConfigResponseDto {
    success: boolean;
    message: string;
    config?: Config;
    validation?: {
        success: boolean;
        errors: string[];
        warnings: string[];
    };
}
export interface StatusTransitionDto {
    userId: string;
    userRole: string;
    comment?: string;
    metadata?: Record<string, any>;
}
export interface SubmitForApprovalDto extends StatusTransitionDto {
    configId: number;
}
export interface ApprovalDto extends StatusTransitionDto {
    configId: number;
    approvalNotes?: string;
}
export interface RejectionDto extends StatusTransitionDto {
    configId: number;
    rejectionReason: string;
}
export interface ChangeRequestDto extends StatusTransitionDto {
    configId: number;
    requestedChanges: string;
}
export interface DeploymentDto extends StatusTransitionDto {
    configId: number;
    deploymentEnvironment?: string;
    deploymentNotes?: string;
}
export interface WorkflowValidationResult {
    canEdit: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canRequestChanges: boolean;
    canDeploy: boolean;
    canReturnToProgress: boolean;
    reason?: string;
}
export interface StatusTransitionValidation {
    isValid: boolean;
    currentStatus: ConfigStatus;
    targetStatus: ConfigStatus;
    allowedNextStatuses: ConfigStatus[];
    reason?: string;
}
export type WorkflowAction = 'submit_for_approval' | 'approve' | 'reject'  | 'deploy' | 'return_to_progress';
export interface ConfigAuditLogEntry {
    configId: number;
    action: string;
    userId: string;
    userRole: string;
    previousStatus?: ConfigStatus;
    newStatus?: ConfigStatus;
    comment?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}
