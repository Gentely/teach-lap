/**
 * app.js — Private mode: Supervisor Enas + teachers isolated spaces
 * - Auth overlay, code generation (name → code), onboarding
 * - Owner-isolated courses/lectures/students/attendance/grades
 * - No public discussion board (removed), compact features
 */

import * as db from './supabase.js';
import { initClassroom, setCourse as classroomSetCourse } from './classroom.js';
import * as auth from './auth.js';

/* ==========================================================================
 * I18N
 * ======================================================================== */
const I18N = {
  ar: {
    nav_print: 'طباعة', nav_classroom: 'إدارة الصف', btn_print: 'طباعة',
    hero_badge: 'كلية الآداب والتربية — قسم اللغة الإنجليزية',
    hero_title: 'توظيف التكنولوجيا في تدريس اللغة الإنجليزية',
    hero_sub: 'منصة خاصة بإشراف الأستاذة إيناس مصباح عمر — لكل أستاذ صفحته ومقرراته وطلبته.',
    hero_card_sub: 'مدعوم بالذكاء الاصطناعي',
    hero_feat_1: 'ملخصات تربوية ومفاهيم جوهرية', hero_feat_2: 'تطبيقات للصفوف الليبية', hero_feat_3: 'سيناريوهات بنماذج إجابة', hero_feat_4: 'مهام تأمل',
    setup_title: 'قاعدة البيانات غير مهيأة بعد (Supabase)',
    setup_text: 'شغّل supabase/upgrade_private.sql في SQL Editor لتفعيل النظام الخاص.',
    step1_title: 'أدخل محتوى المحاضرة', step1_sub: 'الصق النص أو ارفع ملفًا (TXT, Word, PDF)',
    label_course: 'المادة / المقرر', opt_no_course: '— بدون مادة (عام) —',
    label_title: 'عنوان المحاضرة', ph_title: 'مثال: نموذج SAMR وتوظيف التكنولوجيا في الصف',
    label_date: 'تاريخ المحاضرة', label_time: 'وقت المحاضرة', label_text: 'محتوى المحاضرة', ph_text: 'الصق هنا نص المحاضرة الكاملة...',
    chars_word: 'حرف', drop_title: 'اسحب ملفًا هنا أو اضغط للاختيار', drop_hint: 'يدعم: TXT, MD, Word (.docx), PDF — حتى 80 ألف حرف',
    label_output_lang: 'لغة النتائج', opt_ar: 'العربية', opt_en: 'الإنجليزية', opt_bilingual: 'ثنائي اللغة',
    btn_sample: 'مثال جاهز', btn_clear: 'مسح', btn_generate: 'توليد المحتوى التعليمي',
    generate_note: 'بواسطة Google Gemini — المفتاح محمي على الخادم.',
    courses_title: 'المواد / المقررات', courses_empty: 'لا توجد مواد بعد — أضف مادتك الأولى.',
    ph_course_title: 'مثال: Employing Technology in ELT', ph_course_desc: 'وصف مختصر (اختياري)', btn_add_course: 'إضافة مادة',
    classroom_title: 'إدارة الصف', classroom_sub: 'حسب سنواتك — كل محاضرة بمكانها.',
    tab_attendance: 'الحضور والغياب', tab_grades: 'الدرجات',
    attendance_title: 'سجل الحضور', attendance_hint: 'اختر تاريخ الجلسة وسجّل حالة كل طالب.',
    grades_title: 'سجل الدرجات', grades_sub: 'أعمال السنة — الحضور والغياب — الاختبارات.',
    session_date: 'تاريخ الجلسة', student_name_ph: 'اسم الطالب / الطالبة', student_number_ph: 'رقم القيد (اختياري)', btn_add_student: 'إضافة طالب',
    student_number_label: 'رقم القيد', attendance_rate: 'نسبة الحضور', status_present: 'حاضر', status_absent: 'غائب', status_late: 'متأخر',
    classroom_need_course: 'اختر مادة أولًا من القائمة أعلاه.', btn_go_courses: 'الذهاب للمواد', no_students: 'لا يوجد طلاب بعد.',
    cat_coursework: 'أعمال السنة', cat_attendance: 'الحضور والغياب', cat_exam: 'الاختبارات والامتحانات',
    grade_item_ph: 'عنوان البند (مثال: واجب 1)', max_score_ph: 'الدرجة القصوى', btn_add_grade_item: 'إضافة بند',
    no_grade_items: 'لا توجد بنود في هذا التصنيف بعد.', student_name_label: 'الطالب', total_label: 'المجموع', grades_hint: 'القيم تُحفظ تلقائيًا.',
    sidebar_title: 'المحاضرات المحفوظة', sidebar_empty: 'لا توجد محاضرات محفوظة بعد.', btn_open: 'فتح', btn_delete: 'حذف',
    results_title: 'النتائج التفاعلية', btn_copy_all: 'نسخ الكل', btn_copy: 'نسخ', tab_summary: 'الملخص والمفاهيم', tab_takeaways: 'الخلاصات والتطبيقات', tab_scenarios: 'السيناريوهات', tab_reflections: 'مهام التأمل',
    summary_title: 'الملخص التربوي', concepts_title: 'المفاهيم الجوهرية', takeaways_title: 'الخلاصات الرئيسية', applications_title: 'تطبيقات للصفوف الليبية',
    scenarios_title: 'سيناريوهات وأسئلة', scenarios_hint: 'اضغط على السؤال لعرض نموذج الإجابة.',
    reflections_title: 'مهام التأمل الطلابية', reflections_hint: 'اكتب تأملك واحفظه.',
    features_title: 'ماذا يُنتج المساعد لك؟', feat1_title: 'ملخصات ومفاهيم', feat1_text: 'ملخص دقيق مع SAMR، TPACK...', feat2_title: 'خلاصات ليبية', feat2_text: 'تطبيقات للصفوف الليبية', feat3_title: 'سيناريوهات', feat3_text: 'أسئلة بنماذج إجابة', feat4_title: 'تأمل', feat4_text: 'مهام تأمل تفاعلية',
    footer_about: 'تطبيق تعليمي خاص — كلية الآداب والتربية، جامعة صبراتة.', footer_course: 'المقررات', footer_credit: 'إعداد وإشراف: الأستاذة إيناس مصباح عمر — Enas Mesbah Omar', footer_rights: '© 2026 جامعة صبراتة — كلية الآداب والتربية.',
    loading_title: 'جارٍ توليد المحتوى...', toast_generated: 'تم توليد المحتوى بنجاح! ✨', toast_saved_db: 'تم حفظ المحاضرة.', toast_copied: 'تم النسخ.', toast_file_loaded: 'تم تحميل الملف.', toast_file_bad: 'تعذر قراءة الملف.', toast_file_parsing: 'جارٍ استخراج النص...', toast_sample: 'تم تحميل مثال جاهز.', toast_cleared: 'تم مسح النموذج.', toast_reflection: 'تم حفظ تأملك.', toast_deleted: 'تم الحذف.', toast_need_text: 'أدخل محتوى المحاضرة أولًا (40 حرفًا على الأقل).', toast_error: 'حدث خطأ. حاول مرة أخرى.', toast_db_off: 'قاعدة البيانات غير مهيأة.', toast_course_added: 'تمت إضافة المادة.', toast_student_added: 'تمت إضافة الطالب.', toast_grade_item_added: 'تمت إضافة بند الدرجة.', err_prefix: 'خطأ', model_answer_label: 'نموذج الإجابة', type_individual: 'فردي', type_group: 'جماعي', type_discussion: 'نقاش', reflection_name_label: 'اسمك', reflection_ph: 'اكتب تأملك هنا...', btn_save_reflection: 'حفظ التأمل', saved_reflections_title: 'تأملات محفوظة',
    // private
    err_code_required: 'أدخل رمز الدعوة أولًا.', err_code_invalid: 'رمز غير صحيح — تأكد من الرمز أو اطلب رمزًا جديدًا من المشرفة إيناس.', err_code_used: 'هذا الرمز مستخدم مسبقًا.', err_not_admin: 'هذا الرمز ليس للمشرفة.',
    toast_invite_created: 'تم توليد الرمز — انسخه وأرسله للأستاذ.', toast_welcome: 'مرحبًا بك!', toast_profile_saved: 'تم حفظ بياناتك — صفحتك جاهزة الآن.',
    welcome_admin: 'مرحبًا — المشرفة إيناس', welcome_teacher: 'مرحبًا،', profile_incomplete: 'أكمل بياناتك ليتم تجهيز صفحتك حسب سنواتك.',
  },
  en: {
    nav_print: 'Print', nav_classroom: 'Classroom', btn_print: 'Print',
    hero_badge: 'Faculty of Arts & Education — Department of English',
    hero_title: 'Employing Technology in ELT', hero_sub: 'Private platform supervised by Enas Mesbah Omar — each teacher has his own space.',
    hero_card_sub: 'Powered by AI', hero_feat_1: 'Summaries & concepts', hero_feat_2: 'Libyan applications', hero_feat_3: 'Scenarios', hero_feat_4: 'Reflection tasks',
    setup_title: 'Database not configured', setup_text: 'Run supabase/upgrade_private.sql in SQL Editor.',
    step1_title: 'Enter lecture content', step1_sub: 'Paste or upload (TXT, Word, PDF)', label_course: 'Course', opt_no_course: '— No course —', label_title: 'Lecture title', ph_title: 'e.g., SAMR Model', label_date: 'Lecture date', label_time: 'Lecture time', label_text: 'Lecture content', ph_text: 'Paste lecture text...', chars_word: 'characters', drop_title: 'Drop file or click', drop_hint: 'TXT, Word, PDF — up to 80k chars', label_output_lang: 'Output language', opt_ar: 'Arabic', opt_en: 'English', opt_bilingual: 'Bilingual', btn_sample: 'Load sample', btn_clear: 'Clear', btn_generate: 'Generate', generate_note: 'Via Gemini — key protected on server.',
    courses_title: 'Courses', courses_empty: 'No courses yet.', ph_course_title: 'e.g., ELT', ph_course_desc: 'Short description', btn_add_course: 'Add course',
    classroom_title: 'Classroom', classroom_sub: 'Per your years — each lecture in place.', tab_attendance: 'Attendance', tab_grades: 'Grades', attendance_title: 'Attendance', attendance_hint: 'Pick date and mark.', grades_title: 'Grades', grades_sub: 'Coursework — Attendance — Exams.', session_date: 'Session date', student_name_ph: 'Student name', student_number_ph: 'ID (optional)', btn_add_student: 'Add student', student_number_label: 'ID', attendance_rate: 'Attendance', status_present: 'Present', status_absent: 'Absent', status_late: 'Late', classroom_need_course: 'Pick a course first.', btn_go_courses: 'Go to courses', no_students: 'No students yet.', cat_coursework: 'Coursework', cat_attendance: 'Attendance', cat_exam: 'Exams', grade_item_ph: 'Item title', max_score_ph: 'Max score', btn_add_grade_item: 'Add item', no_grade_items: 'No items yet.', student_name_label: 'Student', total_label: 'Total', grades_hint: 'Auto-saved.',
    sidebar_title: 'Saved lectures', sidebar_empty: 'No saved lectures.', btn_open: 'Open', btn_delete: 'Delete', results_title: 'Results', btn_copy_all: 'Copy all', btn_copy: 'Copy', tab_summary: 'Summary', tab_takeaways: 'Takeaways', tab_scenarios: 'Scenarios', tab_reflections: 'Reflections', summary_title: 'Pedagogical summary', concepts_title: 'Core concepts', takeaways_title: 'Key takeaways', applications_title: 'Libyan applications', scenarios_title: 'Scenarios & Q&A', scenarios_hint: 'Click to reveal answer.', reflections_title: 'Reflection tasks', reflections_hint: 'Write your reflection.',
    features_title: 'What does it generate?', feat1_title: 'Summaries', feat1_text: 'Precise summary with SAMR...', feat2_title: 'Libyan takeaways', feat2_text: 'Ready-to-use ideas', feat3_title: 'Scenarios', feat3_text: 'Exam-style Q&A', feat4_title: 'Reflection', feat4_text: 'Interactive tasks',
    footer_about: 'Private educational app — Faculty of Arts & Education, Sabratha.', footer_course: 'Courses', footer_credit: 'Prepared & supervised by: Enas Mesbah Omar', footer_rights: '© 2026 Sabratha University.',
    loading_title: 'Generating...', toast_generated: 'Generated! ✨', toast_saved_db: 'Saved.', toast_copied: 'Copied.', toast_file_loaded: 'File loaded.', toast_file_bad: 'Could not read file.', toast_file_parsing: 'Extracting text...', toast_sample: 'Sample loaded.', toast_cleared: 'Cleared.', toast_reflection: 'Reflection saved.', toast_deleted: 'Deleted.', toast_need_text: 'Enter lecture content first (40+ chars).', toast_error: 'Something went wrong.', toast_db_off: 'DB not configured.', toast_course_added: 'Course added.', toast_student_added: 'Student added.', toast_grade_item_added: 'Grade item added.', err_prefix: 'Error', model_answer_label: 'Model answer', type_individual: 'Individual', type_group: 'Group', type_discussion: 'Discussion', reflection_name_label: 'Your name', reflection_ph: 'Write your reflection...', btn_save_reflection: 'Save reflection', saved_reflections_title: 'Saved reflections',
    err_code_required: 'Enter invite code first.', err_code_invalid: 'Invalid code.', err_code_used: 'Code already used.', err_not_admin: 'Not admin code.', toast_invite_created: 'Code generated — copy and share.', toast_welcome: 'Welcome!', toast_profile_saved: 'Profile saved — your page is ready.', welcome_admin: 'Welcome — Supervisor Enas', welcome_teacher: 'Welcome,', profile_incomplete: 'Complete your profile.',
  }
};

