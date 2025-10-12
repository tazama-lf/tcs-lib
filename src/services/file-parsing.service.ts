import { Injectable, BadRequestException } from '@nestjs/common';
import { ContentType } from '../interfaces/core.interfaces';
import { ParsedFileResult } from '../dtos/file-upload.dto';
import { AuditService } from '../audit/audit.service';
import type { Express } from 'express';
@Injectable()
export class FileParsingService {
  constructor(private readonly _auditService: AuditService) {}
  parseUploadedFile(file: Express.Multer.File, expectedContentType: ContentType): ParsedFileResult {
    if (!file) {
      this._auditService.logError(
        'SYSTEM',
        'default-tenant',
        'No file uploaded',
        'File upload failed',
      );
      throw new BadRequestException('No file uploaded');
    }
    const content = file.buffer.toString('utf8');
    const isValidFile = this.validateFileType(file, expectedContentType, content);
    if (!isValidFile.isValid) {
      this._auditService.logError(
        'SYSTEM',
        'default-tenant',
        isValidFile.error || 'Unknown validation error',
        'File validation failed',
      );
      throw new BadRequestException(isValidFile.error);
    }
    const result = {
      content,
      contentType: expectedContentType,
      originalName: file.originalname,
      size: file.size,
    };
    this._auditService.logAction({
      entityType: 'FILE_PARSING',
      action: 'PARSE_FILE',
      actor: 'SYSTEM',
      tenantId: 'default-tenant',
      details: `Parsed file: ${file.originalname} (${file.size} bytes, ${expectedContentType})`,
      status: 'SUCCESS',
      severity: 'LOW',
    });
    return result;
  }
  private validateFileType(
    file: Express.Multer.File,
    expectedContentType: ContentType,
    content: string,
  ): { isValid: boolean; error?: string } {
    const filename = file.originalname.toLowerCase();
    if (expectedContentType === ContentType.JSON) {
      if (!filename.endsWith('.json')) {
        return {
          isValid: false,
          error: 'File must have .json extension for JSON content type',
        };
      }
      try {
        JSON.parse(content);
      } catch (error) {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        return {
          isValid: false,
          error: `Invalid JSON format: ${errorMessage}`,
        };
      }
    } else if (expectedContentType === ContentType.XML) {
      if (!filename.endsWith('.xml')) {
        return {
          isValid: false,
          error: 'File must have .xml extension for XML content type',
        };
      }
      if (!content.trim().startsWith('<') || !content.trim().endsWith('>')) {
        return {
          isValid: false,
          error: 'Invalid XML format: must start with < and end with >',
        };
      }
    }
    return { isValid: true };
  }
  detectContentType(file: Express.Multer.File): ContentType {
    const filename = file.originalname.toLowerCase();
    const content = file.buffer.toString('utf8').trim();
    if (filename.endsWith('.json')) {
      return ContentType.JSON;
    }
    if (filename.endsWith('.xml')) {
      return ContentType.XML;
    }
    if (content.startsWith('{') || content.startsWith('[')) {
      return ContentType.JSON;
    }
    if (content.startsWith('<')) {
      return ContentType.XML;
    }
    return ContentType.JSON;
  }
  static getAllowedMimeTypes(): string[] {
    return [
      'application/json',
      'text/json',
      'application/xml',
      'text/xml',
      'text/plain', // Allow plain text files that might contain JSON/XML
    ];
  }
}
