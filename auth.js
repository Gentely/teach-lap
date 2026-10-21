/**
 * auth.js — Private site auth & supervisor code generation
 * - Supervisor Enas (admin) can generate invite codes after entering name
 * - Teacher registers with code + completes profile
 * - Private site: nothing visible until logged in
 * - Works even before Supabase SQL is run (local fallback for ENAS)
 */

const SESSION_KEY = 'sabratha_session_v2';
const LOCAL_INVITES_KEY = 'sabratha_invites_local';
const LOCAL_PROFILES_KEY = 'sabratha_profiles_local';

let currentProfile = null;

const FALLBACK_ADMIN = {
  id: '00000000-0000-0000-0000-000000000001',
  code: 'ENAS-SUPERVISOR',
  role: 'admin',
  full_name: 'Enas Mesbah Omar — إيناس مصباح عمر',
  fullName: 'Enas Mesbah Omar — إيناس مصباح عمر',
  title: 'المشرفة العامة — أستاذة',
  subjects: 'Employing Technology in ELT — وجميع مقررات القسم',
  academic_year: 'جميع السنوات',
  academicYear: 'جميع السنوات',
  schedule: 'حسب الجدول الدراسي',
  created_at: new Date().toISOString(),
};

function uid() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
export function generateCode(prefix = 'ELT') {
  return `${prefix}-${uid()}-${uid().slice(0, 4)}`;
}

// --- storage abstraction that survives localStorage "Access denied" on Samsung/Chrome ---
let memStore = {};
function safeGet(k){ try{ return localStorage.getItem(k); }catch{ try{ return sessionStorage.getItem(k); }catch{ try{ const m=document.cookie.match(new RegExp('(?:^|; )'+k.replace(/[-.+*^$|()\[\]{}]/g,'\\$&')+'=([^;]*)')); return m? decodeURIComponent(m[1]): null; }catch{ return memStore[k]||null; } } } }
function safeSet(k,v){ try{ localStorage.setItem(k,v); return; }catch{} try{ sessionStorage.setItem(k,v); return; }catch{} try{ document.cookie=k+'='+encodeURIComponent(v)+'; path=/; max-age=31536000; SameSite=Lax'; memStore[k]=v; return; }catch{} memStore[k]=v; }
function safeRemove(k){ try{ localStorage.removeItem(k); }catch{} try{ sessionStorage.removeItem(k); }catch{} try{ document.cookie=k+'=; path=/; max-age=0'; }catch{} delete memStore[k]; }
// expose fallback session for direct UI mode
if(typeof window!=='undefined') window._fallbackSession = window._fallbackSession || null;
function getLocalInvites() {
  try { const v=safeGet(LOCAL_INVITES_KEY); return v? JSON.parse(v): []; } catch { return []; }
}
function setLocalInvites(arr) { try{ safeSet(LOCAL_INVITES_KEY, JSON.stringify(arr)); }catch{} }
function getLocalProfiles() {
  try { const v=safeGet(LOCAL_PROFILES_KEY); return v? JSON.parse(v): []; } catch { return []; }
}
function setLocalProfiles(arr) { try{ safeSet(LOCAL_PROFILES_KEY, JSON.stringify(arr)); }catch{} }

export function getSession() {
  try { const v=safeGet(SESSION_KEY) || (typeof window!=='undefined' && window._fallbackSession ? JSON.stringify(window._fallbackSession): null); return v? JSON.parse(v): null; } catch { return (typeof window!=='undefined' && window._fallbackSession) ? window._fallbackSession : null; }
}
export function setSession(profile) {
  if (!profile) { try{ safeRemove(SESSION_KEY); }catch{} currentProfile = null; try{ if(typeof window!=='undefined') window._fallbackSession=null; }catch{} return; }
  // successful login/login clears logout flag so next reload can restore
  try{ sessionStorage.removeItem('sabratha_logout_done'); }catch(e){}
  try{ window.__logoutJustDone=false; }catch(e){}
  const normalized = { ...profile, full_name: profile.full_name || profile.fullName || '', academic_year: profile.academic_year || profile.academicYear || '', schedule: profile.schedule || '' };
  try{ safeSet(SESSION_KEY, JSON.stringify(normalized)); }catch(e){ console.warn('setSession fallback',e.message); try{ memStore[SESSION_KEY]=JSON.stringify(normalized); }catch{} }
  try{ if(typeof window!=='undefined') window._fallbackSession=normalized; }catch{}
  currentProfile = normalized;
}
export function clearSession() { setSession(null); }
try{ if(typeof window!=='undefined') window.__clearAuthSession = clearSession; }catch(e){}
export function getCurrentProfile() {
  if (currentProfile) return currentProfile;
  currentProfile = getSession();
  return currentProfile;
}
export function isAdmin() { const p = getCurrentProfile(); return p && p.role === 'admin'; }
export function isTeacher() { const p = getCurrentProfile(); return p && p.role === 'teacher'; }
export function isLoggedIn() { return !!getCurrentProfile(); }