const state = {
  lang: 'ar',
  courses: [],
  selectedCourseId: null,
  current: null,
  comments: [],
  reflections: [],
};

function t(key) { return I18N[state.lang][key] ?? I18N.ar[key] ?? key; }

function applyI18n() {
  const html = document.documentElement;
  html.lang = state.lang; html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('btn-lang-label').textContent = state.lang === 'ar' ? 'EN' : 'عربي';
  document.querySelectorAll('[data-i18n]').forEach(n => n.textContent = t(n.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(n => n.placeholder = t(n.dataset.i18nPlaceholder));
  if (state.current) renderAnalysis();
  renderCourses(); renderSavedList(); renderReflections();
  updateHeaderProfile();
}

function el(tag, className, text) { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; }
function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const colors = { success: 'bg-brand-800 text-white', error: 'bg-red-600 text-white', info: 'bg-slate-700 text-white' };
  const item = el('div', `pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm fade-in max-w-md ${colors[type] || colors.info}`, message);
  container.appendChild(item);
  setTimeout(() => { item.style.opacity = '0'; item.style.transition = 'opacity .4s'; setTimeout(() => item.remove(), 400); }, 3800);
}
function showLoading(show) { document.getElementById('loading-overlay').classList.toggle('hidden', !show); }
function formatDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString(state.lang === 'ar' ? 'ar-LY' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return iso; } }
function formatTime(timeStr) { if (!timeStr) return '—'; const p = timeStr.split(':'); let h = parseInt(p[0], 10); const m = p[1]; const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ampm}`; }
async function copyText(text) { try { await navigator.clipboard.writeText(text); toast(t('toast_copied')); return; } catch {} try { const ta = el('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(t('toast_copied')); } catch { toast(t('toast_error'), 'error'); } }

function updateHeaderProfile() {
  const p = auth.getCurrentProfile();
  const badge = document.getElementById('user-badge');
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  const logoutBtn = document.getElementById('btn-logout');
  const heroProfile = document.getElementById('hero-profile');
  if (!p) { badge.classList.add('hidden'); badge.classList.remove('flex'); logoutBtn.classList.add('hidden'); if (heroProfile) heroProfile.classList.add('hidden'); return; }
  badge.classList.remove('hidden'); badge.classList.add('flex'); logoutBtn.classList.remove('hidden');
  nameEl.textContent = p.full_name || p.code;
  roleEl.textContent = p.role === 'admin' ? (state.lang === 'ar' ? 'مشرفة' : 'Admin') : (state.lang === 'ar' ? 'أستاذ' : 'Teacher');
  if (heroProfile) {
    heroProfile.classList.remove('hidden');
    document.getElementById('hero-welcome').textContent = p.role === 'admin' ? t('welcome_admin') : `${t('welcome_teacher')} ${p.full_name}`;
    document.getElementById('hero-subjects').textContent = p.subjects ? `${state.lang === 'ar' ? 'المواد:' : 'Subjects:'} ${p.subjects}` : '';
    document.getElementById('hero-years').textContent = p.academic_year ? `${state.lang === 'ar' ? 'السنوات:' : 'Years:'} ${p.academic_year}` : '';
    const hsc = document.getElementById('hero-schedule'); if (hsc) hsc.textContent = p.schedule ? `${state.lang === 'ar' ? 'الأوقات:' : 'Schedule:'} ${p.schedule}` : '';
    document.getElementById('footer-mycourses').textContent = p.subjects || p.academic_year || p.schedule || '';
  }
}

function ownerId() {
  const p = auth.getCurrentProfile();
  return p ? p.id : null;
}
function isAdminView() { return auth.isAdmin(); }

/* ==========================================================================
 * Sample lecture
 * ======================================================================== */
const SAMPLES = {
  ar: `عنوان المحاضرة: نموذج SAMR وتوظيف التكنولوجيا في تدريس اللغة الإنجليزية\n\nيُعد نموذج SAMR (الاستبدال، التعزيز، التعديل، إعادة التعريف) الذي طوره روبن بونتيدر من أبرز النماذج المستخدمة لتقييم درجة توظيف التكنولوجيا في التعليم. يصنف النموذج استخدام التكنولوجيا إلى أربعة مستويات: الاستبدال حيث تحل التقنية محل الأداة التقليدية دون تعديل جوهري، والتعزيز حيث تضيف التقنية تحسينات بسيطة، والتعديل حيث تسمح التقنية بإعادة تصميم المهام بشكل ملحوظ، وإعادة التعريف حيث تُنشئ التقنية مهامًا كانت مستحيلة سابقًا.\n\nأما إطار TPACK فيؤكد على أن المعلم الفعال هو الذي يجمع بين المعرفة بالمحتوى والمعرفة التربوية والمعرفة التكنولوجية في تكامل ديناميكي.\n\nومن المفاهيم المهمة أيضًا التعلم المدمج (Blended Learning) الذي يجمع بين التعليم الصفي المباشر والتعلم الإلكتروني عبر منصات مثل Moodle أو Google Classroom.\n\nأخيرًا، يبرز مبدأ تعدد الوسائط استنادًا إلى نظرية ماير التي تؤكد أن التعلم يصبح أعمق عند دمج النص والصورة والفيديو بشكل متوازن.`,
  en: `Lecture title: The SAMR Model and Employing Technology in ELT\n\nThe SAMR model is one of the most widely used frameworks for evaluating how technology is employed in education. The model classifies technology use into four levels: Substitution, Augmentation, Modification, and Redefinition.\n\nThe TPACK framework stresses that the effective teacher integrates Content Knowledge, Pedagogical Knowledge, and Technological Knowledge in a dynamic way.\n\nBlended Learning is another key concept: combining face-to-face classroom instruction with online learning through platforms such as Moodle or Google Classroom.\n\nFinally, Mayer's Cognitive Theory of Multimedia Learning highlights deeper learning when text, images and video are combined in a balanced way.`,
};

