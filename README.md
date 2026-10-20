# SABRATHA ELT Tech-Assistant · مساعد تكنولوجيا تدريس اللغة الإنجليزية

**جامعة صبراتة — كلية الآداب والتعليم — قسم اللغة الإنجليزية**
Sabratha University — Faculty of Arts & Education — Department of English

Course: **Employing Technology in ELT** · مقرر: **توظيف التكنولوجيا في تدريس اللغة الإنجليزية**

A free, responsive, full-stack web application that turns lecture content into interactive
pedagogical material with the **Google Gemini API**, stores everything in **Supabase**, and
deploys seamlessly on **Vercel**.

---

## ✨ Features · المزايا

| # | Feature | الوصف |
|---|---------|-------|
| 1 | **Pedagogical summaries & core concepts** | ملخص تربوي + مفاهيم جوهرية (SAMR، TPACK، التعلم المدمج…) بأمثلة صفية |
| 2 | **Key takeaways & Libyan classroom applications** | خلاصات سريعة وتطبيقات عملية واقعية للصفوف الليبية (موارد محدودة، صفوف مزدحمة، هواتف ذكية) |
| 3 | **Scenario-based Q&A with model answers** | سيناريوهات صفية وأسئلة بنماذج إجابة على نمط الامتحانات الجامعية |
| 4 | **Interactive reflection tasks & discussion board** | مهام تأمل (فردية/جماعية/نقاش) + لوحة نقاش تفاعلية محفوظة في قاعدة البيانات |

Extra: bilingual UI (عربي RTL / English LTR), TXT/MD file upload (drag & drop), sample lecture,
copy-to-clipboard, print / save-as-PDF, saved-lectures library.

---

## 🏗 Architecture · البنية

```
teach-lap/
├── index.html            # Full responsive frontend UI (Tailwind CSS)
├── app.js                # Frontend logic (Vanilla JS, bilingual i18n, rendering)
├── supabase.js           # Supabase configuration & DB queries (lectures/comments/reflections)
├── api/
│   └── generate.js       # Vercel Serverless Function → Google Gemini API
├── supabase/
│   └── schema.sql        # PostgreSQL schema for Supabase (tables + RLS policies)
├── dev-server.mjs        # Zero-dependency local dev server (static + /api/generate)
├── package.json          # Project metadata (zero runtime dependencies)
├── vercel.json           # Vercel deployment configuration
├── .env.example          # Environment variables template
└── README.md
```

**Stack:** HTML5 · Tailwind CSS (CDN) · Vanilla JavaScript (ES modules) · Vercel Serverless
Functions (Node.js 18+) · Google Gemini API · Supabase (PostgreSQL).

**Data flow:**

```
Browser (index.html + app.js)
   │  POST /api/generate  {title, text, outputLanguage}
   ▼
Vercel Function (api/generate.js)  ──►  Google Gemini API  (key from process.env.GEMINI_API_KEY)
   │  JSON {summary, core_concepts, key_takeaways, libyan_applications,
   │        scenario_qa, reflection_tasks, discussion_questions}
   ▼
Browser renders results · saves lectures/analyses/comments/reflections ──► Supabase
```

---

## 🚀 Setup Guide · دليل الإعداد

### 1) Google Gemini API key · مفتاح Gemini

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Keep it **server-side only** — never put it in frontend code.

### 2) Supabase database · قاعدة بيانات Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.
3. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **Publishable key** (new dashboards show `sb_publishable_...`) or legacy **anon public** key
4. Open [`supabase.js`](supabase.js) and fill in the two constants at the top:

```js
export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

> Without Supabase the app still works: AI generation runs normally, results are shown,
> only saving (library / discussion board / reflections) is disabled and a notice is displayed.

### 3) Deploy to Vercel · النشر على Vercel

**Option A — Vercel dashboard:**

1. Push this repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (framework preset: **Other**).
3. Add the environment variable:
   - `GEMINI_API_KEY` = your Gemini key
   - *(optional)* `GEMINI_MODEL` = `gemini-2.5-flash` (default)
4. Deploy. Done ✔

**Option B — Vercel CLI:**

```bash
npm i -g vercel
vercel login
vercel          # link the project
vercel env add GEMINI_API_KEY production
vercel --prod
```

### 4) Local development · التطوير المحلي

```bash
# Option 1: Vercel CLI (runs api/ functions too)
npm i -g vercel
vercel dev

# Option 2: zero-dependency Node dev server (serves static files + /api/generate)
GEMINI_API_KEY=your-key node dev-server.mjs       # or: npm run dev:node

# Option 3: any static server (API calls need the deployed /api or options above)
python3 -m http.server 3000
```

For `vercel dev`, create a `.env` file (see `.env.example`) with `GEMINI_API_KEY`.

---

## 🔌 API Reference · مرجع الواجهة البرمجية

### `POST /api/generate`

Request body:

```json
{
  "title": "SAMR Model lecture",
  "text": "the full lecture text (40–80,000 characters)",
  "outputLanguage": "ar | en | bilingual"
}
```

Success response `200`:

```json
{
  "success": true,
  "data": {
    "summary": "…",
    "core_concepts": [{ "term": "SAMR", "definition": "…", "classroom_link": "…" }],
    "key_takeaways": ["…"],
    "libyan_applications": ["…"],
    "scenario_qa": [{ "question": "…", "model_answer": "…" }],
    "reflection_tasks": [{ "title": "…", "prompt": "…", "type": "individual | group | discussion" }],
    "discussion_questions": ["…"]
  },
  "meta": { "model": "gemini-2.5-flash", "generatedAt": "…", "chars": 1234, "outputLanguage": "ar" }
}
```

Error response:

```json
{ "success": false, "error": { "code": "TEXT_TOO_SHORT", "message": "…" } }
```

Common error codes: `MISSING_API_KEY`, `INVALID_API_KEY`, `TEXT_TOO_SHORT`, `TEXT_TOO_LONG`,
`RATE_LIMIT`, `GEMINI_ERROR`, `PARSE_ERROR`, `TIMEOUT`, `METHOD_NOT_ALLOWED`.

---

## 🗄 Database Schema · مخطط قاعدة البيانات

Four tables (all with RLS enabled — see comments in `supabase/schema.sql`):

| Table | Purpose |
|-------|---------|
| `lectures` | uploaded/pasted lecture content |
| `analyses` | AI-generated pedagogical content (JSONB columns) |
| `comments` | discussion board entries (student / professor) |
| `reflections` | student responses to reflection tasks |

Deleting a lecture cascades to its analyses, comments and reflections.

---

## 🔒 Security Notes · ملاحظات أمنية

- `GEMINI_API_KEY` lives **only** in Vercel environment variables and is read via
  `process.env.GEMINI_API_KEY` in `api/generate.js`.
- The Supabase **anon** key is safe to expose in the browser (that is its purpose) as long as
  RLS policies match your needs. The shipped policies allow anonymous classroom use; before a
  public launch, enable Supabase Auth and tighten them (examples are commented in the schema).
- All user/model-generated text is rendered with `textContent` (no HTML injection).
- File upload accepts plain-text files only (`.txt`, `.md`).

---

## 🌍 Localization · اللغات

- UI: Arabic (RTL, default) ⇄ English (LTR) — toggle button in the header.
- Generated content language is chosen independently: Arabic / English / Bilingual.

---

## 📄 License

MIT — feel free to use, adapt and share for educational purposes.
