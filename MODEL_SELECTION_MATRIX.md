# Rendorax Studio — Model Selection Matrix

## Purpose

This document is a companion reference to the **Model Selection Policy** section of `AI_TEAM_PROTOCOL.md`.

It profiles every model currently available for use on the Rendorax Studio project and defines which model should be selected for which task type. This document is descriptive guidance for choosing a model correctly. It does not authorize any implementation work, and it does not override the Golden Rule (`Inspect → Report → Approval → Implement → Test → Document`) or the Architecture Lock defined in `AI_TEAM_PROTOCOL.md`.

Auto Mode selection remains banned for the categories listed in the Model Selection Policy regardless of anything in this document.

---

## Available Models

- Composer 2.5 FAST
- Fable 5 HIGH
- Sonnet 5 HIGH
- Opus 4.6 HIGH
- Gemini 3.1 Pro
- Deepseek-v4 Pro

---

## Model Profiles

### Composer 2.5 FAST

1. **Strengths** — Very low latency, cheap to run in high volume, good at mechanical/pattern-based edits, strong for rapid iteration loops.
2. **Weaknesses** — Shallow reasoning depth, weaker at multi-file architectural reasoning, more prone to missing edge cases in complex logic.
3. **Best Use Cases** — Small isolated bug fixes, CSS/styling tweaks, copy changes, repetitive boilerplate edits, quick formatting passes.
4. **Unsafe Use Cases** — Database/schema changes, Supabase changes, R2 architecture, authentication, Admin HQ, Timeline Sharing, Operations Core, any multi-file refactor.
5. **Context Window Considerations** — Optimized for speed over breadth; do not rely on it to hold large multi-file context accurately across a long session.
6. **Architecture Analysis Suitability** — Low. Not appropriate for architecture decisions or root cause analysis.
7. **Database / Supabase Suitability** — Not suitable.
8. **Prisma Suitability** — Not suitable for schema authorship; acceptable only for trivial, pre-approved, single-line query edits.
9. **R2 Storage Suitability** — Not suitable.
10. **Next.js Suitability** — Suitable for small, isolated component/page edits only.
11. **Large Refactor Risk** — High risk if used for refactors. Avoid.
12. **Inspection Quality** — Low-to-moderate. Should not be used as the sole inspector for anything non-trivial.
13. **Implementation Quality** — Good for small, well-scoped, already-approved changes.

---

### Fable 5 HIGH

1. **Strengths** — Strong narrative/documentation writing, good at producing clear structured reports, solid general reasoning at "high" thinking setting.
2. **Weaknesses** — Less specialized for deep systems/infrastructure reasoning than a dedicated reasoning-flagship model; coding output can be less rigorous than a dedicated coding-flagship model.
3. **Best Use Cases** — Writing/structuring documentation, changelogs, reports, protocol documents, QA write-ups, communication-heavy deliverables.
4. **Unsafe Use Cases** — Sole authority on database/schema decisions, Supabase/R2 architecture, authentication flow, or production incident triage.
5. **Context Window Considerations** — Handles long documents well; good choice when the task is primarily about synthesizing and organizing large amounts of text/context into a document.
6. **Architecture Analysis Suitability** — Moderate. Useful as a secondary reviewer or for documenting an architecture decision already reasoned through by a stronger reasoning model.
7. **Database / Supabase Suitability** — Low. Use for documenting Supabase decisions, not making them.
8. **Prisma Suitability** — Low-moderate. Acceptable for reviewing/explaining schema diffs, not authoring them.
9. **R2 Storage Suitability** — Low. Documentation of R2 decisions only.
10. **Next.js Suitability** — Moderate. Fine for documentation and lighter-weight component work.
11. **Large Refactor Risk** — Moderate-high. Not the first choice for large refactors.
12. **Inspection Quality** — Moderate-high for report writing; pair with a reasoning-flagship model for the underlying analysis on critical systems.
13. **Implementation Quality** — Moderate. Acceptable for non-critical, approved implementation.

---

### Sonnet 5 HIGH