/* ==========================================================================
 * File reading
 * ======================================================================== */
function updateCharCount() { document.getElementById('char-count').textContent = String(document.getElementById('lecture-text').value.length); }
function setFileUI(name, status) {
  const nameEl = document.getElementById('file-name'); const statusEl = document.getElementById('file-status');
  if (name) { nameEl.textContent = name; nameEl.classList.remove('hidden'); } else nameEl.classList.add('hidden');
  if (status) { statusEl.textContent = status; statusEl.classList.remove('hidden'); } else statusEl.classList.add('hidden');
}
async function extractDocx(arrayBuffer) { if (!window.mammoth) throw new Error('Mammoth not loaded'); const r = await window.mammoth.extractRawText({ arrayBuffer }); return r.value || ''; }
async function extractPdf(arrayBuffer) {
  let pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) { try { const mod = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs'); pdfjsLib = mod; window.pdfjsLib = mod; } catch { throw new Error('PDF.js not loaded'); } }
  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = ''; for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const c = await page.getTextContent(); text += c.items.map(item => item.str).join(' ') + '\n\n'; if (text.length > 80000) break; } return text.trim();
}
async function handleFile(file) {
  if (!file) return; const name = file.name || 'file'; const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['txt', 'md', 'markdown', 'text'].includes(ext) || file.type.startsWith('text/')) {
    const reader = new FileReader(); reader.onload = () => { applyFileText(String(reader.result || ''), name); }; reader.onerror = () => toast(t('toast_file_bad'), 'error'); reader.readAsText(file); return;
  }
  setFileUI(name, t('toast_file_parsing')); showLoading(true); document.getElementById('file-loading-text').textContent = `${t('toast_file_parsing')} — ${name}`; document.getElementById('file-loading-text').classList.remove('hidden');
  try { const buffer = await file.arrayBuffer(); let text = ''; if (ext === 'docx' || ext === 'doc') text = await extractDocx(buffer); else if (ext === 'pdf') text = await extractPdf(buffer); else text = new TextDecoder().decode(buffer); text = text.trim(); if (!text) throw new Error('empty'); if (text.length > 80000) text = text.slice(0, 80000); applyFileText(text, name); } catch (err) { console.warn(err); toast(t('toast_file_bad'), 'error'); setFileUI(name, t('toast_file_bad')); } finally { showLoading(false); document.getElementById('file-loading-text').classList.add('hidden'); }
}
function applyFileText(text, name) { document.getElementById('lecture-text').value = text; setFileUI(name, `${text.length.toLocaleString()} ${t('chars_word')}`); if (!document.getElementById('lecture-title').value.trim()) document.getElementById('lecture-title').value = name.replace(/\.[^.]+$/, ''); updateCharCount(); toast(t('toast_file_loaded')); }
function initInputHandlers() {
  const textArea = document.getElementById('lecture-text'); const fileInput = document.getElementById('file-input'); const dropZone = document.getElementById('drop-zone');
  textArea.addEventListener('input', updateCharCount);
  dropZone.addEventListener('click', () => fileInput.click()); fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
  ['dragover', 'dragenter'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
  dropZone.addEventListener('drop', e => handleFile(e.dataTransfer?.files?.[0]));
  document.getElementById('btn-sample').addEventListener('click', () => { const s = SAMPLES[state.lang] || SAMPLES.ar; textArea.value = s; document.getElementById('lecture-title').value = state.lang === 'ar' ? 'نموذج SAMR وتوظيف التكنولوجيا' : 'SAMR Model'; updateCharCount(); toast(t('toast_sample')); });
  document.getElementById('btn-clear').addEventListener('click', () => { textArea.value = ''; document.getElementById('lecture-title').value = ''; document.getElementById('lecture-date').value = ''; document.getElementById('lecture-time').value = ''; setFileUI(null, null); fileInput.value = ''; updateCharCount(); toast(t('toast_cleared'), 'info'); });
}

/* ==========================================================================
 * Courses
 * ======================================================================== */
async function refreshCourses() {
  if (!db.isConfigured()) { renderCourses([]); return; }
  const p = auth.getCurrentProfile();
  const ownerFilter = isAdminView() ? null : (p ? p.id : null);
  const { data } = await db.fetchCourses({ ownerId: ownerFilter });
  renderCourses(data || []);
}
function renderCourses(courses) {
  if (courses !== undefined) { state.courses = courses; renderCourses._cache = courses; } else { courses = state.courses || renderCourses._cache || []; }
  const list = document.getElementById('courses-list'); const countEl = document.getElementById('courses-count'); const select = document.getElementById('course-select');
  if (!list || !countEl || !select) return;
  const currentVal = state.selectedCourseId ?? select.value ?? '';
  const prevVal = select.value; select.innerHTML = '';
  const noOpt = el('option', '', t('opt_no_course')); noOpt.value = ''; select.appendChild(noOpt);
  courses.forEach(c => { const opt = el('option', '', c.title); opt.value = c.id; select.appendChild(opt); });
  if (courses.some(c => c.id === currentVal)) { select.value = currentVal; state.selectedCourseId = currentVal; } else if (courses.some(c => c.id === prevVal)) { select.value = prevVal; state.selectedCourseId = prevVal || null; } else { select.value = ''; state.selectedCourseId = null; }
  countEl.textContent = String(courses.length); list.innerHTML = '';
  if (!courses.length) { list.appendChild(el('p', 'text-sm text-slate-400 text-center py-4', t('courses_empty'))); return; }
  courses.forEach(course => {
    const card = el('div', `rounded-2xl border-2 p-3 transition ${state.selectedCourseId === course.id ? 'border-brand-800 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`);
    const row = el('div', 'flex items-start justify-between gap-2'); const info = el('div', 'flex-1 min-w-0');
    info.appendChild(el('p', 'font-bold text-slate-800 text-sm leading-snug', course.title));
    if (course.description) info.appendChild(el('p', 'text-xs text-slate-400 mt-0.5', course.description));
    if (isAdminView() && course.owner_id) info.appendChild(el('p', 'text-[10px] text-gold-700 mt-1', `owner: ${course.owner_id.slice(0, 8)}...`));
    row.appendChild(info);
    const actions = el('div', 'flex items-center gap-1 shrink-0');
    const selectBtn = el('button', `px-3 py-1.5 rounded-lg text-xs font-bold transition ${state.selectedCourseId === course.id ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-800 hover:bg-brand-100'}`, state.selectedCourseId === course.id ? '✓' : t('btn_open'));
    selectBtn.addEventListener('click', async () => { state.selectedCourseId = course.id; document.getElementById('course-select').value = course.id; renderCourses(); await onCourseChanged(); });
    const delBtn = el('button', 'px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition', t('btn_delete'));
    delBtn.addEventListener('click', async () => { if (!confirm(state.lang === 'ar' ? 'حذف هذه المادة؟' : 'Delete course?')) return; await db.deleteCourse(course.id); if (state.selectedCourseId === course.id) state.selectedCourseId = null; await refreshCourses(); await refreshSavedList(); await onCourseChanged(); toast(t('toast_deleted')); });
    actions.appendChild(selectBtn); actions.appendChild(delBtn); row.appendChild(actions); card.appendChild(row); list.appendChild(card);
  });
}
async function onCourseChanged() { state.selectedCourseId = document.getElementById('course-select').value || null; renderCourses(); await refreshSavedList(); try { await classroomSetCourse(); } catch {} }
function initCourses() {
  document.getElementById('course-select').addEventListener('change', onCourseChanged);
  document.getElementById('course-form').addEventListener('submit', async e => {
    e.preventDefault(); if (!db.isConfigured()) { toast(t('toast_db_off'), 'info'); return; }
    const title = document.getElementById('course-title').value.trim(); const description = document.getElementById('course-desc').value.trim(); if (!title) return;
    const p = auth.getCurrentProfile();
    const { data, error } = await db.saveCourse({ title, description, ownerId: p ? p.id : null });
    if (error || !data) { toast(t('toast_error'), 'error'); return; }
    document.getElementById('course-title').value = ''; document.getElementById('course-desc').value = ''; state.selectedCourseId = data.id;
    await refreshCourses(); await onCourseChanged(); toast(t('toast_course_added'));
  });
}

/* ==========================================================================
 * Generation
 * ======================================================================== */
async function generate() {
  const title = document.getElementById('lecture-title').value.trim();
  const text = document.getElementById('lecture-text').value.trim();
  const outputLanguage = document.getElementById('output-language').value;
  const courseId = document.getElementById('course-select').value || null;
  const lectureDate = document.getElementById('lecture-date').value || null;
  const lectureTime = document.getElementById('lecture-time').value || null;
  if (text.length < 40) { toast(t('toast_need_text'), 'error'); document.getElementById('lecture-text').focus(); return; }
  showLoading(true);
  try {
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, text, outputLanguage }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json?.error?.message || t('toast_error'));
    state.current = { lectureId: null, title: title || (state.lang === 'ar' ? 'محاضرة بدون عنوان' : 'Untitled'), text, outputLanguage, lectureDate, lectureTime, courseId, analysis: json.data, meta: json.meta };
    renderAnalysis(); document.getElementById('results-section').classList.remove('hidden'); switchTab('summary');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' }); toast(t('toast_generated'));
    if (db.isConfigured()) await persistCurrent(); else toast(t('toast_db_off'), 'info');
  } catch (err) { toast(`${t('err_prefix')}: ${err.message}`, 'error'); } finally { showLoading(false); }
}
async function persistCurrent() {
  try {
    const p = auth.getCurrentProfile();
    const { data: lecture, error } = await db.saveLecture({ title: state.current.title, sourceText: state.current.text, outputLanguage: state.current.outputLanguage, courseId: state.current.courseId, lectureDate: state.current.lectureDate, lectureTime: state.current.lectureTime, ownerId: p ? p.id : null });
    if (error || !lecture) return; state.current.lectureId = lecture.id; await db.saveAnalysis(lecture.id, state.current.analysis, state.current.meta?.model); await refreshSavedList(); toast(t('toast_saved_db'));
  } catch (e) { console.warn(e.message); }
}

