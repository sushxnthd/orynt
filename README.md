# Orynt

**The operating intelligence layer for schools.**

Orynt is a school operations and student-success platform designed around a simple premise: schools already generate large amounts of data, but that data is fragmented across SIS/ERP systems, spreadsheets, LMS tools, attendance systems, assessments, transport systems, communications, and CCTV. Most software records what happened. Orynt is designed to connect those signals, explain what is happening, coordinate what should happen next, and measure whether the action worked.

Orynt is not intended to be a surveillance product or a black-box student scoring system. Human decision-makers stay in control. Every material recommendation must expose its evidence, provenance, confidence, and authorized data sources.

## Product thesis

The initial wedge is **not** “replace the school ERP.” Existing school ERPs are broad, entrenched, and optimized around transactions such as admissions, fees, attendance, examinations, payroll, transport, and parent communication.

Orynt starts one layer above them:

```text
Existing systems
ERP · SIS · LMS · Sheets · Assessments · Attendance · Transport · CCTV
        ↓
Orynt Connect
        ↓
Orynt School Ontology
        ↓
Intelligence · Search · Forecasting · Root-cause analysis
        ↓
Actions · Interventions · Workflows · Approvals · Incidents
        ↓
Measured outcomes + audit trail
```

The long-term system can absorb transactional modules where doing so produces a materially better workflow, but the first requirement is interoperability rather than forced replacement.

## Product surfaces

- **Orynt Core** — school ontology, identity resolution, permissions, lineage, audit.
- **Orynt Connect** — CSV/XLSX imports plus SIS/LMS/ERP/API connectors.
- **Orynt Command** — principal and management command center.
- **Orynt Student 360** — authorized longitudinal student context.
- **Orynt Academics** — assessments, concepts, mastery, curriculum and cohort analytics.
- **Orynt Actions** — referrals, interventions, tasks, approvals and outcome tracking.
- **Orynt Vision** — privacy-preserving school-safety and operations events from CCTV.
- **Orynt AIP** — permission-aware natural-language analysis and tool execution.
- **Orynt Forecast** — calibrated early-warning and scenario models.
- **Orynt Studio** — configurable ontology objects, metrics, workflows and views.
- **Orynt Governance** — consent, retention, access policies, data minimization and audit.

## Non-negotiable principles

1. **Action over dashboards.** Every important insight should lead to a responsible next action.
2. **Evidence over opaque scores.** No unexplained risk labels.
3. **Interoperability before replacement.** Integrate with the school’s current stack.
4. **Human authority.** AI drafts and recommends; authorized staff decide.
5. **Privacy by architecture.** Minimize collection, scope access, retain only what is required.
6. **No biometric student tracking as a default capability.** Orynt Vision is event- and safety-oriented, not persistent identity surveillance.
7. **Measure interventions.** The platform should learn which actions work in which contexts instead of merely predicting problems.
8. **Synthetic-first development.** The repository must be fully demoable without real student data.

## Research and specifications

- [`docs/01-product-research.md`](docs/01-product-research.md) — evidence, market/competitor analysis, legal constraints, falsifiable product hypotheses.
- [`docs/02-product-definition.md`](docs/02-product-definition.md) — users, jobs, ontology, product boundaries and module definition.
- [`docs/03-system-blueprint.md`](docs/03-system-blueprint.md) — build architecture, data model, AI/ML, Vision, security and deployment strategy.
- [`docs/04-interview-research.md`](docs/04-interview-research.md) — interview plan, scripts, scoring and decision rules.

## Current phase

**Phase 0: evidence-driven definition.** The first implementation milestone begins once the product hypotheses and architecture are frozen enough to avoid building a generic school ERP.