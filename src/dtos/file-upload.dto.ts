import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../interfaces/core.interfaces';

// export class FileUploadDto {
//   @IsEnum(ContentType)
//   contentType!: ContentType;

//   @IsOptional()
//   @IsString()
//   description?: string;
// }

export interface ParsedFileResult {
  content: string;
  contentType: ContentType;
  originalName: string;
  size: number;
}