/* ==========================================================================
 * Results rendering
 * ======================================================================== */
function switchTab(name) { document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('tab-active', btn.dataset.tab === name)); document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('hidden', panel.id !== `panel-${name}`)); }
function typeLabel(type) { if (type === 'group') return t('type_group'); if (type === 'discussion') return t('type_discussion'); return t('type_individual'); }
function renderAnalysis() {
  const a = state.current?.analysis; if (!a) return;
  document.getElementById('summary-text').textContent = a.summary || '';
  const conceptsGrid = document.getElementById('concepts-grid'); conceptsGrid.innerHTML = '';
  (a.core_concepts || []).forEach((c, i) => {
    const card = el('div', 'rounded-2xl border-2 border-brand-100 bg-brand-50/60 p-4');
    card.appendChild(el('span', 'inline-block px-2 py-0.5 rounded-full bg-brand-800 text-gold-500 text-[11px] font-extrabold mb-2', `#${i + 1}`));
    card.appendChild(el('h5', 'font-extrabold text-brand-900 text-base leading-snug', c.term));
    card.appendChild(el('p', 'text-sm text-slate-700 mt-2 leading-relaxed', c.definition));
    if (c.classroom_link) { const link = el('div', 'mt-3 pt-3 border-t border-brand-100'); link.appendChild(el('p', 'text-xs font-bold text-gold-700 mb-1', state.lang === 'ar' ? 'مثال صفي:' : 'Classroom example:')); link.appendChild(el('p', 'text-xs text-slate-600 leading-relaxed', c.classroom_link)); card.appendChild(link); }
    conceptsGrid.appendChild(card);
  });
  const takeawaysList = document.getElementById('takeaways-list'); takeawaysList.innerHTML = '';
  (a.key_takeaways || []).forEach(item => { const li = el('li', 'flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100'); li.appendChild(el('span', 'w-7 h-7 rounded-full bg-gold-500 text-brand-900 flex items-center justify-center text-sm font-extrabold shrink-0', '★')); li.appendChild(el('p', 'text-slate-700 leading-relaxed', item)); takeawaysList.appendChild(li); });
  const appsList = document.getElementById('applications-list'); appsList.innerHTML = '';
  (a.libyan_applications || []).forEach((item, i) => { const card = el('div', 'rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 text-white p-4 shadow-card'); card.appendChild(el('div', 'w-7 h-7 rounded-xl bg-gold-500 text-brand-900 flex items-center justify-center font-extrabold text-sm mb-2', String(i + 1))); card.appendChild(el('p', 'text-sm leading-relaxed text-brand-50', item)); appsList.appendChild(card); });
  const scenariosList = document.getElementById('scenarios-list'); scenariosList.innerHTML = '';
  (a.scenario_qa || []).forEach((q, i) => {
    const details = el('details', 'group rounded-2xl border-2 border-slate-100 overflow-hidden'); const summary = el('summary', 'flex items-start gap-3 p-4 bg-slate-50 group-hover:bg-brand-50 transition');
    summary.appendChild(el('span', 'w-7 h-7 rounded-xl bg-brand-800 text-gold-500 flex items-center justify-center font-extrabold text-sm shrink-0', `Q${i + 1}`));
    summary.appendChild(el('p', 'flex-1 font-bold text-slate-800 leading-relaxed text-sm', q.question));
    summary.appendChild(el('span', 'chevron text-brand-700 transition-transform shrink-0', '▾')); details.appendChild(summary);
    const body = el('div', 'p-4 border-t-2 border-slate-100 bg-white'); body.appendChild(el('p', 'text-xs font-extrabold text-gold-700 uppercase tracking-wider mb-2', t('model_answer_label'))); body.appendChild(el('p', 'text-slate-700 leading-loose whitespace-pre-line text-sm', q.model_answer)); details.appendChild(body); scenariosList.appendChild(details);
  });
  renderReflections();
}
function analysisAsText() {
  const a = state.current?.analysis; if (!a) return ''; const lines = []; if (state.current?.title) lines.push(`# ${state.current.title}`, '');
  lines.push(`## ${t('summary_title')}`, a.summary || '', ''); lines.push(`## ${t('concepts_title')}`); (a.core_concepts || []).forEach(c => lines.push(`• ${c.term}: ${c.definition}${c.classroom_link ? ` (${c.classroom_link})` : ''}`));
  lines.push('', `## ${t('takeaways_title')}`); (a.key_takeaways || []).forEach(x => lines.push(`• ${x}`));
  lines.push('', `## ${t('applications_title')}`); (a.libyan_applications || []).forEach(x => lines.push(`• ${x}`));
  lines.push('', `## ${t('scenarios_title')}`); (a.scenario_qa || []).forEach((q, i) => lines.push(`Q${i + 1}: ${q.question}`, `${t('model_answer_label')}: ${q.model_answer}`, ''));
  return lines.join('\n');
}

