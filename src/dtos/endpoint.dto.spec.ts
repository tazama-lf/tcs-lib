import { validate } from 'class-validator';
import { CreateEndpointDto } from './endpoint.dto';
import { HttpMethod, ContentType } from '../interfaces/core.interfaces';

describe('CreateEndpointDto', () => {
  it('should create a valid endpoint DTO', () => {
    const dto = new CreateEndpointDto();
    dto.path = '/api/test';
    dto.method = HttpMethod.POST;
    dto.contentType = ContentType.JSON;
    dto.transactionType = 'Payments';
    dto.version = '1.0.0';
    dto.samplePayload = '{"test": "data"}';

    expect(dto.path).toBe('/api/test');
    expect(dto.method).toBe(HttpMethod.POST);
  });

  it('should validate required fields', async () => {
    const dto = new CreateEndpointDto();
    // Leave required fields empty

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate with all required fields', async () => {
    const dto = new CreateEndpointDto();
    dto.path = '/api/test';
    dto.method = HttpMethod.GET;
    dto.contentType = ContentType.JSON;
    dto.transactionType = 'Transfers';
    dto.version = '1.0.0';
    dto.samplePayload = '{"test": "data"}';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept optional fields', async () => {
    const dto = new CreateEndpointDto();
    dto.path = '/api/test';
    dto.method = HttpMethod.POST;
    dto.contentType = ContentType.JSON;
    dto.transactionType = 'Payments';
    dto.version = '1.0.0';
    dto.samplePayload = '{"test": "data"}';
    dto.description = 'Test description';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.description).toBe('Test description');
  });
});
