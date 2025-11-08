enum ScheduleStatus {
    ACTIVE = 'active',
    INACTIVE = 'in-active',
}

enum IngestMode {
    APPEND = 'append',
    REPLACE = 'replace',
}

enum ConfigType {
    PUSH = 'push',
    PULL = 'pull',
}

enum FileType {
    CSV = 'CSV',
    JSON = 'JSON',
    TSV = 'TSV',
}

enum SourceType {
    SFTP = 'SFTP',
    HTTP = 'HTTP',
}

enum AuthType {
    USERNAME_PASSWORD = 'USERNAME_PASSWORD',
    PRIVATE_KEY = 'PRIVATE_KEY',
}

enum JobStatus {
    INPROGRESS = 'in-progress',
    REVIEW = 'under-review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPORTED = 'exported',
    READY = 'ready-for-deployment',
    DEPLOYED = 'deployed'
}

interface ISuccess {
    success: boolean;
    message: string;
}

interface Schedule {
    id: number;
    tenant_id: string,
    name: string;
    cron: string;
    iterations: number;
    status: JobStatus,
    start_date: Date,
    end_date?: Date
    comments: string
}

interface HTTPConnection {
    url: string;
    headers: Record<string, string>;
}

interface SFTPConnection {
    host: string;
    port: number;
    auth_type?: AuthType;
    user_name: string;
    password?: string;
    private_key?: string;
}

type FileSettings =
    | { file_type: FileType.CSV; delimiter?: string; header?: boolean | string[]; path: string }
    | { file_type: FileType.TSV; header?: boolean | string[]; path: string }
    | { file_type: FileType.JSON; path: string };

interface Job {
    id: string;
    tenant_id: string;
    endpoint_name: string;
    source_type: SourceType;
    description: string;
    connection: HTTPConnection | SFTPConnection;
    file: FileSettings;
    table_name: string;
    mode?: IngestMode;
    version: string;
    status: JobStatus;
    record_status?: ScheduleStatus;
    schedule_id: string,
    cron: string,
    start_date: Date,
    end_date: Date,
    iterations?: number
}

interface Enrichment {
    id?: number;
    tenant_id: string;
    endpoint_id: number;
    correlation_id: string;
    checksum: string;
    data: Record<string, any>;
}

interface PushJob {
    id: string;
    endpoint_name: string;
    path: string;
    description: string;
    mode: IngestMode;
    table_name: string;
    job_status: JobStatus;
    created_at: Date;
    updated_at: Date;
}

export {
    ScheduleStatus,
    IngestMode,
    SourceType,
    JobStatus,
    FileType,
    AuthType,
    ConfigType,
    type ISuccess,
    type Schedule,
    type PushJob,
    type Enrichment,
    type FileSettings,
    type HTTPConnection,
    type Job,
    type SFTPConnection
};
