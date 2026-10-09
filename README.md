# Orynt

**School Operating Intelligence.**

Orynt connects the systems a school already uses, models the institution as a permission-aware operational graph, surfaces evidence-backed exceptions, coordinates authorized action, and measures whether those actions worked.

It is intentionally different from a conventional ERP. ERPs record transactions. Orynt's job is to turn fragmented academic, attendance, support, operational and safety data into a coherent **signal → evidence → decision → action → outcome** loop.

## Implemented platform

The repository contains a runnable multi-tenant platform rather than a dashboard-only prototype.

### Core operating system

- **Orynt Command** — principal operating picture for attendance, signals, interventions, readiness and operational exceptions.
- **Student 360** — scoped attendance, assessments, evidence, interventions and progress.
- **Orynt Actions** — intervention creation, ownership, review dates, tasks, measured outcomes and audit history.
- **Academics + Attendance + Operations** — assessments/results, syllabus progress, attendance, timetable/class meetings, substitutions, assignments, tasks and incidents.
- **Governance** — server-side RBAC, grade/class/subject scoping, audit events, retention policies and tenant boundaries.
- **Synthetic Orynt Academy** — seeded principal/student/parent experiences without real children's data.

### Frontier modules

1. **Orynt AIP** — permission-aware natural-language investigation over explicit Orynt tools. It works deterministically without a model provider, supports an optional OpenAI-compatible synthesis endpoint, and requires explicit human confirmation before any write action.
2. **Orynt Forecast** — tenant-history forecasting with transparent trend models, residual uncertainty intervals and an explicit `baseline` versus `empirical` calibration state. Forecast runs are persisted for auditability.
3. **Orynt Studio** — tenant-specific object-type, metric and workflow definitions stored as versioned metadata rather than product forks.
4. **Orynt Connect** — CSV ingestion plus connector infrastructure for Fedena, OneRoster, Ed-Fi and vendor-assisted Teachmint/Entab/Edunext integrations. Connector syncs normalize and upsert student records, track source health and lineage, store only secret references, require HTTPS and block private-network/DNS targets.
5. **Orynt Vision Edge** — school-controlled RTSP inference service using anonymous person detection to emit minimal operational events such as crowding, restricted-zone occupancy, after-hours presence, possible falls and camera outages. No face embeddings or identity history are generated.
6. **Live School Graph** — interactive tenant-backed ontology explorer for students, classes, courses, subjects, signals and interventions with real relationship edges.
7. **Scenario Lab** — transparent Monte Carlo planning simulations with p10/p50/p90 outputs, contribution decomposition and persisted scenario runs. It is intentionally separate from predictive forecasting.
8. **Production deployment stack** — PostgreSQL, standalone Next.js service, Caddy TLS reverse proxy, security headers, database readiness checks, daily compressed backups, retention, structured proxy logs and a documented restore/recovery procedure.

## Architecture

```text
ERP / SIS / LMS / Files / Assessments               School CCTV / NVR
                │                                           │
                ▼                                           ▼
          Orynt Connect                              Orynt Vision Edge
                │                                           │
                └──────────────────┬────────────────────────┘
                                   ▼
                         Orynt School Ontology
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
          Orynt AIP            Forecast             Live Graph
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ▼
                         Human-authorized action
                                   │
                                   ▼
                      Intervention / task / workflow
                                   │
                                   ▼
                        Measured outcome + audit
```

The web application is Next.js/TypeScript with PostgreSQL + Drizzle. Vision runs separately at the school edge. The domain model and APIs are explicit enough to split services later without replacing the ontology.

## Local setup

Requirements:

- Node.js 22+
- pnpm 9.15+
- Docker / Docker Compose

