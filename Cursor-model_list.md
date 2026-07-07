Cursor Model Selection (Rendorax Studio)

Available Models:

Composer 2.5 FAST
Fable 5 HIGH
Sonnet 5 HIGH
Opus 4.6 HIGH
Gemini 3.1 Pro
DeepSeek-v4 Pro
Opus 4.6 HIGH

Use for:

Architecture inspection
Operations Core
Admin HQ decisions
Workspace boundaries
Database strategy
Prisma/Supabase decisions
Timeline sharing architecture
Role systems
Large audits
Risk analysis

When ChatGPT says:

Recommended Model:
Opus 4.6 HIGH

Select Opus.

Sonnet 5 HIGH

Use for:

Implementation plans
Feature implementation
API wiring
Frontend/backend integration
Admin HQ work
AgencyProject wiring
Task assignment features
Verification support
Controlled refactors

Default coding model for Rendorax.

When unsure:

Use Sonnet 5 HIGH
Gemini 3.1 Pro

Use for:

Large file analysis
Long context reading
Cross-document comparison
Massive codebase inspection
Report generation

Good when reading:

20+ MD files
large audits
multiple reports
DeepSeek-v4 Pro

Use for:

SQL review
Backend logic review
Algorithm review
Alternative reasoning
Second opinion

Use when:

Need independent verification

Not primary implementation model.

Fable 5 HIGH

Use for:

UI copy
Documentation writing
Client-facing content
Marketing content
Process documents

Not for architecture decisions.

Composer 2.5 FAST

Use only for:

Small fixes
Simple inspections
Search tasks
Formatting
File organization
Minor documentation updates

Never use for:

Architecture
Database
Operations Core
Admin HQ
Timeline Sharing
Role systems
Auto Selection Rules

When starting any task:

Task	Model
Architecture Audit	Opus 4.6 HIGH
Operations Core	Opus 4.6 HIGH
Admin HQ	Opus 4.6 HIGH
Timeline Sharing	Opus 4.6 HIGH
Role Boundary	Opus 4.6 HIGH
Implementation Plan	Sonnet 5 HIGH
Feature Coding	Sonnet 5 HIGH
API Work	Sonnet 5 HIGH
Prisma Work	Sonnet 5 HIGH
Large Document Analysis	Gemini 3.1 Pro
SQL Review	DeepSeek-v4 Pro
Documentation	Fable 5 HIGH
Small Safe Fix	Composer 2.5 FAST

নতুন "Rendorax Studio Overview" chat-এর bootstrap prompt-এ এই line যোগ করো:

Before every task:

1. Read PROJECT_NORTH_STAR.md
2. Read AI_TEAM_PROTOCOL.md
3. Determine the correct Cursor model using the Model Selection Matrix.
4. Explicitly state:

Recommended Model:
Reason:
Task Type:

before proceeding.