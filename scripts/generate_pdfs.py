#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "presentations")
os.makedirs(OUT_DIR, exist_ok=True)

NAVY = HexColor("#0B3C49")
NAVY2 = HexColor("#0F4C5C")
TEAL = HexColor("#14657A")
GOLD = HexColor("#E3B23C")
GOLD_LIGHT = HexColor("#FFF0C0")
SLATE_BG = HexColor("#F2F9FB")
WHITE = white
SLATE_500 = HexColor("#64748B")
SLATE_700 = HexColor("#334155")
SLATE_100 = HexColor("#F1F5F9")

W, H = landscape(A4)  # 842 x 595 pt approx 11.69 x 8.27 inch

def hex_to_rgb(h):
    h=h.lstrip('#')
    return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))

def draw_bg(c, color):
    c.setFillColor(color)
    c.rect(0,0,W,H, fill=1, stroke=0)

def draw_rect(c, x,y,w,h, fill_color=None, stroke_color=None, radius=4):
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(0.5)
    # use roundRect
    c.roundRect(x, y, w, h, radius, fill=1 if fill_color else 0, stroke=1 if stroke_color else 0)

def p_style(fontName, fontSize, leading, textColor, alignment=TA_LEFT, spaceAfter=4, fontNameBold=None, italic=False):
    return ParagraphStyle(
        f's_{fontName}_{fontSize}_{alignment}_{textColor.hexval() if hasattr(textColor, "hexval") else str(textColor)}',
        fontName=fontName,
        fontSize=fontSize,
        leading=leading,
        textColor=textColor,
        alignment=alignment,
        spaceAfter=spaceAfter,
    )

def draw_para(c, text, x, y, w, h, style):
    # text may contain <br/> and <b> etc.
    p = Paragraph(text, style)
    pw, ph = p.wrap(w, h)
    # y is top coordinate, reportlab y is bottom; convert
    p.drawOn(c, x, y - ph)
    return ph

def cover_slide(c, data, is_arabic):
    draw_bg(c, NAVY)
    # gold top bar
    c.setFillColor(GOLD)
    c.rect(0, H-8, W, 8, fill=1, stroke=0)
    # badge top right
    bx, by, bw, bh = W-130, H-38, 115, 18
    c.setFillColor(GOLD)
    c.roundRect(bx, by, bw, bh, 6, fill=1, stroke=0)
    style_badge = p_style('Helvetica-Bold', 6, 7, NAVY, alignment=TA_CENTER)
    draw_para(c, data["badge"], bx, by+bh-4, bw, bh, style_badge)
    # kicker
    align = TA_RIGHT if is_arabic else TA_LEFT
    style_kicker = p_style('Helvetica-Bold', 6, 7, GOLD, alignment=align)
    draw_para(c, data["kicker"], 35, H-70, W-70, 20, style_kicker)
    # title
    style_title = p_style('Helvetica-Bold', 42, 42, WHITE, alignment=align)
    draw_para(c, f'<b>{data["title"]}</b>', 35, H-150, W-70, 60, style_title)
    # subtitle
    style_sub = p_style('Helvetica', 14, 16, GOLD_LIGHT, alignment=align)
    draw_para(c, data["subtitle"], 35, H-180, W-70, 30, style_sub)
    # desc
    style_desc = p_style('Helvetica', 8, 10, WHITE, alignment=align)
    draw_para(c, data["desc"], 35, H-210, 420, 40, style_desc)
    # footer
    style_footer = p_style('Helvetica', 6, 7, HexColor("#AABBCC"), alignment=TA_CENTER)
    draw_para(c, data["footer"], 35, 22, W-70, 12, style_footer)
    # S circle
    cx, cy, r = W-110, 180, 38
    c.setFillColor(GOLD)
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(cx, cy-10, "S")

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
        "desc": "English Department — Faculty of Education — Sabratha University<br/>Conceived, directed and supervised the pedagogical model, data structure and AI workflow for TEACH-LAP.<br/>Private instance: 2 teachers, isolated workspaces, bilingual AI grounded in the Standard Classroom.",
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
                "سياسات RLS + دوال is_enrolled_in_course() / is_teacher_of_course() helpers — التجاوز فقط لـ teacher_username الموثق",
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
        "desc": "قسم اللغة الإنجليزية — كلية التربية — جامعة صبراتة<br/>صاحبة الفكرة والمشرفة على النموذج البيداغوجي وهيكلة البيانات وسير عمل الذكاء الاصطناعي لـ TEACH-LAP.<br/>نسخة خاصة: أستاذتان، مساحات معزولة، ذكاء اصطناعي ثنائي اللغة مؤسس على الفصل المعياري.",
        "note": "هذا العرض لا يحتوي على بيانات دخول. يُمنح الوصول فردياً عبر اسم المستخدم + الكود الدائم.",
    },
]

