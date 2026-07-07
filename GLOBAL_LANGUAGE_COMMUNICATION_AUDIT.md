# Global Local-Language Communication Feature — Audit

**Date:** 2026-07-05  
**Type:** Inspection only  
**Recommended Model:** Opus 4.6 HIGH  
**Reason:** Tracing a multi-layer real-time translation system across global widgets, dashboard components, socket events, and two AI backends requires the deepest reasoning model.  
**Task Type:** Inspection Only

---

## 1. Current Implementation — Component Map

### 1.1 Language Selector

| Property | Value |
|----------|-------|
| Component | `<select>` inside `DashboardHeader.tsx` (lines 130–140) |
| State | `useGlobalStore().selectedLanguage` / `setSelectedLanguage` |
| Default | `"en-US"` |
| Languages | 20 profiles: EN, BN, ES, FR, DE, ZH, JA, RU, PT, IT, KO, AR, HI, TR, NL, PL, VI, TH, ID, SV |
| Store | Zustand `useGlobalStore` — client-only, in-memory (no persistence across sessions) |
| Rendered on | **`/dashboard` only** — `DashboardHeader` is not imported by any other page |
| Rendered on `/admin`? | **No** |
| Rendered on marketing pages? | **No** |
| Rendered in `app/layout.tsx`? | **No** |

**Root cause of "dashboard only" visibility:** The language selector `<select>` is hardcoded inside `DashboardHeader.tsx`, which is only rendered inside `app/dashboard/page.tsx`. There is no global or layout-level language selector.

### 1.2 Live Session Translation (Audio → Text → Audio)

**Three distinct translation pathways exist:**

#### Pathway A: Real-time audio translation (OpenAI Realtime API)

| Layer | Component / File | Role |
|-------|-----------------|------|
| Frontend capture | `LiveSessionWidget.tsx` lines 408–429 | `ScriptProcessor` captures PCM16 audio when `isTranslationEnabled` is true; emits `audio-chunk` to backend |
| Backend multiplexer | `index.ts` lines 229+ | Receives `audio-chunk`, determines target languages from `clientLanguages` map, fans out to per-language OpenAI Realtime WebSocket sessions |
| Backend → OpenAI | `index.ts` `getOrInitOpenAIConnection()` | Opens `wss://api.openai.com/v1/realtime` per (roomId, targetLang); sends PCM16 as base64; receives translated audio + text deltas |
| Backend → clients | `translated-audio-chunk` + `live-caption` events | Audio chunks and text captions dispatched to clients whose `clientLanguages[socketId]` matches the target language |
| Frontend playback | `LiveSessionWidget.tsx` lines 322–335 | Decodes audio chunks via `AudioContext.decodeAudioData` and plays; `live-caption` displayed as overlay text |
| Toggle UI | `LiveSessionWidget.tsx` lines 562–572 | "🌐 Translate" / "🌐 Translating" button inside the live session panel |

**Availability:** Active inside `LiveSessionWidget` which is rendered by `GlobalLiveWidget` → visible wherever `GlobalLiveWidget` renders the logged-in session UI (dashboard, marketing pages, and now admin via embedded mode).

#### Pathway B: Live mic speech-to-text translation (Web Speech API + Gemini)

| Layer | Component / File | Role |
|-------|-----------------|------|
| Frontend capture | `useLiveMicTranslation.ts` | Uses browser `SpeechRecognition` API; captures speech transcript |
| Frontend → backend | Socket event `translate-speech` | Sends `{ text, targetLang }` to backend |
| Backend | `index.ts` `translateWithGemini()` | Translates text via `@google/generative-ai` (Gemini 2.5 Flash) |
| Backend → clients | `receive-translated-speech` event | Broadcasts translated text to **all** connected clients (`io.emit`) |
| Frontend playback | `useLiveMicTranslation.ts` lines 105–113 | TTS via `window.speechSynthesis.speak()` in the user's selected language |
| Cinema mode display | `TimelineShareWidget.tsx` | Shows translated subtitles on the cinema screen; plays TTS for editor |

**Role restriction:** `useLiveMicTranslation` skips activation for `admin` or `editor` roles (`isEditor` check, line 26–28). This means admins/editors **hear** translated output but their own mic is not captured for translation — only non-admin/non-editor participants generate speech translations.

**Availability:** Hook runs inside `LiveSessionWidget` → same availability as Pathway A.

#### Pathway C: Chat text translation (Gemini via Next.js API route)

