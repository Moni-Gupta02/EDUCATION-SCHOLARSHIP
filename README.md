# Education Scholarship Portal

A reference implementation for the supplied full-stack assessment. It demonstrates a secure Node.js/Express API, a React dashboard, and PostgreSQL persistence for a state education and scholarship portal.

## Tech stack

- Frontend: React 18 with Vite, responsive CSS, semantic HTML, Gujarati/English UI switcher.
- Backend: Node.js, Express, Zod validation, JWT authorization, Helmet, CORS.
- Data: PostgreSQL 16, transactions, constraints, indexes, JSON audit metadata.
- Local infrastructure: Docker Compose.

## Run locally

1. Install Node.js 20+ and Docker Desktop.
2. From the project root, run `docker compose up -d` to start PostgreSQL and initialize the schema.
3. Backend: `cd backend`, copy `.env.example` to `.env` if needed (a development `.env` is already included), run `npm install`, then `npm run dev`.
4. Frontend: in another terminal run `cd frontend`, `npm install`, then `npm run dev`.
5. Open the Vite URL, normally `http://localhost:5173`; the API health endpoint is `http://localhost:4000/health`.

## Included assessment solutions

### API validation and status codes

`POST /api/students` requires a Bearer JWT with `ADMIN` or `OFFICER`, validates the body, returns `201` for creation, `400` for invalid/missing fields, `401` for missing/invalid authentication, and `403` for unauthorized roles. The centralized error handler returns a request id with unexpected errors.

### Idempotent payment endpoint

`POST /api/payments` requires `Idempotency-Key`. In a database transaction it locks an existing key, returns the stored response for the same payload, rejects a changed payload with `409`, or creates and records the payment atomically. A production system would submit the actual bank transfer through a durable outbox/worker after this transaction.

### BOLA/IDOR prevention

Student retrieval combines the resource lookup and caller scope in one query. An officer can only retrieve students in their `schoolId`; only `ADMIN` is cross-school. This is authorization at every object access, not a front-end-only check.

### Data migration strategy

Extract legacy records incrementally by stable source id and watermark; map to a versioned staging schema; normalize/match fields; validate counts, checksums, referential integrity, and rejected rows; then load with transactional batches. Preserve the source immutable until reconciliation, run parallel-read cutover rehearsals, and keep a reversible migration ledger. This provides an auditable zero-data-loss migration path.

### Rules, integration, and scale

Keep eligibility rules as versioned records (JSON/DMN) evaluated by a stateless rules service, so authorized administrators can activate a reviewed rule version without redeploying. For central APIs, use OAuth token caching/refresh, strict timeouts, retry with exponential backoff and jitter, circuit breakers, queues/cached last-known verified data, and per-provider rate limits. Use asynchronous workers for non-real-time work.

For a high-traffic React dashboard, route-level lazy loading, virtualized tables, pagination, memoized chart transforms, HTTP caching, compressed assets, and CDN hosting keep the first render small. This demo uses semantic headings, a visible focus escape hatch, accessible labels/tables, responsive layout, and bilingual copy; production should complete WCAG 2.2 AA keyboard, contrast, screen-reader, and language testing.

### Security and cloud practices

Audit events are append-only at the database permission layer and record actor/action/resource without raw PII. Encrypt connections with TLS, encrypt database/storage at rest using managed KMS keys, restrict decryption access, and redact PII from application logs. Store documents in private S3 buckets with Block Public Access enabled; use least-privilege IAM/bucket policies and short-lived pre-signed URLs, plus encryption and access logging.

## Benefits

- Prevents duplicate scholarship disbursement during retries.
- Protects student records from cross-user access and captures administrative activity.
- Keeps changing eligibility policy configurable and traceable.
- Starts quickly on slow networks and remains usable across devices and languages.
- Provides a clean foundation for VAPT, migration, AWS deployment, and future central-government integrations.
