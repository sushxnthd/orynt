# Orynt Product Research

Status: **working evidence base**  
Updated: 2026-10-09

## 1. Research question

The question is not whether schools need another ERP. They already have many.

The question is:

> **Is there an important, defensible product gap between systems that record school activity and a system that helps a school understand, coordinate, act on, and learn from that activity?**

The evidence reviewed so far supports a qualified **yes**. The strongest version of Orynt is not “a better database for schools.” It is an **operating intelligence and action layer** across academic, operational, student-support, and safety data.

This document deliberately separates evidence from hypotheses. We should not claim product-market fit before interviewing real stakeholders and testing workflows in a live or representative school context.

---

## 2. What the evidence says

### 2.1 Schools operate at enormous scale

India’s UDISE+ 2024-25 report records approximately:

- **1.47 million schools**
- **246.9 million enrolled students**
- **10.1 million teachers**

The same report explicitly frames student-level tracking of enrolment, attendance and learning levels as important to universal participation and early identification of dropout/re-entry needs.

**Implication:** Orynt is addressing a very large institutional system in which even small reductions in administrative friction or small improvements in intervention quality can compound materially.

Source: Ministry of Education, UDISE+ 2024-25  
https://www.education.gov.in/sites/upload_files/mhrd/files/statistics-new/UDISE%2BReport%202024-25%20-%20NEP%20Structure.pdf

### 2.2 Administrative work is a real teacher burden

OECD TALIS 2024 reports that about **52% of teachers** across participating education systems identify general administrative work as a source of work-related stress. Teaching is only part of total working time; teachers also spend substantial time preparing, marking, communicating, and handling administrative work.

This does not prove a software product will fix teacher workload. It does establish that administrative friction is not a trivial problem.

**Orynt product implication:** every teacher-facing workflow should be judged by whether it reduces total effort. If Orynt merely adds another dashboard or another place to enter data, it fails.

Source: OECD, Results from TALIS 2024  
https://www.oecd.org/en/publications/results-from-talis-2024_90df6235-en/full-report/the-demands-of-teaching_0e941e2f.html

### 2.3 Fragmentation is a recurring qualitative pain

Recent practitioner discussions describe schools using many overlapping tools for attendance, grades, IEPs, data warehousing, learning paths, LMS, email, lesson plans and communication. Other K-12 IT discussions repeatedly complain about SIS products requiring plug-ins, duplicate/manual synchronization, confusing workflows, stale interfaces and substantial staffing just to keep systems coherent.

These are anecdotes, not representative survey estimates, but they are useful for generating interview hypotheses.

Examples:

- “too many apps” discussion, r/Teachers, Aug 2026  
  https://www.reddit.com/r/Teachers/comments/1vxfwad/anyone_elses_school_use_way_too_many_apps/
- SIS integration and plug-in complaints, r/k12sysadmin  
  https://www.reddit.com/r/k12sysadmin/comments/182bh4o/
- SIS replacement discussion describing missing integrations and separate products for dismissal / conferences  
  https://www.reddit.com/r/k12sysadmin/comments/1c1l1uu/
- teacher/IT burden caused by lack of roster synchronization  
  https://www.reddit.com/r/sysadmin/comments/io9fj3/

**Orynt product implication:** a core value proposition is *not* “we have more modules.” It is **we make the systems and workflows you already have behave like one coherent operating model**.

### 2.4 The Indian ERP market already covers transactions well

Major Indian school platforms already cover combinations of:

- admissions
- fees and accounting
- attendance
- examinations/report cards
- timetables
- HR/payroll
- transport/GPS
- parent apps
- communication
- library/hostel/inventory
- compliance reports

Examples:

- Entab CampusCare / Entab One  
  https://www.entab.in/school-erp-software.html  
  https://www.entab.in/entab-one.html
- Teachmint School ERP / School Management  
  https://www.teachmint.com/en-us/features/school-erp  
  https://www.teachmint.com/en-us/features/school-management-software
- Fedena  
  https://fedena.com/feature-tour

**Conclusion:** building another broad CRUD ERP as the initial wedge is strategically weak. Incumbents have years of domain depth, integrations, implementation teams, and institutional switching costs.

### 2.5 A separate “student success / intervention” category has validated demand

Panorama Education is an important comparator because it explicitly differentiates an SIS—which stores student information—from an intervention platform that combines academics, attendance, behavior and other signals to identify needs, coordinate supports and monitor interventions.

Panorama says it serves **2,000+ districts and 15M students** and integrates data from 200+ systems. Its current product includes natural-language search, student grouping, intervention management, attendance forecasting and AI-assisted workflows.

Sources:  
https://www.panoramaed.com/student-success-with-panorama  
https://www.panoramaed.com/solutions/mtss-software-platform

**Implication:** the market has already validated that institutions will buy a layer above the SIS when that layer turns data into intervention workflows.

### 2.6 But dashboards alone are not enough

The literature is important here because the product must not confuse visibility with effectiveness.