let deps = null;
export function initAuth(dependencies) { deps = dependencies; }

function isMissingTableError(err) {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('does not exist') || (msg.includes('relation') && msg.includes('not exist')) || msg.includes('42p01') || msg.includes('not configured') || msg.includes('supabase is not configured') || msg.includes('failed to fetch');
}

export async function restoreSession() {
  // Final logout guard: if URL is ?logout=1 or head set flag or sessionStorage logout flag, wipe session and never restore
  try{
    var _isLogout = false;
    if(typeof window!=='undefined'){
      if(window.__logoutJustDone) _isLogout=true;
      if(window.location && (window.location.href.indexOf('logout=1')>-1 || window.location.search.indexOf('logout=1')>-1)) _isLogout=true;
      try{ if(sessionStorage.getItem('sabratha_logout_done')==='1') _isLogout=true; }catch(e){}
    }
    if(_isLogout){
      clearSession();
      try{ window._fallbackSession=null; }catch(e){}
      return null;
    }
  }catch(e){}
  const sess = getSession();
  if (!sess) return null;
  // Try to verify in DB, but don't clear on DB error (table not yet created)
  if (deps?.db?.fetchProfileByCode) {
    try {
      const { data, error } = await deps.db.fetchProfileByCode(sess.code);
      if (error && isMissingTableError(error)) {
        // DB not yet set up — keep local session
        currentProfile = sess;
        return sess;
      }
      if (data) {
        currentProfile = data;
        setSession(data);
        return data;
      }
      // Not found in DB — check local profiles fallback
      const locals = getLocalProfiles();
      const localMatch = locals.find(p => p.code === sess.code);
      if (localMatch) { currentProfile = localMatch; return localMatch; }
      // If admin fallback, keep it
      if (sess.code === FALLBACK_ADMIN.code) { currentProfile = sess; return sess; }
      clearSession();
      return null;
    } catch {
      currentProfile = sess;
      return sess;
    }
  }
  currentProfile = sess;
  return sess;
}

// Admin creates invite code for teacher
export async function createInvite({ forName, createdBy }) {
  const code = generateCode('ELT');
  // Try DB first
  if (deps?.db?.createInvite) {
    try {
      const { data, error } = await deps.db.createInvite({ code, forName: forName || 'أستاذ جديد', role: 'teacher', createdBy: createdBy || null });
      if (!error && data) return data;
      // If table missing, fall through to local
      if (error && !isMissingTableError(error)) throw error;
    } catch (e) {
      if (!isMissingTableError(e)) throw e;
    }
  }
  // Local fallback
  const invites = getLocalInvites();
  const rec = { code, for_name: forName, role: 'teacher', created_by: createdBy || null, used: false, used_by: null, created_at: new Date().toISOString() };
  invites.unshift(rec);
  setLocalInvites(invites);
  return rec;
}

