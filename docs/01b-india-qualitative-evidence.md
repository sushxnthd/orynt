# India-specific qualitative evidence for Orynt

Updated: 2026-10-09

This note supplements `01-product-research.md` with evidence closer to Orynt's likely first market.

## 1. Digital tools can reduce paperwork — and still create platform overload

A 2026 mixed-methods study of teacher technostress reports interview themes including repetitive administrative tasks, use of multiple applications/platforms to complete one task, time spent learning new systems, irrelevant information overload and system unreliability.

This supports an important Orynt design constraint: **digitization is not automatically simplification**. A new product that adds one more login can make the problem worse even if each feature is individually useful.

Source: *Understanding teachers’ technostress creators due to IT use at work: a mixed-methods study* (Frontiers in Psychology, 2026)  
https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1887403/full

## 2. School leaders need usable data, not merely collected data

A September 2026 qualitative study of primary-school administrators found that administrators understood data-driven decision-making as evidence-informed and continuous, but identified barriers including workload/time constraints, limited analytical knowledge, weak technological infrastructure, missing data and outdated data. Participants called for better digital data systems and faster access to relevant data.

This maps closely to Orynt's proposed role: Orynt should not merely warehouse more data. It should improve data quality, retrieval, interpretation, collaboration and follow-through.

Source: *School administrators’ perspectives on data-driven decision-making processes* (Frontiers in Education, 2026)  
https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1929590/full

## 3. India-specific reporting shows application/data-entry burden

A December 2025 Careers360 investigation described Indian government-school teachers switching among UDISE Plus, Student Attendance Tracking System and other monitoring portals, with named teachers reporting that same-day entry requirements can extend work beyond school hours.

Source: *‘Teaching through logins’: School teachers waste time on ‘data-entry’ as apps become integral to monitoring*  
https://news.careers360.com/school-teacher-data-entry-burden-udiseplus-midday-meal-diksha-attendance-nishtha-ullas-portal-apps-login-monitoring-education/

A separate 2025 Hindustan Times report described teachers in Uttar Pradesh navigating many different applications for attendance, meals, reports, assessments and other required monitoring tasks.

Source: *Tech overload hits UP govt primary, upper primary school teachers*  
https://www.hindustantimes.com/cities/others/tech-overload-hits-up-govt-primary-upper-primary-school-teachers-101760203660828.html

These reports should be treated as qualitative evidence, not national prevalence estimates.

## 4. Interview-based Indian research supports context-specific design

An ACM study on technology integration in Indian classrooms surveyed 1,355 teachers and recruited a diverse subset for semi-structured interviews across government/private schools, boards, subjects and teaching experience. The interview design explicitly examined workload and work practices, reinforcing the need to study Orynt in the real institutional context rather than assuming that a globally successful education product transfers directly to Indian schools.

Source: *Examining Factors Influencing Technology Integration in Indian Classrooms: A Teachers’ Perspective*  
https://doi.org/10.1145/3677325

A 2026 NCERT journal study used semi-structured interviews with 20 Delhi school teachers and reported implementation constraints including training, connectivity/resources, rigid curricula and exam-oriented contexts.

Source: *Navigating the SAMR Model: Challenges and Perspectives of Delhi School Teachers*  
https://journals.ncert.gov.in/IJET/article/view/1775

## 5. Product consequences

The evidence changes Orynt's design in concrete ways:

1. **Read-first integration:** derive value from existing records before asking teachers to enter anything new.
2. **Exception-first UI:** reduce information volume rather than creating another feed.
3. **Low-click workflows:** intervention/action logging should be significantly faster than a spreadsheet/WhatsApp workaround.
4. **Data quality as a product surface:** stale, missing and conflicting data must be visible.
5. **Human interpretation:** leaders need context and collaboration around evidence; Orynt should not substitute a risk score for professional judgment.
6. **Offline/weak-network tolerance where appropriate:** imports and teacher workflows should not assume perfect infrastructure.
7. **Local workflow extensibility:** CBSE/private-school workflows, government reporting contexts and school-specific processes differ materially.
8. **Training burden budget:** each feature must justify the user effort required to learn it.

## 6. Additional interview hypotheses for India

Add these to the real interview protocol:

- How many government/board portals must staff update separately from the school's own ERP?
- Which reports require the same data in different formats?
- Does the school's ERP export in a form that can be reliably mapped without vendor cooperation?
- How much decision-making happens in WhatsApp groups even when an ERP exists?
- Does leadership trust a centrally generated dashboard if teachers believe source data is incomplete?
- Which workflows must continue during weak internet connectivity?
- Is an overlay product easier to procure than an ERP replacement?
- Which role owns data quality when multiple departments edit the same student record?

## 7. Current interpretation

The India-specific evidence strengthens the **integration + action-layer thesis** and weakens a “replace every school app immediately” strategy.

The problem to solve is not insufficient digitization. In many environments, it is **fragmented digitization without a coherent operating model**.