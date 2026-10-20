/**
 * app.js — Frontend application logic
 * ============================================================================
 * SABRATHA ELT Tech-Assistant (مساعد تكنولوجيا تدريس اللغة الإنجليزية)
 * Sabratha University — Faculty of Arts & Education — Department of English
 * ----------------------------------------------------------------------------
 * Vanilla JS SPA controller: bilingual UI (AR/EN), lecture input & file upload,
 * Gemini generation via /api/generate, results rendering, reflection tasks and
 * the discussion board (persisted with Supabase via supabase.js).
 * ========================================================================== */

import * as db from './supabase.js';

/* ==========================================================================
 * Internationalisation (AR default / EN)
 * ======================================================================== */

const I18N = {
  ar: {
    nav_print: 'طباعة',
    btn_print: 'طباعة',
    hero_badge: 'كلية الآداب والتعليم — قسم اللغة الإنجليزية',
    hero_title: 'توظيف التكنولوجيا في تدريس اللغة الإنجليزية',
    hero_sub: 'الصق محتوى المحاضرة أو ارفعه، ودع المساعد الذكي يُنتج لك ملخصًا تربويًا، مفاهيم جوهرية (SAMR، TPACK، التعلم المدمج)، تطبيقات عملية للصفوف الليبية، سيناريوهات وأسئلة بنماذج إجابة، ومهام تأمل ونقاش تفاعلية.',
    hero_cta: 'ابدأ الآن',
    hero_learn_more: 'ماذا يُنتج المساعد؟',
    hero_card_sub: 'مدعوم بالذكاء الاصطناعي — مجاني بالكامل',
    hero_feat_1: 'ملخصات تربوية ومفاهيم جوهرية',
    hero_feat_2: 'خلاصات وتطبيقات للصفوف الليبية',
    hero_feat_3: 'سيناريوهات وأسئلة بنماذج إجابة',
    hero_feat_4: 'مهام تأمل ونقاش تفاعلية',
    setup_title: 'قاعدة البيانات غير مهيأة بعد (Supabase)',
    setup_text: 'أضف بيانات Supabase في ملف supabase.js لتفعيل حفظ المحاضرات ومحادثات النقاش. التوليد بالذكاء الاصطناعي يعمل بدونها.',
    step1_title: 'أدخل محتوى المحاضرة',
    step1_sub: 'الصق النص أو ارفع ملفًا نصيًا — كلما كان المحتوى أدق، كانت النتائج أفضل',
    label_title: 'عنوان المحاضرة',
    ph_title: 'مثال: نموذج SAMR وتوظيف التكنولوجيا في الصف',
    label_text: 'محتوى المحاضرة',
    ph_text: 'الصق هنا نص المحاضرة الكاملة...',
    chars_word: 'حرف',
    drop_title: 'اسحب ملفًا نصيًا هنا أو اضغط للاختيار',
    drop_hint: 'يدعم: TXT, MD — حتى 80 ألف حرف',
    label_output_lang: 'لغة النتائج',
    opt_ar: 'العربية',
    opt_en: 'الإنجليزية',
    opt_bilingual: 'ثنائي اللغة (عربي + إنجليزي)',
    btn_sample: 'مثال جاهز',
    btn_clear: 'مسح',
    btn_generate: 'توليد المحتوى التعليمي',
    generate_note: 'يتم التوليد بواسطة Google Gemini — النص لا يُرسل إلا للخدمة، والمفتاح محمي على الخادم.',
    sidebar_title: 'المحاضرات المحفوظة',
    sidebar_empty: 'لا توجد محاضرات محفوظة بعد.',
    btn_open: 'فتح',
    btn_delete: 'حذف',
    results_title: 'النتائج التفاعلية',
    btn_copy_all: 'نسخ الكل',
    btn_copy: 'نسخ',
    tab_summary: 'الملخص والمفاهيم',
    tab_takeaways: 'الخلاصات والتطبيقات',
    tab_scenarios: 'السيناريوهات والأسئلة',
    tab_reflections: 'مهام التأمل',
    tab_discussion: 'لوحة النقاش',
    summary_title: 'الملخص التربوي',
    concepts_title: 'المفاهيم الجوهرية',
    takeaways_title: 'الخلاصات الرئيسية',
    applications_title: 'تطبيقات عملية للصفوف الليبية',
    scenarios_title: 'سيناريوهات صفية وأسئلة بنماذج إجابة',
    scenarios_hint: 'اضغط على السؤال لعرض نموذج الإجابة — تدرب عليها استعدادًا للامتحان.',
    reflections_title: 'مهام التأمل الطلابية',
    reflections_hint: 'اكتب تأملك واحفظه ليطلع عليه الزملاء والمحاضر.',
    discussion_title: 'لوحة النقاش',
    discussion_hint: 'شارك رأيك في أسئلة النقاش، ورد على زملائك.',
    discussion_qs_title: 'أسئلة النقاش المقترحة',
    label_name: 'الاسم',
    ph_name: 'اسمك أو اسمك المستعار',
    label_role: 'الصفة',
    role_student: 'طالب/طالبة',
    role_professor: 'محاضر/ة',
    label_comment: 'تعليقك',
    ph_comment: 'اكتب تعليقك هنا...',
    btn_comment_submit: 'نشر التعليق',
    comments_title: 'التعليقات',
    comments_empty: 'كن أول من يعلّق على هذه المحاضرة.',
    features_title: 'ماذا يُنتج المساعد لك؟',
    features_sub: 'أربعة مخرجات تعليمية مصممة خصيصًا لمقرر «توظيف التكنولوجيا في تدريس اللغة الإنجليزية».',
    feat1_title: 'ملخصات تربوية ومفاهيم',
    feat1_text: 'ملخص دقيق للمحاضرة مع المفاهيم الجوهرية: SAMR، TPACK، التعلم المدمج، نظريات التعلم وأكثر.',
    feat2_title: 'خلاصات وتطبيقات ليبية',
    feat2_text: 'خلاصات سريعة وتطبيقات عملية واقعية للصفوف الليبية: أفكار جاهزة للتنفيذ حتى مع موارد محدودة.',
    feat3_title: 'سيناريوهات ونماذج إجابة',
    feat3_text: 'أسئلة سيناريوهات واقعية بنماذج إجابة قوية، مصممة على نمط أسئلة الامتحانات الجامعية.',
    feat4_title: 'تأمل ونقاش تفاعلي',
    feat4_text: 'مهام تأمل شخصية وجماعية ولوحة نقاش تفاعلية تربط الطلاب والمحاضرين في مساحة واحدة.',
    footer_about: 'تطبيق تعليمي مجاني مفتوح لطلبة ومحاضري قسم اللغة الإنجليزية — كلية الآداب والتعليم، جامعة صبراتة.',
    footer_course: 'المقرر',
    footer_course_ar: 'توظيف التكنولوجيا في تدريس اللغة الإنجليزية',
    footer_tech: 'التقنيات',
    footer_rights: '© 2026 جامعة صبراتة — كلية الآداب والتعليم — قسم اللغة الإنجليزية. جميع الحقوق محفوظة.',
    loading_title: 'جارٍ توليد المحتوى التعليمي...',
    loading_sub: 'يقرأ Gemini المحاضرة ويجهّز الملخص والتطبيقات والأسئلة. قد يستغرق ذلك حتى دقيقة.',
    // dynamic strings
    toast_generated: 'تم توليد المحتوى بنجاح! ✨',
    toast_saved_db: 'تم حفظ المحاضرة في قاعدة البيانات.',
    toast_copied: 'تم النسخ إلى الحافظة.',
    toast_file_loaded: 'تم تحميل الملف بنجاح.',
    toast_file_bad: 'تعذر قراءة الملف. تأكد أنه ملف نصي.',
    toast_sample: 'تم تحميل مثال جاهز.',
    toast_cleared: 'تم مسح النموذج.',
    toast_comment: 'تم نشر تعليقك. شكراً لك!',
    toast_reflection: 'تم حفظ تأملك.',
    toast_deleted: 'تم حذف المحاضرة.',
    toast_need_text: 'يرجى إدخال محتوى المحاضرة أولًا (40 حرفًا على الأقل).',
    toast_error: 'حدث خطأ. حاول مرة أخرى.',
    toast_db_off: 'قاعدة البيانات غير مهيأة — النتائج معروضة لكن غير محفوظة.',
    err_prefix: 'خطأ',
    model_answer_label: 'نموذج الإجابة',
    question_label: 'السؤال',
    type_individual: 'فردي',
    type_group: 'جماعي',
    type_discussion: 'نقاش',
    reflection_name_label: 'اسمك',
    reflection_ph: 'اكتب تأملك هنا...',
    btn_save_reflection: 'حفظ التأمل',
    saved_reflections_title: 'تأملات محفوظة',
    no_reflections: 'لا توجد تأملات محفوظة بعد.',
    comments_disabled: 'لوحة النقاش تحتاج إعداد Supabase.',
    loading_saved: 'جارٍ فتح المحاضرة...',
  },
  en: {
    nav_print: 'Print',
    btn_print: 'Print',
    hero_badge: 'Faculty of Arts & Education — Department of English',
    hero_title: 'Employing Technology in ELT',
    hero_sub: 'Paste or upload your lecture content and let the AI assistant generate a pedagogical summary, core concepts (SAMR, TPACK, Blended Learning), Libyan-classroom applications, scenario-based Q&A with model answers, and interactive reflection & discussion tasks.',
    hero_cta: 'Start now',
    hero_learn_more: 'What does it generate?',
    hero_card_sub: 'Powered by AI — completely free',
    hero_feat_1: 'Pedagogical summaries & core concepts',
    hero_feat_2: 'Takeaways for Libyan classrooms',
    hero_feat_3: 'Scenarios with model answers',
    hero_feat_4: 'Interactive reflection & discussion',
    setup_title: 'Database not configured yet (Supabase)',
    setup_text: 'Add your Supabase credentials in supabase.js to enable saving lectures and discussion threads. AI generation works without it.',
    step1_title: 'Enter your lecture content',
    step1_sub: 'Paste the text or upload a text file — the richer the content, the better the results',
    label_title: 'Lecture title',
    ph_title: 'e.g., The SAMR Model and technology integration in class',
    label_text: 'Lecture content',
    ph_text: 'Paste the full lecture text here...',
    chars_word: 'characters',
    drop_title: 'Drop a text file here or click to browse',
    drop_hint: 'Supports: TXT, MD — up to 80,000 characters',
    label_output_lang: 'Output language',
    opt_ar: 'Arabic',
    opt_en: 'English',
    opt_bilingual: 'Bilingual (Arabic + English)',
    btn_sample: 'Load sample',
    btn_clear: 'Clear',
    btn_generate: 'Generate educational content',
    generate_note: 'Generated by Google Gemini — text is only sent to the service; the API key stays protected on the server.',
    sidebar_title: 'Saved lectures',
    sidebar_empty: 'No saved lectures yet.',
    btn_open: 'Open',
    btn_delete: 'Delete',
    results_title: 'Interactive results',
    btn_copy_all: 'Copy all',
    btn_copy: 'Copy',
    tab_summary: 'Summary & Concepts',
    tab_takeaways: 'Takeaways & Applications',
    tab_scenarios: 'Scenarios & Q&A',
    tab_reflections: 'Reflection tasks',
    tab_discussion: 'Discussion board',
    summary_title: 'Pedagogical summary',
    concepts_title: 'Core concepts',
    takeaways_title: 'Key takeaways',
    applications_title: 'Practical applications for Libyan classrooms',
    scenarios_title: 'Classroom scenarios with model answers',
    scenarios_hint: 'Click a question to reveal the model answer — practise them for your exam.',
    reflections_title: 'Student reflection tasks',
    reflections_hint: 'Write your reflection and save it for peers and the professor.',
    discussion_title: 'Discussion board',
    discussion_hint: 'Share your view on the discussion questions and reply to peers.',
    discussion_qs_title: 'Suggested discussion questions',
    label_name: 'Name',
    ph_name: 'Your name or nickname',
    label_role: 'Role',
    role_student: 'Student',
    role_professor: 'Professor',
    label_comment: 'Your comment',
    ph_comment: 'Write your comment here...',
    btn_comment_submit: 'Post comment',
    comments_title: 'Comments',
    comments_empty: 'Be the first to comment on this lecture.',
    features_title: 'What does the assistant generate?',
    features_sub: 'Four educational outputs tailored to the course "Employing Technology in ELT".',
    feat1_title: 'Summaries & concepts',
    feat1_text: 'A precise lecture summary with core concepts: SAMR, TPACK, Blended Learning, learning theories and more.',
    feat2_title: 'Libyan takeaways & applications',
    feat2_text: 'Quick takeaways and realistic classroom applications for Libyan settings — ready-to-use ideas even with limited resources.',
    feat3_title: 'Scenarios & model answers',
    feat3_text: 'Realistic scenario questions with strong model answers, styled after university exam questions.',
    feat4_title: 'Reflection & discussion',
    feat4_text: 'Individual and group reflection tasks plus an interactive discussion board connecting students and professors.',
    footer_about: 'A free, open educational app for students and staff of the Department of English — Faculty of Arts & Education, Sabratha University.',
    footer_course: 'Course',
    footer_course_ar: 'Employing Technology in ELT (Arabic title)',
    footer_tech: 'Technologies',
    footer_rights: '© 2026 Sabratha University — Faculty of Arts & Education — Department of English. All rights reserved.',
    loading_title: 'Generating educational content...',
    loading_sub: 'Gemini is reading your lecture and preparing the summary, applications and questions. This may take up to a minute.',
    // dynamic strings
    toast_generated: 'Content generated successfully! ✨',
    toast_saved_db: 'Lecture saved to the database.',
    toast_copied: 'Copied to clipboard.',
    toast_file_loaded: 'File loaded successfully.',
    toast_file_bad: 'Could not read the file. Please use a plain-text file.',
    toast_sample: 'Sample lecture loaded.',
    toast_cleared: 'Form cleared.',
    toast_comment: 'Comment posted. Thank you!',
    toast_reflection: 'Reflection saved.',
    toast_deleted: 'Lecture deleted.',
    toast_need_text: 'Please enter lecture content first (at least 40 characters).',
    toast_error: 'Something went wrong. Please try again.',
    toast_db_off: 'Database not configured — results shown but not saved.',
    err_prefix: 'Error',
    model_answer_label: 'Model answer',
    question_label: 'Question',
    type_individual: 'Individual',
    type_group: 'Group',
    type_discussion: 'Discussion',
    reflection_name_label: 'Your name',
    reflection_ph: 'Write your reflection here...',
    btn_save_reflection: 'Save reflection',
    saved_reflections_title: 'Saved reflections',
    no_reflections: 'No saved reflections yet.',
    comments_disabled: 'The discussion board needs Supabase setup.',
    loading_saved: 'Opening lecture...',
  },
};

