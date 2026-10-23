#!/usr/bin/env python3
# Generate voiceover scripts for TEACH-LAP 8-slide presentation
# EN voice-01, AR voice-00

AR_SCRIPTS = [
    ("01_AR_intro.mp3", "مرحباً بكم في منصة TEACH-LAP — المساعد التدريسي الذكي لتدريس اللغة الإنجليزية في جامعة صبراتة. منصتنا تحول تحضير المحاضرة من ساعات إلى دقائق، بخصوصية تامة ومصممة للفصل المعياري."),
    ("02_AR_definition.mp3", "ما هي TEACH-LAP؟ هي منصة ويب خاصة تحول النصوص والملفات الخام إلى محاضرات أكاديمية منظمة خلال ثوانٍ. يولد الذكاء الاصطناعي جيميناي ملخصاً ومفاهيم أساسية وخلاصات وتطبيقات صفية وسيناريوهات ومهام تأملية، مع تصدير جاهز."),
    ("03_AR_importance.mp3", "لماذا هي مهمة؟ توفر الوقت من ثلاث ساعات إلى خمس دقائق، تضمن جودة موحدة بمعايير سامر وتيباك، تحمي خصوصية كل أستاذة بعزل كامل، وتعمل بكفاءة في الفصول الكبيرة بهواتف فقط وإنترنت ضعيف."),
    ("04_AR_audience.mp3", "لمن هذا الموقع؟ لأستاذتين بمساحتين معزولتين تماماً، لكل واحدة مقرراتها حسب السنة والسمستر. والطالبات مدعوات عبر البريد لكل مقرر، يعرضن المحاضرات ويحفظن الملخصات ويرين درجاتهن فقط."),
    ("05_AR_benefits.mp3", "الفائدة والخلاصة: للأستاذة توليد وحفظ ونشر ومتابعة الحضور والدرجات. للطالبة مساحة واحدة بسيطة. للمؤسسة أرشيف رقمي موحد ثنائي اللغة وآمن. TEACH-LAP ليس موقعاً عاماً مهملاً، بل مركز مهني خاص."),
    ("06_AR_workflow.mp3", "كيف يعمل؟ الأستاذة تدخل باسم مستخدم وكود دائم، تُنشأ مقرراتها تلقائياً، تدعو طالباتها، تلصق نصاً أو ترفع ملفات فيولد جيميناي المحاضرة وتحفظ بسجلها، ثم تنشرها في المقرر فتظهر فوراً للطالبات، وتتابع الحضور والدرجات."),
    ("07_AR_tech.mp3", "البنية التقنية: واجهة نيكست جي إس وتيلويند، خلفية سوپابيس بسياسات حماية وتجاوز آمن، ذكاء اصطناعي جيميناي بمفتاح خادم، مصادقة إتشماك مخصصة، وشرائح معاينة حية للصفحات الأربع الرئيسية."),
    ("08_AR_closing.mp3", "الفكرة التقنية للمشروع — أ. إيناس مصباح، قسم اللغة الإنجليزية كلية التربية جامعة صبراتة. صاحبة الفكرة والمشرفة على النموذج البيداغوجي وهيكلة البيانات وسير عمل الذكاء الاصطناعي. شكراً لحسن استماعكم."),
]

EN_SCRIPTS = [
    ("01_EN_intro.mp3", "Welcome to TEACH-LAP — your AI-powered teaching assistant for the English Department at Sabratha University. Our platform turns lesson preparation from hours into minutes — private, secure, and built for the Standard Classroom."),
    ("02_EN_definition.mp3", "What is TEACH-LAP? It's a private web platform that converts raw texts and documents into structured academic lectures in seconds. Powered by Gemini, it generates a summary, core concepts, takeaways, classroom applications, scenarios, and reflection tasks — ready to export."),
    ("03_EN_importance.mp3", "Why does it matter? It cuts prep time from three hours to five minutes, ensures consistent quality with SAMR and TPACK, protects each teacher's privacy with full isolation, and works smoothly in large classes with just smartphones and low bandwidth."),
    ("04_EN_audience.mp3", "Who is it for? Two dedicated teachers with fully isolated workspaces — each with her own courses by year and semester. Students are invited by email per course, view published lectures, save summaries, and see their grades — no Gemini access."),
    ("05_EN_benefits.mp3", "Benefits and conclusion: For teachers — generate, save, publish, and track attendance and grades. For students — one simple space. For the institution — a unified, bilingual, secure archive. TEACH-LAP is not a neglected public site; it's a private professional hub."),
    ("06_EN_workflow.mp3", "How does it work? The teacher logs in with username and permanent code, courses are auto-seeded, she invites students, pastes text or uploads files, Gemini generates the lecture and saves it to her history, she publishes it to the course where students see it instantly, then tracks attendance and scores."),
    ("07_EN_tech.mp3", "Technical architecture: Next.js and Tailwind frontend, Supabase backend with RLS and secure bypass, Gemini AI with server-side key, custom HMAC authentication, and live previews of the four main pages."),
    ("08_EN_closing.mp3", "Technical project idea — by Professor Inas Mesbah, English Department, Faculty of Education, Sabratha University. She conceived the pedagogical model, data structure, and AI workflow for TEACH-LAP. Thank you for listening."),
]

print("Scripts prepared:")
print(f"AR: {len(AR_SCRIPTS)}, EN: {len(EN_SCRIPTS)}")
for f,t in AR_SCRIPTS+EN_SCRIPTS:
    print(f, len(t), "chars")
