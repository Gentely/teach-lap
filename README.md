# SABRATHA ELT Tech-Assistant — Phase 1 (Clean)

**Sabratha University — Faculty of Arts & Education — Department of English**  
Course: *Employing Technology in ELT*

Minimal, clean, fully functional codebase for Phase 1. No experimental code.

## Stack
- **Frontend:** HTML5 + Tailwind CSS (CDN) + Vanilla JS (no build step)
- **Backend:** Vercel Serverless Function (Node 18+) → Google Gemini API
- **Deployment:** Vercel (cleanUrls, 120s maxDuration)

## Files (Phase 1 only)
```
index.html         → Clean UI: textarea, language selector, generate button, results display
api/generate.js    → Secure Vercel function using process.env.GEMINI_API_KEY (never exposed to client)
package.json       → type: module, no runtime deps
vercel.json        → function config + security headers
.env.example       → GEMINI_API_KEY example
.gitignore         → standard ignores
```

No `auth.js`, no `supabase.js`, no `classroom.js`, no Supabase SQL — Phase 1 is purely the ELT generator.

## Local dev
No install needed for static. For API route locally:
```
npm i -g vercel
vercel dev
# then open http://localhost:3000
```

## Deploy to Vercel
1. Push to GitHub → Vercel → Add New Project → Import `Gentely/teach-lap`
2. Settings → Environment Variables → add:
   - `GEMINI_API_KEY` = your key from https://aistudio.google.com/apikey
   - (optional) `GEMINI_MODEL` = `gemini-2.5-flash` (default)
3. Deploy
4. Verify: `POST /api/generate` with `{title, text, outputLanguage}` returns structured pedagogical JSON.

## Security
- Key lives only in Vercel env (`process.env.GEMINI_API_KEY`), never in frontend.
- `X-Content-Type-Options: nosniff` + `Referrer-Policy` headers via `vercel.json`.

## License
MIT — for educational use at Sabratha University.
