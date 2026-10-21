/**
 * api/generate.js — Vercel Serverless Function (Phase 1 — Minimal Clean)
 * SABRATHA ELT Tech-Assistant
 * Calls Google Gemini securely via process.env.GEMINI_API_KEY.
 * No Supabase, no auth — Phase 1 only does lecture → pedagogical JSON.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const FALLBACKS = ['gemini-3-flash', 'gemini-3-pro', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const getKey = () => process.env.GEMINI_API_KEY || '';
const MIN = 40;
const MAX = 80000;

const LANG = {
  ar: 'Write ALL output fields in Modern Standard Arabic (academic, teacher-education style).',
  en: 'Write ALL output fields in clear academic English.',
  bilingual: 'Write ALL output fields bilingually: Arabic first, then line "— EN —", then English.'
};

const SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    core_concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          definition: { type: 'string' },
          classroom_link: { type: 'string' }
        },
        required: ['term', 'definition', 'classroom_link']
      }
    },
    key_takeaways: { type: 'array', items: { type: 'string' } },
    libyan_applications: { type: 'array', items: { type: 'string' } },
    scenario_qa: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          model_answer: { type: 'string' }
        },
        required: ['question', 'model_answer']
      }
    },
    reflection_tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          prompt: { type: 'string' },
          type: { type: 'string', enum: ['individual', 'group', 'discussion'] }
        },
        required: ['title', 'prompt', 'type']
      }
    },
    discussion_questions: { type: 'array', items: { type: 'string' } }
  },
  required: ['summary', 'core_concepts', 'key_takeaways', 'libyan_applications', 'scenario_qa', 'reflection_tasks', 'discussion_questions']
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}
function fail(res, status, message, code) {
  return res.status(status).json({ success: false, error: { code: code || 'ERROR', message } });
}
function buildPrompt({ title, text, outputLanguage }) {
  const lang = LANG[outputLanguage] || LANG.ar;
  return `You are SABRATHA ELT Tech-Assistant, professor of Educational Technology & ELT at Sabratha University (Libya) for course "Employing Technology in ELT". Students are Libyan English Dept. Ground practical ideas in Libyan classrooms: large classes, limited devices, intermittent internet, smartphones most common.\n\n${lang}\n\nProduce EXACT JSON with fields:\n1. \"summary\" (220-350 words) — pedagogical summary relating to SAMR/TPACK/Blended etc when relevant.\n2. \"core_concepts\" (5-8) {term, definition, classroom_link}\n3. \"key_takeaways\" (5-8 strings)\n4. \"libyan_applications\" (4-6 strings) each: tool + ELT skill + fit for limited resources.\n5. \"scenario_qa\" (4-6) {question, model_answer 120-200 words}\n6. \"reflection_tasks\" (3-5) {title, prompt, type: individual|group|discussion}\n7. \"discussion_questions\" (3-5 strings)\nReturn ONLY JSON (no fences).\n\nTITLE: ${title || '(untitled)'}\nCONTENT:\n\"\"\"\n${text}\n\"\"\"\n`;
}
function extractJson(raw) {
  let t = raw.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (m) t = m[1];
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('No JSON in response');
  return JSON.parse(t.slice(s, e + 1));
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return fail(res, 405, 'Only POST allowed', 'METHOD_NOT_ALLOWED');

  // --- Simple access gate: must have valid cookie or header from /api/verify ---
  const accessCode = (process.env.ACCESS_CODE || 'E-ENGLISH').trim();
  const cookie = req.headers.cookie || '';
  const headerCode = String(req.headers['x-access-code'] || '').trim();
  const hasCookie = cookie.includes('sabratha_access=1');
  const headerOk = headerCode.toUpperCase() === accessCode.toUpperCase();
  if (!hasCookie && !headerOk) {
    // also allow code sent in body as fallback (for old clients)
    let bodyTmp = req.body;
    if (typeof bodyTmp === 'string') { try { bodyTmp = JSON.parse(bodyTmp); } catch {} }
    const bodyCode = String(bodyTmp?.accessCode || '').trim();
    if (bodyCode.toUpperCase() !== accessCode.toUpperCase()) {
      return fail(res, 403, 'غير مصرح — أدخل كود الدخول E-ENGLISH أولاً.', 'NOT_AUTHORIZED');
    }
  }

  const key = getKey();
  if (!key) return fail(res, 500, 'GEMINI_API_KEY not configured on server. Add it in Vercel → Settings → Environment Variables.', 'MISSING_API_KEY');

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return fail(res, 400, 'Invalid JSON body', 'INVALID_JSON'); }
  }
  body = body || {};
  const title = String(body.title || '').trim().slice(0, 200);
  const text = String(body.text || '').trim();
  const outputLanguage = ['ar', 'en', 'bilingual'].includes(body.outputLanguage) ? body.outputLanguage : 'ar';

  if (text.length < MIN) return fail(res, 400, `Text too short — minimum ${MIN} chars`, 'TEXT_TOO_SHORT');
  if (text.length > MAX) return fail(res, 400, `Text too long — maximum ${MAX} chars`, 'TEXT_TOO_LONG');

  async function call(model) {
    const payload = {
      contents: [{ role: 'user', parts: [{ text: buildPrompt({ title, text, outputLanguage }) }] }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 12288,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA
      }
    };
    const url = `${ENDPOINT}/${encodeURIComponent(model)}:generateContent`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000)
    });
    const j = await r.json().catch(() => ({}));
    return { r, j };
  }

  const candidates = [DEFAULT_MODEL, ...FALLBACKS.filter(m => m !== DEFAULT_MODEL)];
  try {
    let last = null;
    for (const m of candidates) {
      const { r, j } = await call(m);
      last = { r, j, m };
      if (r.ok) {
        const raw = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
        if (!raw) return fail(res, 502, 'Gemini returned empty response', 'EMPTY_RESPONSE');
        let data;
        try { data = extractJson(raw); } catch (e) { return fail(res, 502, `Parse error: ${e.message}`, 'PARSE_ERROR'); }
        return res.status(200).json({
          success: true,
          data,
          meta: { model: m, requestedModel: DEFAULT_MODEL, generatedAt: new Date().toISOString(), chars: text.length, outputLanguage }
        });
      }
      const msg = j?.error?.message || '';
      if (!/not found|does not exist|no longer available|Unsupported/i.test(msg)) break;
    }
    const status = last?.r?.status || 502;
    const msg = last?.j?.error?.message || 'Unknown Gemini error';
    if (status === 401 || status === 403 || /API key/i.test(msg)) return fail(res, 401, 'Invalid Gemini API key', 'INVALID_API_KEY');
    if (status === 429) return fail(res, 429, 'Gemini rate limit — try again shortly', 'RATE_LIMIT');
    return fail(res, 502, `Gemini error: ${msg}`, 'GEMINI_ERROR');
  } catch (e) {
    const t = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return fail(res, t ? 504 : 500, t ? 'Gemini timeout — try again' : `Server error: ${e.message}`, t ? 'TIMEOUT' : 'SERVER_ERROR');
  }
}
