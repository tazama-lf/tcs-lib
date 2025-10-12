import { validate } from 'class-validator';
import { FileUploadDto } from './file-upload.dto';
import { ContentType } from '../interfaces/core.interfaces';

describe('FileUploadDto', () => {
  it('should create a valid file upload DTO', () => {
    const dto = new FileUploadDto();
    dto.contentType = ContentType.JSON;

    expect(dto.contentType).toBe(ContentType.JSON);
  });

  it('should validate required fields', async () => {
    const dto = new FileUploadDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate with all required fields', async () => {
    const dto = new FileUploadDto();
    dto.contentType = ContentType.XML;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept optional description', async () => {
    const dto = new FileUploadDto();
    dto.contentType = ContentType.JSON;
    dto.description = 'Test file upload';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.description).toBe('Test file upload');
  });
});

describe('ParsedFileResult', () => {
  it('should have correct structure', () => {
    const result = {
      content: '{"test": "data"}',
      contentType: ContentType.JSON,
      originalName: 'test.json',
      size: 1024,
    };

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('contentType');
    expect(result).toHaveProperty('originalName');
    expect(result).toHaveProperty('size');
  });
});
