/**
 * auth.js — Private site auth & supervisor code generation
 * ============================================================================
 * - Supervisor Enas (admin) can generate invite codes after entering name
 * - Teacher registers with code + completes profile (name/title/subjects/years)
 * - Private site: nothing visible until logged in
 * - Session stored in localStorage
 * ========================================================================== */

const SESSION_KEY = 'sabratha_session_v2';

let currentProfile = null;

function uid() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export function generateCode(prefix = 'SAB') {
  return `${prefix}-${uid()}-${uid().slice(0, 4)}`;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function setSession(profile) {
  if (!profile) { localStorage.removeItem(SESSION_KEY); currentProfile = null; return; }
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  currentProfile = profile;
}
export function clearSession() { setSession(null); }

export function getCurrentProfile() {
  if (currentProfile) return currentProfile;
  currentProfile = getSession();
  return currentProfile;
}

export function isAdmin() {
  const p = getCurrentProfile();
  return p && p.role === 'admin';
}
export function isTeacher() {
  const p = getCurrentProfile();
  return p && p.role === 'teacher';
}
export function isLoggedIn() {
  return !!getCurrentProfile();
}

// Supabase helpers — passed via init
let deps = null; // { db, t, toast }

export function initAuth(dependencies) {
  deps = dependencies;
}

// Try to restore session and refresh from DB
export async function restoreSession() {
  const sess = getSession();
  if (!sess) return null;
  // verify still exists in DB
  if (deps?.db?.fetchProfileByCode) {
    const { data } = await deps.db.fetchProfileByCode(sess.code);
    if (data) {
      currentProfile = data;
      setSession(data);
      return data;
    } else {
      clearSession();
      return null;
    }
  }
  currentProfile = sess;
  return sess;
}

// Admin creates invite code for teacher
export async function createInvite({ forName, createdBy }) {
  if (!deps?.db) throw new Error('DB not ready');
  const code = generateCode('ELT');
  const { data, error } = await deps.db.createInvite({
    code,
    forName: forName || 'أستاذ جديد',
    role: 'teacher',
    createdBy: createdBy || null,
  });
  if (error) throw error;
  return data;
}

// Teacher redeems code + creates profile
export async function redeemInvite({ code, fullName, title, subjects, academicYear }) {
  if (!deps?.db) throw new Error('DB not ready');
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) throw new Error(deps.t('err_code_required'));

  // Check invite exists and not used; also allow direct code as login if profile already exists
  const { data: existingProfile } = await deps.db.fetchProfileByCode(normalized);
  if (existingProfile) {
    // Already a profile with this code — treat as login
    setSession(existingProfile);
    return existingProfile;
  }

  const { data: invite, error: invErr } = await deps.db.fetchInvite(normalized);
  if (invErr || !invite) throw new Error(deps.t('err_code_invalid'));
  if (invite.used) throw new Error(deps.t('err_code_used'));

  // Create teacher profile
  const { data: profile, error: pErr } = await deps.db.createProfile({
    code: normalized,
    role: 'teacher',
    fullName: fullName || invite.for_name,
    title: title || '',
    subjects: subjects || '',
    academicYear: academicYear || '',
    createdBy: invite.created_by,
  });
  if (pErr) throw pErr;

  // Mark invite used
  await deps.db.markInviteUsed(normalized, profile.id);

  setSession(profile);
  return profile;
}

// Supervisor login via known code (ENAS-SUPERVISOR or admin code)
export async function loginAsAdmin({ code }) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) throw new Error(deps.t('err_code_required'));
  const { data, error } = await deps.db.fetchProfileByCode(normalized);
  if (error || !data) throw new Error(deps.t('err_code_invalid'));
  if (data.role !== 'admin') throw new Error(deps.t('err_not_admin'));
  setSession(data);
  return data;
}

// Update own profile (after onboarding)
export async function updateProfile({ code, updates }) {
  const { data, error } = await deps.db.updateProfile(code, updates);
  if (error) throw error;
  setSession(data);
  return data;
}

export function logout() {
  clearSession();
  location.reload();
}