/* ==========================================================================
 * Saved lectures
 * ======================================================================== */
async function refreshSavedList() {
  if (!db.isConfigured()) { renderSavedList([]); return; }
  const p = auth.getCurrentProfile(); const ownerFilter = isAdminView() ? null : (p ? p.id : null);
  const { data } = await db.fetchLectures({ courseId: state.selectedCourseId || null, ownerId: ownerFilter });
  renderSavedList(data || []);
}
function renderSavedList(lectures) {
  const list = document.getElementById('saved-list'); const countEl = document.getElementById('saved-count'); if (!list) return;
  const items = lectures ?? (renderSavedList._cache || []); renderSavedList._cache = items; countEl.textContent = String(items.length); list.innerHTML = '';
  if (!items.length) { list.appendChild(el('p', 'text-sm text-slate-400 text-center py-6', t('sidebar_empty'))); return; }
  items.forEach(lecture => {
    const card = el('div', 'rounded-2xl border-2 border-slate-100 p-4 hover:border-brand-200 transition');
    card.appendChild(el('h4', 'font-bold text-slate-800 text-sm leading-snug', lecture.title));
    const meta = el('div', 'flex flex-wrap gap-2 mt-1'); meta.appendChild(el('span', 'text-xs text-slate-400', formatDate(lecture.created_at)));
    if (lecture.lecture_date) meta.appendChild(el('span', 'text-xs text-brand-700 font-bold', formatDate(lecture.lecture_date)));
    if (lecture.lecture_time) meta.appendChild(el('span', 'text-xs text-slate-400', formatTime(lecture.lecture_time)));
    const courseName = state.courses.find(c => c.id === lecture.course_id)?.title; if (courseName) meta.appendChild(el('span', 'text-xs px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 font-bold', courseName));
    card.appendChild(meta);
    const actions = el('div', 'flex items-center gap-2 mt-3');
    const openBtn = el('button', 'px-3 py-1.5 rounded-lg bg-brand-800 text-white text-xs font-bold hover:bg-brand-900 transition', t('btn_open'));
    openBtn.addEventListener('click', () => openLecture(lecture));
    const delBtn = el('button', 'px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition', t('btn_delete'));
    delBtn.addEventListener('click', async () => { if (!confirm(state.lang === 'ar' ? 'حذف هذه المحاضرة؟' : 'Delete?')) return; await db.deleteLecture(lecture.id); await refreshSavedList(); toast(t('toast_deleted')); });
    actions.appendChild(openBtn); actions.appendChild(delBtn); card.appendChild(actions); list.appendChild(card);
  });
}
async function openLecture(lecture) {
  if (!db.isConfigured()) return; showLoading(true);
  try {
    const [{ data: analysis }, { data: reflections }] = await Promise.all([db.fetchAnalysis(lecture.id), db.fetchReflections(lecture.id)]);
    state.current = { lectureId: lecture.id, title: lecture.title, text: lecture.source_text || '', outputLanguage: lecture.output_language || 'ar', lectureDate: lecture.lecture_date || '', lectureTime: lecture.lecture_time || '', courseId: lecture.course_id || null, analysis: analysis ? { summary: analysis.summary, core_concepts: analysis.core_concepts, key_takeaways: analysis.key_takeaways, libyan_applications: analysis.libyan_applications, scenario_qa: analysis.scenario_qa, reflection_tasks: analysis.reflection_tasks, discussion_questions: analysis.discussion_questions } : null, meta: { model: analysis?.model } };
    state.reflections = reflections || [];
    document.getElementById('lecture-title').value = lecture.title; document.getElementById('lecture-text').value = lecture.source_text || ''; document.getElementById('lecture-date').value = lecture.lecture_date || ''; document.getElementById('lecture-time').value = lecture.lecture_time ? lecture.lecture_time.slice(0, 5) : '';
    if (lecture.course_id) { state.selectedCourseId = lecture.course_id; document.getElementById('course-select').value = lecture.course_id; renderCourses(); }
    updateCharCount(); if (state.current.analysis) { renderAnalysis(); document.getElementById('results-section').classList.remove('hidden'); switchTab('summary'); document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' }); }
    renderReflections(); try { await classroomSetCourse(); } catch {}
  } catch (err) { toast(`${t('err_prefix')}: ${err.message}`, 'error'); } finally { showLoading(false); }
}

/* ==========================================================================
 * Reflections
 * ======================================================================== */
function renderReflections() {
  const container = document.getElementById('reflections-list'); if (!container) return; container.innerHTML = '';
  const tasks = state.current?.analysis?.reflection_tasks || [];
  tasks.forEach((task, index) => {
    const card = el('div', 'rounded-2xl border-2 border-slate-100 overflow-hidden');
    const head = el('div', 'bg-brand-50 p-4 border-b-2 border-slate-100'); const headRow = el('div', 'flex items-start justify-between gap-3'); const left = el('div', 'flex-1');
    left.appendChild(el('h5', 'font-extrabold text-brand-900 leading-snug', task.title)); left.appendChild(el('p', 'text-slate-700 mt-2 leading-relaxed text-sm', task.prompt)); headRow.appendChild(left);
    headRow.appendChild(el('span', 'px-3 py-1 rounded-full bg-brand-800 text-gold-500 text-xs font-bold shrink-0', typeLabel(task.type))); head.appendChild(headRow); card.appendChild(head);
    const body = el('div', 'p-4 space-y-3 no-print');
    const nameInput = el('input', 'w-full rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5 text-sm'); nameInput.placeholder = t('reflection_name_label');
    const responseArea = el('textarea', 'w-full rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5 text-sm resize-y'); responseArea.rows = 3; responseArea.placeholder = t('reflection_ph');
    const saveBtn = el('button', 'inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gold-500 text-brand-900 text-sm font-extrabold hover:bg-gold-600 transition'); saveBtn.textContent = t('btn_save_reflection');
    saveBtn.addEventListener('click', async () => { const response = responseArea.value.trim(); if (!response) return; if (!db.isConfigured() || !state.current?.lectureId) { toast(t('toast_db_off'), 'info'); return; } const { data, error } = await db.saveReflection({ lectureId: state.current.lectureId, taskIndex: index, taskTitle: task.title, authorName: nameInput.value.trim() || 'طالب', response }); if (error) { toast(t('toast_error'), 'error'); return; } if (data) state.reflections.unshift(data); responseArea.value = ''; renderReflections(); toast(t('toast_reflection')); });
    body.appendChild(nameInput); body.appendChild(responseArea); body.appendChild(saveBtn); card.appendChild(body);
    const saved = (state.reflections || []).filter(r => (r.task_index ?? 0) === index);
    if (saved.length) { const wrap = el('div', 'px-4 pb-4 space-y-2'); wrap.appendChild(el('h6', 'text-xs font-extrabold text-slate-500 uppercase tracking-wider', t('saved_reflections_title'))); saved.forEach(r => { const item = el('div', 'rounded-xl bg-slate-50 border border-slate-100 p-3'); const meta = el('div', 'flex items-center gap-2 text-xs text-slate-400'); meta.appendChild(el('span', 'font-bold text-brand-700', r.author_name)); meta.appendChild(el('span', '', formatDate(r.created_at))); item.appendChild(meta); item.appendChild(el('p', 'text-sm text-slate-700 mt-1.5 leading-relaxed whitespace-pre-line', r.response)); wrap.appendChild(item); }); card.appendChild(wrap); }
    container.appendChild(card);
  });
  if (!tasks.length) container.appendChild(el('p', 'text-sm text-slate-400', state.lang === 'ar' ? 'لا توجد مهام تأمل بعد — ولّد المحتوى أولًا.' : 'No tasks yet — generate first.'));
}

/* ==========================================================================
 * Auth handlers & Supervisor panel
 * ======================================================================== */
function showAuth(show) {
  document.getElementById('auth-overlay').classList.toggle('hidden', !show);
  document.getElementById('main-content').classList.toggle('hidden', show);
  document.getElementById('hero').classList.toggle('hidden', show);
  document.getElementById('supervisor-panel').classList.toggle('hidden', show || !auth.isAdmin());
}

async function refreshSupervisorData() {
  if (!auth.isAdmin()) return;
  // Teachers — try DB then local fallback
  let teachers = [];
  try { const { data } = await db.fetchProfiles({ role: 'teacher' }); teachers = data || []; } catch {}
  if (!teachers.length) {
    // fallback local
    try { const locals = auth.getLocalProfilesList ? auth.getLocalProfilesList().filter(p => p.role === 'teacher') : []; if (locals.length) teachers = locals; } catch {}
  }
  const list = document.getElementById('teachers-list'); list.innerHTML = '';
  if (!teachers || !teachers.length) list.appendChild(el('p', 'text-sm text-brand-900/60', state.lang === 'ar' ? 'لا يوجد أساتذة بعد.' : 'No teachers yet.'));
  else teachers.forEach(tch => {
    const card = el('div', 'bg-white rounded-2xl p-4 border-2 border-brand-900/10');
    card.appendChild(el('p', 'font-extrabold text-brand-900 text-sm', tch.full_name || tch.fullName || '—'));
    card.appendChild(el('p', 'text-xs text-slate-500', `${tch.title || ''} ${tch.subjects ? '— ' + tch.subjects : ''}`));
    card.appendChild(el('p', 'text-xs text-slate-400', `${tch.academic_year || tch.academicYear || ''} • ${tch.code}`));
    list.appendChild(card);
  });
  // Invites
  let invites = [];
  try { const { data } = await db.fetchInvites(); invites = data || []; } catch {}
  if (!invites.length) {
    try { const locals = auth.getLocalInvitesList ? auth.getLocalInvitesList() : []; if (locals.length) invites = locals; } catch {}
  }
  const invList = document.getElementById('invites-list'); invList.innerHTML = '';
  if (!invites || !invites.length) invList.appendChild(el('p', 'text-sm text-brand-900/60', '—'));
  else invites.forEach(inv => {
    const row = el('div', 'flex items-center gap-3 bg-white rounded-xl p-3 border-2 border-brand-900/10 text-sm');
    row.appendChild(el('span', 'font-mono font-bold text-brand-900', inv.code));
    row.appendChild(el('span', 'flex-1 text-slate-600 text-xs', `${inv.for_name || inv.forName || ''} — ${inv.used ? (state.lang === 'ar' ? 'مستخدم' : 'used') : (state.lang === 'ar' ? 'غير مستخدم' : 'unused')}`));
    const copy = el('button', 'px-3 py-1 rounded-lg bg-brand-800 text-white text-xs font-bold', state.lang === 'ar' ? 'نسخ' : 'Copy');
    copy.addEventListener('click', () => copyText(inv.code)); row.appendChild(copy);
    invList.appendChild(row);
  });
}

function initAuthHandlers() {
  // Legacy tabs are now hidden two-box layout — keep compat but don't require them
  const tabTeacher = document.getElementById('auth-tab-teacher');
  const tabAdmin = document.getElementById('auth-tab-admin');
  const panelTeacher = document.getElementById('auth-teacher-panel');
  const panelAdmin = document.getElementById('auth-admin-panel');
  if (tabTeacher && panelTeacher && panelAdmin) {
    tabTeacher.addEventListener('click', () => { tabTeacher.className = 'flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-extrabold'; if (tabAdmin) tabAdmin.className = 'flex-1 py-2.5 rounded-xl text-slate-600 text-sm font-bold'; panelTeacher.classList.remove('hidden'); panelAdmin.classList.add('hidden'); });
    if (tabAdmin) tabAdmin.addEventListener('click', () => { tabAdmin.className = 'flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-extrabold'; tabTeacher.className = 'flex-1 py-2.5 rounded-xl text-slate-600 text-sm font-bold'; panelAdmin.classList.remove('hidden'); panelTeacher.classList.add('hidden'); });
  }

  async function handleTeacherLogin(e) {
    if (e) e.preventDefault();
    const codeEl = document.getElementById('teacher-code');
    const code = (codeEl?.value || '').trim();
    const msg = document.getElementById('auth-msg-teacher');
    const btn = document.getElementById('btn-teacher-submit');
    if (msg) msg.textContent = '';
    if (!code) { if (msg) { msg.textContent = t('err_code_required'); msg.className = 'text-xs text-center mt-3 min-h-[18px] text-red-600 font-bold'; } toast(t('err_code_required'), 'error'); return; }
    // Admin code in teacher box -> route to admin
    if (code.toUpperCase() === 'ENAS-SUPERVISOR') {
      if (msg) { msg.textContent = state.lang === 'ar' ? 'جاري التحقق...' : 'Checking...'; msg.className = 'text-xs text-center mt-3 min-h-[18px] text-slate-500'; }
      if (btn) { btn.disabled = true; btn.textContent = state.lang === 'ar' ? 'جاري...' : 'Checking...'; }
      try { const p = await auth.loginAsAdmin({ code }); onLoginSuccess(p); return; } catch (err) { console.error('[admin-via-teacher]', err); if (msg) { msg.textContent = err.message || String(err); msg.className = 'text-xs text-center mt-3 min-h-[18px] text-red-600 font-bold'; } toast(err.message || String(err), 'error'); return; } finally { if (btn) { btn.disabled = false; btn.textContent = state.lang === 'ar' ? 'دخول / تفعيل الرمز' : 'Login'; } }
    }
    let fullName = document.getElementById('t-fullname')?.value.trim() || '';
    let title = document.getElementById('t-title')?.value.trim() || '';
    let subjects = document.getElementById('t-subjects')?.value.trim() || '';
    let years = document.getElementById('t-years')?.value.trim() || '';
    if (msg) { msg.textContent = state.lang === 'ar' ? 'جاري التحقق...' : 'Checking...'; msg.className = 'text-xs text-center mt-3 min-h-[18px] text-slate-500'; }
    if (btn) { btn.disabled = true; btn.textContent = state.lang === 'ar' ? 'جاري...' : 'Checking...'; }
    try {
      console.log('[teacher-login] code=', code);
      const profile = await auth.redeemInvite({ code, fullName: fullName || undefined, title, subjects, academicYear: years });
      onLoginSuccess(profile); return;
    } catch (err) {
      const errMsg = err?.message || String(err) || '';
      console.warn('[teacher-login-error]', errMsg, err);
      if (msg) { msg.textContent = errMsg || t('toast_error'); msg.className = 'text-xs text-center mt-3 min-h-[18px] text-red-600 font-bold'; }
      toast(errMsg || t('toast_error'), 'error');
    } finally { if (btn) { btn.disabled = false; btn.textContent = state.lang === 'ar' ? 'دخول / تفعيل الرمز' : 'Login'; } }
  }

  async function handleAdminLogin(e) {
    if (e) e.preventDefault();
    const codeEl = document.getElementById('admin-code');
    const code = (codeEl?.value || '').trim();
    const msg = document.getElementById('auth-msg-admin');
    const btn = document.getElementById('btn-admin-submit');
    if (msg) msg.textContent = '';
    if (!code) { if (msg) { msg.textContent = t('err_code_required'); msg.className = 'text-xs text-center mt-3 min-h-[18px] text-red-600 font-bold'; } toast(t('err_code_required'), 'error'); return; }
    if (msg) { msg.textContent = state.lang === 'ar' ? 'جاري التحقق...' : 'Checking...'; msg.className = 'text-xs text-center mt-3 min-h-[18px] text-slate-500'; }
    if (btn) { btn.disabled = true; btn.textContent = state.lang === 'ar' ? 'جاري...' : 'Checking...'; }
    try {
      console.log('[admin-login] code=', code);
      const p = await auth.loginAsAdmin({ code });
      onLoginSuccess(p);
    } catch (err) {
      console.error('[admin-login-error]', err);
      const em = err?.message || String(err) || t('toast_error');
      if (msg) { msg.textContent = em; msg.className = 'text-xs text-center mt-3 min-h-[18px] text-red-600 font-bold'; }
      toast(em, 'error');
    } finally { if (btn) { btn.disabled = false; btn.textContent = state.lang === 'ar' ? 'دخول المشرفة' : 'Login'; } }
  }

  // Attach both submit and click handlers for maximum mobile compatibility
  const teacherForm = document.getElementById('teacher-login-form');
  const adminForm = document.getElementById('admin-login-form');
  const btnTeacher = document.getElementById('btn-teacher-submit');
  const btnAdmin = document.getElementById('btn-admin-submit');
  if (teacherForm) teacherForm.addEventListener('submit', handleTeacherLogin);
  if (adminForm) adminForm.addEventListener('submit', handleAdminLogin);
  if (btnTeacher) btnTeacher.addEventListener('click', (ev) => { ev.preventDefault(); handleTeacherLogin(ev); });
  if (btnAdmin) btnAdmin.addEventListener('click', (ev) => { ev.preventDefault(); handleAdminLogin(ev); });
  // Also allow Enter key directly on inputs
  document.getElementById('teacher-code')?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); handleTeacherLogin(ev); }});
  document.getElementById('admin-code')?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); handleAdminLogin(ev); }});

  // Supervisor generate code — attach FIRST, with full guards, before any other handler can throw
  (function attachGenerateCode(){
    try {
      var gForm = document.getElementById('generate-code-form');
      var gInput = document.getElementById('new-teacher-name');
      if (!gForm) { console.warn('generate-code-form not found'); return; }
      function doGenerateCode(ev){
        try {
          if (ev) { try{ ev.preventDefault(); }catch(e){} try{ ev.stopPropagation(); }catch(e){} try{ ev.stopImmediatePropagation && ev.stopImmediatePropagation(); }catch(e){} }
          var nameEl2 = document.getElementById('new-teacher-name');
          var name2 = nameEl2 ? (nameEl2.value || '').trim() : '';
          if (!name2) {
            try { toast(state.lang === 'ar' ? 'أدخل اسم الأستاذ أولاً' : 'Enter teacher name', 'error'); } catch(e2){ alert(state.lang==='ar' ? 'أدخل اسم الأستاذ أولاً' : 'Enter name'); }
            return false;
          }
          var code2;
          try { code2 = auth.generateCode('ELT'); } catch(err2) {
            code2 = 'ELT-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
          }
          if (!code2 || code2.length < 6) code2 = 'ELT-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Date.now().toString(36).slice(-4).toUpperCase();
          var forNameEl2 = document.getElementById('gen-for-name');
          var codeEl2 = document.getElementById('gen-code');
          var box2 = document.getElementById('generated-code-box');
          if (forNameEl2) forNameEl2.textContent = name2;
          if (codeEl2) { codeEl2.textContent = code2; codeEl2.style.display=''; }
          if (box2) { box2.classList.remove('hidden'); box2.style.display='block'; box2.removeAttribute('hidden'); }
          // fill link
          try{ var _linkEl=document.getElementById('gen-link'); var _wrap=document.getElementById('gen-link-wrap'); if(_linkEl && _wrap){ var _lnk=location.origin+location.pathname+'?code='+encodeURIComponent(code2); _linkEl.textContent=_lnk; _linkEl.href=_lnk; _wrap.classList.remove('hidden'); _wrap.style.display='block'; } }catch(e){}
          if (nameEl2) nameEl2.value = '';
          try { toast(t('toast_invite_created')); } catch(e3){}
          // also toast via DOM fallback if toast fails
          try {
            var tc=document.getElementById('toast-container');
            if (tc && !tc.children.length) { /* toast already shown */ }
          } catch(e){}
          setTimeout(function(){ try{ if (box2) box2.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){} }, 120);
          // expose for inline fallback to dedupe
          try { window._lastGeneratedCode = code2; window._lastGeneratedAt = Date.now(); } catch(e){}
          // background save
          try {
            var p2 = null; try{ p2 = auth.getCurrentProfile(); }catch(e){}
            auth.createInvite({ forName: name2, createdBy: p2 ? p2.id : null }).then(function(saved){
              if (saved && saved.code && codeEl2) { codeEl2.textContent = saved.code; try{ window._lastGeneratedCode=saved.code; }catch(e){} try{ var _le=document.getElementById('gen-link'); if(_le){ var _ln=location.origin+location.pathname+'?code='+encodeURIComponent(saved.code); _le.textContent=_ln; _le.href=_ln; } }catch(e){} }
              try { refreshSupervisorData(); } catch(err3) {}
            }).catch(function(err){ console.warn('createInvite bg fail', err && err.message); try { refreshSupervisorData(); } catch(e){} });
          } catch(err4) { console.warn(err4); }
          // local list immediate
          try {
            var list2 = document.getElementById('invites-list');
            if (list2) {
              if (list2.textContent.trim() === '—') list2.innerHTML='';
              // avoid duplicate if emergency handler already added
              var already = false; try{ already = list2.textContent.indexOf(code2) !== -1; }catch(e){}
              if (!already) {
                var row2 = el('div', 'flex items-center gap-3 bg-white rounded-xl p-3 border-2 border-brand-900/10 text-sm');
                row2.appendChild(el('span', 'font-mono font-bold text-brand-900', code2));
                row2.appendChild(el('span', 'flex-1 text-slate-600 text-xs', name2 + ' — ' + (state.lang==='ar' ? 'غير مستخدم' : 'unused')));
                var copy2 = el('button', 'px-3 py-1 rounded-lg bg-brand-800 text-white text-xs font-bold', state.lang==='ar' ? 'نسخ' : 'Copy');
                (function(c){ copy2.addEventListener('click', function(){ copyText(c); }); })(code2);
                row2.appendChild(copy2);
                list2.prepend(row2);
              }
            }
          } catch(e){}
        } catch(errAll){
          console.error('doGenerateCode error', errAll);
          try{ alert('خطأ: ' + (errAll.message||errAll)); }catch(e){}
          try{ toast('خطأ: '+(errAll.message||errAll), 'error'); }catch(e){}
        }
        return false;
      }
      // expose for inline onclick dedupe
      try{ window._fallbackGenCode = function(ev){
        // if app.js just generated within 1s, skip duplicate
        try{ if (window._lastGeneratedAt && (Date.now()-window._lastGeneratedAt < 900)) return false; }catch(e){}
        return doGenerateCode(ev);
      }; }catch(e){}
      gForm.addEventListener('submit', doGenerateCode);
      // also direct click on button (covers Samsung where submit doesn't fire)
      var gBtn = gForm.querySelector('button[type="submit"]');
      if (gBtn) gBtn.addEventListener('click', doGenerateCode);
      // also catch via capture on form
      gForm.addEventListener('click', function(ev){
        var target = ev.target && ev.target.closest ? ev.target.closest('button') : null;
        if (target && gForm.contains(target)) { /* handled by button */ }
      });
    } catch(eTop){ console.error('attachGenerateCode top error', eTop); }
  })();

  try {
    var _logoutBtn=document.getElementById('btn-logout');
    if(_logoutBtn) _logoutBtn.addEventListener('click', function(ev){
      if(window._doGlobalLogout){ try{ return window._doGlobalLogout(ev); }catch(e){} }
      try{
        var _keys=['sabratha_session_v2','sabratha_invites_local','sabratha_profiles_local'];
        for(var i=0;i<_keys.length;i++){ var _k=_keys[i]; try{ localStorage.removeItem(_k);}catch(e){} try{ sessionStorage.removeItem(_k);}catch(e){} try{ document.cookie=_k+'=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'; }catch(e){} }
        try{ window._fallbackSession=null; }catch(e){} try{ auth.clearSession(); }catch(e){} try{ window.__logoutJustDone=true; }catch(e){}
        try{ var ov=document.getElementById('auth-overlay'); if(ov){ ov.classList.remove('hidden'); ov.style.display='flex'; } var mc=document.getElementById('main-content'); if(mc){ mc.classList.add('hidden'); mc.style.display='none'; } var sp=document.getElementById('supervisor-panel'); if(sp){ sp.classList.add('hidden'); sp.style.display='none'; } }catch(e){}
        setTimeout(function(){ try{ location.href=location.origin+location.pathname+'?logout=1'; }catch(e){ location.reload(); } },80);
      } catch(e){ try{ auth.logout(); }catch(e2){ location.reload(); } }
    });
  } catch(e){}
  try {
    var _copyBtn=document.getElementById('btn-copy-code');
    if(_copyBtn) _copyBtn.addEventListener('click', function() { var elc=document.getElementById('gen-code'); if(elc && elc.textContent) copyText(elc.textContent); else toast(state.lang==='ar'?'لا يوجد كود للنسخ':'No code','error'); });
  } catch(e){}
  try {
    var _copyLinkBtn=document.getElementById('btn-copy-link');
    if(_copyLinkBtn) _copyLinkBtn.addEventListener('click', function(){ var _le=document.getElementById('gen-link'); if(_le && _le.textContent) copyText(_le.textContent); else { var _c=document.getElementById('gen-code'); if(_c && _c.textContent) copyText(location.origin+location.pathname+'?code='+encodeURIComponent(_c.textContent)); } });
  } catch(e){}
  try {
    var _shareBtn=document.getElementById('btn-share-code');
    if(_shareBtn) _shareBtn.addEventListener('click', function() {
      var codeEl=document.getElementById('gen-code'); var nameEl=document.getElementById('gen-for-name');
      var code = codeEl ? codeEl.textContent : ''; var name = nameEl ? nameEl.textContent : '';
      if(!code){ toast(state.lang==='ar'?'لا يوجد كود للمشاركة':'No code','error'); return; }
      var link = location.origin+location.pathname+'?code='+encodeURIComponent(code);
      var text = (state.lang === 'ar' ? 'رمز دعوة للأستاذ' : 'Invite code for') + ' ' + name + ': ' + code + ' — رابط مباشر: ' + link;
      if (navigator.share) { try { navigator.share({ title: 'ELT Tech-Assistant — Invite', text: text, url: link }); return; } catch(e2) {} } copyText(text + ' — ' + link);
    });
  } catch(e){}

  // Onboarding modal handler — guarded
  try {
  document.getElementById('onboarding-form').addEventListener('submit', async e => {
    e.preventDefault();
    const p = auth.getCurrentProfile(); if (!p) return;
    const updates = { fullName: document.getElementById('ob-fullname').value.trim(), title: document.getElementById('ob-title').value.trim(), subjects: document.getElementById('ob-subjects').value.trim(), academicYear: document.getElementById('ob-years').value.trim(), schedule: (document.getElementById('ob-schedule')?.value || '').trim() };
    if (!updates.fullName) { toast(t('err_code_required'), 'error'); return; }
    if (!updates.title || !updates.subjects || !updates.academicYear || !updates.schedule) { toast(state.lang==='ar'?'أكمل كل الحقول — الصفة، المواد، السنوات، الأوقات':'Please fill all fields — title, subjects, years, schedule','error'); return; }
    try { await auth.updateProfile({ code: p.code, updates }); toast(t('toast_profile_saved')); document.getElementById('onboarding-modal').classList.add('hidden'); updateHeaderProfile(); classroomSetCourse().catch(()=>{}); } catch (err) { toast(err.message, 'error'); }
  }); } catch(e){ console.warn('onboarding handler', e.message); }
}