A 2024 K-12 learning-analytics review found potential benefits such as individualized learning and better assessment, but also noted limited evidence, privacy concerns, and risks of misuse or misinterpretation. A 2025 meta-analysis across 34 empirical studies found learning-analytics-based interventions had a moderate overall positive effect on learning outcomes, while effects varied by context, subject, learning stage, environment, intervention type and diagnostic approach.

Sources:

- Paolucci et al. (2024), *A review of learning analytics opportunities and challenges for K-12 education*  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10881331/
- Liu, Wang & Xu (2025), *The Effectiveness of Learning Analytics-Based Interventions in Enhancing Students’ Learning Effect*  
  https://journals.sagepub.com/doi/10.1177/21582440251336707
- Mohseni et al. (2024), *Visual Learning Analytics for Educational Interventions in Primary and Secondary Schools*  
  https://consensus.app/papers/visual-learning-analytics-for-educational-interventions-mohseni-masiello/4d8199ff67cd5845b465c69651a53550/

**Orynt product implication:** the core loop is not `data → dashboard`. It is:

```text
signal → explanation → authorized action → intervention → follow-up evidence → measured outcome
```

If an Orynt feature cannot connect to an action or decision, its priority should be questioned.

### 2.7 Human-centered design and trust are architecture requirements

A 2023 systematic review of human-centered learning analytics / AI in education found limited involvement of actual end users in system design and emphasized balancing automation with human control, safety, reliability and trustworthiness.

Privacy-focused systematic reviews similarly show that privacy risks appear throughout the learning-analytics lifecycle rather than at one isolated consent screen.

Sources:

- Alfredo et al. (2023), *Human-Centred Learning Analytics and AI in Education: a Systematic Literature Review*  
  https://consensus.app/papers/humancentred-learning-analytics-and-ai-in-education-a-alfredo-echeverría/2a94c165baa952a08d0d4f0a4126d6ea/
- Liu & Khalil (2023), *Understanding privacy and data protection issues in learning analytics using a systematic review*  
  https://consensus.app/papers/understanding-privacy-and-data-protection-issues-in-liu-khalil/5cb5a126f5c4507f84ebda07f7faa24e/

**Orynt product implication:** explainability, provenance, access control, user override, auditability and stakeholder testing must exist in the underlying platform, not as later compliance polish.

---

## 3. CCTV / Orynt Vision research

### 3.1 CCTV is already becoming operational infrastructure in CBSE schools

In July 2025 CBSE amended its affiliation requirements to state that schools should install high-resolution CCTV with audio-visual capability at entry/exit points, lobbies, corridors, staircases, classrooms, labs, library, canteen, store room, playground and other common areas except toilets/washrooms, with at least 15 days of footage storage.

Source: CBSE amendment to Chapter 4 of Affiliation Bye Laws  
https://www.cbse.gov.in/cbsenew/documents/Amendments_Chapter_4_21072025.pdf

This creates a legitimate school-safety / operations integration opportunity.

### 3.2 Orynt Vision must not become biometric surveillance

India’s DPDP Act and notified 2025 Rules create specific obligations for children’s data. Educational institutions receive limited exemptions for processing connected to educational activities or children’s safety; that should not be interpreted as permission for unconstrained behavioral profiling.

Official DPDP Rules page:  
https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa

PIB summary on student data and education platforms:  
https://www.pib.gov.in/PressReleasePage.aspx?PRID=2202901

**Orynt Vision principle:** process camera streams primarily into *events* rather than identities.

Appropriate initial events include:

- unexpected occupancy after hours
- crowd density / congestion
- restricted-zone entry
- perimeter/gate event
- camera outage or tampering
- possible fall / person-down event for human verification
- evacuation occupancy accounting by zone
- queue build-up
- room utilization

Explicitly out of scope for the default product:

- persistent face recognition of students
- continuous individual location histories
- emotion inference
- “attention” or “engagement” scoring from faces
- automated disciplinary decisions
- behavioral risk labels derived primarily from CCTV

The technical system should make those boundaries enforceable, not merely documented.

---

## 4. Competitive landscape

### Category A — Indian school ERP/SIS

**Strength:** operational breadth and local workflow knowledge.  
**Weakness Orynt can target:** these systems are primarily systems of record / transaction and reporting, not a flexible cross-system ontology + action + evidence platform.

Representative products: Entab, Teachmint, Fedena, MyClassboard, Edunext.

### Category B — global SIS

**Strength:** mature student records, scheduling, compliance, grades, integrations.  
**Weakness:** often complex, expensive to customize, and institutionally difficult to replace.

Representative products: PowerSchool, Infinite Campus, Skyward, Blackbaud.

### Category C — student success / MTSS / attendance intelligence

**Strength:** proves that an intelligence layer above the SIS has real institutional value.  
**Weakness Orynt can target:** narrower focus on student support rather than the full operational graph of the school.

Representative products: Panorama Education, SchoolStatus.

### Category D — point solutions

Examples: parent communication, transport, LMS, assessment, visitor management, cameras, access control.

**Orynt opportunity:** unify the signals and workflows without demanding immediate rip-and-replace.

---

## 5. Orynt’s proposed category

### **School Operating Intelligence**

Definition:

> A permission-aware software layer that models the school as a connected operational system, unifies signals from existing tools, helps authorized people understand causes and risks, coordinates actions, and measures whether those actions improve outcomes.