const state = {
  lang: 'ar',
  current: null, // { lectureId, title, text, outputLanguage, analysis, meta }
  comments: [],
  reflections: [],
};

function t(key) {
  return I18N[state.lang][key] ?? I18N.ar[key] ?? key;
}

function applyI18n() {
  const html = document.documentElement;
  html.lang = state.lang;
  html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('btn-lang-label').textContent = state.lang === 'ar' ? 'EN' : 'عربي';

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });

  // Re-render dynamic content in the new language
  if (state.current) renderAnalysis();
  renderSavedList();
  renderComments();
  renderReflections();
}

/* ==========================================================================
 * Small DOM / UX helpers
 * ======================================================================== */

/** Safe element builder — text via textContent (no HTML injection). */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const colors = {
    success: 'bg-brand-800 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-700 text-white',
  };
  const item = el(
    'div',
    `pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm fade-in max-w-md ${colors[type] || colors.info}`,
    message
  );
  container.appendChild(item);
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transition = 'opacity .4s';
    setTimeout(() => item.remove(), 400);
  }, 3800);
}

function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(state.lang === 'ar' ? 'ar-LY' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('toast_copied'));
    return;
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = el('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    if (typeof document.execCommand === 'function') {
      document.execCommand('copy');
    }
    ta.remove();
    toast(t('toast_copied'));
  } catch {
    toast(t('toast_error'), 'error');
  }
}

