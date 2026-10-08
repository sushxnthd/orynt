# Orynt System Blueprint

Status: **implementation blueprint v0.1**  
Updated: 2026-10-09

## 1. Architecture objective

Build one coherent platform that can begin as an intelligence/action overlay on top of existing school systems and later absorb selected transactional workflows without re-architecting the core.

The architecture therefore needs five properties from day one:

1. **multi-tenant security**
2. **source-aware data ingestion and lineage**
3. **extensible ontology**
4. **action/workflow engine**
5. **AI/analytics that never bypass authorization or provenance**

---

## 2. Proposed monorepo

```text
orynt/
├── apps/
│   ├── web/                 # Next.js + TypeScript application
│   ├── api/                 # FastAPI core API
│   ├── worker/              # async ingestion / analytics jobs
│   └── vision-edge/         # optional edge video event service
├── packages/
│   ├── ui/                  # design system
│   ├── contracts/           # shared OpenAPI/generated TS contracts
│   ├── ontology/            # canonical object/link definitions
│   ├── policy/              # authorization policy definitions/tests
│   ├── analytics/           # feature definitions and metrics
│   └── synthetic-school/    # reproducible demo dataset generator
├── connectors/
│   ├── csv/
│   ├── xlsx/
│   ├── oneroster/
│   ├── edfi/
│   └── generic-rest/
├── infra/
│   ├── docker/
│   ├── migrations/
│   ├── compose/
│   └── deploy/
├── docs/
└── tests/
    ├── integration/
    ├── security/
    ├── e2e/
    └── fixtures/
```

---

## 3. Technology choices

### Web

- Next.js (current stable)
- TypeScript strict mode
- React
- accessible headless primitives
- Tailwind for implementation speed, with Orynt design tokens above it
- TanStack Query for remote state
- TanStack Table for data-heavy views
- a graph visualization library behind an adapter so it can be changed later

### API

- Python
- FastAPI
- Pydantic
- SQLAlchemy 2.x
- Alembic migrations

Why Python API instead of a TypeScript-only backend: analytics, data ingestion, educational data science and vision are first-class capabilities. Keeping the core service in Python reduces cross-language friction for those paths while retaining a TypeScript UI.

### Data

- PostgreSQL as system of record
- Postgres row-level security where appropriate
- JSONB for extensible object properties
- pgvector only for authorized semantic retrieval use cases
- Redis/Valkey for cache/queues only where needed
- S3-compatible object storage for imports/exports and approved evidence artifacts

### Why not Neo4j initially?

A graph product does not require a graph database on day one. The school ontology can be represented with typed core tables plus generic object/link tables in PostgreSQL. This avoids dual-write complexity, simplifies transactions/audit/permissions, and remains capable of graph traversal at school scale. A dedicated graph store can be added behind the ontology service if actual query workloads justify it.

### Async jobs

Start with a durable queue abstraction for:

- imports
- source sync
- report generation
- feature computation
- model scoring
- notifications
- media/event processing

Do not couple product logic directly to a specific queue implementation.

### Deployment

Local/demo:
- Docker Compose

Production target:
- containerized services
- managed PostgreSQL or hardened self-hosted deployment
- S3-compatible object storage
- optional on-prem/edge Vision gateway

The product should support cloud control plane + school-local edge processing for video.

---

## 4. Multi-tenancy model

Hierarchy:

```text
Organization / SchoolGroup
  └── School
       └── Campus
```

Every data-bearing record must be scoped to an organization and normally a school/campus.

Security invariant:

> A missing tenant filter must fail closed, not return global data.

Use:

- tenant IDs in all core entities
- database constraints
- service-level policy checks
- RLS for defense in depth on sensitive tables
- security regression tests attempting cross-tenant access

---

## 5. Identity and authorization

### Authentication

Production architecture should support OIDC/SAML-style institutional SSO through an identity-provider adapter. Local development uses seeded users.

### Authorization

Hybrid RBAC + ABAC.

