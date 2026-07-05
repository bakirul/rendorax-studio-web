# Rendorax Studio — AI Team Protocol

## Purpose

This document defines how ChatGPT, Cursor, Gemini, and future AI tools must work on the Rendorax Studio project.

---

## Golden Rule

Never change anything before inspection.

Workflow:

Inspect → Report → Approval → Implement → Test → Document

---

## Architecture Lock

Do NOT change:

- Dashboard structure
- Client Vault structure
- Authentication flow
- Supabase architecture
- Cloudflare R2 architecture
- Route structure
- Folder structure
- Core business workflow

Unless explicitly approved.

---

## Allowed Changes

- Bug fixes
- Error handling
- Loading states
- Empty states
- UX clarity improvements
- Performance optimizations
- Security improvements

---

## Not Allowed

- Unapproved redesigns
- Large refactors
- Database rewrites
- Authentication rewrites
- Deployment changes
- Environment variable changes

---

## Current Business Model

Rendorax Studio is currently a service-based broadcast post-production company.

Clients are onboarded manually.

Public SaaS signup is NOT currently required.

---

## Current Priorities

1. Production authentication validation
2. Dashboard workflow testing
3. R2 media playback testing
4. Live collaboration testing
5. User testing
6. UX polish
7. Production launch

---

## Cursor Rules

Cursor must:

1. Inspect first
2. Create report
3. Wait for approval
4. Implement only approved changes
5. Run relevant tests
6. Update project documentation

Never skip steps.

---

## Documentation Requirement

After every completed task:

- Update `rendorax-project-checklist.md`
- Update completed work section
- Update known issues section
- Update next steps section
- Add decision log entry if applicable

---

## Model Selection Policy

Rules:

1. Never use Auto Mode for:
   - Database changes
   - Schema changes
   - Supabase
   - R2 architecture
   - Authentication
   - Admin HQ
   - Timeline Sharing
   - Operations Core
   - Agency workflows
   - Production infrastructure

2. Inspection / Audit / Root Cause Analysis
   - Use strongest reasoning model available.

3. Architecture decisions
   - Use strongest reasoning model available.

4. Approved implementation
   - Use strongest coding model available.

5. Small isolated fixes
   - Fast coding model allowed.

6. Every report must include:
   Recommended Model:
   Reason:
   Task Type:
