# tpn-frontend — Claude Reference

## Companion Backend

Backend source lives at `C:\Users\galsh\Projects\News`.
Read it freely when you need to understand API shapes, field names, category enums,
or database schemas. The backend has its own detailed `CLAUDE.md` at that root.

---

## Project Layout

```
apps/
  web/                  ← the only active app (React + Vite + Tailwind)
    App.tsx             ← root component, routing, header, feed
    components/         ← all UI components
    services/
      newsService.ts    ← all fetch calls + shared ingest types
    locales/
      {en,he,fr,ru,ar}/translation.json   ← i18n strings
    vite.config.ts      ← dev proxy → http://localhost:8000 (Railway backend)
packages/
  shared/src/
    services/newsService.ts   ← base fetchArticles / searchArticles
    types.ts                  ← Article, SavedFilter, etc.
```

---

## API — Base URL

`VITE_API_URL` (env var, defaults to `""`). In dev the Vite proxy forwards
`/articles`, `/search`, `/health`, `/ingest` → `http://localhost:8000`.
On Railway the same env var should point to the deployed backend URL.

---

## API Endpoints & Exact Response Shapes

### GET /articles → Article[]
Used by `fetchArticles()`. Returns enriched MongoDB documents mapped through
`doc_to_article()`. Key fields after mapping:

```typescript
{
  id: string            // MongoDB _id as string
  header: string        // English title
  category: string      // see Category Enum below
  summary: string
  content: string       // article body (≤1000 chars)
  languages: {          // bilingual content dict
    en: { title, summary, body },
    he: { title, summary, body }   // currently same as en
  }
  author: string
  date: string          // ISO 8601 — last_updated or created_at
  created_at: string | null
  last_updated: string | null
  imageUrl: string      // always a picsum URL (image gen disabled)
  credibility_score: number | null   // 0–10
  external_sources: string[] | null  // URLs
  area_exterior: object | null       // GeoJSON
  region: string | null              // maps to location_name in DB
}
```

### GET /search?q=… → Article[]
Same shape as /articles. Returns empty array on error (no fallback).

### GET /ingest?limit=N → IngestByChannelResponse
Used by `fetchIngestByChannel()`. Returns pre-grouped, pre-sorted data —
**do NOT re-group or re-sort on the frontend**. Exact shape:

```typescript
{
  channels: [
    {
      channel_id: string       // platform-native ID
      channel_name: string     // display name
      platform: string         // "telegram" | "twitter" | "website" | "rss"
      reports: [
        {
          id: string
          report_txt: string   // raw ingest text, no truncation
          key_points: string[]
          category: string | null
          location_name: string | null
          post_id: string | null
          post_timestamp: string | null   // ISO 8601
          created_at: string             // ISO 8601
          updated_at: string | null      // ISO 8601
        }
      ]
    }
  ],
  total_reports: number
}
```

Channels are sorted A→Z (case-insensitive) by the server.
Reports within each channel are newest-first by `created_at`.
Default limit = 500, max = 2000.

---

## Category Enum

Valid values across all DB collections and the API:

```
"Politics" | "Economy" | "Health" | "Technology" |
"Environment" | "Defence and Security" | "Sports"
```

`"Shitpost"` is dropped server-side and never reaches the frontend.

Category → color mapping (defined in `App.tsx` and repeated in components):
```
Politics            → #FF6B35
Economy             → #00C896
Health              → #FF4D6D
Technology          → #0057FF
Environment         → #3DBF6E
Defence and Security→ #9747FF
Sports              → #FFB800
```

If you add a new component that needs category colors, copy this map —
don't invent new colors.

---

## Platform Values (ingest sources)

`platform` field comes from the `sources` MongoDB collection:
```
"telegram" | "twitter" | "website" | "rss"
```
Always `.toLowerCase()` before lookup. Platform badge colors:
```
telegram → blue   (#0057FF)
twitter  → sky    (#38BDF8)
website  → gray   (#505070)
rss      → gray   (#505070)
unknown  → gray   (#505070)
```

---

## Datetime Conventions

All datetimes from the API are ISO 8601 strings in UTC.
Some may lack a `Z` suffix — always normalize before parsing:
```typescript
const normalized = /[Z+\-]\d*$/.test(s) ? s : s + 'Z';
new Date(normalized);
```
This pattern is already in `ArticleCard.tsx` (`normalizeDate`) and
`JournalistDataPage.tsx` — reuse it, don't reinvent.

---

## Styling Rules

- Dark theme is **always on** (`document.documentElement.classList.add('dark')` in App.tsx).
- Background hierarchy: `#0A0A0F` (page) → `#111118` (cards) → `#16161F` (inset/nested).
- Borders: `#1E1E2A`. Muted text: `#505070`. Body text: `#A8A8C0`. White: headings/values.
- Primary accent: `#0057FF`. Error/urgent: `#FF3333`. Warning: `#FFB800`.
- Tailwind classes are used throughout — match existing patterns in `ArticleCard.tsx`
  and `FullArticleView.tsx` before reaching for inline styles.
- Font sizes follow a scale: `text-[9px]` badges → `text-[10px]` meta →
  `text-[11px]` labels → `text-[12px]` secondary → `text-[13px]` body →
  `text-sm` (14px) primary.

---

## i18n

- All 5 locales must be updated together: `en`, `he`, `fr`, `ru`, `ar`.
- Files: `apps/web/locales/{locale}/translation.json`.
- RTL layout (he, ar) is handled globally — no per-component dir hacks needed.
- Interpolation syntax: `{{varName}}`.

---

## Feature Flags

`JOURNALIST_MODE` is currently hardcoded `true` in `App.tsx`.
It controls visibility of the Feed / Journalist Data tab nav.
Note: `VITE_*` vars are baked in at **build time** by Vite — Railway runtime
env vars have no effect on them after a build. Hardcode or trigger a redeploy.

---

## Key Lessons Learned

- The `/ingest` endpoint returns data already grouped and sorted — pass it
  through directly, never re-group on the frontend.
- `VITE_*` env vars must be set before the Railway build runs, not after.
- Dates from the backend may be missing the `Z` UTC suffix — always normalize.
