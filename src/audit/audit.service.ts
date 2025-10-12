import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  log(): void {}
  logError(..._args: any[]): void {}
  logAction(..._args: any[]): void {}
}
