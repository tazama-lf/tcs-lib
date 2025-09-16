// Export main audit logger class
export { AuditLogger } from "./services/audit-logger.service";

// Export interfaces
export { IAuditLogger } from "./interfaces/audit-logger.interface";

// Export types and enums
export {
  AuditStatus,
  AuditAction,
  AuditLevel,
  AuditMetadata,
  AuditLogEntry,
  AuditLoggerConfig,
} from "./types/audit.types";

// Import for factory function
import { AuditLogger } from "./services/audit-logger.service";
import { AuditLoggerConfig } from "./types/audit.types";

// Export a factory function for creating audit loggers
export function createAuditLogger(config: AuditLoggerConfig): AuditLogger {
  return new AuditLogger(config);
}

// Export version information
export const VERSION = "1.0.0";
