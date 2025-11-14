import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../interfaces/core.interfaces';


export interface ParsedFileResult {
  content: string;
  contentType: ContentType;
  originalName: string;
  size: number;
}
