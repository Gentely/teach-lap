/**
 * api/generate.js — Vercel Serverless Function
 * ============================================================================
 * SABRATHA ELT Tech-Assistant (مساعد تكنولوجيا تدريس اللغة الإنجليزية)
 * Sabratha University — Faculty of Arts & Education — Department of English
 * ----------------------------------------------------------------------------
 * Connects to the OFFICIAL Google Gemini API (Generative Language API) and
 * turns raw lecture content into pedagogical material for the course
 * "Employing Technology in ELT":
 *   1. Pedagogical summary + core concepts (SAMR, TPACK, Blended Learning, …)
 *   2. Key takeaways + practical applications for Libyan classrooms
 *   3. ELT scenario-based Q&A with model answers
 *   4. Student reflection tasks + discussion questions
 *
 * SECURITY: The API key is read ONLY from the server-side environment
 * variable `process.env.GEMINI_API_KEY` — it is never exposed to the browser.
 * ========================================================================== */

const GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash';
// Fallbacks tried automatically if the primary model is unavailable/retired.
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash-lite'];
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Read credentials at request time so env changes are always picked up. */
const getApiKey = () => process.env.GEMINI_API_KEY || '';
const getModel = () => process.env.GEMINI_MODEL || GEMINI_MODEL_DEFAULT;

const MIN_CHARS = 40;
const MAX_CHARS = 80000;

const LANG_INSTRUCTIONS = {
  ar: 'Write ALL output fields in Modern Standard Arabic (academic, teacher-education style).',
  en: 'Write ALL output fields in clear academic English (teacher-education style).',
  bilingual:
    'Write ALL output fields bilingually: first in Modern Standard Arabic, then a line "— EN —", then the English version.',
};

/* --------------------------------------------------------------------------
 * Prompt engineering
 * ------------------------------------------------------------------------ */
function buildPrompt({ title, text, outputLanguage }) {
  const langInstruction = LANG_INSTRUCTIONS[outputLanguage] || LANG_INSTRUCTIONS.ar;

  return `You are the "SABRATHA ELT Tech-Assistant", an expert professor of
Educational Technology and ELT (English Language Teaching) at the Faculty of
Arts and Education, Sabratha University (Libya). You design teacher-education
material for the university course "Employing Technology in ELT".

Your students are Libyan university students and professors in the Department
of English. Ground every practical suggestion in REAL Libyan classroom
conditions: large classes, limited or shared devices, intermittent internet,
interactive whiteboards or data projectors when available, smartphones as the
most common personal device, and local curriculum / exam constraints.

${langInstruction}

Analyze the lecture below and produce a JSON object with EXACTLY these fields:

1. "summary" (string) — A pedagogical summary of the lecture (220–350 words):
   main argument, how technology should be employed in ELT, and the underlying
   learning theories. Explicitly connect to frameworks mentioned in the lecture
   (SAMR, TPACK, Blended Learning, Connectivism, UDL, …) when relevant.

2. "core_concepts" (array of 5–8 objects) — The essential concepts of the
   lecture. Each object:
     - "term": the concept name (e.g. "SAMR Model", "TPACK")
     - "definition": a precise, exam-ready definition (1–3 sentences)
     - "classroom_link": one concrete ELT classroom example showing the concept
       in action (preferably feasible in Libyan schools/universities)

3. "key_takeaways" (array of 5–8 strings) — Short, memorable takeaways a
   student should remember for the exam AND for teaching practice.

4. "libyan_applications" (array of 4–6 strings) — Practical applications
   tailored to Libyan classrooms: each item is a ready-to-use teaching idea
   mentioning the tool/technique, the ELT skill it serves (reading, writing,
   listening, speaking, grammar, vocabulary), and how it fits limited-resource
   settings.

5. "scenario_qa" (array of 4–6 objects) — Scenario-based exam-style questions
   with model answers. Each object:
     - "question": a realistic teaching scenario followed by a clear question
       (mention the teacher, class size, available technology, and the dilemma)
     - "model_answer": a strong model answer (120–200 words) that references the
       relevant framework(s), gives step-by-step classroom procedure, and
       anticipates limitations in the Libyan context.

6. "reflection_tasks" (array of 3–5 objects) — Interactive student reflection
   tasks. Each object:
     - "title": short task title
     - "prompt": the full reflection prompt (open, personal, critical thinking)
     - "type": one of "individual", "group", "discussion"

7. "discussion_questions" (array of 3–5 strings) — Open questions for the
   course discussion board that invite debate among students and professors.

Return ONLY the JSON object (no markdown fences, no commentary).

LECTURE TITLE:
${title || '(untitled)'}

LECTURE CONTENT:
"""
${text}
"""
`;
}

/* --------------------------------------------------------------------------
 * Strict JSON schema so the model returns reliably machine-readable output
 * ------------------------------------------------------------------------ */
const RESPONSE_SCHEMA = {
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
          classroom_link: { type: 'string' },
        },
        required: ['term', 'definition', 'classroom_link'],
      },
    },
    key_takeaways: { type: 'array', items: { type: 'string' } },
    libyan_applications: { type: 'array', items: { type: 'string' } },
    scenario_qa: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          model_answer: { type: 'string' },
        },
        required: ['question', 'model_answer'],
      },
    },
    reflection_tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          prompt: { type: 'string' },
          type: { type: 'string', enum: ['individual', 'group', 'discussion'] },
        },
        required: ['title', 'prompt', 'type'],
      },
    },
    discussion_questions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'summary',
    'core_concepts',
    'key_takeaways',
    'libyan_applications',
    'scenario_qa',
    'reflection_tasks',
    'discussion_questions',
  ],
};