1. **Strengths** — Strong balance of reasoning and coding quality, reliable multi-file editing, good instruction-following, strong general-purpose engineering assistant.
2. **Weaknesses** — Not the absolute ceiling on either pure reasoning depth (vs. a top reasoning-flagship model) or pure coding throughput (vs. a dedicated fast coding model).
3. **Best Use Cases** — General application development, approved feature implementation, API development, moderate refactors, day-to-day engineering work across the stack.
4. **Unsafe Use Cases** — Should not be the sole decision-maker for irreversible database/schema changes or production infrastructure changes without a reasoning-flagship model review first.
5. **Context Window Considerations** — Handles large multi-file context well; suitable for cross-cutting changes across frontend and backend in the same session.
6. **Architecture Analysis Suitability** — Good. Suitable for architecture review support, though the strongest reasoning model should own final architecture decisions on locked systems.
7. **Database / Supabase Suitability** — Moderate. Suitable for implementing an already-approved Supabase change designed by a reasoning-flagship model.
8. **Prisma Suitability** — Good for implementing approved schema/migration changes; not the first choice for originating irreversible schema decisions.
9. **R2 Storage Suitability** — Moderate. Suitable for approved, scoped R2 integration work.
10. **Next.js Suitability** — Strong. Well suited to App Router work across `/app/`, `/components/`, `/hooks/`, `/utils/`, `/lib/`.
11. **Large Refactor Risk** — Moderate. Reasonable for approved, well-scoped refactors; large unscoped refactors still carry risk.
12. **Inspection Quality** — Good general-purpose inspector; escalate to strongest reasoning model for Admin HQ, Timeline Sharing, Operations Core, and production incidents.
13. **Implementation Quality** — Strong. Good default implementation model once a change has been approved.

---

### Opus 4.6 HIGH

1. **Strengths** — Strongest available depth of reasoning, best for tracing subtle root causes, best at holding complex multi-system tradeoffs in mind, most reliable for irreversible-decision analysis.
2. **Weaknesses** — Slower and more expensive than fast/coding-optimized models; overkill for small isolated fixes.
3. **Best Use Cases** — Root cause analysis, architecture review, inspection/audit of locked systems, production incident investigation, any decision that is expensive to get wrong.
4. **Unsafe Use Cases** — None from a capability standpoint, but should not be used to bypass the Golden Rule — inspection output must still go through Report → Approval before implementation.
5. **Context Window Considerations** — Best suited to holding the largest, most complex context (multi-service, multi-file, historical decision trail) without losing the thread.
6. **Architecture Analysis Suitability** — Highest. This is the designated model for architecture decisions per the Model Selection Policy.
7. **Database / Supabase Suitability** — Highest suitability for *designing/inspecting* changes; implementation can be handed to a coding-flagship model once approved.
8. **Prisma Suitability** — Highest suitability for schema/migration design and risk analysis before any migration is written.
9. **R2 Storage Suitability** — Highest suitability for reasoning about R2 architecture changes and failure modes.
10. **Next.js Suitability** — Strong, but reserve for cases involving architectural or routing-structure implications, not routine page work.
11. **Large Refactor Risk** — Lowest risk of the available models when used to *plan* a refactor; still requires human approval before execution.
12. **Inspection Quality** — Highest. This is the designated model for Inspection / Audit / Root Cause Analysis per the Model Selection Policy.
13. **Implementation Quality** — Strong, but reserve for the highest-stakes approved implementation only; less efficient to use for routine implementation work.

---

### Gemini 3.1 Pro

