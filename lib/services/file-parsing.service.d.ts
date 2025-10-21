import { ContentType } from '../interfaces/core.interfaces';
import { ParsedFileResult } from '../dtos/file-upload.dto';
import { AuditService } from '../audit/audit.service';
export declare class FileParsingService {
    private readonly _auditService;
    constructor(_auditService: AuditService);
    parseUploadedFile(file: Express.Multer.File, expectedContentType: ContentType): ParsedFileResult;
    private validateFileType;
    detectContentType(file: Express.Multer.File): ContentType;
    static getAllowedMimeTypes(): string[];
}
