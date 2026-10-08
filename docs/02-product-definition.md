# Orynt Product Definition

Status: **v0.1 — research-backed working definition**  
Updated: 2026-10-09

## 1. One-line definition

**Orynt is the operating intelligence layer for schools: it connects school data, models how the institution actually works, identifies what needs attention, coordinates authorized actions, and measures whether those actions worked.**

---

## 2. What Orynt is not

Orynt is not primarily:

- another fee-management ERP
- another LMS
- another report-card app
- another dashboard layer
- a student surveillance system
- a black-box “risk score” engine
- an AI chatbot placed on top of disconnected school data

Those categories may appear as capabilities or integrations, but they do not define the product.

---

## 3. Core product loop

```text
OBSERVE
School systems generate events and records
        ↓
CONNECT
Normalize, validate and resolve identities
        ↓
MODEL
Place records into the school ontology
        ↓
UNDERSTAND
Metrics, search, anomaly detection, explanation, forecasts
        ↓
DECIDE
Authorized human reviews evidence and recommendation
        ↓
ACT
Intervention / task / approval / communication / incident workflow
        ↓
MEASURE
Did the action happen? Did the target outcome change?
        ↓
LEARN
Update playbooks, thresholds and local evidence
```

The product is successful when this loop is faster, more reliable, more explainable and less labor-intensive than the school’s current process.

---

## 4. Primary users

### Principal / school head

Jobs:

- know what requires attention today
- identify deteriorating academic / attendance / operational patterns
- compare cohorts fairly
- understand whether interventions are working
- inspect evidence behind claims
- assign responsibility and monitor execution
- prepare management reviews without assembling multiple reports manually

Default home surface: **Orynt Command**

### Academic coordinator / HOD

Jobs:

- identify weak topics/cohorts
- distinguish assessment difficulty from teaching/learning gaps
- coordinate remediation
- track syllabus and assessment readiness
- compare intervention effectiveness
- support teachers without forcing duplicate reporting

Default home surface: **Academics + Actions**

### Teacher

Jobs:

- know which students need attention and why
- see concept-level patterns after assessments
- record a useful intervention with minimal work
- receive follow-up reminders
- see whether the action helped
- avoid entering the same data in multiple places

Default home surface: **Today + Class View**

### Counselor / student-support staff

Jobs:

- receive appropriate referrals
- coordinate support plans
- view only authorized context
- document contact/interventions
- monitor outcomes and follow-up

Default home surface: **Support Queue**

### IT / data administrator

Jobs:

- connect sources
- resolve schema/identity issues
- monitor data freshness and quality
- define access policies
- investigate sync failures
- prove lineage/audit history

Default home surface: **Orynt Connect + Governance**

### School management / owner

Jobs:

- compare schools/branches
- monitor high-level academic, operational and safety indicators
- evaluate program effectiveness
- avoid micromanaging individual students unless authorized and necessary

Default home surface: **Portfolio Command**

### Student

Jobs:

- understand own progress
- see upcoming actions/deadlines
- view transparent recommendations
- inspect what data is being used where policy permits
- contribute context/feedback

Default home surface: **My Progress**

### Parent / guardian

Jobs:

- see relevant progress and attendance
- understand important alerts and interventions
- communicate through structured channels
- avoid being exposed to internal staff analytics or unrelated student data

Default home surface: **Family View**

---

## 5. The Orynt ontology

Orynt should represent the school as real objects and relationships rather than a collection of isolated dashboard tables.

### People and organizations

- SchoolGroup
- School
- Campus
- Department
- Student
- Guardian
- Staff
- Teacher
- Counselor
- Administrator
- Vendor / ServiceProvider (restricted)

### Academic structure

- AcademicYear
- Term
- Grade
- Section
- Course
- Subject
- Unit
- Topic
- Concept
- Competency
- LearningObjective
- PrerequisiteRelation

### Teaching and learning

- ClassMeeting
- LessonPlan
- Assignment
- Resource
- Assessment
- AssessmentItem
- Attempt
- Result
- Rubric
- MasteryEstimate
- Feedback

### Student-support and action

- Signal
- Concern
- Referral
- Intervention
- InterventionPlan
- Task
- FollowUp
- Communication
- Meeting
- OutcomeMeasure
- Playbook

### Attendance and engagement

