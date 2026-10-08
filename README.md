# Orynt

**School Operating Intelligence.**

Orynt connects the systems a school already uses, models the institution as a permission-aware operational graph, surfaces evidence-backed exceptions, coordinates authorized action, and measures whether those actions worked.

It is intentionally different from a conventional ERP. ERPs record transactions. Orynt's first job is to turn fragmented academic, attendance, support, operational and safety data into a coherent **signal → evidence → action → outcome** loop.

## What is implemented

The repository currently contains a runnable first end-to-end platform slice:

- **Orynt Command** — tenant-backed principal operating picture with current attendance, signals, interventions and assessment state.
- **Student 360** — tenant-scoped attendance, assessment, signal evidence and intervention history.
- **Orynt Actions** — authorized intervention creation, ownership, review dates, success metrics and measured outcomes.
- **Orynt Connect** — preview/validate/commit CSV ingestion for student rosters and attendance, with idempotent upserts, checksums, lineage and audit events.
- **Ask Orynt** — permission-aware deterministic school queries that remain useful without an LLM provider.
- **Orynt Vision** — privacy-oriented CCTV event queue with human review/confirm/dismiss/resolve workflows and audit history.
- **School Graph** — ontology surface for students, classes, courses, concepts, assessments, signals, interventions and Vision events.
- **Governance** — role/action policy model, scoped access concepts, auditability and explicit Vision privacy boundaries.
- **Authentication** — database-backed credential login with signed, HTTP-only session cookies.
- **Multi-tenancy** — tenant identifiers on school-domain records and tenant checks on sensitive reads/writes.
- **Explainable signal engine** — deterministic attendance/academic deterioration rules with rule versions, confidence and evidence.
- **Synthetic Orynt Academy** — a complete demo tenant that can be created without using real student data.
- **CI** — PostgreSQL-backed schema/seed/type/test/production-build verification on GitHub Actions.

## Architecture

```text
ERP / SIS / LMS / Sheets / Assessments / CCTV
                       │
                       ▼
                 Orynt Connect
                       │
                       ▼
              Orynt School Ontology
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Signals      Student 360    Vision events
          │            │             │
          └────────────┼─────────────┘
                       ▼
               Human-authorized action
                       │
                       ▼
            Intervention / workflow
                       │
                       ▼
              Measured outcome + audit
```

Current implementation is a single deployable Next.js/TypeScript application with PostgreSQL + Drizzle. The domain boundary is intentionally explicit so services can be split later without replacing the ontology.

## Local setup

Requirements:

- Node.js 22+
- pnpm 9.15+
- Docker / Docker Compose for the local PostgreSQL service

```bash
git clone https://github.com/sushxnthd/orynt.git
cd orynt
cp .env.example .env
```

Set `SESSION_SECRET` in `.env` to a long random value, then:

```bash
docker compose up -d db
corepack enable
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

Synthetic development login:

```text
principal@orynt.local
orynt-demo-2026
```

The credentials above are for the synthetic local tenant only and must never be reused for a real deployment.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

CI also provisions PostgreSQL, applies the schema, seeds Orynt Academy, then runs all three checks.

## Core ontology

The initial schema contains:

```text
Tenant
├── Users / Memberships / Roles
├── Students
├── Staff
├── Classes
├── Subjects
├── Course Offerings
├── Enrollments
├── Concepts
├── Assessments
│   ├── Concept links
│   └── Results
├── Attendance
├── Signals
│   └── Evidence
├── Interventions
│   ├── Students
│   └── Events / outcomes
├── Vision Events
├── Imports
└── Audit Events
```

## Security model

Orynt's current application policy is action-based RBAC with optional grade/class/subject scope. Sensitive write endpoints enforce permissions server-side; hiding a UI control is never treated as authorization.

Examples:

- a teacher can work with assigned academic/student workflows but cannot review Vision incidents;
- a principal can review interventions and Vision incidents;
- a parent has narrow student/intervention read capability and no sensitive internal access;
- intervention creation validates that every target student belongs to the active tenant;
- Vision review validates the event against the active tenant and records before/after state in the audit log;
- school queries only receive context the current role is permitted to read.

This is an application-level foundation, not a claim of completed external security certification. Real-school deployment still requires production identity/SSO, secrets management, infrastructure controls, data-processing agreements, retention configuration, security review and penetration testing.

## Orynt Vision boundary

Orynt Vision is designed around operational **events**, not persistent student identities.

Initial event classes include crowding, queue buildup, after-hours occupancy, restricted-zone entry, possible falls/person-down events, camera outage/tampering and evacuation occupancy.

The default product explicitly excludes:

- persistent facial recognition of students;
- emotion inference;
- attention/engagement scoring from faces;
- continuous individual location histories;
- automated disciplinary decisions;
- behavioral-risk labels primarily derived from CCTV.

## Product principles

1. **Action over dashboards.** Visibility is useful only when it improves a decision or workflow.
2. **Evidence over opaque scores.** Material signals expose the supporting records and rule version.
3. **Interoperability before forced replacement.** Orynt can sit above an existing ERP/SIS first.
4. **Human authority.** High-impact decisions remain authorized human actions.
5. **Useful without AI.** The ontology, signals, workflows, audit trail and outcomes work without an LLM.
6. **Privacy by architecture.** Collection and access should be minimized by default.
7. **Measure interventions.** Orynt records whether actions actually improved the target outcome.
8. **Synthetic-first development.** The full product can be evaluated without real children’s data.

## Research and specifications

- [`docs/01-product-research.md`](docs/01-product-research.md) — evidence, market/competitor analysis, legal constraints and falsifiable hypotheses.
- [`docs/01b-india-qualitative-evidence.md`](docs/01b-india-qualitative-evidence.md) — India-specific qualitative evidence.
- [`docs/02-product-definition.md`](docs/02-product-definition.md) — users, jobs, ontology and product boundaries.
- [`docs/03-system-blueprint.md`](docs/03-system-blueprint.md) — architecture, AI/ML, Vision, security and deployment strategy.
- [`docs/04-interview-research.md`](docs/04-interview-research.md) — real stakeholder interview protocol and falsification criteria.

## Next production milestones

The current codebase is the first complete operating slice, not the endpoint of the product. The next real-school milestones are:

- production SSO / identity provisioning and stronger policy administration;
- OneRoster, Ed-Fi and priority Indian ERP adapters;
- XLSX ingestion and richer schema mapping UI;
- configurable signal/rule management with calibration monitoring;
- concept/question-level assessment ingestion;
- intervention effectiveness analysis and controlled experimentation;
- timetable/substitution and school operations workflows;
- on-prem/edge Vision adapter with VMS/ONVIF integration;
- configurable retention/deletion workflows and data-subject governance;
- observability, backup/recovery and incident-response tooling;
- external security/privacy review;
- pilot validation with real school stakeholders using the protocol in `docs/04-interview-research.md`.

Orynt should not claim product-market fit or production certification until those claims are supported by real deployments and independent validation.
