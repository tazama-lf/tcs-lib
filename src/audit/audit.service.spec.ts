import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have log method', () => {
    expect(service.log).toBeDefined();
    expect(typeof service.log).toBe('function');
  });

  it('should have logError method', () => {
    expect(service.logError).toBeDefined();
    expect(typeof service.logError).toBe('function');
  });

  it('should have logAction method', () => {
    expect(service.logAction).toBeDefined();
    expect(typeof service.logAction).toBe('function');
  });

  it('should not throw when calling log methods', () => {
    expect(() => service.log()).not.toThrow();
    expect(() => service.logError('test', 'error')).not.toThrow();
    expect(() => service.logAction('action', 'data')).not.toThrow();
  });
});