/* ==========================================================================
 * Sample lecture
 * ======================================================================== */

const SAMPLES = {
  ar: `عنوان المحاضرة: نموذج SAMR وتوظيف التكنولوجيا في تدريس اللغة الإنجليزية

يُعد نموذج SAMR (الاستبدال، التعزيز، التعديل، إعادة التعريف) الذي طوره روبن بونتيدر (Ruben Puentedura) من أبرز النماذج المستخدمة لتقييم درجة توظيف التكنولوجيا في التعليم. يصنف النموذج استخدام التكنولوجيا إلى أربعة مستويات: الاستبدال حيث تحل التقنية محل الأداة التقليدية دون تعديل جوهري (مثل استخدام المستند الرقمي بدل الورقة)، والتعزيز حيث تضيف التقنية تحسينات بسيطة (مثل التدقيق الإملائي)، والتعديل حيث تسمح التقنية بإعادة تصميم المهام بشكل ملحوظ (مثل كتابة المقالات تفاعليًا مع زملاء في صف آخر)، وإعادة التعريف حيث تُنشئ التقنية مهامًا كانت مستحيلة سابقًا (مثل إنتاج طلبة لمدونة صوتية عالمية يشاركها متعلمون حول العالم).

أما إطار TPACK (المعرفة التكنولوجية التربوية للمحتوى) الذي طوره ميشرا وكوهلر (Mishra & Koehler) فيؤكد على أن المعلم الفعال هو الذي يجمع بين المعرفة بالمحتوى (CK)، والمعرفة التربوية (PK)، والمعرفة التكنولوجية (TK) في تكامل ديناميكي. فمعرفة المعلم بقواعد اللغة الإنجليزية وحدها لا تكفي؛ بل يجب أن يعرف كيف يعلّمها (PK) وكيف تدعمها التقنيات الرقمية (TK) بشكل متكامل.

ومن المفاهيم المهمة أيضًا التعلم المدمج (Blended Learning) الذي يجمع بين التعليم الصفّي المباشر والتعلم الإلكتروني عبر منصات مثل Moodle أو Google Classroom، وهو مناسب جدًا للجامعات الليبية حيث يمكن الاستفادة من الإنترنت في الأنشطة التكميلية رغم تفاوت سرعة الاتصال. كما يرتبط ذلك بمفهوم البيئة الافتراضية للتعلم (VLE) والفصل المقلوب (Flipped Classroom) حيث يشاهد الطلبة المحاضرة المسجلة في المنزل وتناقش الأنشطة داخل الصف.

أخيرًا، يبرز مبدأ تعدد الوسائط (Multimedia Learning) استنادًا إلى نظرية ماير (Mayer) التي تؤكد أن التعلم يصبح أعمق عند دمج النص والصورة والفيديو بشكل متوازن، مع تجنب الحمل المعرفي الزائد. وفي الصفوف الليبية المزدحمة، يمكن للمعلم استخدام الهاتف الذكي والبرامج المجانية مثل Kahoot وQuizlet وYouTube لتحويل المحتوى إلى تجارب تعلم تفاعلية.`,
  en: `Lecture title: The SAMR Model and Employing Technology in ELT

The SAMR model (Substitution, Augmentation, Modification, Redefinition), developed by Ruben Puentedura, is one of the most widely used frameworks for evaluating how technology is employed in education. The model classifies technology use into four levels: Substitution, where technology replaces a traditional tool with no functional change (e.g., a digital document instead of paper); Augmentation, where technology adds minor improvements (e.g., spell checking); Modification, where technology allows significant task redesign (e.g., collaborative essays with a class in another city); and Redefinition, where technology creates tasks that were previously impossible (e.g., students publishing a global podcast shared with learners worldwide).

The TPACK framework (Technological Pedagogical Content Knowledge), developed by Mishra and Koehler, stresses that the effective teacher integrates Content Knowledge (CK), Pedagogical Knowledge (PK), and Technological Knowledge (TK) in a dynamic way. Knowing English grammar alone is not enough: the teacher must also know how to teach it (PK) and how digital tools can support it (TK).

Blended Learning is another key concept: combining face-to-face classroom instruction with online learning through platforms such as Moodle or Google Classroom. It suits Libyan universities well, where internet connectivity varies but can still support complementary activities. Related concepts include the Virtual Learning Environment (VLE) and the Flipped Classroom, where students watch recorded lectures at home and discuss activities in class.

Finally, Mayer's Cognitive Theory of Multimedia Learning highlights that deeper learning happens when text, images and video are combined in a balanced way while avoiding cognitive overload. In crowded Libyan classrooms, teachers can use smartphones and free tools such as Kahoot, Quizlet and YouTube to transform content into interactive learning experiences.`,
};

