import { ContentType } from '../interfaces/core.interfaces';
export declare class FileUploadDto {
  contentType: ContentType;
  description?: string;
}
export interface ParsedFileResult {
  content: string;
  contentType: ContentType;
  originalName: string;
  size: number;
}
