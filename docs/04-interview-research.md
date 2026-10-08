# Orynt Interview Research Protocol

Status: **ready for real stakeholder interviews**  
Updated: 2026-10-09

## Purpose

The goal is not to ask people whether they “like Orynt.” The goal is to understand how schools currently make decisions, where information and responsibility break down, what they already pay to solve, and whether Orynt can own a workflow important enough to become infrastructure.

No interview should be reported as completed unless a real participant was actually interviewed. Public forum posts and published studies are useful desk research, but they are not substitutes for direct interviews.

---

## Research questions

1. Where does critical school information live today?
2. Which recurring decisions require staff to manually combine information from multiple sources?
3. Which processes create duplicate data entry or repeated follow-up?
4. Where do students “fall through the cracks” despite the school possessing relevant data?
5. How are interventions assigned, documented and measured?
6. What does school leadership review daily, weekly, monthly and before major exams?
7. What questions are difficult to answer with the current ERP/SIS?
8. How much does trust/explainability matter for predictive recommendations?
9. What would make a school reject an AI/data system even if it were accurate?
10. How are CCTV recordings currently monitored, retrieved and escalated?
11. Who owns the budget and who can veto deployment?
12. Would buyers prefer an overlay on the existing ERP or a replacement platform?

---

## Sampling plan

### Private school leadership
- 3 owners/management representatives
- 6 principals/heads
- 5 coordinators/HODs

### Daily operators
- 8 teachers across primary/secondary/senior secondary
- 4 ERP/IT/data administrators
- 4 counselors/welfare staff where present
- 2 examination coordinators
- 2 transport/safety/operations staff

### Affected stakeholders
- 4 parents
- 6 students, only under an appropriate consent/safeguard process

### Diversity criteria

Try to include:

- CBSE and at least one non-CBSE board
- single-campus and multi-campus schools
- schools already using a mature ERP and schools relying heavily on spreadsheets
- schools with >1,000 students and smaller schools
- at least two different Indian cities/states if possible

---

## Interview method

### Rule 1 — ask about the last real occurrence

Bad:
> Would an AI alert for weak students be useful?

Good:
> Think about the last student whose academic decline surprised the school. When did someone first notice? What information existed before that? Show me what you looked at.

### Rule 2 — ask them to show the workflow

Where permitted, observe the actual ERP/spreadsheet/report workflow. Screens and artifacts are more valuable than opinions.

### Rule 3 — quantify friction

Ask:

- how often does this happen?
- who is involved?
- how long does it take?
- how many systems are opened?
- how many times is information re-entered?
- what happens when nobody follows up?

### Rule 4 — separate user from buyer

Teachers may love something the principal will not fund. Principals may buy something teachers will avoid. Interview both.

### Rule 5 — do not pitch too early

Spend at least 70% of an interview on current behavior before showing a concept.

---

# Interview scripts

## A. Principal / school head — 40 minutes

### Context
1. What are you directly accountable for this academic year?
2. Which numbers or reports do you review every day? Every week? Before exams?
3. Which systems do you personally log into?

### Recent incident
4. Tell me about the last time a problem with a student, class or department was discovered later than you would have liked.
5. What was the first signal?
6. What other signals existed but were not connected?
7. Who had to investigate it?
8. How long until you understood what was happening?
9. What action followed?
10. How did you know whether that action worked?

### Information architecture
11. If I asked “Why has Grade 10B mathematics fallen over the last six weeks?”, how would you answer today?
12. Which reports/spreadsheets/people would you need?
13. What can your current ERP not answer?
14. Which reports do staff manually recreate outside the ERP?

### Decision/action loop
15. How are concerns assigned to someone?
16. How do you know a follow-up happened?
17. Where are interventions recorded?
18. Do you review intervention effectiveness systematically?

### Buying
19. Which school-software purchase has delivered the most value? Why?
20. Which has disappointed you? Why?
21. Who signs off on a new platform?
22. Would integrating with your existing ERP be materially easier than replacing it?
23. What would make you refuse a pilot?

### Concept test — only now
Show a one-minute Orynt concept: existing systems → ontology → exceptions → actions → measured outcomes.

24. Which part is immediately valuable?
25. Which part sounds unnecessary?
26. What would you need to see in a 30-day pilot to continue paying?

---

## B. Teacher — 30 minutes

1. Walk me through yesterday from first login to end of day. Which digital tools did you use?
2. Where do you record attendance, marks, homework, notes and parent communication?
3. What information do you enter more than once?
4. Tell me about the last student you became worried about academically.
5. What made you notice?
6. What data would have helped you notice earlier?
7. What did you do next?
8. Did anyone else know about or own the follow-up?
9. How do you analyze a test after marking it?
10. How do you identify whether a whole class misunderstood one concept?
11. What reports are required that you feel do not help you teach?
12. What would make you refuse to use another school app?
13. Would a system be useful if it required no extra data entry and only surfaced useful exceptions from data you already create?
14. What would make its recommendations trustworthy?

Observe if possible:
- attendance entry
- marks entry
- class performance review
- parent communication

---

## C. Coordinator / HOD — 35 minutes

1. What are the recurring academic reviews you run?
2. How do you compare sections and teachers without drawing unfair conclusions?
3. How do you identify whether a weak score came from a hard paper, weak prerequisite knowledge, absences, syllabus sequencing or instruction?
4. What data is unavailable at the moment you need it?
5. Show the last remediation plan you coordinated.
6. How were students selected?
7. How was responsibility assigned?
8. How was improvement measured?
9. Which parts happen on WhatsApp/spreadsheets rather than the official system?
10. What questions do you repeatedly ask IT/exam staff to answer for you?