- AttendanceEvent
- AbsenceEpisode
- LeaveRequest
- LateArrival
- ParticipationSignal

### Operations

- Timetable
- Room
- Facility
- TransportRoute
- Vehicle
- Stop
- InventoryItem
- Device
- Event
- Visitor
- Incident

### Safety / Vision

- Camera
- Zone
- VisionEvent
- EvidenceClipReference
- SafetyAlert
- IncidentReview

VisionEvent is event-centric. Student identity should not be required for most event classes.

### Governance

- SourceSystem
- SourceRecord
- ImportJob
- DataQualityIssue
- Policy
- Role
- Permission
- ConsentRecord
- RetentionRule
- AccessLog
- AuditEvent
- ModelVersion
- Recommendation
- Explanation

---

## 6. Relationship examples

```text
Student --enrolled_in--> Section
Teacher --teaches--> Course
Course --covers--> Concept
Concept --prerequisite_of--> Concept
AssessmentItem --measures--> Concept
Student --attempted--> Assessment
Attempt --produced--> Result
AbsenceEpisode --overlaps--> ClassMeeting
Signal --concerns--> Student
Signal --supported_by--> SourceRecord
Referral --created_from--> Signal
Intervention --targets--> Concern
Intervention --owned_by--> Staff
Intervention --measured_by--> OutcomeMeasure
VisionEvent --occurred_in--> Zone
VisionEvent --may_trigger--> SafetyAlert
Recommendation --derived_from--> Signal
Recommendation --generated_by--> ModelVersion
Action --authorized_by--> Staff
```

The ontology should be extensible rather than trying to predict every school object in v1.

---

## 7. Product modules

### Orynt Core

Foundational platform:

- tenant/school model
- ontology service
- identity resolution
- authorization
- audit
- lineage
- event bus
- configuration

### Orynt Connect

Initial connectors:

- CSV
- XLSX
- Google Sheets export/import path
- generic REST
- generic SFTP/file drop
- OneRoster 1.2
- later Ed-Fi API compatibility

Connector principles:

- schema mapping is saved/reusable
- every record carries source/provenance
- imports are idempotent where possible
- data-quality errors are visible and actionable
- source systems retain ownership unless explicitly migrated

### Orynt Command

Principal / management command center.

Core question:

> What needs attention now, why, who owns it, and what changed after action?

Views:

- daily exceptions
- school health overview
- academic deterioration
- attendance risk
- unresolved interventions
- action backlog
- operational incidents
- safety events
- data freshness/quality warnings

### Orynt Student 360

Authorized longitudinal context:

- academic trajectory
- concept/competency evidence
- attendance
- interventions
- support history
- upcoming tasks
- contextual factors that the current role is permitted to see

No universal “student score.” Multiple transparent indicators are preferable.

### Orynt Academics

- assessment ingestion
- question-to-concept mapping
- difficulty / discrimination summaries where statistically justified
- cohort/topic heat maps
- prerequisite tracing
- misconception tagging
- curriculum coverage
- assessment readiness
- teacher/coordinator drill-down

### Orynt Actions

Object/action workflow engine.

Action types:

- create referral
- create intervention
- request review
- assign follow-up
- contact guardian
- schedule meeting
- mark action completed
- escalate
- record outcome
- resolve incident

Every action stores actor, authorization, timestamp, reason/context, relevant source evidence and state transition.

### Orynt Forecast

Models must be calibrated and decision-linked.

Initial candidates:

- attendance deterioration
- assessment readiness
- concept mastery uncertainty
- intervention follow-up priority
- timetable/syllabus completion risk

Rules:

- no model without a defined action pathway
- no hidden feature use
- no protected/sensitive attributes unless lawful, necessary and explicitly governed
- uncertainty shown
- local validation before high-impact use
- drift monitoring
- human override

### Orynt AIP

Permission-aware natural-language interface over Orynt.

Examples:

- “Why did 12C Chemistry fall after September?”
- “Which students need an academic intervention before the next unit test? Show evidence.”
- “Which attendance interventions actually improved attendance last term?”
- “What unresolved actions are blocking the Grade 10 board-readiness plan?”

AIP should retrieve authorized facts, execute structured tools and cite Orynt objects/source records. It should not answer sensitive questions from model memory.

### Orynt Vision