/* --------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function str(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

/** Extract a JSON object even if the model wrapped it in ```json fences. */
function extractJson(raw) {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) text = fence[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(text.slice(start, end + 1));
}

/** Guarantee every field exists with the right shape before sending to client. */
function normalize(data) {
  return {
    summary: str(data.summary),
    core_concepts: arr(data.core_concepts).map((c) => ({
      term: str(c?.term),
      definition: str(c?.definition),
      classroom_link: str(c?.classroom_link ?? c?.relevance ?? c?.example),
    })),
    key_takeaways: arr(data.key_takeaways).map(str),
    libyan_applications: arr(data.libyan_applications ?? data.applications ?? data.practical_applications).map(str),
    scenario_qa: arr(data.scenario_qa ?? data.scenarios).map((q) => ({
      question: str(q?.question),
      model_answer: str(q?.model_answer ?? q?.answer),
    })),
    reflection_tasks: arr(data.reflection_tasks ?? data.reflections).map((r) => ({
      title: str(r?.title),
      prompt: str(r?.prompt),
      type: ['individual', 'group', 'discussion'].includes(r?.type) ? r.type : 'individual',
    })),
    discussion_questions: arr(data.discussion_questions).map(str),
  };
}

/* --------------------------------------------------------------------------
 * Main handler
 * ------------------------------------------------------------------------ */
export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST requests are supported.');
  }

  const apiKey = getApiKey();
  const model = getModel();

  if (!apiKey) {
    return fail(
      res,
      500,
      'MISSING_API_KEY',
      'GEMINI_API_KEY is not configured on the server. Add it under Vercel → Project → Settings → Environment Variables.'
    );
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return fail(res, 400, 'INVALID_JSON', 'Request body must be valid JSON.');
    }
  }
  body = body || {};

  const title = str(body.title).slice(0, 200);
  const text = String(body.text ?? '');
  const trimmed = text.trim();
  const outputLanguage = ['ar', 'en', 'bilingual'].includes(body.outputLanguage)
    ? body.outputLanguage
    : 'ar';

  if (trimmed.length < MIN_CHARS) {
    return fail(res, 400, 'TEXT_TOO_SHORT', `Lecture text must be at least ${MIN_CHARS} characters.`);
  }
  if (trimmed.length > MAX_CHARS) {
    return fail(res, 400, 'TEXT_TOO_LONG', `Lecture text must not exceed ${MAX_CHARS} characters.`);
  }

  // Helper to call one model
  async function callGemini(targetModel) {
    const payload = {
      contents: [{ role: 'user', parts: [{ text: buildPrompt({ title, text: trimmed, outputLanguage }) }] }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 12288,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    };
    const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(targetModel)}:generateContent`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    });
    const result = await upstream.json().catch(() => ({}));
    return { upstream, result };
  }

  function isModelUnavailableMessage(msg) {
    return /is no longer available|has been removed|not found|Unsupported model|does not exist/i.test(msg || '');
  }

  try {
    let tried = [];
    let currentModel = model;
    let upstream, result;

    // Try primary + fallbacks sequentially
    const candidates = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
    for (const m of candidates) {
      tried.push(m);
      ({ upstream, result } = await callGemini(m));
      currentModel = m;
      if (upstream.ok) break;
      const apiMsg = result?.error?.message || '';
      // Only retry on model-unavailability; otherwise surface the real error
      if (!isModelUnavailableMessage(apiMsg)) break;
      // otherwise continue to next fallback
    }

    if (!upstream.ok) {
      const status = upstream.status;
      const apiMessage = result?.error?.message || 'Unknown Gemini API error';
      if (status === 400 && /API key/i.test(apiMessage)) {
        return fail(res, 401, 'INVALID_API_KEY', 'The Gemini API key is invalid. Check GEMINI_API_KEY in Vercel.');
      }
      if (status === 403) {
        return fail(res, 403, 'FORBIDDEN', 'Gemini API rejected the request (forbidden). Check API key permissions.');
      }
      if (status === 429) {
        return fail(res, 429, 'RATE_LIMIT', 'Gemini API rate limit reached. Please wait a moment and try again.');
      }
      const hint = tried.length > 1 ? ` (tried: ${tried.join(', ')})` : '';
      return fail(res, 502, 'GEMINI_ERROR', `Gemini API error: ${apiMessage}${hint}`);
    }

    const candidate = result?.candidates?.[0];
    const raw = (candidate?.content?.parts || []).map((p) => p?.text || '').join('').trim();

    if (!raw) {
      const blockReason = result?.promptFeedback?.blockReason || candidate?.finishReason || 'empty response';
      return fail(res, 502, 'EMPTY_RESPONSE', `Gemini returned no content (${blockReason}). Try revising the lecture text.`);
    }

    let data;
    try {
      data = normalize(extractJson(raw));
    } catch (err) {
      return fail(res, 502, 'PARSE_ERROR', `Could not parse Gemini output as JSON: ${err.message}`);
    }

    return res.status(200).json({
      success: true,
      data,
      meta: {
        model: currentModel,
        requestedModel: model,
        generatedAt: new Date().toISOString(),
        chars: trimmed.length,
        outputLanguage,
      },
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return fail(
      res,
      timedOut ? 504 : 500,
      timedOut ? 'TIMEOUT' : 'SERVER_ERROR',
      timedOut ? 'Gemini API took too long to respond. Please try again.' : `Server error: ${err.message}`
    );
  }
}
