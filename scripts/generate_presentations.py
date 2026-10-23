#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate bilingual TEACH-LAP presentations: EN + AR
- 4 files: EN.pptx, EN.pdf, AR.pptx, AR.pdf
- No teacher names/passwords in public slides, only final slide credits A. Inas Mesbah
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# Colors
NAVY = RGBColor(0x0B, 0x3C, 0x49)
NAVY2 = RGBColor(0x0F, 0x4C, 0x5C)
TEAL = RGBColor(0x14, 0x65, 0x7A)
GOLD = RGBColor(0xE3, 0xB2, 0x3C)
GOLD_LIGHT = RGBColor(0xFF, 0xF0, 0xC0)
SLATE_BG = RGBColor(0xF2, 0xF9, 0xFB)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SLATE_500 = RGBColor(0x64, 0x74, 0x8B)
SLATE_700 = RGBColor(0x33, 0x41, 0x55)
SLATE_100 = RGBColor(0xF1, 0xF5, 0xF9)

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "presentations")
os.makedirs(OUT_DIR, exist_ok=True)

# Helpers
def add_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def set_slide_size(prs, w=Inches(13.33), h=Inches(7.5)):
    prs.slide_width = w
    prs.slide_height = h

def add_shape(slide, shape_type, left, top, width, height, fill_color=None, line_color=None, line_width=None):
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
        if line_width:
            shape.line.width = line_width
    else:
        shape.line.fill.background()
    return shape

def add_textbox(slide, left, top, width, height, text, font_size=14, bold=False, color=NAVY, alignment=PP_ALIGN.LEFT, font_name="Calibri", italic=False, line_spacing=None):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.font.italic = italic
    p.alignment = alignment
    if line_spacing:
        p.line_spacing = line_spacing
    return txBox

def add_para(text_frame, text, font_size=12, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT, font_name="Calibri", space_after=Pt(6), italic=False, bullet=False):
    p = text_frame.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.font.italic = italic
    p.alignment = alignment
    p.space_after = space_after
    if bullet:
        p.level = 1
    return p

def add_badge(slide, left, top, text, bg=GOLD, fg=NAVY):
    shape = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(1.6), Inches(0.35), fill_color=bg)
    shape.shadow.inherit_shadow = False
    tf = shape.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(8)
    p.font.bold = True
    p.font.color.rgb = fg
    p.font.name = "Calibri"
    p.alignment = PP_ALIGN.CENTER
    return shape

