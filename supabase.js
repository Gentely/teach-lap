/**
 * supabase.js — Supabase configuration & data layer
 * ============================================================================
 * SABRATHA ELT Tech-Assistant (مساعد التدريس التفاعلي — جامعة صبراتة)
 * Sabratha University — Faculty of Arts & Education — Department of English
 * ----------------------------------------------------------------------------
 * Handles all database operations:
 *   - profiles & invites (private mode: supervisor Enas + teachers)
 *   - courses, lectures, analyses, reflections, students, attendance, grades
 * ========================================================================== */

// ⚙️ ---- Supabase credentials ----
export const SUPABASE_URL = 'https://revmwbfytjbukjccswmb.supabase.co'; // ✅ Supabase project URL
export const SUPABASE_ANON_KEY = 'sb_publishable_GnayppXIRyI1NqoR35EASg_6qsA71bQ'; // ✅ publishable (anon) key
// ⚙️ ------------------------------

const SUPABASE_TABLES = {
  profiles: 'profiles',
  invites: 'invites',
  courses: 'courses',
  lectures: 'lectures',
  analyses: 'analyses',
  comments: 'comments',
  reflections: 'reflections',
  students: 'students',
  attendance: 'attendance',
  grade_items: 'grade_items',
  grades: 'grades',
};

let client = null;

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
 * Profiles & Invites (private mode)
 * ======================================================================== */

export async function fetchProfileByCode(code) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.profiles).select('*').eq('code', code).maybeSingle());
}

export async function fetchProfiles({ role = null } = {}) {
  const db = requireClient();
  let q = db.from(SUPABASE_TABLES.profiles).select('*').order('created_at', { ascending: true });
  if (role) q = q.eq('role', role);
  const { data, error } = await safe(q);
  return { data: data || [], error };
}

export async function createProfile({ code, role, fullName, title, subjects, academicYear, email, createdBy }) {
  const db = requireClient();
  return safe(
    db.from(SUPABASE_TABLES.profiles).insert({
      code, role, full_name: fullName, title: title || null, subjects: subjects || null, academic_year: academicYear || null, email: email || null, created_by: createdBy || null,
    }).select().single()
  );
}

export async function updateProfile(code, updates) {
  const db = requireClient();
  const patch = {};
  if (updates.fullName != null) patch.full_name = updates.fullName;
  if (updates.title != null) patch.title = updates.title;
  if (updates.subjects != null) patch.subjects = updates.subjects;
  if (updates.academicYear != null) patch.academic_year = updates.academicYear;
  if (updates.email != null) patch.email = updates.email;
  return safe(db.from(SUPABASE_TABLES.profiles).update(patch).eq('code', code).select().single());
}

export async function createInvite({ code, forName, role, createdBy }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.invites).insert({ code, for_name: forName, role: role || 'teacher', created_by: createdBy || null }).select().single());
}

export async function fetchInvite(code) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.invites).select('*').eq('code', code).maybeSingle());
}

export async function fetchInvites() {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.invites).select('*').order('created_at', { ascending: false }));
}

export async function markInviteUsed(code, usedBy) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.invites).update({ used: true, used_by: usedBy }).eq('code', code).select().single());
}

/* ==========================================================================
 * Courses
 * ======================================================================== */

export async function saveCourse({ title, description, ownerId }) {
  const db = requireClient();
  const { data, error } = await safe(
    db.from(SUPABASE_TABLES.courses).insert({ title, description: description || null, owner_id: ownerId || null }).select().single()
  );
  return { data, error };
}

export async function fetchCourses({ ownerId = null } = {}) {
  const db = requireClient();
  let q = db.from(SUPABASE_TABLES.courses).select('id, title, description, owner_id, created_at').order('created_at', { ascending: true });
  if (ownerId) q = q.eq('owner_id', ownerId);
  const { data, error } = await safe(q);
  return { data: data || [], error };
}

export async function deleteCourse(courseId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.courses).delete().eq('id', courseId));
}

/* ==========================================================================
 * Lectures
 * ======================================================================== */

export async function saveLecture({ title, sourceText, outputLanguage, courseId, lectureDate, lectureTime, ownerId }) {
  const db = requireClient();
  const { data, error } = await safe(
    db.from(SUPABASE_TABLES.lectures).insert({
      title: title || 'Untitled lecture',
      source_text: sourceText,
      output_language: outputLanguage || 'ar',
      course_id: courseId || null,
      lecture_date: lectureDate || null,
      lecture_time: lectureTime || null,
      owner_id: ownerId || null,
    }).select().single()
  );
  return { data, error };
}

