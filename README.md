# CourseAI -- Education Course Planning Support Tool

A Gemini-powered curriculum planning workspace for university faculty and department leadership. Professors get a single-course view with enrollment data, student feedback, and prerequisite mapping. Department chairs get a multi-program dashboard with curriculum gap detection, faculty load balancing, and accreditation compliance monitoring.

Built on [Convex](https://convex.dev) for reactive backend queries, with Gemini as the reasoning engine and Google Search for grounded external context.

## Architecture

```
src/app/page.tsx         Landing + user session picker (4 personas)
src/app/course/          Professor workspace: course briefing, proposals, records
src/app/department/      Department chair workspace: program health, gaps, review queue
src/app/chat/            Shared faculty channel with assistant rail

convex/schema.ts         8 domain tables + 7 generic infrastructure tables
convex/agent.ts          Plan-execute-synthesize agent with 10 education tools
convex/briefs.ts         Evidence assembly: courses, policies, enrollment, faculty, reviews
convex/seed.ts           25 courses, 50 enrollment records, 8 faculty, 12 policies, 15 reviews

data/golden_dataset.json 20 scenario-based test cases
```

## Two Personas

| Persona | Route | Focus |
|---------|-------|-------|
| **Professor** | `/course` | Single-program view: learning objectives, enrollment trends, student feedback, prerequisite mapping |
| **Department Chair** | `/department` | Multi-program view: curriculum gaps, faculty load, accreditation compliance, program health |

Additional roles: **Academic Advisor** (cross-program access) for prerequisite overrides and transfer credit evaluation.

## Domain Tables

| Table | Purpose |
|-------|---------|
| `programs` | BS/MS/PhD/certificate programs with accreditation status |
| `courses` | Course catalog with prerequisites, learning outcomes, status |
| `enrollment` | Per-semester enrollment, completion rates, grades, drop rates |
| `faculty` | Teaching load, expertise, rank, overload tracking |
| `curricularPolicies` | ABET criteria, credit hour rules, prerequisite chains, enrollment minimums |
| `reviews` | Student evaluations, peer reviews, accreditation audits, curriculum gap analyses |

## Agent Tools

1. `search_courses` -- Find courses by program, type, status, keyword
2. `search_curricular_policies` -- Policy lookup by ID or keyword
3. `get_enrollment_data` -- Enrollment trends for a course across semesters
4. `get_faculty_summary` -- Faculty load and expertise for a program
5. `get_course_summary` -- Program-level course metrics and health
6. `get_program_overview` -- Department-wide summary across programs
7. `search_reviews` -- Student evals, peer reviews, accreditation audits
8. `create_action_item` -- Track follow-up work with owner and deadline
9. `list_action_items` -- List existing tracked items
10. `search_web` -- Google Search for external context (industry trends, accreditation updates)

## Quality Checks (Runtime)

Every agent response is evaluated against 8 checks:
- Course reference grounding
- Policy reference grounding
- Actionable recommendations
- Enrollment context (when relevant)
- Prerequisite chain context (when relevant)
- Priority ordering (for multi-course questions)
- Reference integrity (no hallucinated IDs)
- External source backing (when external facts needed)

## Synthetic Data

- **4 users**: 2 professors, 1 department chair, 1 academic advisor
- **6 programs**: CS BS, Data Science MS, AI Certificate, Software Engineering BS (x2 campuses)
- **25 courses**: Mix of core, elective, capstone with realistic CS/DS course codes
- **50 enrollment records**: Across Fall 2025, Spring 2026, Fall 2026
- **8 faculty**: Varied expertise, ranks, and load levels (1 overloaded)
- **12 curricular policies**: ABET, credit hours, prerequisites, enrollment, reviews, online standards
- **15 reviews**: Student evals, peer reviews, accreditation audits, curriculum gap analyses
- **3 action items**: Prerequisite bottleneck, stale curriculum, faculty overload

## Getting Started

```bash
npm install
# Configure Convex: npx convex dev
# Set GEMINI_API_KEY in Convex environment
npm run seed        # Seed synthetic data
npm run dev         # Start dev server
```

## Tradeoffs

| Decision | Rationale |
|----------|-----------|
| Gemini over OpenAI | Native Google Search grounding eliminates RAG pipeline for external facts |
| Convex over Postgres | Reactive queries give real-time UI updates without polling; schema enforcement at the edge |
| Deterministic fallback | High-confidence single-course questions get policy-backed answers without LLM synthesis latency |
| Plan-execute-synthesize | Explicit planning step lets the agent reason about tool ordering before execution |
| Runtime quality checks | Catch missing references and hallucinated IDs before the answer reaches the user |

## Golden Evaluation

20 test scenarios in `data/golden_dataset.json` covering:
- Prerequisite chain queries and bottleneck detection
- Curriculum gap identification and proposed course evaluation
- Enrollment trend analysis and capacity planning
- Accreditation compliance and ABET outcome assessment
- Faculty load balancing and overload resolution
- Student feedback synthesis and course improvement
- Program comparison across campuses
- Transfer credit evaluation and policy interpretation