Safety and operations computer vision.

Initial event types:

- zone occupancy
- congestion
- after-hours person detected
- restricted-zone entry
- perimeter event
- possible fall/person-down
- camera offline/tampered
- queue threshold

Preferred architecture:

```text
Camera / NVR
   ↓
Edge gateway
   ↓
Detector / tracker with ephemeral track IDs
   ↓
Event policy engine
   ↓
Minimal event metadata
   ↓
Orynt VisionEvent
   ↓
Human verification / workflow
```

Face recognition is not part of the default architecture.

### Orynt Studio

Configuration for advanced customers/implementation teams:

- custom object types
- custom properties
- relationship definitions
- saved metrics
- rules
- workflow templates
- role-specific views
- alerts

### Orynt Governance

- role-based and attribute-based access
- purpose limitation
- consent / legal basis metadata
- retention controls
- audit search
- data export/deletion workflow where applicable
- model registry
- prompt/tool audit for AIP
- camera/event retention policies

---

## 8. Data standards strategy

Do not invent education schemas unnecessarily.

### OneRoster 1.2

Use for people, courses, classes/enrollments, gradebook and resource interchange where supported.

Spec: https://standards.1edtech.org/oneroster/specifications/standards/v1p2

### Ed-Fi Data Standard

Use as a major reference model for K-12 student, assessment, attendance, discipline and school data. Current v6.x is designed for 2026-27 / 2027-28 school years.

Docs: https://docs.ed-fi.org/reference/data-exchange/data-standard/

### Caliper / xAPI

Use selectively for event-level learning activity data rather than forcing them into core administrative records.

Caliper: https://www.1edtech.org/standards/caliper  
xAPI: https://github.com/adlnet/xAPI-Spec

### India-specific extension layer

Orynt must support local objects/fields required for CBSE/ICSE/state-board workflows, UDISE+/APAAR-related exports where lawful and applicable, local report-card structures, transport, fee/accounting integration and school-specific fields.

The ontology should preserve a clean common core plus tenant-specific extensions.

---

## 9. UX principles

1. **Exception-first** — default screens answer “what needs attention?”
2. **Progressive disclosure** — summary → reason → evidence → raw source.
3. **One-click action** — insights are adjacent to appropriate workflows.
4. **No dashboard graveyard** — remove metrics that do not drive decisions.
5. **Role-specific** — a teacher should not see a principal’s system-wide complexity.
6. **Source-visible** — users can inspect where a number came from.
7. **Time-aware** — every value has freshness and observation period.
8. **Uncertainty-aware** — forecasts show confidence, not fake precision.
9. **Accessible and mobile-capable** — school work happens away from desks.
10. **Fast enough for daily use** — common views should feel immediate.

---

## 10. Product success metrics

Do not use “number of dashboards viewed” as the primary measure.

### Operational

- time to answer common cross-system questions
- duplicate data-entry events avoided
- unresolved action backlog
- mean time from signal → first action
- mean time to close intervention loop
- percent of interventions with defined outcome measure
- report preparation time

### Academic / student-support

- attendance change after interventions
- targeted assessment improvement
- intervention completion/fidelity
- number of students whose concern is detected before existing threshold/process
- false-positive / false-negative rates for predictive signals

### Trust

- recommendation override rate
- percentage of model outputs with evidence viewed
- user-reported usefulness
- privacy/access incidents
- unauthorized access attempts blocked
- data-quality issues resolved

### Adoption

- weekly active staff by role
- percentage of actions completed inside Orynt
- connector freshness reliability
- number of source systems consolidated into Orynt view

---

## 11. Release boundary for first credible product

The first credible Orynt release does **not** need fees, payroll, admissions, hostel, library or every ERP module.

It does need:

- secure multi-tenant foundation
- realistic synthetic school
- users/roles/permissions
- CSV/XLSX ingestion
- ontology and source lineage
- students/classes/teachers/subjects/timetable
- attendance
- assessments/results/concepts
- Student 360
- Command dashboard
- cohort/topic analytics
- signal rules
- Actions/interventions
- follow-up/outcomes
- audit log
- natural-language query with citations to authorized Orynt objects
- connector/data-quality admin
- a minimal Vision event simulator + event review workflow (real camera support later)

If that loop is excellent, the platform already demonstrates the category.