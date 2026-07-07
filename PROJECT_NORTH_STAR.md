# PROJECT NORTH STAR — Rendorax Studio

---

## 1. Product Identity

Rendorax Studio is one platform for entire post-production operations.

It is not just a review tool.
It is not a public SaaS signup product right now.
It currently supports a service-based production team.
Clients are onboarded manually by the admin.

---

## 2. Primary Flow

```
Client → Project → Assignment → Work → Feedback → Delivery
```

Every feature, fix, and decision must move this flow forward.

---

## 3. Role Definitions

**Admin:**
Manages clients, projects, team, assignments, billing, delivery status.

**Editor / Production Team:**
Works on assigned projects and assets. Handles comments, markers, revisions, exports, uploads new versions.

**Client:**
Reviews video, gives feedback, approves or requests revision.

---

## 4. Architecture Lock

**Supabase:** Auth, database, metadata, RLS.

**Prisma:** Operations and business models — User, AgencyProject, Task, MediaAsset.

**Cloudflare R2:** All media, video, and object storage.

Do not use Supabase Storage for media storage.

---

## 5. Decision Rule

Before any task, ask:

> Does this move the platform forward in Client → Project → Assignment → Work → Feedback → Delivery?

If **NO:** Do not implement.

---

## 6. Current Execution Order

Reference: `OPERATIONS_CORE_EXECUTION_ORDER.md`

1. Sync User on Login
2. Project CRUD on Admin
3. Task Assignment on Admin
4. Editor Task View on Dashboard
5. Link Assets to Projects
6. Client Asset Filtering

---

## 7. Not Priority Right Now

- No new AI features.
- No cosmetic redesign.
- No extra routes unless required by Operations Core.
- No random widgets.
- No architecture rewrites.
- No new migrations unless they support Operations Core.
- No broad audits unless explicitly approved.

---

## 8. AI Rule

Every Cursor, ChatGPT, Gemini, or future AI task must read this document first.

Before any inspection, plan, audit, or implementation, confirm the task supports the North Star.

If it does not, stop and ask for clarification.