| Layer | Component / File | Role |
|-------|-----------------|------|
| Frontend send | `LiveSessionWidget.tsx` lines 462–484 | Sends `send-chat-message` with `senderLanguage` |
| Frontend receive | `LiveSessionWidget.tsx` lines 275–310 | On `receive-chat-message`, calls `translateIncomingChatMessage()` |
| Translation | `utils/translateLiveChatMessage.ts` | `POST /api/translate-text` (Next.js API route) |
| Backend API | `app/api/translate-text/route.ts` | Gemini 2.5 Flash translation; requires auth |
| Display | `LiveSessionWidget.tsx` lines 632–655 | Shows `(Translated)` or `(Translation Failed)` badges |

**Availability:** Active inside `LiveSessionWidget` → same availability as Pathways A and B.

### 1.3 ChatbotWidget translation

| Property | Value |
|----------|-------|
| Language source | `useGlobalStore().selectedLanguage` → `resolveChatLanguage()` |
| Sent to backend | `POST /api/chat` with `selectedLanguage` field |
| Backend behavior | AI responds in the selected language (Gemini system prompt) |
| Availability | Wherever `ChatbotWidget` renders (layout.tsx global mount, admin embedded) |

**Note:** ChatbotWidget reads `selectedLanguage` from the same global store. On dashboard, the user has set their language via the selector. On admin or marketing pages, `selectedLanguage` remains at the default `"en-US"` because no selector is available to change it.

---

## 2. Scope and Location Analysis

### 2.1 Where the language selector is rendered

**Only inside `DashboardHeader.tsx`** — which is only rendered on `/dashboard`.

The `LANGUAGES` array is defined as a local constant in `DashboardHeader.tsx` (lines 17–38), not exported or shared. The `<select>` element (lines 130–140) writes to `useGlobalStore().setSelectedLanguage`.

### 2.2 Where live translated audio/text UI is rendered

| Component | Rendered where | Translation UI elements |
|-----------|---------------|------------------------|
| `LiveSessionWidget` | Inside `GlobalLiveWidget` on all authenticated pages | "🌐 Translate" toggle, live captions overlay, chat messages with `(Translated)` badge |
| `TimelineShareWidget` | Inside `/dashboard` cinema mode only | Subtitles overlay + TTS playback + "Hear in: {language}" label |
| `ChatbotWidget` | Root layout (all pages), admin embedded | Responds in selected language (no explicit UI indicator) |

### 2.3 Why it appears only on `/dashboard`

The translation **engine** (Pathways A/B/C) is global — it runs wherever `LiveSessionWidget` and `ChatbotWidget` are active. What is **not global** is the **language selector UI**.

Without the language selector, all translation features still exist technically but are locked to the default `"en-US"` because `useGlobalStore().selectedLanguage` is never changed. The user has no way to choose Bengali, Hindi, Spanish, etc. on any page other than `/dashboard`.

### 2.4 Whether `app/layout.tsx` mounts it globally

`app/layout.tsx` mounts `GlobalLiveWidget` and `ChatbotWidget` globally (lines 63–64). **It does not mount a language selector.**

### 2.5 Whether `/admin` guard or embedded widget changes hide it

The admin embedding changes (Group B uncommitted work) **do not hide the translation engine**. They re-embed `GlobalLiveWidget isEmbedded={true}` inside the admin page, which still renders `LiveSessionWidget` with its full translation toggle and chat capabilities. However, the admin user cannot change their language preference because there is **no language selector on `/admin`**.

---

## 3. Functional Flow (When Working on Dashboard)

1. **User selects language:** `DashboardHeader` → `<select>` → `setSelectedLanguage("bn-BD")` → Zustand store update.
2. **Audio/video call starts:** User clicks "START LIVE SESSION" in `LiveSessionWidget` → `acquireMediaAndJoin()` → `getUserMedia` → socket `join-call` + `join-room-language` with selected language.
3. **Speech captured (Pathway A):** `ScriptProcessor.onaudioprocess` captures PCM16 frames → socket `audio-chunk` → backend OpenAI Realtime WS per target language.
4. **Speech captured (Pathway B):** `useLiveMicTranslation` → browser `SpeechRecognition` → transcript → socket `translate-speech` → backend Gemini translation → `receive-translated-speech`.
5. **Speech translated:** Backend OpenAI Realtime returns translated audio chunks + text deltas → dispatched to clients matching target language via `clientLanguages` map.
6. **Text displayed:** `live-caption` events render as overlay in `LiveSessionWidget`; chat messages translated via `POST /api/translate-text` and shown with `(Translated)` badge.
7. **Audio playback:** `translated-audio-chunk` decoded via `AudioContext.decodeAudioData` and played through `syntheticDestRef`; Pathway B uses `speechSynthesis.speak()`.

---

## 4. Global Requirement Gap Analysis

