import { validate } from 'class-validator';
import { ParsePayloadDto, AdjustFieldDto } from './schema-workflow.dto';
import { FieldType, ContentType } from '../interfaces/core.interfaces';

describe('ParsePayloadDto', () => {
  it('should create a valid parse payload DTO', () => {
    const dto = new ParsePayloadDto();
    dto.payload = '{"test": "data"}';
    dto.contentType = ContentType.JSON;

    expect(dto.payload).toBe('{"test": "data"}');
    expect(dto.contentType).toBe(ContentType.JSON);
  });

  it('should validate required fields', async () => {
    const dto = new ParsePayloadDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate with all required fields', async () => {
    const dto = new ParsePayloadDto();
    dto.payload = '<root><test>data</test></root>';
    dto.contentType = ContentType.XML;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept optional filename', async () => {
    const dto = new ParsePayloadDto();
    dto.payload = '{"test": "data"}';
    dto.contentType = ContentType.JSON;
    dto.filename = 'test.json';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.filename).toBe('test.json');
  });
});

describe('AdjustFieldDto', () => {
  it('should create a valid adjust field DTO', () => {
    const dto = new AdjustFieldDto();
    dto.path = 'root.testField';
    dto.type = FieldType.STRING;
    dto.isRequired = true;

    expect(dto.path).toBe('root.testField');
    expect(dto.type).toBe(FieldType.STRING);
    expect(dto.isRequired).toBe(true);
  });

  it('should validate required fields', async () => {
    const dto = new AdjustFieldDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate with all fields', async () => {
    const dto = new AdjustFieldDto();
    dto.path = 'root.field';
    dto.type = FieldType.NUMBER;
    dto.isRequired = false;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
