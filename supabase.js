/**
 * supabase.js — Supabase configuration & data layer
 * ============================================================================
 * SABRATHA ELT Tech-Assistant (مساعد تكنولوجيا تدريس اللغة الإنجليزية)
 * Sabratha University — Faculty of Arts & Education — Department of English
 * ----------------------------------------------------------------------------
 * Handles all database operations: saving & fetching lectures, AI analyses,
 * discussion-board comments and student reflections.
 *
 * SETUP — paste your Supabase project credentials below (Supabase →
 * Project Settings → API). The anon key is safe to expose in the browser as
 * long as Row Level Security policies are in place (see supabase/schema.sql).
 *
 * This module is imported by app.js as an ES module and expects the Supabase
 * UMD client (window.supabase) to be loaded from CDN in index.html.
 * ========================================================================== */

// ⚙️ ---- Supabase credentials (fill these in after creating your project) ----
export const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g. https://abcdefgh.supabase.co
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // "anon public" key
// ⚙️ --------------------------------------------------------------------------

const SUPABASE_TABLES = {
  lectures: 'lectures',
  analyses: 'analyses',
  comments: 'comments',
  reflections: 'reflections',
};

let client = null;

/** True when real credentials have been provided. */
export function isConfigured() {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.startsWith('http') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_URL.includes('YOUR_') &&
    !SUPABASE_ANON_KEY.includes('YOUR_')
  );
}

/** Create (once) and return the Supabase client, or null when unconfigured. */
export function initSupabase() {
  if (client) return client;
  if (!isConfigured()) return null;
  const factory = window.supabase?.createClient;
  if (typeof factory !== 'function') {
    console.warn('[supabase.js] Supabase UMD client not loaded yet.');
    return null;
  }
  client = factory(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

function requireClient() {
  const c = initSupabase();
  if (!c) throw new Error('Supabase is not configured. Fill in SUPABASE_URL and SUPABASE_ANON_KEY in supabase.js.');
  return c;
}

/** Run a query and return { data, error } — never throws. */
async function safe(promise) {
  try {
    const { data, error } = await promise;
    if (error) {
      console.warn('[supabase.js]', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.warn('[supabase.js]', err.message);
    return { data: null, error: err };
  }
}

/* ==========================================================================
 * Lectures
 * ======================================================================== */

/** Save a new lecture. Returns { data: lecture, error }. */
export async function saveLecture({ title, sourceText, outputLanguage }) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.lectures)
      .insert({
        title: title || 'Untitled lecture',
        source_text: sourceText,
        output_language: outputLanguage || 'ar',
      })
      .select()
      .single()
  );
  return { data, error };
}

/** Fetch newest lectures first (default 30). Returns { data: lectures[], error }. */
export async function fetchLectures(limit = 30) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.lectures)
      .select('id, title, source_text, output_language, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
  );
  return { data: data || [], error };
}

/** Delete a lecture (analyses/comments/reflections cascade via FK). */
export async function deleteLecture(lectureId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.lectures).delete().eq('id', lectureId));
}

/* ==========================================================================
 * AI analyses (generated pedagogical content)
 * ======================================================================== */

/** Persist the Gemini-generated analysis for a lecture. */
export async function saveAnalysis(lectureId, analysis, model) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.analyses)
      .insert({
        lecture_id: lectureId,
        summary: analysis.summary || '',
        core_concepts: analysis.core_concepts || [],
        key_takeaways: analysis.key_takeaways || [],
        libyan_applications: analysis.libyan_applications || [],
        scenario_qa: analysis.scenario_qa || [],
        reflection_tasks: analysis.reflection_tasks || [],
        discussion_questions: analysis.discussion_questions || [],
        model: model || null,
      })
      .select()
      .single()
  );
  return { data, error };
}

/** Load the latest analysis for a lecture. Returns { data: analysis|null, error }. */
export async function fetchAnalysis(lectureId) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.analyses)
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  return { data, error };
}

/* ==========================================================================
 * Discussion board (comments)
 * ======================================================================== */

/** Post a comment on a lecture. Returns { data: comment, error }. */
export async function addComment({ lectureId, authorName, authorRole, content }) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.comments)
      .insert({
        lecture_id: lectureId,
        author_name: authorName,
        author_role: authorRole === 'professor' ? 'professor' : 'student',
        content,
      })
      .select()
      .single()
  );
  return { data, error };
}

/** Fetch comments for a lecture, oldest first. Returns { data: comments[], error }. */
export async function fetchComments(lectureId) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.comments)
      .select('id, author_name, author_role, content, created_at')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: true })
  );
  return { data: data || [], error };
}

/* ==========================================================================
 * Student reflections
 * ======================================================================== */

/** Save a student's response to a reflection task. */
export async function saveReflection({ lectureId, taskIndex, taskTitle, authorName, response }) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.reflections)
      .insert({
        lecture_id: lectureId,
        task_index: taskIndex ?? 0,
        task_title: taskTitle || null,
        author_name: authorName || 'طالب',
        response,
      })
      .select()
      .single()
  );
  return { data, error };
}

/** Fetch saved reflections for a lecture (newest first per task). */
export async function fetchReflections(lectureId) {
  const db = requireClient();
  const { data, error } = await safe(
    db
      .from(SUPABASE_TABLES.reflections)
      .select('id, task_index, task_title, author_name, response, created_at')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false })
  );
  return { data: data || [], error };
}