/* ==========================================================================
 * Input handling
 * ======================================================================== */

function updateCharCount() {
  const text = document.getElementById('lecture-text').value;
  document.getElementById('char-count').textContent = String(text.length);
}

function handleFile(file) {
  if (!file) return;
  const okTypes = /\.(txt|md|markdown|text)$/i;
  if (!okTypes.test(file.name) && file.type && !file.type.startsWith('text/')) {
    toast(t('toast_file_bad'), 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('lecture-text').value = String(reader.result || '');
    const fileNameEl = document.getElementById('file-name');
    fileNameEl.textContent = file.name;
    fileNameEl.classList.remove('hidden');
    if (!document.getElementById('lecture-title').value.trim()) {
      document.getElementById('lecture-title').value = file.name.replace(/\.[^.]+$/, '');
    }
    updateCharCount();
    toast(t('toast_file_loaded'));
  };
  reader.onerror = () => toast(t('toast_file_bad'), 'error');
  reader.readAsText(file);
}

function initInputHandlers() {
  const textArea = document.getElementById('lecture-text');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');

  textArea.addEventListener('input', updateCharCount);

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  ['dragover', 'dragenter'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    })
  );
  dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer?.files?.[0]));

  document.getElementById('btn-sample').addEventListener('click', () => {
    const sample = SAMPLES[state.lang] || SAMPLES.ar;
    textArea.value = sample;
    document.getElementById('lecture-title').value =
      state.lang === 'ar'
        ? 'نموذج SAMR وتوظيف التكنولوجيا في تدريس اللغة الإنجليزية'
        : 'The SAMR Model and Employing Technology in ELT';
    updateCharCount();
    toast(t('toast_sample'));
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    textArea.value = '';
    document.getElementById('lecture-title').value = '';
    document.getElementById('file-name').classList.add('hidden');
    fileInput.value = '';
    updateCharCount();
    toast(t('toast_cleared'), 'info');
  });
}