| Surface | Language Selector Available? | Translation Engine Active? | Gap |
|---------|:--:|:--:|-----|
| `/dashboard` (logged in) | **Yes** — `DashboardHeader` `<select>` | **Yes** — all 3 pathways | None |
| `/admin` (logged in as admin) | **No** | **Partially** — `LiveSessionWidget` renders via embedded `GlobalLiveWidget`; `ChatbotWidget` embedded; but language stuck at `"en-US"` | **Language selector missing** |
| Marketing pages (logged in) | **No** | **Yes** — floating `GlobalLiveWidget` renders `LiveSessionWidget`; `ChatbotWidget` renders | **Language selector missing** |
| Marketing pages (logged out) | **No** | **No** — `GlobalLiveWidget` shows "Talk to Rendorax" contact button; `ChatbotWidget` renders with default `en-US` | **No live session available** (by design — visitors don't get live calls) |
| Client review room (cinema mode) | Inherited from dashboard | **Yes** — `TimelineShareWidget` shows subtitles + TTS | Depends on dashboard selector having been used |

### Summary of gaps

1. **Admin HQ:** Translation engine runs but is locked to English because no language selector exists on `/admin`. Admin users who need Bengali/Hindi/other languages cannot switch.
2. **Marketing pages (logged in):** Same — translation engine runs but selector is only in `DashboardHeader`. Rare use case (logged-in users on marketing pages).
3. **Marketing pages (logged out):** No gap — visitors get a contact form, not live calls. Translation is not expected here.
4. **Client/team live room:** No standalone gap — clients access via `/dashboard` which has the selector. However, if a client opens a shared link that doesn't go through `/dashboard`, they would be stuck on English.

---

## 5. Risk Assessment — Recent Uncommitted Changes

### 5.1 Did hiding `GlobalLiveWidget` on `/admin` break translation?

**No — the hide was replaced with embedding.** The current working tree does `if (isAdmin && !isEmbedded) return null` on the **root layout instance** only, while `app/admin/page.tsx` renders `<GlobalLiveWidget isEmbedded={true} />` in the HQ Communications footer. The embedded instance still renders `LiveSessionWidget` with full Pathway A/B/C translation capabilities.

**However, the embedded instance lacks a language selector.** Translation runs but defaults to `"en-US"`.

### 5.2 Did embedding widgets change translation UI?

**No.** The `isEmbedded` prop only affects CSS layout (`containerClass` and `showLiveToolbar` logic). It does not suppress any translation-related state, props, or socket events. The "🌐 Translate" toggle still renders inside `LiveSessionWidget`.

### 5.3 Did the visitor contact flow (Group C) affect translation?

**No.** The `!user` branch in `GlobalLiveWidget` (which shows "Talk to Rendorax" + `ContactModal`) was already a separate code path before translation existed. Logged-out visitors never had access to `LiveSessionWidget` or its translation features.

### 5.4 Did the `useGlobalStore` default change?

**No.** `selectedLanguage` default is still `"en-US"` in `useGlobalStore.ts`. No working tree change touches this file.

---

## 6. Minimal Safe Restoration Recommendation

### Problem statement

The language selector is a `<select>` element defined as a local constant (`LANGUAGES` array) inside `DashboardHeader.tsx`. It is not extracted as a reusable component and is not importable by other pages.

### Recommended approach (when approved for implementation)

**Extract the language selector into a standalone component. Render it wherever live communication tools appear.**

| Step | Action | Risk | Scope |
|------|--------|------|-------|
| 1 | **Extract** `LANGUAGES` array + `<select>` from `DashboardHeader.tsx` into a new `components/LanguageSelector.tsx` | None — pure refactor, no behavior change | New component |
| 2 | **Import** `LanguageSelector` back into `DashboardHeader.tsx` (preserves existing dashboard behavior exactly) | None — drop-in replacement | `DashboardHeader.tsx` |
| 3 | **Render** `LanguageSelector` in `app/admin/page.tsx` header row (beside the "Rendorax AI" button and "PostgreSQL Node: Synced") | Low — additive UI on admin | `app/admin/page.tsx` |
| 4 | **Optional:** render `LanguageSelector` inside `LiveSessionToolbar` so it appears wherever the toolbar appears (admin embedded, non-dashboard pages) | Low — additive; follows existing toolbar pattern | `LiveSessionToolbar.tsx` |

### What NOT to do

| Action | Why avoid |
|--------|-----------|
| Duplicate the `LANGUAGES` array in `admin/page.tsx` | Creates a maintenance burden; changes to language list would need two updates |
| Add a language selector to `app/layout.tsx` for all routes | Over-scoped; marketing visitors don't need it |
| Add translation features for logged-out visitors | Out of scope; visitors use the contact form, not live calls |
| Change `useGlobalStore` default from `"en-US"` to a browser-detected language | Potentially surprising behavior; separate decision |
| Persist `selectedLanguage` across sessions (localStorage/cookie) | Useful but separate scope |

### Effect on dashboard

**Zero impact.** Steps 1–2 are a pure extraction refactor. The `DashboardHeader` `<select>` becomes `<LanguageSelector />` with identical props and behavior.

### Effect on Admin HQ

After Step 3, admin users would see a language dropdown in the HQ header. Selecting a language would update `useGlobalStore().selectedLanguage`, which propagates to:

- `LiveSessionWidget` (embedded via `GlobalLiveWidget`) → room language, audio translation, chat translation
- `ChatbotWidget` (embedded) → AI responses in selected language
- `useLiveMicTranslation` → speech recognition language (for non-admin participants in the same room)

### Effect on logged-out visitors

None. The `!user` branch in `GlobalLiveWidget` does not render `LiveSessionWidget` or any translation UI.

---

## 7. Component Dependency Diagram

```
app/layout.tsx
├── GlobalLiveWidget (root — floating)
│   ├── if (!user) → "Talk to Rendorax" + ContactModal
│   ├── if (isAdmin && !isEmbedded) → return null
│   └── if (user, not admin root) →
│       ├── LiveSessionToolbar (mic + join call)
│       └── LiveSessionWidget (full session)
│           ├── useLiveMicTranslation (Pathway B)
│           ├── audio-chunk capture (Pathway A)
│           ├── chat translation (Pathway C)
│           └── 🌐 Translate toggle
└── ChatbotWidget (root — floating)
    └── reads selectedLanguage → AI responds in language

app/dashboard/page.tsx
├── DashboardHeader
│   ├── LANGUAGES <select> ← THE ONLY LANGUAGE SELECTOR
│   └── LiveSessionToolbar
├── VaultSidebar
│   └── GlobalLiveWidget isEmbedded (desktop)
│       └── LiveSessionWidget (full session)
├── TimelineShareWidget (cinema mode)
│   └── receive-translated-speech → subtitles + TTS
└── GlobalLiveWidget root (mobile, md:hidden)

app/admin/page.tsx
├── ChatbotWidget isEmbedded (header)
│   └── reads selectedLanguage (stuck at en-US — NO SELECTOR)
├── GlobalLiveWidget isEmbedded (comm footer)
│   ├── LiveSessionToolbar
│   └── LiveSessionWidget (full session)
│       └── translation engine active but language = en-US — NO SELECTOR
└── NO DashboardHeader → NO LANGUAGE SELECTOR
```

---

## 8. Backend Translation Infrastructure Summary

| Service | Used by | API | Status |
|---------|---------|-----|--------|
| OpenAI Realtime API | Pathway A (audio multiplexer) | `wss://api.openai.com/v1/realtime` (gpt-4o-realtime-preview) | Requires `OPENAI_API_KEY` env var |
| Google Gemini (backend) | Pathway B (speech text translation) | `@google/generative-ai` (gemini-2.5-flash) | Requires `GEMINI_API_KEY` env var |
| Google Gemini (frontend API) | Pathway C (chat text translation) | `POST /api/translate-text` (Next.js route) | Requires `GEMINI_API_KEY` env var |
| Web Speech API | Pathway B (speech capture) | Browser-native `SpeechRecognition` | No API key; browser support varies |
| Web Speech Synthesis | Pathway B (TTS playback) | Browser-native `speechSynthesis` | No API key; browser support varies |
| Redis | Socket.io adapter (optional) | `REDIS_URL` | Currently failing `ECONNREFUSED :6379` — non-critical for single-instance dev |

---

## 9. Impact on WORKING_TREE_SPLIT_PLAN.md

**No reclassification of existing groups required.**

The language selector gap is a **pre-existing architectural limitation**, not something introduced by any uncommitted Group B/C/D change. The language selector has always been inside `DashboardHeader` only. The Group B admin embedding changes did not remove, hide, or break any translation functionality — they simply exposed the pre-existing gap by making admin live tools visible without also providing the selector.

If a language selector extraction is approved as a follow-up task, it would be a **new Group (Group G)** — a small, additive, low-risk change touching:

- New: `components/LanguageSelector.tsx`
- Modified: `DashboardHeader.tsx` (import refactor)
- Modified: `app/admin/page.tsx` (add selector to header)
- Optionally: `LiveSessionToolbar.tsx`

This does not affect the current commit plan for Groups B, C, or D.

---

No code modified. No files staged. No commits made. No pushes performed.