export async function fetchLectures({ limit = 50, courseId = null, ownerId = null } = {}) {
  const db = requireClient();
  let query = db.from(SUPABASE_TABLES.lectures).select('id, title, source_text, output_language, course_id, lecture_date, lecture_time, owner_id, created_at').order('lecture_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(limit);
  if (courseId) query = query.eq('course_id', courseId);
  if (ownerId) query = query.eq('owner_id', ownerId);
  const { data, error } = await safe(query);
  return { data: data || [], error };
}

export async function deleteLecture(lectureId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.lectures).delete().eq('id', lectureId));
}

/* ==========================================================================
 * Analyses
 * ======================================================================== */

export async function saveAnalysis(lectureId, analysis, model) {
  const db = requireClient();
  const { data, error } = await safe(
    db.from(SUPABASE_TABLES.analyses).insert({
      lecture_id: lectureId,
      summary: analysis.summary || '',
      core_concepts: analysis.core_concepts || [],
      key_takeaways: analysis.key_takeaways || [],
      libyan_applications: analysis.libyan_applications || [],
      scenario_qa: analysis.scenario_qa || [],
      reflection_tasks: analysis.reflection_tasks || [],
      discussion_questions: analysis.discussion_questions || [],
      model: model || null,
    }).select().single()
  );
  return { data, error };
}

export async function fetchAnalysis(lectureId) {
  const db = requireClient();
  const { data, error } = await safe(db.from(SUPABASE_TABLES.analyses).select('*').eq('lecture_id', lectureId).order('created_at', { ascending: false }).limit(1).maybeSingle());
  return { data, error };
}

/* ==========================================================================
 * Comments (kept for backward compat, but UI removed)
 * ======================================================================== */

export async function addComment({ lectureId, authorName, authorRole, content }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.comments).insert({ lecture_id: lectureId, author_name: authorName, author_role: authorRole === 'professor' ? 'professor' : 'student', content }).select().single());
}
export async function fetchComments(lectureId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.comments).select('id, author_name, author_role, content, created_at').eq('lecture_id', lectureId).order('created_at', { ascending: true }));
}

/* ==========================================================================
 * Reflections
 * ======================================================================== */

export async function saveReflection({ lectureId, taskIndex, taskTitle, authorName, response }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.reflections).insert({ lecture_id: lectureId, task_index: taskIndex ?? 0, task_title: taskTitle || null, author_name: authorName || 'طالب', response }).select().single());
}
export async function fetchReflections(lectureId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.reflections).select('id, task_index, task_title, author_name, response, created_at').eq('lecture_id', lectureId).order('created_at', { ascending: false }));
}

/* ==========================================================================
 * Students
 * ======================================================================== */

export async function addStudent({ courseId, fullName, studentNumber, ownerId }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.students).insert({ course_id: courseId, full_name: fullName, student_number: studentNumber || null, owner_id: ownerId || null }).select().single());
}
export async function fetchStudents(courseId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.students).select('id, course_id, full_name, student_number, owner_id, created_at').eq('course_id', courseId).order('full_name', { ascending: true }));
}
export async function deleteStudent(studentId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.students).delete().eq('id', studentId));
}

/* ==========================================================================
 * Attendance & Grades
 * ======================================================================== */

export async function upsertAttendance({ studentId, courseId, sessionDate, status }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.attendance).upsert({ student_id: studentId, course_id: courseId, session_date: sessionDate, status: status || 'present' }, { onConflict: 'student_id,course_id,session_date' }).select().single());
}
export async function fetchAttendance({ courseId, sessionDate = null }) {
  const db = requireClient();
  let query = db.from(SUPABASE_TABLES.attendance).select('id, student_id, course_id, session_date, status').eq('course_id', courseId);
  if (sessionDate) query = query.eq('session_date', sessionDate);
  return safe(query);
}
export async function addGradeItem({ courseId, category, title, maxScore }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.grade_items).insert({ course_id: courseId, category, title, max_score: maxScore ?? 100 }).select().single());
}
export async function fetchGradeItems(courseId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.grade_items).select('id, course_id, category, title, max_score, created_at').eq('course_id', courseId).order('created_at', { ascending: true }));
}
export async function deleteGradeItem(itemId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.grade_items).delete().eq('id', itemId));
}
export async function upsertGrade({ itemId, studentId, score }) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.grades).upsert({ item_id: itemId, student_id: studentId, score: score === '' || score == null ? null : Number(score) }, { onConflict: 'item_id,student_id' }).select().single());
}
export async function fetchGrades(itemIds) {
  const db = requireClient();
  if (!itemIds || !itemIds.length) return { data: [], error: null };
  return safe(db.from(SUPABASE_TABLES.grades).select('id, item_id, student_id, score').in('item_id', itemIds));
}
export async function deleteGrade(gradeId) {
  const db = requireClient();
  return safe(db.from(SUPABASE_TABLES.grades).delete().eq('id', gradeId));
}