1. **Strengths** — Very large practical context handling, strong at cross-referencing large codebases and long documents, competent general reasoning and coding.
2. **Weaknesses** — Can be less consistent than Opus 4.6 HIGH on the deepest, most subtle root-cause chains; behavior can differ from Claude-family models in ways that require verification on Rendorax-specific conventions.
3. **Best Use Cases** — Large-context inspection tasks, cross-file consistency checks, secondary/independent review of an architecture decision, large document synthesis.
4. **Unsafe Use Cases** — Should not unilaterally own decisions on locked architecture areas without cross-check against the strongest reasoning model.
5. **Context Window Considerations** — Excellent for tasks that require scanning very large portions of the repository or long historical logs at once.
6. **Architecture Analysis Suitability** — Good as a secondary/independent reviewer; strongest reasoning model remains primary for final architecture decisions.
7. **Database / Supabase Suitability** — Moderate. Useful for cross-checking a proposed Supabase change against the rest of the codebase.
8. **Prisma Suitability** — Moderate. Good for reviewing schema diffs across a large codebase for unintended references.
9. **R2 Storage Suitability** — Moderate. Useful for tracing all R2 usage sites across the codebase before a change.
10. **Next.js Suitability** — Good, especially for full-app consistency checks (e.g., verifying a route change doesn't break other pages).
11. **Large Refactor Risk** — Moderate. Good for refactor *planning/impact analysis*, still requires approval before execution.
12. **Inspection Quality** — Strong, particularly for wide/whole-repo inspection; pair with Opus 4.6 HIGH for the deepest root-cause reasoning on critical systems.
13. **Implementation Quality** — Good general implementation quality; acceptable alternative when Sonnet 5 HIGH is unavailable.

---

### Deepseek-v4 Pro

1. **Strengths** — Cost-efficient, reasonably strong general coding ability, useful as an independent second opinion since it is a different model family.
2. **Weaknesses** — Less proven track record on this codebase's specific conventions; reasoning depth on ambiguous, high-stakes decisions is less predictable than the strongest reasoning model.
3. **Best Use Cases** — Secondary/independent code review, low-risk implementation, generating a second opinion to cross-check another model's inspection report.
4. **Unsafe Use Cases** — Should not be the primary or sole model for database/schema changes, Supabase, R2 architecture, authentication, Admin HQ, Timeline Sharing, Operations Core, or production infrastructure.
5. **Context Window Considerations** — Adequate for single-file to moderate multi-file tasks; not the first choice for the largest whole-repo context tasks.
6. **Architecture Analysis Suitability** — Low-moderate. Acceptable only as a cross-check, not as the primary architecture authority.
7. **Database / Supabase Suitability** — Low. Cross-check only.
8. **Prisma Suitability** — Low. Cross-check only.
9. **R2 Storage Suitability** — Low. Cross-check only.
10. **Next.js Suitability** — Moderate. Acceptable for small-to-moderate scoped implementation.
11. **Large Refactor Risk** — Moderate-high. Avoid as sole model for large refactors.
12. **Inspection Quality** — Moderate. Useful as a second opinion, not a replacement for the strongest reasoning model on critical systems.
13. **Implementation Quality** — Moderate. Acceptable for small, approved, non-critical implementation work.

---

## Task Type → Model Selection Table

| Task Type | Recommended Model | Fallback Model | Reason |
|---|---|---|---|
| Inspection | Opus 4.6 HIGH | Gemini 3.1 Pro | Inspection requires the deepest, most reliable reasoning to avoid missing risk before any change is approved. |
| Root Cause Analysis | Opus 4.6 HIGH | Gemini 3.1 Pro | Root cause work requires tracing subtle, non-obvious failure chains across systems; this is the designated use case for the strongest reasoning model. |
| Architecture Review | Opus 4.6 HIGH | Gemini 3.1 Pro | Architecture decisions are high-cost-to-reverse and require the strongest reasoning model per the Model Selection Policy. |
| Admin HQ | Opus 4.6 HIGH (inspection) → Sonnet 5 HIGH (approved implementation) | Gemini 3.1 Pro | Admin HQ is a locked, Auto-Mode-banned area; inspection and implementation must be split across the reasoning-flagship and coding-flagship models. |
| Supabase | Opus 4.6 HIGH (inspection/design) → Sonnet 5 HIGH (approved implementation) | Gemini 3.1 Pro | Supabase is part of the Architecture Lock and is Auto-Mode-banned; irreversible data-layer risk requires the strongest reasoning model to design/approve before any implementation model touches it. |
| Prisma Schema | Opus 4.6 HIGH (inspection/design) → Sonnet 5 HIGH (approved migration) | Gemini 3.1 Pro | Schema changes are hard to reverse safely; design/risk analysis needs the strongest reasoning model, migration authorship can go to the coding-flagship model once approved. |
| R2 Architecture | Opus 4.6 HIGH (inspection/design) → Sonnet 5 HIGH (approved implementation) | Gemini 3.1 Pro | R2 is part of the Architecture Lock and Auto-Mode-banned; storage architecture mistakes are costly and hard to detect early. |
| Timeline Sharing | Opus 4.6 HIGH (inspection) → Sonnet 5 HIGH (approved implementation) | Gemini 3.1 Pro | Explicitly Auto-Mode-banned; recent regression history on this feature makes strongest-reasoning inspection mandatory before any change. |
| Operations Core | Opus 4.6 HIGH (inspection/design) → Sonnet 5 HIGH (approved implementation) | Gemini 3.1 Pro | Explicitly Auto-Mode-banned; this is core business workflow infrastructure requiring the highest inspection rigor. |
| Small UI Fix | Composer 2.5 FAST | Sonnet 5 HIGH | Low-risk, isolated, well-scoped changes are best handled by the fastest coding model. |
| CSS Fix | Composer 2.5 FAST | Sonnet 5 HIGH | Purely presentational, low-risk, isolated change suited to a fast coding model. |
| Build Error | Sonnet 5 HIGH | Composer 2.5 FAST | Build errors can originate from configuration or cross-file issues that benefit from stronger general reasoning than a pure fast-fix model provides. |
| TypeScript Error | Sonnet 5 HIGH | Composer 2.5 FAST | Type errors often reveal deeper logic mismatches; a general-purpose coding-flagship model is safer than a fast-only model for anything beyond trivial cases. |
| API Development | Sonnet 5 HIGH | Gemini 3.1 Pro | Well-suited to a strong general-purpose coding model for approved endpoint/feature work. |
| Refactor | Sonnet 5 HIGH (approved, scoped) / Opus 4.6 HIGH (planning, if large) | Gemini 3.1 Pro | Large refactors are explicitly Not Allowed without approval; planning needs the strongest reasoning model, scoped/approved execution can go to the coding-flagship model. |
| Documentation | Fable 5 HIGH | Sonnet 5 HIGH | Documentation writing and structuring is this model's core strength. |
| Production Incident | Opus 4.6 HIGH | Gemini 3.1 Pro | Production incidents carry the highest cost of misdiagnosis and require the strongest reasoning model for triage before any fix is attempted. |
| Deployment Investigation | Opus 4.6 HIGH | Gemini 3.1 Pro | Deployment changes are explicitly Not Allowed without approval; investigating deployment issues touches production infrastructure, which is Auto-Mode-banned. |

---

## Rendorax Recommended Defaults

| Project Area | Exact Model to Use |
|---|---|
| Database changes (general) | Opus 4.6 HIGH for design/inspection → Sonnet 5 HIGH for approved implementation |
| Schema changes | Opus 4.6 HIGH for design/inspection → Sonnet 5 HIGH for approved migration |
| Supabase | Opus 4.6 HIGH for design/inspection → Sonnet 5 HIGH for approved implementation |
| Cloudflare R2 architecture | Opus 4.6 HIGH for design/inspection → Sonnet 5 HIGH for approved implementation |
| Authentication flow | Opus 4.6 HIGH for design/inspection → Sonnet 5 HIGH for approved implementation |
| Admin HQ | Opus 4.6 HIGH for inspection/design → Sonnet 5 HIGH for approved implementation |
| Timeline Sharing | Opus 4.6 HIGH for inspection/design → Sonnet 5 HIGH for approved implementation |
| Operations Core | Opus 4.6 HIGH for inspection/design → Sonnet 5 HIGH for approved implementation |
| Agency workflows | Opus 4.6 HIGH for inspection/design → Sonnet 5 HIGH for approved implementation |
| Production infrastructure / deployment | Opus 4.6 HIGH only (Auto-Mode banned; treat as highest caution area) |
| Dashboard structure | Opus 4.6 HIGH for any structural change decision → Sonnet 5 HIGH for approved implementation |
| Client Vault structure | Opus 4.6 HIGH for any structural change decision → Sonnet 5 HIGH for approved implementation |
| Route / folder structure | Opus 4.6 HIGH for any structural change decision → Sonnet 5 HIGH for approved implementation |
| General Next.js feature work (approved) | Sonnet 5 HIGH |
| General API development (approved) | Sonnet 5 HIGH |
| Small, isolated UI/CSS fixes | Composer 2.5 FAST |
| Build / TypeScript errors | Sonnet 5 HIGH |
| Refactors (any size) | Opus 4.6 HIGH for planning → Sonnet 5 HIGH for approved, scoped execution |
| Documentation / reports / checklist updates | Fable 5 HIGH |
| Root cause analysis / production incidents | Opus 4.6 HIGH |
| Architecture review / audits | Opus 4.6 HIGH |
| Independent second-opinion review | Gemini 3.1 Pro or Deepseek-v4 Pro |

---

This document contains no implementation, no roadmap, and no code changes. It is a reference for model selection only and must be read alongside `AI_TEAM_PROTOCOL.md`.