# Content definitions
SLIDES_EN = [
    {
        "type": "cover",
        "kicker": "SABRATHA UNIVERSITY  •  FACULTY OF EDUCATION  •  ENGLISH DEPARTMENT",
        "title": "TEACH-LAP",
        "subtitle": "AI-Powered Teaching Assistant for ELT",
        "desc": "Transforming lesson preparation from hours to minutes — private, secure, and tailored to the Standard Classroom",
        "badge": "Next.js  •  Supabase  •  Gemini AI",
        "footer": "Bilingual Platform  •  EN / AR  •  2025 — 2026",
    },
    {
        "type": "definition",
        "section": "01  DEFINITION",
        "title": "What is TEACH-LAP?",
        "bullets": [
            "A private web platform that converts raw texts and documents into structured, academic lectures in seconds",
            "Powered by Gemini AI — generates: summary (220-350 words), core concepts, key takeaways, classroom applications, scenario Q&A, reflection tasks & discussion questions",
            "Every generation is auto-saved to a secure, teacher-isolated history (Supabase) and can be exported as Markdown / .txt",
            "Bilingual output: English, Arabic, or Bilingual — grounded in SAMR / TPACK and the Libyan Standard Classroom reality",
        ],
        "side_title": "Core Promise",
        "side_bullets": [
            "Large classes? Supported.",
            "Limited devices? Optimized for smartphones.",
            "Intermittent internet? Lightweight & fast.",
            "Teacher privacy? 100% isolated spaces.",
        ],
    },
    {
        "type": "importance",
        "section": "02  IMPORTANCE",
        "title": "Why It Matters",
        "cards": [
            ("⏱ SAVE TIME", "Cuts preparation from 3-4 hours to under 5 minutes. Teachers focus on teaching, not formatting."),
            ("🎯 QUALITY & CONSISTENCY", "Every lecture follows the same academic rigor: SAMR/TPACK links, ELT skill tags, Libyan context fit."),
            ("🔒 PRIVACY BY DESIGN", "No public marketplace. Each teacher sees only her courses, students, and history. Service-role bypass ensures isolation."),
            ("📱 REAL CLASSROOM FIT", "Designed for Standard Classroom — large groups, smartphones only, low bandwidth. No lab required."),
        ],
    },
    {
        "type": "audience",
        "section": "03  TARGET AUDIENCE",
        "title": "Who Is It For?",
        "cols": [
            ("PRIMARY USERS", [
                "Two dedicated teachers with fully isolated workspaces — each with own login, courses by Year/Semester, and student cohorts",
                "Teacher A: 4 active subjects (Years 1-4) — e.g., CALL, Conversation, ELT Methodology, Phonology",
                "Teacher B: 3 active subjects (Years 1 & 4) — e.g., Writing, Literature & Micro-Teaching",
                "Schedules embedded per subject (Day + Lecture Period + Time)",
            ]),
            ("STUDENTS", [
                "Invited per course/year by their teacher via email — no self-registration chaos",
                "View published lectures, save summaries (.md/.txt), and see attendance & grades (read-only)",
                "No Gemini access — consumption and reflection only, keeping assessment fair",
            ]),
            ("MANAGEMENT", [
                "Read-only oversight for quality assurance — no editing of teacher content",
                "Future-ready: scalable to more teachers without redesign",
            ]),
        ],
    },
    {
        "type": "benefits",
        "section": "04  BENEFITS & SUMMARY",
        "title": "Benefits & Conclusion",
        "left": [
            ("FOR TEACHERS", "Generate → Save → Publish → Track. Manage attendance, coursework & exam scores per course. History with search, view, delete & export."),
            ("FOR STUDENTS", "One private space: My Courses → Lectures (with summaries) → My Grades (attendance + scores). Simple, mobile-first."),
            ("FOR THE INSTITUTION", "Standardized digital archive, bilingual capability, secure Supabase RLS + service-role isolation, 90-day persistent login."),
        ],
        "right_title": "CONCLUSION",
        "right_text": "TEACH-LAP is not a generic public site that gets neglected. It is a private, professional hub that solves a real daily problem — preparation time and classroom relevance — while respecting teacher privacy and student fairness. It turns a manual burden into a 5-minute professional workflow.",
    },
    {
        "type": "workflow",
        "section": "05  IDEA & WORKFLOW",
        "title": "How It Works — End to End",
        "steps": [
            ("1. LOGIN", "Teacher logs in with username + permanent code → persistent HMAC-signed cookie (90 days) → redirected to her private dashboard (/teacher/teacher-a)."),
            ("2. COURSES", "Courses auto-seeded per subject/year via SQL (teacher_username isolated). Each course has its own interactive page (lectures, students, records)."),
            ("3. INVITE", "Teacher invites students per course/year by email → course_enrollments created → students see only their teacher’s courses."),
            ("4. GENERATE", "Teacher pastes text / uploads files → POST /api/generate → Gemini (gemini-3.5-flash-lite + fallbacks) → JSON → Markdown → saved to lectures_history with teacher_username."),
            ("5. HISTORY", "GET /api/history (teacher_username filtered, bypass RLS) → searchable history panel (total count, view, expand, delete, export .md/.txt). No Unauthorized."),
            ("6. PUBLISH", "Teacher selects lecture from history → POST /api/courses/[id]/lectures → course_lectures junction → visible instantly to enrolled students."),
            ("7. TRACK", "Record attendance (present/absent/late/excused), coursework & exams per course → students see grades read-only in /student."),
            ("8. LOGOUT", "Header + Dashboard logout clears both teacher_session & student_session (secure/sameSite) → redirects to correct login."),
        ],
    },
    {
        "type": "tech",
        "section": "06  TECHNICAL ARCHITECTURE",
        "title": "Technical Concept",
        "cols2": [
            ("STACK", [
                "Frontend: Next.js 14 App Router + Tailwind + i18n (en/ar, RTL aware)",
                "Backend: Supabase (Postgres + Auth + RLS) • Service-role bypass for teacher_session",
                "AI: Google Gemini API (server-side GEMINI_API_KEY, JSON schema + Markdown render)",
                "Auth: Custom HMAC teacher_session (username.code) — no Supabase Auth dependency for teachers",
            ]),
            ("DATA & SECURITY", [
                "Tables: courses (teacher_username isolated), course_enrollments, course_lectures, lectures_history (teacher_username + professor_id), attendance, coursework_grades, exam_scores",
                "RLS policies + is_enrolled_in_course() / is_teacher_of_course() helpers — bypass only for verified teacher_username",
                "Middleware: protects /teacher, /admin, /courses/[id] — allows /api/auth/* public",
                "Build: 15 routes + Middleware 57.1kB — verified production build",
            ]),
        ],
        "note": "Setup: 1) Run whitelist.sql → lectures_history.sql → step5_lms.sql  2) Run enas_teacher_setup.sql & eman_teacher_setup.sql  3) Run fix_lectures_history_teacher_username.sql  4) Set TEACHER_SESSION_SECRET + GEMINI_API_KEY on Vercel",
    },
    {
        "type": "screenshots",
        "section": "07  LIVE PREVIEW",
        "title": "Screens & Experience",
        "items": [
            ("/  Home", "Hero: Generate lecture form (title + text + files) → Gemini settings (language) → Live Markdown preview + Export"),
            ("/teacher/[username]", "Dashboard: welcome banner, subjects by semester with schedule chips, created courses grid, invite panel, quick tools"),
            ("/courses/[id]", "Course page: 5 tabs — Lectures (publish/unpublish), Students (enroll/remove), Attendance, Coursework, Exams"),
            ("/student  &  Header", "Student view: My Courses with read-only lectures + grades. Global header: role-aware logout (teacher/student)"),
        ],
    },
    {
        "type": "closing",
        "kicker": "PROJECT CREDIT",
        "title": "Technical Project Idea",
        "name": "A. Inas Mesbah",
        "desc": "English Department — Faculty of Education — Sabratha University\nConceived, directed and supervised the pedagogical model, data structure and AI workflow for TEACH-LAP.\nPrivate instance: 2 teachers, isolated workspaces, bilingual AI grounded in the Standard Classroom.",
        "note": "This presentation contains no credentials. Access is granted individually via username + permanent code.",
    },
]

