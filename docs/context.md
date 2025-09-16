# TCS-Lib Project Context

**Version**: 1.0  
**Date**: September 16, 2025  
**Branch**: feat-paysys-audit-logger

---

## Executive Summary

**TCS-Lib** is a shared TypeScript library serving as the commons repository for the **Tazama Connection Studio (TCS)** ecosystem. It provides standardized audit logging, event logging, and shared utilities across multiple Tazama services including TCS, Admin-Service, and DEMS (Data Enrichment and Mapping Service).

The library supports Tazama's **real-time transaction monitoring system** - a rules-based inference engine that processes ISO20022 financial messages to detect fraud and money laundering patterns through configurable rule processors and typology scoring.

---

## Core System Architecture

### Tazama Platform Overview

- **Primary Function**: Real-time transaction monitoring for fraud detection and anti-money laundering (AML)
- **Message Processing**: JSON-formatted ISO20022 messages (pain.001, pain.013, pacs.008, pacs.002)
- **Detection Engine**: Rules-based forward-chaining inference engine with configurable thresholds
- **Data Flow**: TMS API → Event Director → Rule Processors → Typology Processors → Alert/Block decisions

### TCS-Lib Position in Ecosystem

TCS-Lib sits at the foundation of the Tazama ecosystem, providing cross-cutting concerns:

- **Audit Logging**: Governance and compliance tracking
- **Event Logging**: Operational telemetry and debugging
- **Shared Utilities**: Common functionality across services

---

## Business Requirements Context

### Primary Use Cases (from BRS)

#### 1. **Data Integration & Schema Management**

- Addition of new data elements to existing ISO20022 messages
- Onboarding of new payment message types (Pacs.009, Camt.052, ISO8583)
- Schema-driven REST API endpoint auto-generation
- XML to JSON transformation capabilities

#### 2. **Data Enrichment Patterns**

- **Push-based**: External systems push enrichment data via REST endpoints
- **Pull-based**: Scheduled polling from SFTP/FTP sources and HTTP endpoints
- **File processing**: CSV/TSV/delimited text files with column-to-JSON mapping
- **Storage**: ArangoDB collections for enrichment data

#### 3. **Mapping & Transformation**

- One-to-one, one-to-many, many-to-one field mappings
- Constant value injection and transformation rules
- Tazama message template validation
- Simulation/dry-run capabilities

#### 4. **Security & Governance**

- Keycloak-based role-based access control (RBAC)
- Endpoint versioning and namespace isolation
- Configuration artifact versioning and traceability
- Deployment zone management

---

## Technical Architecture Context

### Technology Stack (from FSD)

- **Frontend**: React 18.3 with secure cookie handling (SameSite=Strict, HttpOnly, Secure)
- **Backend**: TypeScript with NestJS framework
- **Primary Database**: PostgreSQL for Tazama data model and TCS configuration
- **Enrichment Database**: ArangoDB for operational data store (ODS)
- **Identity & Access Management**: Keycloak
- **Logging Infrastructure**: ELK stack integration with Grafana

### User Types & Responsibilities

1. **System Administrator**: Environment management, user provisioning, security policies
2. **Integration Developer**: API endpoint creation, schema management, mapping configuration
3. **Data Analyst**: Enrichment source configuration, data validation, monitoring
4. **Business User**: Configuration review, approval workflows, operational oversight

### Deployment Architecture

- **Environment Isolation**: Development, staging, production deployment zones
- **Configuration Management**: Version-controlled artifacts with rollback capabilities
- **Package Distribution**: Secured configuration packages with integrity validation
- **Monitoring**: Centralized logging with operational telemetry

---

## TCS-Lib Specific Requirements

### 1. Audit Logging Module

**Purpose**: Immutable, compliance-grade audit trail for regulatory requirements

**Scope**:

- TCS configuration changes (endpoint creation, mapping updates, schema modifications)
- Deployment activities (package publishing, approval workflows, rollbacks)
- User authentication and authorization events
- Data enrichment source configuration changes

**Data Structure**:

```json
{
  "timestamp": "2025-09-16T12:34:56Z",
  "actor": "user123",
  "tenantId": "bank01",
  "action": "DEPLOY_PACKAGE",
  "entity": "pacs008_endpoint",
  "status": "SUCCESS|FAILURE|PENDING",
  "metadata": {
    "version": "v2.1.0",
    "hash": "sha256...",
    "environment": "production",
    "approvedBy": "manager456"
  }
}
```

**Storage & Retention**:

- Primary: PostgreSQL audit database with append-only constraints
- Secondary: Forward to centralized ELK/Grafana for analytics
- Integrity: Optional cryptographic signing for tamper evidence
- Retention: Configurable retention policies for compliance requirements

### 2. Event Logging Module

**Purpose**: Structured operational logging for debugging, monitoring, and performance analysis

**Scope**:

- API endpoint runtime events (request validation, response generation, error handling)
- Data enrichment pipeline events (source polling, transformation, validation)
- System performance metrics (latency, throughput, resource utilization)
- Integration events (external system communication, cache operations)

**Log Levels**: TRACE → DEBUG → INFO → WARN → ERROR → FATAL

**Data Structure**:

```json
{
  "timestamp": "2025-09-16T12:35:10Z",
  "service": "tcs-admin",
  "event": "MESSAGE_VALIDATED",
  "level": "INFO",
  "traceId": "abc123",
  "tenantId": "bank01",
  "userId": "user123",
  "details": {
    "msgType": "pacs.008",
    "latencyMs": 123,
    "validationRules": ["schema", "business_rules"],
    "enrichmentSources": 3
  }
}
```

**Transport Configuration**:

- Console output for development
- File-based logging with rotation
- Elasticsearch APM for production monitoring
- Configurable via environment variables

### 3. Configuration Management

**Environment Variables**:

```bash
# Logging Configuration
LOG_LEVEL=INFO|DEBUG|TRACE|WARN|ERROR
LOG_FORMAT=json|plain
LOG_DESTINATION=console|file|elasticsearch|postgres

# Audit Configuration
AUDIT_DATABASE_URL=postgresql://...
AUDIT_RETENTION_DAYS=2555  # 7 years for compliance
AUDIT_SIGNING_ENABLED=true|false

# Event Configuration
EVENT_ELASTICSEARCH_URL=http://...
EVENT_BUFFER_SIZE=1000
EVENT_FLUSH_INTERVAL=5000

# Transport Configuration
ENABLE_CONSOLE_TRANSPORT=true|false
ENABLE_FILE_TRANSPORT=true|false
ENABLE_ELASTICSEARCH_TRANSPORT=true|false
```

---

## Integration Points

### Tazama Core Services Integration

- **TMS API**: Message ingestion and validation logging
- **Event Director**: Transaction triage and routing decisions
- **Rule Processors**: Individual rule evaluation events
- **Typology Processors**: Scoring and threshold evaluation
- **Admin Service**: User management and configuration changes

### External System Integration

- **Keycloak**: User authentication and role validation events
- **SFTP/FTP Sources**: Data enrichment polling and ingestion logs
- **HTTP APIs**: External data source communication events
- **File Systems**: CSV/JSON file processing events

### Data Flow Audit Points

1. **Ingress**: Message reception and initial validation
2. **Transformation**: Schema mapping and data conversion
3. **Enrichment**: External data augmentation
4. **Processing**: Rule evaluation and typology scoring
5. **Egress**: Alert generation and response transmission

---

## Compliance & Security Considerations

### Regulatory Requirements

- **Data Protection**: GDPR/CCPA compliance for PII handling
- **Financial Regulations**: SOX, PCI-DSS audit trail requirements
- **AML Compliance**: Transaction monitoring and suspicious activity reporting
- **Data Retention**: Configurable retention policies per jurisdiction

### Security Features

- **Access Control**: Role-based logging access with audit trails
- **Data Integrity**: Optional cryptographic signatures for audit logs
- **Encryption**: At-rest and in-transit encryption for sensitive logs
- **Anonymization**: PII masking for non-audit event logs

### Operational Security

- **Log Tampering Prevention**: Append-only database constraints
- **Access Monitoring**: Administrative action logging
- **Incident Response**: Real-time alerting for security events
- **Compliance Reporting**: Automated audit trail generation

---

## Development & Deployment Context

### Current Status

- **Branch**: `feat-paysys-audit-logger` - Active development of payment system audit logging
- **Phase**: Foundation library development and API design
- **Target**: NPM package publication as `@tazama/tcs-lib`

### Development Priorities

1. **Audit Logger Implementation**: Core audit logging functionality
2. **Event Logger Implementation**: Structured operational logging
3. **Configuration Management**: Environment-driven setup
4. **Transport Abstractions**: Multi-destination logging support
5. **Security Features**: Cryptographic integrity and access controls

### Quality Assurance

- **Testing Strategy**: Unit tests, integration tests, performance benchmarks
- **Documentation**: API documentation, usage examples, configuration guides
- **Validation**: Schema validation, data integrity checks, security audits
- **Monitoring**: Performance metrics, error rates, compliance reporting

---

## Success Metrics

### Technical Metrics

- **Performance**: <10ms logging overhead per transaction
- **Reliability**: 99.9% logging success rate
- **Scalability**: Support for 10,000+ transactions per second
- **Storage Efficiency**: Optimized data structures and compression

### Business Metrics

- **Compliance**: 100% audit trail completeness
- **Adoption**: Usage across all Tazama services
- **Developer Experience**: Simplified integration and configuration
- **Operational Visibility**: Comprehensive monitoring and alerting

### Security Metrics

- **Audit Integrity**: Zero unauthorized modifications
- **Access Control**: 100% RBAC enforcement
- **Incident Response**: <1 hour mean time to detection
- **Compliance Reporting**: Automated regulatory report generation

---

## Future Roadmap

### Phase 1: Foundation (Current)

- Core audit and event logging modules
- Basic transport implementations
- Configuration management
- Initial security features

### Phase 2: Enhancement

- Advanced transformation capabilities
- Real-time analytics integration
- Enhanced security features (signing, encryption)
- Performance optimizations

### Phase 3: Intelligence

- Machine learning anomaly detection
- Predictive compliance monitoring
- Advanced analytics and reporting
- AI-assisted configuration management

---

_This context document serves as the authoritative reference for TCS-Lib development and should be updated as requirements evolve and implementation progresses._