/* ==========================================================================
 * Generation flow (/api/generate → Gemini)
 * ======================================================================== */

async function generate() {
  const title = document.getElementById('lecture-title').value.trim();
  const text = document.getElementById('lecture-text').value.trim();
  const outputLanguage = document.getElementById('output-language').value;

  if (text.length < 40) {
    toast(t('toast_need_text'), 'error');
    document.getElementById('lecture-text').focus();
    return;
  }

  showLoading(true);
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text, outputLanguage }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      const message = json?.error?.message || t('toast_error');
      throw new Error(message);
    }

    state.current = {
      lectureId: null,
      title: title || (state.lang === 'ar' ? 'محاضرة بدون عنوان' : 'Untitled lecture'),
      text,
      outputLanguage,
      analysis: json.data,
      meta: json.meta,
    };

    renderAnalysis();
    document.getElementById('results-section').classList.remove('hidden');
    switchTab('summary');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    toast(t('toast_generated'));

    if (db.isConfigured()) {
      await persistCurrent();
    } else {
      document.getElementById('setup-notice').classList.remove('hidden');
      toast(t('toast_db_off'), 'info');
    }
  } catch (err) {
    toast(`${t('err_prefix')}: ${err.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

/** Save lecture + analysis to Supabase, then refresh the sidebar. */
async function persistCurrent() {
  try {
    const { data: lecture, error } = await db.saveLecture({
      title: state.current.title,
      sourceText: state.current.text,
      outputLanguage: state.current.outputLanguage,
    });
    if (error || !lecture) return;

    state.current.lectureId = lecture.id;
    await db.saveAnalysis(lecture.id, state.current.analysis, state.current.meta?.model);
    await refreshSavedList();
    toast(t('toast_saved_db'));
  } catch (err) {
    console.warn('[app.js] persist failed:', err.message);
  }
}

/* ==========================================================================
 * Results rendering
 * ======================================================================== */

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const active = btn.dataset.tab === name;
    btn.classList.toggle('tab-active', active);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== `panel-${name}`);
  });
}

function typeLabel(type) {
  if (type === 'group') return t('type_group');
  if (type === 'discussion') return t('type_discussion');
  return t('type_individual');
}

function renderAnalysis() {
  const a = state.current?.analysis;
  if (!a) return;

  // Summary
  document.getElementById('summary-text').textContent = a.summary || '';

  // Core concepts
  const conceptsGrid = document.getElementById('concepts-grid');
  conceptsGrid.innerHTML = '';
  (a.core_concepts || []).forEach((c, i) => {
    const card = el('div', 'rounded-2xl border-2 border-brand-100 bg-brand-50/60 p-5 hover:shadow-card transition');
    const badge = el(
      'span',
      'inline-block px-2.5 py-0.5 rounded-full bg-brand-800 text-gold-500 text-[11px] font-extrabold mb-2',
      `#${i + 1}`
    );
    card.appendChild(badge);
    card.appendChild(el('h5', 'font-extrabold text-brand-900 text-lg leading-snug', c.term));
    card.appendChild(el('p', 'text-sm text-slate-700 mt-2 leading-relaxed', c.definition));
    if (c.classroom_link) {
      const link = el('div', 'mt-3 pt-3 border-t border-brand-100');
      link.appendChild(el('p', 'text-xs font-bold text-gold-700 mb-1', state.lang === 'ar' ? 'مثال صفي:' : 'Classroom example:'));
      link.appendChild(el('p', 'text-xs text-slate-600 leading-relaxed', c.classroom_link));
      card.appendChild(link);
    }
    conceptsGrid.appendChild(card);
  });

  // Takeaways
  const takeawaysList = document.getElementById('takeaways-list');
  takeawaysList.innerHTML = '';
  (a.key_takeaways || []).forEach((item) => {
    const li = el('li', 'flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100');
    const icon = el(
      'span',
      'w-7 h-7 rounded-full bg-gold-500 text-brand-900 flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5',
      '★'
    );
    li.appendChild(icon);
    li.appendChild(el('p', 'text-slate-700 leading-relaxed', item));
    takeawaysList.appendChild(li);
  });

  // Libyan applications
  const appsList = document.getElementById('applications-list');
  appsList.innerHTML = '';
  (a.libyan_applications || []).forEach((item, i) => {
    const card = el('div', 'rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 text-white p-5 shadow-card');
    const badge = el(
      'div',
      'w-8 h-8 rounded-xl bg-gold-500 text-brand-900 flex items-center justify-center font-extrabold text-sm mb-3',
      String(i + 1)
    );
    card.appendChild(badge);
    card.appendChild(el('p', 'text-sm leading-relaxed text-brand-50', item));
    appsList.appendChild(card);
  });

  // Scenarios
  const scenariosList = document.getElementById('scenarios-list');
  scenariosList.innerHTML = '';
  (a.scenario_qa || []).forEach((q, i) => {
    const details = el('details', 'group rounded-2xl border-2 border-slate-100 overflow-hidden hover:border-brand-100 transition');
    const summary = el('summary', 'flex items-start gap-3 p-5 bg-slate-50 group-hover:bg-brand-50 transition');
    const qBadge = el(
      'span',
      'w-8 h-8 rounded-xl bg-brand-800 text-gold-500 flex items-center justify-center font-extrabold text-sm shrink-0',
      `Q${i + 1}`
    );
    summary.appendChild(qBadge);
    const qText = el('p', 'flex-1 font-bold text-slate-800 leading-relaxed', q.question);
    summary.appendChild(qText);
    const chevron = el(
      'span',
      'chevron text-brand-700 transition-transform shrink-0 mt-1',
      '▾'
    );
    summary.appendChild(chevron);
    details.appendChild(summary);

    const body = el('div', 'p-5 border-t-2 border-slate-100 bg-white');
    body.appendChild(
      el('p', 'text-xs font-extrabold text-gold-700 uppercase tracking-wider mb-2', t('model_answer_label'))
    );
    body.appendChild(el('p', 'text-slate-700 leading-loose whitespace-pre-line', q.model_answer));
    details.appendChild(body);
    scenariosList.appendChild(details);
  });

  // Reflection tasks
  renderReflections();

  // Discussion questions
  const qsList = document.getElementById('discussion-questions');
  qsList.innerHTML = '';
  (a.discussion_questions || []).forEach((q, i) => {
    const li = el('li', 'flex items-start gap-2.5');
    li.appendChild(el('span', 'w-6 h-6 rounded-full bg-brand-800 text-gold-500 flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5', String(i + 1)));
    li.appendChild(el('p', 'text-sm text-slate-700 leading-relaxed', q));
    qsList.appendChild(li);
  });
}