SLIDES_AR = [
    {
        "type": "cover",
        "kicker": "جامعة صبراتة  •  كلية التربية  •  قسم اللغة الإنجليزية",
        "title": "TEACH-LAP",
        "subtitle": "المساعد التدريسي الذكي لتدريس اللغة الإنجليزية",
        "desc": "يحوّل تحضير المحاضرة من ساعات إلى دقائق — خاص، آمن، ومصمم للفصل المعياري",
        "badge": "Next.js  •  Supabase  •  Gemini AI",
        "footer": "منصة ثنائية اللغة  •  EN / AR  •  2025 — 2026",
    },
    {
        "type": "definition",
        "section": "01  التعريف",
        "title": "ما هو TEACH-LAP؟",
        "bullets": [
            "منصة ويب خاصة تحوّل النصوص والملفات الخام إلى محاضرات أكاديمية منظمة خلال ثوانٍ",
            "مدعوم بـ Gemini — يولّد: ملخصاً (220-350 كلمة)، مفاهيم أساسية، خلاصات، تطبيقات صفية، سيناريو وأسئلة، مهام تأملية ونقاشية",
            "كل توليد يُحفظ تلقائياً في سجل آمن معزول لكل أستاذة (Supabase) ويمكن تصديره Markdown / .txt",
            "إخراج ثنائي اللغة: إنجليزية، عربية، أو ثنائية — مؤسس على SAMR/TPACK وواقع الفصل المعياري الليبي",
        ],
        "side_title": "الوعد الأساسي",
        "side_bullets": [
            "فصول كبيرة؟ مدعومة.",
            "أجهزة محدودة؟ محسّن للهواتف الذكية.",
            "إنترنت متقطع؟ خفيف وسريع.",
            "خصوصية الأستاذة؟ مساحات معزولة 100%.",
        ],
    },
    {
        "type": "importance",
        "section": "02  الأهمية",
        "title": "لماذا هو مهم؟",
        "cards": [
            ("⏱ توفير الوقت", "يقلّص التحضير من 3-4 ساعات إلى أقل من 5 دقائق. تركيز الأستاذة على التدريس لا التنسيق."),
            ("🎯 جودة واتساق", "كل محاضرة بنفس الصرامة الأكاديمية: روابط SAMR/TPACK ووسوم مهارات ELT وملاءمة للسياق الليبي."),
            ("🔒 خصوصية بالتصميم", "ليس سوقاً عاماً. كل أستاذة ترى مقرراتها وطالباتها وسجلها فقط. عزل عبر service-role."),
            ("📱 ملاءمة واقعية", "مصمم للفصل المعياري — مجموعات كبيرة، هواتف فقط، نطاق ضعيف. لا حاجة لمختبر."),
        ],
    },
    {
        "type": "audience",
        "section": "03  الجمهور المستهدف",
        "title": "لمن هذا الموقع؟",
        "cols": [
            ("المستخدِمون الأساسيون", [
                "أستاذتان بمساحتي عمل معزولتين تماماً — لكل واحدة دخولها ومقرراتها حسب السنة/السمستر وكوكبة طالباتها",
                "الأستاذة (أ): 4 مواد نشطة (السنوات 1-4) — مثل CALL والمحادثة وطرق التدريس والصوتيات",
                "الأستاذة (ب): 3 مواد نشطة (السنوات 1 و 4) — مثل الكتابة والأدب والتدريس المصغر",
                "جداول مضمّنة لكل مادة (اليوم + الحصة + التوقيت)",
            ]),
            ("الطالبات", [
                "مدعوات لكل مقرر/سنة عبر البريد من قبل أستاذتهن — لا تسجيل ذاتي عشوائي",
                "يعرضن المحاضرات المنشورة، يحفظن الملخصات (.md/.txt)، ويرين الحضور والدرجات (قراءة فقط)",
                "لا وصول لـ Gemini — استهلاك وتأمل فقط للحفاظ على عدالة التقييم",
            ]),
            ("الإدارة", [
                "متابعة قراءة فقط لضمان الجودة — دون تعديل محتوى الأستاذات",
                "قابل للتوسع مستقبلاً لأستاذات إضافيات دون إعادة تصميم",
            ]),
        ],
    },
    {
        "type": "benefits",
        "section": "04  الفائدة والخلاصة",
        "title": "الفائدة والخلاصة",
        "left": [
            ("للأستاذة", "توليد ← حفظ ← نشر ← متابعة. إدارة حضور ودرجات أعمال السنة والاختبارات لكل مقرر. سجل مع بحث وعرض وحذف وتصدير."),
            ("للطالبة", "مساحة واحدة خاصة: مقرراتي ← محاضرات (مع ملخصات) ← تقييماتي (حضور + درجات). بسيطة ومهيأة للجوال."),
            ("للمؤسسة", "أرشيف رقمي موحّد، قدرة ثنائية اللغة، أمان Supabase RLS + عزل service-role، دخول مستمر 90 يوماً."),
        ],
        "right_title": "الخلاصة",
        "right_text": "TEACH-LAP ليس موقعاً عاماً مهملاً. هو مركز مهني خاص يحل مشكلة يومية حقيقية — وقت التحضير وملاءمة الفصل — مع احترام خصوصية الأستاذة وعدالة الطالبة. يحوّل عبئاً يدوياً إلى سير عمل احترافي من 5 دقائق.",
    },
    {
        "type": "workflow",
        "section": "05  الفكرة وطريقة العمل",
        "title": "كيف يعمل — من البداية حتى النهاية",
        "steps": [
            ("1. الدخول", "الأستاذة تدخل باسم المستخدم + الكود الدائم ← كوكي موقّعة HMAC (90 يوم) ← توجه لمساحتها الخاصة (/teacher/teacher-a)."),
            ("2. المقررات", "مقررات مُنشأة تلقائياً لكل مادة/سنة عبر SQL (معزولة بـ teacher_username). لكل مقرر صفحة تفاعلية (محاضرات، طالبات، سجلات)."),
            ("3. الدعوة", "الأستاذة تدعو الطالبات لكل مقرر/سنة عبر البريد ← إنشاء course_enrollments ← الطالبة ترى فقط مقررات أستاذتها."),
            ("4. التوليد", "الأستاذة تلصق نصاً / ترفع ملفات ← POST /api/generate ← Gemini (3.5-flash-lite + بدائل) ← JSON ← Markdown ← حفظ في lectures_history مع teacher_username."),
            ("5. السجل", "GET /api/history (مصفّى بـ teacher_username وتجاوز RLS) ← لوحة سجل قابلة للبحث (العدد الإجمالي، عرض، توسيع، حذف، تصدير .md/.txt) بدون Unauthorized."),
            ("6. النشر", "الأستاذة تختار محاضرة من السجل ← POST /api/courses/[id]/lectures ← جدول course_lectures ← تظهر فوراً للطالبات المسجلات."),
            ("7. المتابعة", "تسجيل حضور (حاضر/غائب/متأخر/بعذر) ودرجات أعمال السنة والاختبارات لكل مقرر ← الطالبة تراها قراءة فقط في /student."),
            ("8. الخروج", "زر خروج في الهيدر + لوحة التحكم + صفحة الطالبة (يمسح teacher_session و student_session مع secure/sameSite) ← يعيد للدخول الصحيح."),
        ],
    },
    {
        "type": "tech",
        "section": "06  الفكرة التقنية",
        "title": "البنية التقنية",
        "cols2": [
            ("الحِزمة", [
                "الواجهة: Next.js 14 App Router + Tailwind + i18n (en/ar مع دعم RTL)",
                "الخلفية: Supabase (Postgres + Auth + RLS) • تجاوز service-role لـ teacher_session",
                "الذكاء الاصطناعي: Google Gemini API (مفتاح GEMINI_API_KEY في الخادم، مخطط JSON + عرض Markdown)",
                "المصادقة: جلسة HMAC مخصصة teacher_session (username.code) — لا اعتماد على Supabase Auth للأساتذة",
            ]),
            ("البيانات والأمان", [
                "الجداول: courses (معزولة بـ teacher_username)، course_enrollments، course_lectures، lectures_history (teacher_username + professor_id)، attendance، coursework_grades، exam_scores",
                "سياسات RLS + دوال is_enrolled_in_course() / is_teacher_of_course() — التجاوز فقط لـ teacher_username الموثق",
                "Middleware: يحمي /teacher و /admin و /courses/[id] — يسمح بـ /api/auth/* علناً",
                "البناء: 15 مساراً + Middleware 57.1kB — بناء إنتاج موثق",
            ]),
        ],
        "note": "التهيئة: 1) تشغيل whitelist.sql ← lectures_history.sql ← step5_lms.sql  2) تشغيل enas_teacher_setup.sql و eman_teacher_setup.sql  3) تشغيل fix_lectures_history_teacher_username.sql  4) ضبط TEACHER_SESSION_SECRET + GEMINI_API_KEY في Vercel",
    },
    {
        "type": "screenshots",
        "section": "07  معاينة حيّة",
        "title": "الشاشات والتجربة",
        "items": [
            ("/ الصفحة الرئيسية", "الواجهة: نموذج توليد (عنوان + نص + ملفات) ← إعدادات Gemini (اللغة) ← معاينة Markdown حيّة + تصدير"),
            ("/teacher/[username]", "لوحة التحكم: بانر ترحيب، مواد حسب السمستر مع شارات الجدول، شبكة المقررات المنشأة، لوحة الدعوة، أدوات سريعة"),
            ("/courses/[id]", "صفحة المقرر: 5 تبويبات — المحاضرات (نشر/إلغاء)، الطالبات (إضافة/إزالة)، الحضور، أعمال السنة، الاختبارات"),
            ("/student  و  الهيدر", "عرض الطالبة: مقرراتي مع محاضرات للقراءة + درجات. هيدر عام: تسجيل خروج ذكي حسب الدور (أستاذة/طالبة)"),
        ],
    },
    {
        "type": "closing",
        "kicker": "نسبة المشروع",
        "title": "الفكرة التقنية للمشروع",
        "name": "أ. إيناس مصباح",
        "desc": "قسم اللغة الإنجليزية — كلية التربية — جامعة صبراتة\nصاحبة الفكرة والمشرفة على النموذج البيداغوجي وهيكلة البيانات وسير عمل الذكاء الاصطناعي لـ TEACH-LAP.\nنسخة خاصة: أستاذتان، مساحات معزولة، ذكاء اصطناعي ثنائي اللغة مؤسس على الفصل المعياري.",
        "note": "هذا العرض لا يحتوي على بيانات دخول. يُمنح الوصول فردياً عبر اسم المستخدم + الكود الدائم.",
    },
]

