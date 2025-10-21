import { ContentType } from '../interfaces/core.interfaces';
import { ParsedFileResult } from '../dtos/file-upload.dto';
export declare const parseUploadedFile: (file: Express.Multer.File, expectedContentType: ContentType) => ParsedFileResult;
export declare const validateFileType: (file: Express.Multer.File, expectedContentType: ContentType, content: string) => {
    isValid: boolean;
    error?: string;
};
export declare const detectContentType: (file: Express.Multer.File) => ContentType;
export declare const getAllowedMimeTypes: () => string[];