function analysisAsText() {
  const a = state.current?.analysis;
  if (!a) return '';
  const lines = [];
  const title = state.current?.title || '';
  if (title) lines.push(`# ${title}`, '');
  lines.push(`## ${t('summary_title')}`, a.summary || '', '');
  lines.push(`## ${t('concepts_title')}`);
  (a.core_concepts || []).forEach((c) => lines.push(`• ${c.term}: ${c.definition}${c.classroom_link ? ` (${c.classroom_link})` : ''}`));
  lines.push('', `## ${t('takeaways_title')}`);
  (a.key_takeaways || []).forEach((x) => lines.push(`• ${x}`));
  lines.push('', `## ${t('applications_title')}`);
  (a.libyan_applications || []).forEach((x) => lines.push(`• ${x}`));
  lines.push('', `## ${t('scenarios_title')}`);
  (a.scenario_qa || []).forEach((q, i) => lines.push(`Q${i + 1}: ${q.question}`, `${t('model_answer_label')}: ${q.model_answer}`, ''));
  lines.push(`## ${t('reflections_title')}`);
  (a.reflection_tasks || []).forEach((r, i) => lines.push(`${i + 1}. [${typeLabel(r.type)}] ${r.title}: ${r.prompt}`));
  lines.push('', `## ${t('discussion_qs_title')}`);
  (a.discussion_questions || []).forEach((q) => lines.push(`• ${q}`));
  return lines.join('\n');
}

/* ==========================================================================
 * Saved lectures (Supabase)
 * ======================================================================== */

async function refreshSavedList() {
  if (!db.isConfigured()) {
    renderSavedList([]);
    return;
  }
  const { data } = await db.fetchLectures();
  renderSavedList(data || []);
}