def build_deck(slides_data, is_arabic, filename):
    prs = Presentation()
    set_slide_size(prs)
    # Use blank layout
    blank = prs.slide_layouts[6]

    for idx, s in enumerate(slides_data):
        slide = prs.slides.add_slide(blank)

        if s["type"] == "cover":
            # Navy background
            add_bg(slide, NAVY)
            # Gold top bar
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.12), fill_color=GOLD)
            # Badge top right
            add_badge(slide, Inches(10.2), Inches(0.45), s["badge"])
            # Kicker
            align = PP_ALIGN.RIGHT if is_arabic else PP_ALIGN.LEFT
            add_textbox(slide, Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.4), s["kicker"], font_size=8, bold=True, color=GOLD, alignment=align, font_name="Calibri")
            # Title TEACH-LAP
            add_textbox(slide, Inches(0.8), Inches(1.6), Inches(11.7), Inches(1.1), s["title"], font_size=54, bold=True, color=WHITE, alignment=align, font_name="Calibri")
            # Subtitle
            add_textbox(slide, Inches(0.8), Inches(2.7), Inches(11.7), Inches(0.6), s["subtitle"], font_size=22, bold=False, color=GOLD_LIGHT, alignment=align, font_name="Calibri" if not is_arabic else "Calibri")
            # Desc
            add_textbox(slide, Inches(0.8), Inches(3.5), Inches(7.5), Inches(0.8), s["desc"], font_size=11, bold=False, color=WHITE, alignment=align, font_name="Calibri", line_spacing=1.2)
            # Footer
            add_textbox(slide, Inches(0.8), Inches(6.9), Inches(11.7), Inches(0.3), s["footer"], font_size=7, bold=False, color=RGBColor(0xAA,0xBB,0xCC), alignment=PP_ALIGN.CENTER, font_name="Calibri")
            # Decorative circle with S
            c = add_shape(slide, MSO_SHAPE.OVAL, Inches(10.5), Inches(3.2), Inches(1.4), Inches(1.4), fill_color=GOLD)
            tf = c.text_frame
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = "S"
            p.font.size = Pt(44)
            p.font.bold = True
            p.font.color.rgb = NAVY
            p.font.name = "Calibri"
            p.alignment = PP_ALIGN.CENTER

        elif s["type"] == "definition":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            # Section label
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(3), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            # Title
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            # Bullets left
            left = Inches(0.6) if not is_arabic else Inches(4.8)
            tx = slide.shapes.add_textbox(left, Inches(1.5), Inches(7.6), Inches(5.2))
            tf = tx.text_frame
            tf.word_wrap = True
            for bullet in s["bullets"]:
                add_para(tf, f"•  {bullet}", font_size=9, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri", space_after=Pt(8))
            # Side card
            side_left = Inches(8.8) if not is_arabic else Inches(0.6)
            card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, side_left, Inches(1.5), Inches(3.9), Inches(4.3), fill_color=SLATE_BG, line_color=RGBColor(0xE6,0xF2,0xF5))
            # side title inside card
            add_textbox(slide, side_left + Inches(0.3), Inches(1.8), Inches(3.3), Inches(0.3), s["side_title"], font_size=10, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            t2 = slide.shapes.add_textbox(side_left + Inches(0.3), Inches(2.3), Inches(3.3), Inches(3.0))
            tf2 = t2.text_frame
            tf2.word_wrap = True
            for b in s["side_bullets"]:
                add_para(tf2, f"✓  {b}", font_size=9, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri", space_after=Pt(10))

        elif s["type"] == "importance":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(3), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            # 4 cards in grid
            for i, (title, desc) in enumerate(s["cards"]):
                col = i % 2
                row = i // 2
                left = Inches(0.6) + col * Inches(6.4)
                top = Inches(1.6) + row * Inches(2.8)
                card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(6.1), Inches(2.45), fill_color=WHITE, line_color=RGBColor(0xE2,0xE8,0xF0))
                card.shadow.inherit_shadow = False
                add_textbox(slide, left + Inches(0.3), top + Inches(0.25), Inches(5.5), Inches(0.4), title, font_size=10, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
                add_textbox(slide, left + Inches(0.3), top + Inches(0.75), Inches(5.5), Inches(1.4), desc, font_size=8.5, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
                # gold left border accent
                add_shape(slide, MSO_SHAPE.RECTANGLE, left, top, Inches(0.08), Inches(2.45), fill_color=GOLD)

        elif s["type"] == "audience":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            for i, (col_title, bullets) in enumerate(s["cols"]):
                left = Inches(0.6) + i * Inches(4.25)
                # col header
                hdr = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.55), Inches(4.0), Inches(0.45), fill_color=NAVY)
                add_textbox(slide, left + Inches(0.15), Inches(1.6), Inches(3.7), Inches(0.35), col_title, font_size=8, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER, font_name="Calibri")
                tx = slide.shapes.add_textbox(left + Inches(0.15), Inches(2.2), Inches(3.7), Inches(4.8))
                tf = tx.text_frame
                tf.word_wrap = True
                for b in bullets:
                    add_para(tf, f"•  {b}", font_size=7.5, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri", space_after=Pt(7))

        elif s["type"] == "benefits":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            # left 3 cards stacked
            left_tx = slide.shapes.add_textbox(Inches(0.6), Inches(1.55), Inches(7.5), Inches(5.3))
            tf = left_tx.text_frame
            tf.word_wrap = True
            for title, desc in s["left"]:
                add_para(tf, title, font_size=9, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri", space_after=Pt(2))
                add_para(tf, desc, font_size=8, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri", space_after=Pt(14))
            # right card
            card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.6), Inches(1.55), Inches(4.1), Inches(5.3), fill_color=NAVY)
            add_textbox(slide, Inches(8.9), Inches(1.8), Inches(3.5), Inches(0.4), s["right_title"], font_size=10, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER, font_name="Calibri")
            add_textbox(slide, Inches(8.9), Inches(2.35), Inches(3.5), Inches(4.4), s["right_text"], font_size=8.5, bold=False, color=WHITE, alignment=PP_ALIGN.CENTER if not is_arabic else PP_ALIGN.CENTER, font_name="Calibri")

        elif s["type"] == "workflow":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=24, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            # 8 steps in 2 columns (4 per column)
            for i, (step_title, step_desc) in enumerate(s["steps"]):
                col = i % 2
                row = i // 2
                left = Inches(0.6) + col * Inches(6.4)
                top = Inches(1.5) + row * Inches(1.45)
                # number badge
                num = add_shape(slide, MSO_SHAPE.OVAL, left, top + Inches(0.05), Inches(0.45), Inches(0.45), fill_color=GOLD)
                tf = num.text_frame
                tf.vertical_anchor = MSO_ANCHOR.MIDDLE
                tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = str(i+1)
                p.font.size = Pt(10)
                p.font.bold = True
                p.font.color.rgb = NAVY
                p.font.name = "Calibri"
                p.alignment = PP_ALIGN.CENTER
                # title + desc
                add_textbox(slide, left + Inches(0.6), top, Inches(5.6), Inches(0.35), step_title, font_size=8, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
                add_textbox(slide, left + Inches(0.6), top + Inches(0.3), Inches(5.6), Inches(1.0), step_desc, font_size=7, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")

        elif s["type"] == "tech":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            for i, (col_title, bullets) in enumerate(s["cols2"]):
                left = Inches(0.6) + i * Inches(6.4)
                add_textbox(slide, left, Inches(1.55), Inches(6.0), Inches(0.35), col_title, font_size=9, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
                # thin gold line
                add_shape(slide, MSO_SHAPE.RECTANGLE, left, Inches(1.9), Inches(1.2), Inches(0.06), fill_color=GOLD)
                tx = slide.shapes.add_textbox(left, Inches(2.1), Inches(6.0), Inches(4.0))
                tf = tx.text_frame
                tf.word_wrap = True
                for b in bullets:
                    add_para(tf, f"•  {b}", font_size=7.2, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri", space_after=Pt(8))
            # note at bottom
            note_box = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(6.6), Inches(12.1), Inches(0.55), fill_color=RGBColor(0xFF,0xF8,0xE1), line_color=RGBColor(0xF0,0xE6,0xC2))
            add_textbox(slide, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.45), s["note"], font_size=6.5, bold=False, color=RGBColor(0x7C,0x5A,0x0A), alignment=PP_ALIGN.CENTER, font_name="Calibri")

        elif s["type"] == "screenshots":
            add_bg(slide, SLATE_BG)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
            for i, (title, desc) in enumerate(s["items"]):
                col = i % 2
                row = i // 2
                left = Inches(0.6) + col * Inches(6.4)
                top = Inches(1.55) + row * Inches(2.65)
                card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(6.1), Inches(2.35), fill_color=WHITE, line_color=RGBColor(0xE2,0xE8,0xF0))
                # mock browser bar
                add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.15), top + Inches(0.2), Inches(5.8), Inches(0.35), fill_color=SLATE_100)
                add_textbox(slide, left + Inches(0.3), top + Inches(0.23), Inches(5.5), Inches(0.3), title, font_size=7, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")
                add_textbox(slide, left + Inches(0.3), top + Inches(0.7), Inches(5.5), Inches(1.4), desc, font_size=7.5, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, font_name="Calibri")

        elif s["type"] == "closing":
            add_bg(slide, NAVY)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.12), fill_color=GOLD)
            add_textbox(slide, Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.4), s["kicker"], font_size=8, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER, font_name="Calibri")
            add_textbox(slide, Inches(0.8), Inches(1.6), Inches(11.7), Inches(0.6), s["title"], font_size=30, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER, font_name="Calibri")
            # Gold divider
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(5.9), Inches(2.4), Inches(1.5), Inches(0.08), fill_color=GOLD)
            add_textbox(slide, Inches(0.8), Inches(2.8), Inches(11.7), Inches(0.7), s["name"], font_size=28, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER, font_name="Calibri")
            add_textbox(slide, Inches(1.5), Inches(3.8), Inches(10.3), Inches(1.8), s["desc"], font_size=10, bold=False, color=WHITE, alignment=PP_ALIGN.CENTER, font_name="Calibri")
            # Note box
            add_textbox(slide, Inches(1.5), Inches(6.1), Inches(10.3), Inches(0.5), s["note"], font_size=7, bold=False, color=RGBColor(0xAA,0xBB,0xCC), alignment=PP_ALIGN.CENTER, font_name="Calibri", italic=True)

    prs.save(os.path.join(OUT_DIR, filename))
    print(f"Saved {filename}")

# Generate both decks
build_deck(SLIDES_EN, is_arabic=False, filename="TEACH-LAP_Overview_EN.pptx")
build_deck(SLIDES_AR, is_arabic=True, filename="TEACH-LAP_Overview_AR.pptx")

print("Done PPTX")