Roles are useful defaults:

- super_admin
- school_admin
- principal
- coordinator
- teacher
- counselor
- operations
- data_admin
- parent
- student

But access must also depend on relationships and purpose:

```text
Teacher may view Student academic data
IF teacher teaches a current class containing Student
AND property is allowed for teacher role
AND school policy allows it.
```

Counselor notes may have separate policies from general academic notes.

Vision footage/evidence references require stricter permissions than aggregate occupancy events.

### Policy checks

All API operations should resolve:

```text
actor
resource/object
requested action
relationship context
purpose/context (where needed)
policy result
```

Log significant access and all sensitive mutations.

---

## 6. Ontology storage

Use a hybrid model.

### Typed core tables

High-value stable entities get explicit relational tables:

- students
- guardians
- staff
- schools/campuses
- academic_years/terms
- grades/sections
- courses/classes
- concepts
- assessments/items/results
- attendance_events
- signals
- interventions
- tasks
- incidents
- vision_events

### Generic extension tables

```text
object_types
property_definitions
objects
object_properties
link_types
object_links
```

This lets Orynt Studio create school-specific object types without weakening the typed core.

### Provenance

Every imported/derived value should be able to reference:

```text
source_system
source_record_id
import_job
observed_at
received_at
transformation_version
```

Derived metrics also track computation/model version.

---

## 7. Event and audit architecture

Separate three concepts:

### Domain event
Something happened in the school/domain.

Examples:
- AttendanceRecorded
- AssessmentPublished
- StudentSectionChanged
- InterventionCreated
- InterventionCompleted
- VisionEventDetected

### Audit event
Someone or something changed/accessed the Orynt system.

Examples:
- StudentRecordViewed
- InterventionUpdated
- ExportGenerated
- PolicyChanged

### Source event
A connector observed external data.

Examples:
- SISStudentUpsertReceived
- GradebookImportCompleted

The append-only audit stream should not be mutable through normal product APIs.

---

## 8. Ingestion pipeline

```text
Upload/API/source
    ↓
Raw immutable landing record
    ↓
Parser
    ↓
Schema validation
    ↓
Mapping
    ↓
Identity resolution
    ↓
Data-quality checks
    ↓
Canonical upsert
    ↓
Lineage links
    ↓
Domain events
    ↓
Derived metrics/signals
```

### Data-quality issue classes

- missing required value
- invalid enum/date
- duplicate identity
- ambiguous student match
- orphan class enrollment
- assessment item without assessment
- impossible attendance/timetable relationship
- stale source
- unexpected value distribution

Import jobs need preview/dry-run before mutation.

---

## 9. Interoperability

### OneRoster 1.2

Implement CSV first, REST adapter second.

Core mappings:
- orgs
- users
- courses
- classes
- enrollments
- academic sessions
- line items/results where available

### Ed-Fi

Treat Ed-Fi v6 data model as a reference and later implement an API adapter for target deployments that expose Ed-Fi.

### Generic mapping studio

Real Indian schools will have proprietary exports. A mapping UI must allow:

```text
source column → canonical field
value transform
lookup mapping
identity key priority
validation rule
```

Mapping definitions are versioned.

---

## 10. Signals and explanations

A `Signal` is a structured claim that may require attention.

Example:

```json
{
  "type": "academic_deterioration",
  "subject": "student:123",
  "severity": "medium",
  "observed_window": "2026-08-01/2026-09-30",
  "evidence": [
    "result:991",
    "result:1022",
    "absence_episode:88"
  ],
  "explanation": {
    "summary": "Performance declined in two prerequisite-linked concepts after repeated absences.",
    "factors": [
      {"factor": "assessment_trend", "contribution": 0.55},
      {"factor": "missed_instruction", "contribution": 0.31}
    ]
  },
  "model_or_rule_version": "academic-deterioration@0.3"
}
```

Never show contribution numbers unless the underlying method makes them meaningful.

Signals should support rule-based, statistical and ML sources through the same interface.