function renderSavedList(lectures) {
  const list = document.getElementById('saved-list');
  const countEl = document.getElementById('saved-count');
  if (!list) return;

  const items = lectures ?? (renderSavedList._cache || []);
  renderSavedList._cache = items;

  countEl.textContent = String(items.length);
  list.innerHTML = '';

  if (!items.length) {
    list.appendChild(el('p', 'text-sm text-slate-400 text-center py-8', t('sidebar_empty')));
    return;
  }

  items.forEach((lecture) => {
    const card = el('div', 'rounded-2xl border-2 border-slate-100 p-4 hover:border-brand-200 transition');
    card.appendChild(el('h4', 'font-bold text-slate-800 text-sm leading-snug', lecture.title));
    card.appendChild(el('p', 'text-xs text-slate-400 mt-1', formatDate(lecture.created_at)));

    const actions = el('div', 'flex items-center gap-2 mt-3');
    const openBtn = el('button', 'px-3 py-1.5 rounded-lg bg-brand-800 text-white text-xs font-bold hover:bg-brand-900 transition', t('btn_open'));
    openBtn.addEventListener('click', () => openLecture(lecture));
    const delBtn = el('button', 'px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition', t('btn_delete'));
    delBtn.addEventListener('click', async () => {
      if (!confirm(state.lang === 'ar' ? 'هل تريد حذف هذه المحاضرة؟' : 'Delete this lecture?')) return;
      await db.deleteLecture(lecture.id);
      await refreshSavedList();
      toast(t('toast_deleted'));
    });
    actions.appendChild(openBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

async function openLecture(lecture) {
  if (!db.isConfigured()) return;
  showLoading(true);
  try {
    const [{ data: analysis }, { data: comments }, { data: reflections }] = await Promise.all([
      db.fetchAnalysis(lecture.id),
      db.fetchComments(lecture.id),
      db.fetchReflections(lecture.id),
    ]);

    state.current = {
      lectureId: lecture.id,
      title: lecture.title,
      text: lecture.source_text || '',
      outputLanguage: lecture.output_language || 'ar',
      analysis: analysis
        ? {
            summary: analysis.summary,
            core_concepts: analysis.core_concepts,
            key_takeaways: analysis.key_takeaways,
            libyan_applications: analysis.libyan_applications,
            scenario_qa: analysis.scenario_qa,
            reflection_tasks: analysis.reflection_tasks,
            discussion_questions: analysis.discussion_questions,
          }
        : null,
      meta: { model: analysis?.model },
    };
    state.comments = comments || [];
    state.reflections = reflections || [];

    document.getElementById('lecture-title').value = lecture.title;
    document.getElementById('lecture-text').value = lecture.source_text || '';
    updateCharCount();

    if (state.current.analysis) {
      renderAnalysis();
      document.getElementById('results-section').classList.remove('hidden');
      switchTab('summary');
      document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }
    renderComments();
    renderReflections();
  } catch (err) {
    toast(`${t('err_prefix')}: ${err.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

/* ==========================================================================
 * Reflection tasks (interactive)
 * ======================================================================== */

function renderReflections() {
  const container = document.getElementById('reflections-list');
  if (!container) return;
  container.innerHTML = '';
  const tasks = state.current?.analysis?.reflection_tasks || [];

  tasks.forEach((task, index) => {
    const card = el('div', 'rounded-2xl border-2 border-slate-100 overflow-hidden');

    const head = el('div', 'bg-brand-50 p-5 border-b-2 border-slate-100');
    const headRow = el('div', 'flex items-start justify-between gap-3');
    const left = el('div', 'flex-1');
    left.appendChild(el('h5', 'font-extrabold text-brand-900 text-lg leading-snug', task.title));
    left.appendChild(el('p', 'text-slate-700 mt-2 leading-relaxed', task.prompt));
    headRow.appendChild(left);
    headRow.appendChild(
      el('span', 'px-3 py-1 rounded-full bg-brand-800 text-gold-500 text-xs font-bold shrink-0', typeLabel(task.type))
    );
    head.appendChild(headRow);
    card.appendChild(head);

    const body = el('div', 'p-5 space-y-3 no-print');
    const nameInput = el('input', 'w-full rounded-xl border-2 border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-2.5 text-sm transition');
    nameInput.type = 'text';
    nameInput.maxLength = 80;
    nameInput.placeholder = t('reflection_name_label');
    const responseArea = el('textarea', 'w-full rounded-xl border-2 border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-2.5 text-sm transition resize-y');
    responseArea.rows = 3;
    responseArea.maxLength = 4000;
    responseArea.placeholder = t('reflection_ph');

    const saveBtn = el('button', 'inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gold-500 text-brand-900 text-sm font-extrabold hover:bg-gold-600 transition');
    saveBtn.textContent = t('btn_save_reflection');
    saveBtn.addEventListener('click', async () => {
      const response = responseArea.value.trim();
      if (!response) return;
      if (!db.isConfigured() || !state.current?.lectureId) {
        toast(t('toast_db_off'), 'info');
        return;
      }
      const { data, error } = await db.saveReflection({
        lectureId: state.current.lectureId,
        taskIndex: index,
        taskTitle: task.title,
        authorName: nameInput.value.trim() || 'طالب',
        response,
      });
      if (error) {
        toast(t('toast_error'), 'error');
        return;
      }
      if (data) state.reflections.unshift(data);
      responseArea.value = '';
      renderReflections();
      toast(t('toast_reflection'));
    });

    body.appendChild(nameInput);
    body.appendChild(responseArea);
    body.appendChild(saveBtn);
    card.appendChild(body);

    // Saved responses for this task
    const saved = (state.reflections || []).filter((r) => (r.task_index ?? 0) === index);
    if (saved.length) {
      const savedWrap = el('div', 'px-5 pb-5 space-y-2');
      savedWrap.appendChild(el('h6', 'text-xs font-extrabold text-slate-500 uppercase tracking-wider', t('saved_reflections_title')));
      saved.forEach((r) => {
        const item = el('div', 'rounded-xl bg-slate-50 border border-slate-100 p-3');
        const meta = el('div', 'flex items-center gap-2 text-xs text-slate-400');
        meta.appendChild(el('span', 'font-bold text-brand-700', r.author_name));
        meta.appendChild(el('span', '', formatDate(r.created_at)));
        item.appendChild(meta);
        item.appendChild(el('p', 'text-sm text-slate-700 mt-1.5 leading-relaxed whitespace-pre-line', r.response));
        savedWrap.appendChild(item);
      });
      card.appendChild(savedWrap);
    }

    container.appendChild(card);
  });

  if (!tasks.length) {
    container.appendChild(el('p', 'text-sm text-slate-400', state.lang === 'ar' ? 'لا توجد مهام تأمل بعد — ولّد المحتوى أولًا.' : 'No reflection tasks yet — generate content first.'));
  }
}

/* ==========================================================================
 * Discussion board (Supabase comments)
 * ======================================================================== */

function renderComments() {
  const list = document.getElementById('comments-list');
  const countEl = document.getElementById('comments-count');
  if (!list) return;

  const items = state.comments || [];
  countEl.textContent = String(items.length);
  list.innerHTML = '';

  if (!items.length) {
    list.appendChild(el('p', 'text-sm text-slate-400 py-4', t('comments_empty')));
    return;
  }

  items.forEach((comment) => {
    const card = el('div', 'rounded-2xl border-2 border-slate-100 p-4');
    const header = el('div', 'flex items-center gap-2 flex-wrap');
    const avatar = el(
      'div',
      `w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white ${comment.author_role === 'professor' ? 'bg-gold-600' : 'bg-brand-700'}`,
      (comment.author_name || '?').trim().charAt(0).toUpperCase()
    );
    header.appendChild(avatar);
    const who = el('div');
    who.appendChild(el('p', 'font-bold text-slate-800 text-sm', comment.author_name));
    who.appendChild(el('p', 'text-xs text-slate-400', `${comment.author_role === 'professor' ? t('role_professor') : t('role_student')} · ${formatDate(comment.created_at)}`));
    header.appendChild(who);
    card.appendChild(header);
    card.appendChild(el('p', 'text-slate-700 mt-2.5 leading-relaxed whitespace-pre-line', comment.content));
    list.appendChild(card);
  });
}

async function submitComment(event) {
  event.preventDefault();
  const nameInput = document.getElementById('comment-name');
  const roleInput = document.getElementById('comment-role');
  const contentInput = document.getElementById('comment-content');

  const authorName = nameInput.value.trim();
  const content = contentInput.value.trim();
  if (!authorName || !content) return;

  if (!db.isConfigured() || !state.current?.lectureId) {
    toast(t('comments_disabled'), 'info');
    document.getElementById('setup-notice').classList.remove('hidden');
    return;
  }

  const { data, error } = await db.addComment({
    lectureId: state.current.lectureId,
    authorName,
    authorRole: roleInput.value,
    content,
  });

  if (error) {
    toast(t('toast_error'), 'error');
    return;
  }
  if (data) state.comments.push(data);
  contentInput.value = '';
  renderComments();
  toast(t('toast_comment'));
}

/* ==========================================================================
 * Init
 * ======================================================================== */

function init() {
  // Language toggle
  document.getElementById('btn-lang').addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    applyI18n();
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Copy buttons
  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (target) copyText(target.textContent || '');
    });
  });
  document.getElementById('btn-copy-all').addEventListener('click', () => copyText(analysisAsText()));
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-print-2').addEventListener('click', () => window.print());

  // Input + generation
  initInputHandlers();
  document.getElementById('btn-generate').addEventListener('click', generate);

  // Discussion form
  document.getElementById('comment-form').addEventListener('submit', submitComment);

  // Supabase
  db.initSupabase();
  if (db.isConfigured()) {
    document.getElementById('setup-notice').classList.add('hidden');
    refreshSavedList();
  } else {
    document.getElementById('setup-notice').classList.remove('hidden');
    renderSavedList([]);
  }

  // Restore remembered commenter name
  const remembered = localStorage.getItem('sabratha_elt_name');
  if (remembered) document.getElementById('comment-name').value = remembered;
  document.getElementById('comment-name').addEventListener('change', (e) => {
    localStorage.setItem('sabratha_elt_name', e.target.value.trim());
  });

  applyI18n();
  updateCharCount();
}

document.addEventListener('DOMContentLoaded', init);