---

## D. ERP / IT / data administrator — 40 minutes

1. List every major system that contains student or school operational data.
2. Which system is the source of truth for each object?
3. Which integrations are automated?
4. Which are CSV/manual?
5. Where do identity mismatches occur?
6. Which workflows break when a student changes section or joins mid-year?
7. What reports require SQL/manual joining/export work?
8. How much time is spent cleaning data?
9. What is the most dangerous permission/configuration problem?
10. What is your incident/audit process?
11. Would you support a read-first integration layer above current systems?
12. What API/export limitations would block it?
13. Which standards do your current systems support, if any (OneRoster, Ed-Fi, APIs)?

Artifact requests:
- anonymized import template
- entity/data dictionary
- role matrix
- sample integration map

---

## E. Counselor / support staff — 30 minutes

1. How does a student get referred to you?
2. What information arrives with the referral?
3. What do you have to collect again?
4. Who can see your notes?
5. How are follow-ups scheduled and tracked?
6. What information should teachers see, and what should remain restricted?
7. How do you measure whether a support action helped?
8. What would be harmful if an algorithm inferred it incorrectly?

This interview is critical for permission boundaries.

---

## F. Safety / CCTV / operations — 30 minutes

1. How many cameras are deployed and who monitors them?
2. Is anyone watching continuously or are recordings mainly reviewed after incidents?
3. Describe the last incident requiring footage retrieval.
4. How long did finding the relevant footage take?
5. How was the incident documented/escalated?
6. What events would justify an immediate alert?
7. Which events would produce unacceptable false alarms?
8. How long is footage retained?
9. Who has permission to view/export footage?
10. Would event metadata be more useful than continuous live monitoring?

Do **not** lead with face recognition.

---

## G. Parent — 20 minutes

1. Which school apps/channels do you currently use?
2. Which notifications are genuinely useful?
3. Which feel noisy?
4. Tell me about a time you learned too late about an attendance/academic issue.
5. What should the school proactively tell you?
6. What student data should *not* be used by an AI system?
7. How would CCTV analytics change your trust positively or negatively?
8. Would seeing the evidence behind a recommendation matter?

---

## H. Student — 20 minutes

Only conduct with appropriate safeguards/consent.

1. Which school systems do you interact with?
2. What data about yourself can you currently see?
3. When teachers say you are “weak” in something, do they usually explain why?
4. What kind of progress feedback is useful?
5. What would feel unfair or invasive in a school analytics system?
6. How would you feel if CCTV were used for anonymous safety events versus tracking your identity/location?
7. Should you be able to correct or contextualize certain data?

Do not ask students to disclose sensitive personal matters for product research.

---

# Interview coding framework

After each interview, code evidence into these categories:

| Code | Meaning |
|---|---|
| FRAG | system/data fragmentation |
| DUP | duplicate entry/reconciliation |
| LAT | information arrives too late |
| ACT | unclear action ownership |
| LOOP | no measurement of intervention outcome |
| TRUST | explainability/trust concern |
| PRIV | privacy/access concern |
| ERP | ERP feature/limitation |
| INT | integration requirement |
| VISION | CCTV/safety workflow |
| BUY | budget/buyer/procurement |
| MUST | indispensable workflow |
| NICE | nice-to-have only |
| WORKAROUND | spreadsheet/WhatsApp/manual workaround |

For every coded pain capture:

- actor
- trigger
- current workflow
- frequency
- time/cost
- consequence
- current workaround
- existing product used
- willingness to change

---

# Evidence score

Score each proposed workflow after interviews:

```text
Pain frequency       0–5
Pain severity        0–5
Current workaround   0–5 (5 = terrible/manual)
Buyer urgency        0–5
Data availability    0–5
Orynt advantage      0–5
Implementation ease  0–5
Trust acceptability  0–5
-------------------------
Maximum             40
```

Interpretation:

- **32–40:** core wedge
- **25–31:** strong module
- **18–24:** later / segment-specific
- **<18:** do not prioritize

---

# Falsification / kill criteria

Pause or materially reposition Orynt if interviews show most of the following:

1. school leaders already obtain cross-system answers quickly from their existing software;
2. intervention ownership/outcome tracking is already standardized and low-friction;
3. schools strongly prefer one transactional ERP and reject an intelligence overlay;
4. teachers would need substantial extra data entry for Orynt to work;
5. integrations are unavailable and manual uploads are unacceptable;
6. buyers do not value measurable intervention outcomes enough to fund them;
7. the product’s most compelling demand is generic ERP functionality already served well by incumbents.

A strong product definition should survive attempts to disprove it.

---

# Pilot design after interviews

The first pilot should not attempt a whole-school replacement.

### Inputs
- roster
- class/teacher mapping
- timetable
- attendance
- one term of assessment results
- concept mappings for 1–2 subjects

### Duration
4–8 weeks of active use is preferable to a one-day demo.

### Users
- principal/coordinator
- 2–4 teachers
- one admin/data owner

### Measured outcomes
- time to prepare weekly academic review
- time to identify target students
- time from signal to assigned action
- intervention completion rate
- amount of duplicate/manual data work
- user trust/usefulness rating
- false-alert rate

### Success condition
At least one workflow becomes sufficiently better that users do not want to return to the old process.