---

## 11. Intervention/action engine

Core state machine:

```text
DRAFT
  ↓
ACTIVE
  ├── PAUSED
  ├── ESCALATED
  ↓
COMPLETED
  ↓
EVALUATED
  ├── EFFECTIVE
  ├── PARTIALLY_EFFECTIVE
  ├── NO_EFFECT
  └── INCONCLUSIVE
```

An intervention stores:

- target
- concern/signal
- owner
- collaborators
- start/end/follow-up dates
- strategy/playbook
- intended outcome
- baseline measure
- follow-up measure(s)
- notes with scoped permissions
- completion status
- evaluation result

This is one of Orynt’s most important schemas because it closes the loop between prediction and actual institutional action.

---

## 12. Analytics and ML architecture

### Principle

Start with robust descriptive analytics and transparent rules before using ML where it adds no meaningful value.

### Feature registry

Each derived feature defines:

- name
- semantic meaning
- input sources
- eligible roles/purposes
- observation window
- missing-data behavior
- computation version
- freshness target

### Model registry

Each model version stores:

- task
- target definition
- training/evaluation dataset version
- features
- metrics
- calibration metrics
- subgroup checks where appropriate/lawful
- threshold policy
- model artifact reference
- deployment status
- owner
- review date

### Early-warning requirement

No alert model ships without:

1. a specific authorized user who receives it;
2. a defined safe action they can take;
3. a known evaluation metric for false alerts;
4. explanation/evidence;
5. documented data freshness;
6. local validation or an explicit “experimental” status.

### Prediction is not causation

Orynt must label predictive association separately from causal evidence. Root-cause language should be reserved for cases supported by appropriate design/evidence.

---

## 13. Orynt AIP architecture

AIP is an interface to authorized tools, not an omniscient chatbot.

```text
User question
   ↓
Authorization context
   ↓
Planner
   ↓
Typed Orynt tools
   ├── search_objects
   ├── get_student_context
   ├── query_metric
   ├── explain_signal
   ├── compare_cohorts
   ├── create_intervention_draft
   └── get_source_lineage
   ↓
Structured results + citations
   ↓
LLM synthesis
   ↓
Policy/output check
```

The model does not receive unrestricted database access.

### Rules

- tool arguments validated server-side
- authorization enforced at tool execution, not prompt level
- sensitive results minimized
- every answer cites Orynt objects/source records
- write actions require explicit user confirmation when consequential
- prompt/tool execution metadata auditable
- AI absence must not break the core product

---

## 14. Orynt Vision architecture

### Deployment model

Preferred:

```text
Cameras/NVR
   ↓ local network
Vision Edge Gateway
   ↓
Detection/tracking
   ↓
Policy/event extraction
   ↓
Event metadata + optional short evidence reference
   ↓ encrypted
Orynt Core
```

### Data-minimization strategy

Default event object may contain:

- camera/zone
- event type
- timestamp/window
- confidence
- occupancy/count metadata
- ephemeral track reference
- human verification status
- evidence clip pointer if policy permits

Do not send/store face embeddings by default.

### Model safety

Vision events are alerts for human review, not findings of guilt or disciplinary conclusions.

Measure:

- precision/false-alarm rate
- missed-event rate where labeled data exists
- processing latency
- camera coverage gaps
- reviewer disposition

---

## 15. Synthetic school

The demo dataset is a product requirement, not test filler.

Create **Orynt Academy**, with:

- ~1,200 synthetic students
- grades 6–12
- sections
- teachers/departments
- timetable
- 12 months attendance history
- assessments with item/concept mappings
- interventions
- parent/guardian relationships
- operational incidents
- synthetic Vision events
- deliberately injected patterns

Injected scenarios should include:

1. section-specific Chemistry deterioration
2. one assessment with abnormal item difficulty
3. attendance-linked decline for a subset of students
4. ineffective intervention vs effective matched intervention
5. data-quality mismatch / duplicate student
6. after-hours restricted-zone Vision alert
7. unresolved task backlog