```bash
git clone https://github.com/sushxnthd/orynt.git
cd orynt
cp .env.example .env
docker compose up -d db
corepack enable
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Set `SESSION_SECRET` in `.env` to a long random value before starting the app.

Synthetic development login:

```text
principal@orynt.local
orynt-demo-2026
```

Synthetic credentials must never be reused for a real school.

## Verification

```bash
pnpm typecheck
pnpm test
python -m py_compile edge/vision/orynt_edge.py
pnpm build
```

GitHub Actions additionally provisions PostgreSQL, applies the complete schema, seeds the synthetic tenant, validates the Vision edge service syntax, validates the production Compose configuration and runs the production Next.js build.

## Production deployment

See [`docs/production-runbook.md`](docs/production-runbook.md).

The supplied production stack provides:

- PostgreSQL 16 persistent storage;
- automatic HTTPS through Caddy once a real domain points to the host;
- readiness checks that include database connectivity;
- daily compressed PostgreSQL backups with configurable local retention;
- a restore/recovery procedure;
- structured reverse-proxy logs;
- environment/secret-manager references for connector credentials;
- security headers at the application/proxy boundary.

Copy `.env.production.example` to `.env.production`, replace every placeholder secret, set a real domain, then deploy from `infra/` using the production Compose file.

## Orynt Vision boundary

Vision is designed around operational **events**, not persistent student identities.

Default event classes include crowding, queue buildup, after-hours occupancy, restricted-zone entry, possible falls/person-down events, camera outage/tampering and evacuation occupancy. The included edge detector currently emits crowding, restricted-zone occupancy, after-hours presence, possible-fall heuristics and camera-outage events; other allowed event classes can be added as edge detectors without changing the central event contract.

The default product explicitly excludes:

- persistent facial recognition of students;
- emotion inference;
- attention/engagement scoring from faces;
- continuous individual location histories;
- automated disciplinary decisions;
- CCTV-derived behavioral-risk labels.

## Security model

Sensitive writes are authorized server-side. UI visibility is never treated as authorization. AIP tools inherit the user's tenant and scope. Connector destinations are HTTPS-only, reject obvious private hosts, are rechecked after DNS resolution, can be restricted with an explicit host allowlist and do not persist raw connector tokens. Edge-agent credentials are one-time secrets stored server-side only as SHA-256 hashes.

This repository is a production-capable software foundation, not an external security certification. A real-school deployment should still undergo independent security/privacy review, penetration testing, identity/SSO integration and contract-specific data-governance review.

## External activation requirements

The first eight frontier modules are implemented, but several capabilities only become *live against a real school* when external resources are supplied:

- **ERP/SIS connectors:** vendor or school-issued API/export credentials and, for vendors without a public stable API contract, the school's supported endpoint/export specification.
- **Forecast calibration:** enough historical school data to earn the `empirical` calibration state; Orynt deliberately falls back to conservative intervals before that threshold.
- **Vision:** RTSP/VMS access, an authorized school-controlled edge host and cameras.
- **Provider-assisted AIP:** optional provider endpoint/key/model. The deterministic tool layer works without it.
- **Public deployment:** a hosting target, real domain/DNS and production secrets. The repository includes the deployable stack but cannot provision an external cloud/domain account by itself.

## Product principles

1. **Action over dashboards.** Visibility matters when it improves a decision or workflow.
2. **Evidence over opaque scores.** Material signals expose supporting records and model/rule identity.
3. **Interoperability before forced replacement.** Orynt can sit above an existing ERP/SIS first.
4. **Human authority.** High-impact decisions remain authorized human actions.
5. **Useful without AI.** The ontology, signals, workflows, audit trail and outcomes work without an LLM.
6. **Privacy by architecture.** Collection and access are minimized by default.
7. **Measure interventions.** Orynt records whether actions actually improved the target outcome.
8. **Synthetic-first development.** The product can be exercised without real children's data.

## Research and specifications

- [`docs/01-product-research.md`](docs/01-product-research.md)
- [`docs/01b-india-qualitative-evidence.md`](docs/01b-india-qualitative-evidence.md)
- [`docs/02-product-definition.md`](docs/02-product-definition.md)
- [`docs/03-system-blueprint.md`](docs/03-system-blueprint.md)
- [`docs/04-interview-research.md`](docs/04-interview-research.md)
- [`docs/production-runbook.md`](docs/production-runbook.md)

## What remains after this phase

The next work is deployment and validation rather than filling the eight requested architectural gaps: real-school pilot data, independent security/privacy review, production SSO/identity provisioning, vendor-specific connector certification, model monitoring on real histories, edge-camera validation, load/performance testing and stakeholder outcome measurement.

Orynt should not claim product-market fit, empirical impact or independent production certification until those claims are supported by real deployments and external validation.