function checkProfileComplete(p) {
  return p && p.full_name && p.title && p.subjects && p.academic_year && p.schedule;
}

function onLoginSuccess(profile) {
  const p = profile || auth.getCurrentProfile();
  toast(`${t('toast_welcome')} ${p.full_name || ''}`);
  showAuth(false);
  updateHeaderProfile();
  if (!checkProfileComplete(p)) {
    document.getElementById('ob-fullname').value = p.full_name || '';
    document.getElementById('ob-title').value = p.title || '';
    document.getElementById('ob-subjects').value = p.subjects || '';
    document.getElementById('ob-years').value = p.academic_year || '';
    const sched = document.getElementById('ob-schedule'); if (sched) sched.value = p.schedule || '';
    document.getElementById('onboarding-modal').classList.remove('hidden');
  }
  // Load private data
  if (db.isConfigured()) {
    document.getElementById('setup-notice').classList.add('hidden');
    refreshCourses().then(() => refreshSavedList());
    if (auth.isAdmin()) { document.getElementById('supervisor-panel').classList.remove('hidden'); refreshSupervisorData(); } else { document.getElementById('supervisor-panel').classList.add('hidden'); }
  } else { document.getElementById('setup-notice').classList.remove('hidden'); }
  // notify classroom
  setTimeout(() => { classroomSetCourse().catch(()=>{}); }, 500);
}

