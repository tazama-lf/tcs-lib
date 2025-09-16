So to summarize what we are building:

- **TCS-Lib (Commons Repo)**

  - A shared **library** (internal → later npm package).
  - Houses **Audit Logging** + **Event Logging** (and possibly other shared utilities later).
  - Reason: _cross-repo reuse_ (TCS, Admin-Service, DEMS, etc.).

---

### 🔎 Audit Logging (Governance/Compliance)

- **What:** Immutable, compliance-grade record of _who did what, when, where_.
- **Scope:**

  - Actions in TCS (create endpoint, mapping update, config export/import).
  - Deployment activities (package publish, approval, rollback).
  - User/service identity from Keycloak token (`sub`, `tenantId`, `role`).

- **Fields (suggested):**

  ```json
  {
    "timestamp": "2025-09-16T12:34:56Z",
    "actor": "user123",
    "tenantId": "bank01",
    "action": "DEPLOY_PACKAGE",
    "entity": "pacs008_endpoint",
    "status": "SUCCESS",
    "metadata": { "version": "v2", "hash": "sha256..." }
  }
  ```

- **Destination:** Postgres (audit DB) + forwarded to central ELK/Grafana.
- **Properties:** Immutable (append-only), signed or hashed if needed.

---

### 🔎 Event Logging (Operational/Telemetry)

- **What:** System-level, structured logs (debugging + monitoring).
- **Scope:**

  - Endpoint runtime events (msg validated, msg rejected, cache miss).
  - Library/service events (API call, CRON trigger, enrichment pull).

- **Levels:** TRACE → DEBUG → INFO → WARN → ERROR.
- **Fields (suggested):**

  ```json
  {
    "timestamp": "2025-09-16T12:35:10Z",
    "service": "tcs-admin",
    "event": "MESSAGE_VALIDATED",
    "level": "INFO",
    "txId": "abc123",
    "tenantId": "bank01",
    "details": { "msgType": "pacs.008", "latencyMs": 123 }
  }
  ```

- **Destination:** Console → File → Elastic APM (configurable via env).

---

### 🔧 TCS-Lib Design

- **Language:** TypeScript.
- **Exports:**

  - `auditLogger.log(action: AuditLogEntry)`
  - `eventLogger.log(level: LogLevel, event: EventLogEntry)`

- **Config:**

  - Env-driven (LOG_LEVEL, LOG_FORMAT=json/plain, LOG_DEST=console/elasticsearch/postgres).
  - Multi-transport (pino/ Winston-like).

- **Dependency:** Keep lightweight (avoid pulling in entire Elastic lib if not needed).

---

### 📦 NPM Packaging Plan

1. Create **`tcs-lib` repo** (commons).
2. Split into **modules** (audit-logger, event-logger, utils).
3. Publish as scoped package (`@tazama/tcs-lib`).
4. Import in other repos (`import { auditLogger } from '@tazama/tcs-lib'`).
5. CI/CD → GitHub Actions to auto-publish on tag.