// Teacher redeems code + creates profile
export async function redeemInvite({ code, fullName, title, subjects, academicYear, schedule }) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) throw new Error(deps.t('err_code_required'));

  // Allow admin code to login as admin even via teacher form
  if (normalized === FALLBACK_ADMIN.code) {
    return loginAsAdmin({ code: normalized });
  }

  // Check if profile already exists (DB or local)
  if (deps?.db?.fetchProfileByCode) {
    try {
      const { data: existingProfile, error: e1 } = await deps.db.fetchProfileByCode(normalized);
      if (existingProfile) { setSession(existingProfile); return existingProfile; }
      if (e1 && !isMissingTableError(e1)) throw e1;
    } catch (e) { if (!isMissingTableError(e)) throw e; }
  }
  const locals = getLocalProfiles();
  const localExisting = locals.find(p => p.code === normalized);
  if (localExisting) { setSession(localExisting); return localExisting; }

  // Check invite
  let invite = null;
  if (deps?.db?.fetchInvite) {
    try {
      const { data, error } = await deps.db.fetchInvite(normalized);
      if (data) invite = data;
      else if (error && !isMissingTableError(error)) throw error;
    } catch (e) { if (!isMissingTableError(e)) throw e; }
  }
  if (!invite) {
    const invites = getLocalInvites();
    invite = invites.find(i => i.code === normalized);
  }
  if (!invite) {
    // fallback: if code looks like generated ELT-XXXX-XXXX, allow direct redeem even when invite not synced (local-only on admin device)
    const isEltLike = /^ELT-[A-Z0-9]{3,8}(?:-[A-Z0-9]{3,8})?$/i.test(normalized);
    if (isEltLike) {
      invite = { code: normalized, for_name: fullName || normalized, role: 'teacher', created_by: null, used: false };
    } else {
      throw new Error(deps.t('err_code_invalid'));
    }
  }
  if (invite.used) throw new Error(deps.t('err_code_used'));

  // Create teacher profile
  let profile = null;
  if (deps?.db?.createProfile) {
    try {
      const { data, error } = await deps.db.createProfile({
        code: normalized, role: 'teacher', fullName: fullName || invite.for_name, title: title || '', subjects: subjects || '', academicYear: academicYear || '', schedule: schedule || '', createdBy: invite.created_by,
      });
      if (!error && data) profile = data;
      else if (error && !isMissingTableError(error)) throw error;
    } catch (e) { if (!isMissingTableError(e)) throw e; }
  }
  if (!profile) {
    profile = { id: `local-${Date.now()}`, code: normalized, role: 'teacher', full_name: fullName || invite.for_name, fullName: fullName || invite.for_name, title: title || '', subjects: subjects || '', academic_year: academicYear || '', academicYear: academicYear || '', schedule: schedule || '', created_at: new Date().toISOString(), created_by: invite.created_by };
    const all = getLocalProfiles(); all.push(profile); setLocalProfiles(all);
    const invites = getLocalInvites(); const idx = invites.findIndex(i => i.code === normalized); if (idx >= 0) { invites[idx].used = true; setLocalInvites(invites); }
  } else {
    try { await deps.db.markInviteUsed(normalized, profile.id); } catch {}
  }

  setSession(profile);
  return profile;
}

// Supervisor login
export async function loginAsAdmin({ code }) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) throw new Error(deps.t('err_code_required'));

  // Hardcoded fallback admin — works even before SQL is run
  if (normalized === FALLBACK_ADMIN.code) {
    // Try DB first, but fallback to local
    if (deps?.db?.fetchProfileByCode) {
      try {
        const { data } = await deps.db.fetchProfileByCode(normalized);
        if (data && data.role === 'admin') { setSession(data); return data; }
      } catch {}
    }
    setSession(FALLBACK_ADMIN);
    return FALLBACK_ADMIN;
  }

  if (deps?.db?.fetchProfileByCode) {
    try {
      const { data, error } = await deps.db.fetchProfileByCode(normalized);
      if (error && isMissingTableError(error)) throw new Error(deps.t('err_code_invalid') + ' — ' + (deps.t('setup_title') || ''));
      if (error || !data) throw new Error(deps.t('err_code_invalid'));
      if (data.role !== 'admin') throw new Error(deps.t('err_not_admin'));
      setSession(data);
      return data;
    } catch (e) { throw e; }
  }
  throw new Error(deps.t('err_code_invalid'));
}

export async function updateProfile({ code, updates }) {
  if (deps?.db?.updateProfile) {
    try {
      const { data, error } = await deps.db.updateProfile(code, updates);
      if (!error && data) { setSession(data); return data; }
      if (error && !isMissingTableError(error)) throw error;
    } catch (e) { if (!isMissingTableError(e)) throw e; }
  }
  // Local fallback
  const profiles = getLocalProfiles();
  const idx = profiles.findIndex(p => p.code === code);
  if (idx >= 0) {
    if (updates.fullName != null) profiles[idx].full_name = updates.fullName;
    if (updates.title != null) profiles[idx].title = updates.title;
    if (updates.subjects != null) profiles[idx].subjects = updates.subjects;
    if (updates.academicYear != null) profiles[idx].academic_year = updates.academicYear;
    if (updates.schedule != null) profiles[idx].schedule = updates.schedule;
    setLocalProfiles(profiles);
    setSession(profiles[idx]);
    return profiles[idx];
  }
  // Also check current session fallback
  const sess = getSession();
  if (sess && sess.code === code) {
    if (updates.fullName != null) sess.full_name = updates.fullName;
    if (updates.title != null) sess.title = updates.title;
    if (updates.subjects != null) sess.subjects = updates.subjects;
    if (updates.academicYear != null) sess.academic_year = updates.academicYear;
    if (updates.schedule != null) sess.schedule = updates.schedule;
    setSession(sess);
    return sess;
  }
  throw new Error('Profile not found');
}

export function logout() { clearSession(); location.reload(); }

// Helpers for UI to fetch lists with fallback
export function getLocalInvitesList() { return getLocalInvites(); }
export function getLocalProfilesList() { return getLocalProfiles(); }