def definition_slide(c, data, is_arabic):
    draw_bg(c, WHITE)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 20, 22, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 500, 28, style_title)
    # bullets left
    x_bul = 30 if not is_arabic else 310
    style_bullet = p_style('Helvetica', 7, 10, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
    y = H-95
    for b in data["bullets"]:
        ph = draw_para(c, f'•  {b}', x_bul, y, 380, 50, style_bullet)
        y -= ph + 8
    # side card
    x_card = 470 if not is_arabic else 30
    draw_rect(c, x_card, 30, 300, 220, fill_color=SLATE_BG, stroke_color=HexColor("#E6F2F5"))
    style_side_title = p_style('Helvetica-Bold', 8, 9, NAVY, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
    draw_para(c, f'<b>{data["side_title"]}</b>', x_card+12, 235, 276, 18, style_side_title)
    style_side = p_style('Helvetica', 7, 9, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
    y2 = 215
    for sb in data["side_bullets"]:
        ph = draw_para(c, f'✓  {sb}', x_card+12, y2, 276, 20, style_side)
        y2 -= ph + 6

def importance_slide(c, data, is_arabic):
    draw_bg(c, WHITE)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 20, 22, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 500, 28, style_title)
    # 4 cards 2x2
    card_w, card_h = 365, 125
    gap_x, gap_y = 20, 18
    start_x, start_y = 35, H-100
    for i,(title,desc) in enumerate(data["cards"]):
        col = i%2
        row = i//2
        x = start_x + col*(card_w+gap_x)
        y_top = start_y - row*(card_h+gap_y)
        y_bot = y_top - card_h
        draw_rect(c, x, y_bot, card_w, card_h, fill_color=WHITE, stroke_color=HexColor("#E2E8F0"))
        # gold left border
        c.setFillColor(GOLD)
        c.rect(x, y_bot, 4, card_h, fill=1, stroke=0)
        style_t = p_style('Helvetica-Bold', 7, 8, NAVY, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, f'<b>{title}</b>', x+14, y_top-18, card_w-20, 16, style_t)
        style_d = p_style('Helvetica', 6.5, 8, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, desc, x+14, y_top-38, card_w-20, 60, style_d)

def audience_slide(c, data, is_arabic):
    draw_bg(c, WHITE)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 20, 22, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 500, 28, style_title)
    cols = data["cols"]
    col_w = 245
    gap = 18
    start_x = 30
    for i,(col_title, bullets) in enumerate(cols):
        x = start_x + i*(col_w+gap)
        # header
        c.setFillColor(NAVY)
        c.roundRect(x, H-95, col_w, 20, 4, fill=1, stroke=0)
        style_h = p_style('Helvetica-Bold', 6, 7, GOLD, alignment=TA_CENTER)
        draw_para(c, col_title, x, H-82, col_w, 14, style_h)
        # bullets
        style_b = p_style('Helvetica', 6, 8, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        y = H-115
        for b in bullets:
            ph = draw_para(c, f'•  {b}', x+6, y, col_w-12, 60, style_b)
            y -= ph + 6

def benefits_slide(c, data, is_arabic):
    draw_bg(c, WHITE)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 20, 22, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 500, 28, style_title)
    # left
    y = H-95
    for title, desc in data["left"]:
        style_t = p_style('Helvetica-Bold', 7, 8, NAVY, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        ph = draw_para(c, f'<b>{title}</b>', 30, y, 440, 16, style_t)
        y -= ph + 2
        style_d = p_style('Helvetica', 6.5, 8, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        ph = draw_para(c, desc, 30, y, 440, 30, style_d)
        y -= ph + 12
    # right card
    draw_rect(c, W-260, 30, 230, 280, fill_color=NAVY, radius=6)
    style_rt = p_style('Helvetica-Bold', 8, 9, GOLD, alignment=TA_CENTER)
    draw_para(c, f'<b>{data["right_title"]}</b>', W-250, 285, 210, 16, style_rt)
    style_ri = p_style('Helvetica', 7, 9, WHITE, alignment=TA_CENTER)
    draw_para(c, data["right_text"], W-250, 270, 210, 180, style_ri)

def workflow_slide(c, data, is_arabic):
    draw_bg(c, WHITE)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 18, 20, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 600, 28, style_title)
    steps = data["steps"]
    # 2 columns 4 rows
    col_w = 365
    start_x = 30
    start_y = H-95
    row_h = 75
    gap_x = 20
    for i,(st, sd) in enumerate(steps):
        col = i%2
        row = i//2
        x = start_x + col*(col_w+gap_x)
        y_top = start_y - row*row_h
        # number circle
        cx = x+10
        cy = y_top - 12
        c.setFillColor(GOLD)
        c.circle(cx, cy, 10, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(cx, cy-3, str(i+1))
        style_st = p_style('Helvetica-Bold', 7, 8, NAVY, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, f'<b>{st}</b>', x+26, y_top-8, col_w-30, 14, style_st)
        style_sd = p_style('Helvetica', 6, 7.5, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, sd, x+26, y_top-22, col_w-30, 40, style_sd)

def tech_slide(c, data, is_arabic):
    draw_bg(c, WHITE)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 20, 22, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 600, 28, style_title)
    for i,(col_title, bullets) in enumerate(data["cols2"]):
        x = 30 + i*390
        style_ct = p_style('Helvetica-Bold', 8, 9, NAVY, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, f'<b>{col_title}</b>', x, H-95, 360, 16, style_ct)
        c.setFillColor(GOLD)
        c.rect(x, H-105, 50, 3, fill=1, stroke=0)
        style_b = p_style('Helvetica', 6, 8, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        y = H-125
        for b in bullets:
            ph = draw_para(c, f'•  {b}', x, y, 360, 40, style_b)
            y -= ph + 6
    # note
    draw_rect(c, 30, 28, W-60, 32, fill_color=HexColor("#FFF8E1"), stroke_color=HexColor("#F0E6C2"))
    style_note = p_style('Helvetica', 5.5, 6.5, HexColor("#7C5A0A"), alignment=TA_CENTER)
    draw_para(c, data["note"], 36, 52, W-72, 24, style_note)

def screenshots_slide(c, data, is_arabic):
    draw_bg(c, SLATE_BG)
    c.setFillColor(NAVY)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)
    align_sec = TA_RIGHT if is_arabic else TA_LEFT
    style_sec = p_style('Helvetica-Bold', 6, 7, TEAL, alignment=align_sec)
    draw_para(c, data["section"], 30, H-26, 200, 14, style_sec)
    style_title = p_style('Helvetica-Bold', 20, 22, NAVY, alignment=align_sec)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-55, 500, 28, style_title)
    card_w, card_h = 365, 130
    gap_x, gap_y = 20, 22
    start_x, start_y = 30, H-100
    for i,(title, desc) in enumerate(data["items"]):
        col = i%2
        row = i//2
        x = start_x + col*(card_w+gap_x)
        y_top = start_y - row*(card_h+gap_y)
        y_bot = y_top - card_h
        draw_rect(c, x, y_bot, card_w, card_h, fill_color=WHITE, stroke_color=HexColor("#E2E8F0"))
        c.setFillColor(SLATE_100)
        c.roundRect(x+6, y_top-22, card_w-12, 14, 3, fill=1, stroke=0)
        style_t = p_style('Helvetica-Bold', 6, 7, NAVY, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, title, x+12, y_top-12, card_w-24, 12, style_t)
        style_d = p_style('Helvetica', 6, 8, SLATE_700, alignment=TA_LEFT if not is_arabic else TA_RIGHT)
        draw_para(c, desc, x+12, y_top-42, card_w-24, 60, style_d)

def closing_slide(c, data, is_arabic):
    draw_bg(c, NAVY)
    c.setFillColor(GOLD)
    c.rect(0, H-8, W, 8, fill=1, stroke=0)
    style_kicker = p_style('Helvetica-Bold', 7, 8, GOLD, alignment=TA_CENTER)
    draw_para(c, data["kicker"], 30, H-70, W-60, 16, style_kicker)
    style_title = p_style('Helvetica-Bold', 20, 22, WHITE, alignment=TA_CENTER)
    draw_para(c, f'<b>{data["title"]}</b>', 30, H-105, W-60, 28, style_title)
    c.setFillColor(GOLD)
    c.rect(W/2-30, H-122, 60, 3, fill=1, stroke=0)
    style_name = p_style('Helvetica-Bold', 20, 22, GOLD, alignment=TA_CENTER)
    draw_para(c, f'<b>{data["name"]}</b>', 30, H-155, W-60, 28, style_name)
    style_desc = p_style('Helvetica', 8, 10, WHITE, alignment=TA_CENTER)
    draw_para(c, data["desc"], 80, H-205, W-160, 80, style_desc)
    style_note = p_style('Helvetica-Oblique', 6, 7, HexColor("#AABBCC"), alignment=TA_CENTER)
    draw_para(c, f'<i>{data["note"]}</i>', 80, 30, W-160, 16, style_note)

def build_pdf(slides, is_arabic, filename):
    path = os.path.join(OUT_DIR, filename)
    c = canvas.Canvas(path, pagesize=landscape(A4))
    for s in slides:
        if s["type"] == "cover":
            cover_slide(c, s, is_arabic)
        elif s["type"] == "definition":
            definition_slide(c, s, is_arabic)
        elif s["type"] == "importance":
            importance_slide(c, s, is_arabic)
        elif s["type"] == "audience":
            audience_slide(c, s, is_arabic)
        elif s["type"] == "benefits":
            benefits_slide(c, s, is_arabic)
        elif s["type"] == "workflow":
            workflow_slide(c, s, is_arabic)
        elif s["type"] == "tech":
            tech_slide(c, s, is_arabic)
        elif s["type"] == "screenshots":
            screenshots_slide(c, s, is_arabic)
        elif s["type"] == "closing":
            closing_slide(c, s, is_arabic)
        c.showPage()
    c.save()
    print(f"Saved {filename}")

build_pdf(SLIDES_EN, False, "TEACH-LAP_Overview_EN.pdf")
build_pdf(SLIDES_AR, True, "TEACH-LAP_Overview_AR.pdf")
print("Done PDFs")