All names/data clearly synthetic.

---

## 16. Security baseline

Before real student data:

- TLS everywhere in production
- encryption at rest
- secrets outside repository
- CSP and secure cookie policy
- CSRF protection where relevant
- strict input validation
- output encoding
- rate limiting
- login/session protection
- tenant isolation tests
- least privilege service accounts
- immutable audit log strategy
- backup + restore test
- retention jobs
- export controls
- dependency scanning
- SAST/secret scanning in CI
- no real student data in logs
- no raw model prompts containing more data than needed

Threat-model separately:

- compromised teacher account
- malicious student user
- cross-tenant IDOR
- bulk export abuse
- insider viewing sensitive notes
- prompt injection through imported text
- connector poisoning
- CCTV evidence exfiltration
- over-permissioned AI tools

---

## 17. DPDP / child-data design consequences

The platform must be capable of attaching processing-purpose and retention metadata to categories of child data.

Build for:

- clear data inventories
- consent/legal-basis records where applicable
- parent/guardian relationship validation
- purpose-limited access
- retention schedules
- export/correction/deletion workflows where legally applicable
- processor/subprocessor inventory
- breach/incident audit support

Educational/safety exceptions should be encoded narrowly and reviewed legally before production deployment; they are not blanket permission for unrelated profiling.

---

## 18. Testing strategy

### Unit
- ontology rules
- metric calculations
- policy predicates
- import parsers
- intervention state machines

### Integration
- ingestion → canonical data → signal
- OneRoster fixture imports
- tenant policy enforcement
- audit generation
- AIP tool authorization

### Property/security
- no cross-tenant access under generated object IDs
- permission monotonicity tests
- import idempotency
- lineage completeness

### E2E
Critical journeys:

1. import school data
2. inspect data-quality issue
3. open Command exception
4. drill to Student 360
5. inspect evidence
6. create intervention
7. complete follow-up
8. evaluate outcome
9. ask AIP the same question and verify citations
10. review Vision event and create incident

### Analytics
- deterministic synthetic scenarios with expected flags
- calibration tests
- backtest leakage checks
- missing-data tests

---

## 19. Observability

Track:

- request latency/error rate
- connector success/failure/freshness
- queue lag
- data-quality error rate
- policy denials
- AIP tool errors
- model scoring latency
- Vision event volume and false-alert disposition
- action/intervention lifecycle metrics

Every job/request should carry tenant-safe correlation IDs.

---

## 20. Build order

### Foundation
1. monorepo + CI
2. Postgres + migrations
3. tenant/user/auth model
4. policy layer
5. audit framework
6. synthetic school generator

### Data/ontology
7. typed core ontology
8. generic extension model
9. CSV/XLSX ingest
10. mapping/validation/lineage
11. OneRoster CSV

### Core product
12. Command
13. Student 360
14. Academics
15. Signals/explanations
16. Actions/interventions
17. outcome evaluation

### Intelligence
18. feature registry
19. transparent early-warning rules
20. forecasting models only where validated
21. AIP typed tools
22. cited NL interface

### Vision
23. Vision event schema/simulator
24. incident review UI
25. edge service with event-only person/occupancy detection
26. retention/evidence controls

### Hardening
27. security suite
28. load testing
29. accessibility
30. backup/restore
31. deployment docs
32. seeded production-grade demo

This order produces an end-to-end usable system early while preserving the full architecture.

---

## 21. Definition of “built”

Orynt is not “built” because screens exist.

A credible v1 requires:

- fresh data can enter reliably
- users see only what they are allowed to see
- important exceptions are detected reproducibly
- every insight can be traced to evidence
- an authorized user can take action
- action ownership/follow-up is explicit
- outcomes can be measured
- the system records a defensible audit trail
- the product remains useful if AI is disabled
- synthetic end-to-end tests pass
- no major security/tenant-isolation failures

That is the bar the implementation should target.