This category is intentionally distinct from:

- ERP: records/executes administrative transactions
- LMS: manages teaching content and assignments
- SIS: stores core student records
- BI: summarizes data
- student-success tool: coordinates primarily student interventions
- CCTV VMS: records and searches video

Orynt should be able to connect all of them.

---

## 6. Product wedge

A full long-term Orynt can be enormous. The initial wedge must be narrower and provably valuable.

### Recommended first wedge: **School Command + Student Support Action Layer**

Minimum cross-system inputs:

- student roster
- classes/sections
- attendance
- assessments/marks
- timetable
- teacher/course mapping
- intervention notes

Outputs:

1. principal/coordinator command view
2. student 360
3. cohort/topic drill-down
4. natural-language authorized search
5. transparent early-warning flags
6. intervention creation + ownership
7. follow-up reminders
8. outcome/effect tracking
9. evidence/provenance trace for every signal

Why this wedge:

- avoids replacing fee/payroll/admission infrastructure
- uses data most schools already have
- can demonstrate value within an academic cycle
- creates the ontology needed for every future module
- builds the action/evidence loop that differentiates Orynt

### Second wedge: **Orynt Vision safety events**

Add once governance, access control, retention, audit and on-prem/edge processing are reliable.

---

## 7. Falsifiable product hypotheses

We should attempt to disprove these in interviews and pilots.

### H1 — Fragmentation
At least 70% of target schools use three or more distinct systems/spreadsheets for core academic/operational workflows and experience material reconciliation or duplicate-entry work.

**Failure condition:** most schools already have one trusted platform and do not perceive fragmentation as costly.

### H2 — Insight-to-action gap
School leaders can access reports but cannot easily answer multi-source causal/operational questions or track whether interventions worked.

**Failure condition:** current ERP/BI tools already answer these questions quickly and reliably.

### H3 — Intervention accountability
Coordinators currently track student interventions through informal notes, WhatsApp, spreadsheets or disconnected modules, making ownership and follow-up inconsistent.

**Failure condition:** interventions are already standardized, measurable and easy to audit.

### H4 — Integration beats replacement
Schools are substantially more willing to pilot Orynt when it integrates with their current ERP rather than requiring migration.

**Failure condition:** buyers actively want to replace their ERP and prefer a single vendor immediately.

### H5 — Teacher value must be passive-first
Teachers resist systems that require duplicate data entry but adopt systems that give useful context from data they already generate.

**Failure condition:** teachers are comfortable with additional structured documentation in exchange for analytics.

### H6 — Safety intelligence
Schools with existing CCTV experience meaningful monitoring/search burden and value event-based alerts and incident workflows.

**Failure condition:** CCTV is primarily compliance theater and schools have neither operational capacity nor willingness to act on generated events.

### H7 — Trust boundary
Schools, parents and students accept analytics materially more readily when risk signals are explainable and no biometric identity tracking is used.

**Failure condition:** explainability and privacy architecture do not affect adoption or objections.

---

## 8. What would make Orynt crucial rather than merely useful?

Orynt becomes crucial only if it owns workflows that are expensive to perform without it.

The strongest candidates are:

1. **Daily exception management** — “what requires action today?”
2. **Intervention coordination** — assign, follow up, measure.
3. **Cross-source root-cause investigation** — attendance + assessment + timetable + intervention + operational context.
4. **Audit / evidence reconstruction** — who knew what, from which source, what action was taken, and what happened afterward.
5. **School-wide operational search** — permission-aware answers without manually joining spreadsheets/reports.
6. **Safety event triage** — turn continuous CCTV streams into a manageable queue of human-verifiable events.

A product that only gives prettier dashboards is not crucial.

---

## 9. Research required before declaring the product definition frozen

### Real stakeholder interviews

Minimum target before claiming qualitative saturation:

- 6 principals / school heads
- 5 coordinators / heads of department
- 8 teachers
- 4 school IT / ERP administrators
- 4 counselors / student-support staff where applicable
- 4 parents
- 6 students (with appropriate consent/safeguards)
- 3 school owners / management representatives for private-school buying behavior

We should bias toward interviewing people who use current ERP/SIS products heavily rather than only technology enthusiasts.

### Workflow observation

Ask participants to **show**, not merely describe:

- attendance exception handling
- marks upload and result analysis
- identifying a struggling student
- intervention assignment/follow-up
- timetable substitution
- parent escalation
- incident/CCTV retrieval workflow
- management review meeting preparation

### Artifact collection

With confidential data removed, collect examples of:

- spreadsheets/templates
- report formats
- screenshots of ERP workflows
- meeting checklists
- intervention trackers
- attendance reports
- assessment analysis sheets
- incident forms

The ontology should be derived partly from these real artifacts.

---

## 10. Current decision

**Proceed with Orynt.**

But build the first production architecture around this narrower thesis:

> **Orynt connects the systems a school already uses, models the school as a permission-aware operational graph, surfaces important exceptions and explanations, turns them into accountable actions, and measures what worked.**

That thesis is materially stronger and more defensible than “Palantir for schools” or “AI school ERP.”