/* ==========================================================================
 * Init
 * ======================================================================== */
async function init() {
  document.getElementById('btn-lang').addEventListener('click', () => { state.lang = state.lang === 'ar' ? 'en' : 'ar'; applyI18n(); });
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.querySelectorAll('.btn-copy').forEach(btn => btn.addEventListener('click', () => { const tgt = document.getElementById(btn.dataset.copyTarget); if (tgt) copyText(tgt.textContent || ''); }));
  document.getElementById('btn-copy-all').addEventListener('click', () => copyText(analysisAsText()));
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-print-2').addEventListener('click', () => window.print());
  initInputHandlers(); initCourses(); initAuthHandlers();
  document.getElementById('btn-generate').addEventListener('click', generate);

  db.initSupabase();
  auth.initAuth({ db, t, toast });

  // Restore session if exists
  const sess = await auth.restoreSession();
  if (sess) { showAuth(false); updateHeaderProfile(); if (!checkProfileComplete(sess)) document.getElementById('onboarding-modal').classList.remove('hidden'); if (auth.isAdmin()) document.getElementById('supervisor-panel').classList.remove('hidden'); if (db.isConfigured()) { refreshCourses().then(()=>refreshSavedList()); } } else { showAuth(true); if (db.isConfigured()) document.getElementById('setup-notice').classList.add('hidden'); else document.getElementById('setup-notice').classList.remove('hidden'); }

  try { initClassroom({ t, el, toast, formatDate, state, db }); setTimeout(()=> classroomSetCourse().catch(()=>{}), 800); } catch (e) { console.warn(e.message); }

  const remembered = localStorage.getItem('sabratha_elt_name'); if (remembered) { const n = document.getElementById('comment-name'); if (n) n.value = remembered; }
  applyI18n(); updateCharCount(); updateHeaderProfile();
}

document.addEventListener('DOMContentLoaded', init);
export { state, t, el, toast, formatDate };
