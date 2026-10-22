import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { extractTextsFromFiles, MAX_TOTAL_CHARS } from "@/lib/server/extractText";
import { generateMarkdown } from "@/lib/markdown";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACKS = ["gemini-3-flash", "gemini-3-pro", "gemini-2.5-flash", "gemini-1.5-flash"];

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    core_concepts: {
      type: "array",
      items: {
        type: "object",
        properties: { term: { type: "string" }, definition: { type: "string" }, classroom_link: { type: "string" } },
        required: ["term", "definition", "classroom_link"],
      },
    },
    key_takeaways: { type: "array", items: { type: "string" } },
    libyan_applications: { type: "array", items: { type: "string" } },
    scenario_qa: {
      type: "array",
      items: {
        type: "object",
        properties: { question: { type: "string" }, model_answer: { type: "string" } },
        required: ["question", "model_answer"],
      },
    },
    reflection_tasks: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, prompt: { type: "string" }, type: { type: "string", enum: ["individual", "group", "discussion"] } },
        required: ["title", "prompt", "type"],
      },
    },
    discussion_questions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "core_concepts", "key_takeaways", "libyan_applications", "scenario_qa", "reflection_tasks", "discussion_questions"],
};

function buildPrompt({ title, text, outputLanguage }: { title: string; text: string; outputLanguage: string }) {
  const lang =
    outputLanguage === "ar"
      ? "Write ALL fields in Modern Standard Arabic."
      : outputLanguage === "bilingual"
        ? "Write ALL fields bilingually: Arabic then — EN — then English."
        : "Write ALL fields in clear academic English.";
  return `You are SABRATHA ELT Tech-Assistant, professor of Educational Technology & ELT. Students are English Dept, Sabratha University. Ground ideas in Course Context / Standard Classroom: large classes, limited devices, smartphones, intermittent internet.

${lang}

Produce EXACT JSON:
1.summary 220-350w (link to SAMR/TPACK when relevant)
2.core_concepts 5-8 {term,definition,classroom_link}
3.key_takeaways 5-8
4.libyan_applications→ rename to course_applications in output but keep key for compat — 4-6 strings each: tool + ELT skill + fit for Standard Classroom
5.scenario_qa 4-6 {question,model_answer}
6.reflection_tasks 3-5 {title,prompt,type}
7.discussion_questions 3-5
Return ONLY JSON.

TITLE: ${title || "(untitled)"}
CONTENT:
"""
${text}
"""
`;
}

export async function POST(req: NextRequest) {
  // 1) التحقق من تسجيل الدخول والقائمة البيضاء أولاً — قبل أي معالجة ثقيلة
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build";
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ success: false, error: { message: "Unauthorized — please sign in." } }, { status: 401 });
  const { data: allowed } = await supabase.from("allowed_users").select("email").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!allowed) return NextResponse.json({ success: false, error: { message: `Email ${user.email} is not on the invited list.` } }, { status: 403 });

  // 2) قراءة المدخلات — ندعم JSON القديم و FormData الجديد مع الملفات
  const contentType = req.headers.get("content-type") || "";
  let title = "";
  let pastedText = "";
  let outputLanguage = "en";
  let files: File[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = String(formData.get("title") || "").trim().slice(0, 200);
      pastedText = String(formData.get("text") || "").trim();
      outputLanguage = String(formData.get("outputLanguage") || "en").trim();
      // جميع الملفات تحت مفتاح "files" (متعدد)
      const allFiles = formData.getAll("files");
      for (const f of allFiles) {
        if (f instanceof File && f.name && f.size > 0) files.push(f);
      }
      // دعم اسم حقل مفرد "file" للتوافق
      const single = formData.get("file");
      if (files.length === 0 && single instanceof File && single.name) files.push(single);
    } else {
      const body = await req.json().catch(() => null);
      if (!body) return NextResponse.json({ success: false, error: { message: "Invalid JSON" } }, { status: 400 });
      title = String(body.title || "").trim().slice(0, 200);
      pastedText = String(body.text || "").trim();
      outputLanguage = String(body.outputLanguage || "en").trim();
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { message: "Failed to read request: " + (e?.message || "") } }, { status: 400 });
  }

  if (!["ar", "en", "bilingual"].includes(outputLanguage)) outputLanguage = "en";

  // 3) استخراج النص من الملفات على الخادم فقط — لا نرسل الملفات الثنائية إلى Gemini أبداً
  let extractedCombined = "";
  let extractMeta: any[] = [];
  if (files.length > 0) {
    try {
      const { combinedText, results } = await extractTextsFromFiles(files);
      extractedCombined = combinedText;
      extractMeta = results.map((r) => ({ fileName: r.fileName, fileType: r.fileType, chars: r.chars }));
    } catch (e: any) {
      // خطأ في استخراج ملف معين — نرجعه للواجهة بوضوح
      return NextResponse.json({ success: false, error: { message: e?.message || "File extraction failed" } }, { status: 400 });
    }
  }

  // 4) دمج النص الملصق + المستخرج من الملفات
  let finalText = [pastedText, extractedCombined].filter(Boolean).join("\n\n").trim();

  // تنظيف بسيط: إزالة أسطر فارغة كثيرة
  finalText = finalText.replace(/\n{3,}/g, "\n\n").trim();

  if (finalText.length < 40) {
    return NextResponse.json({ success: false, error: { message: "Text too short — need at least 40 characters from pasted text + uploaded files combined. / النص قصير — نحتاج 40 حرفاً على الأقل من النص + الملفات" } }, { status: 400 });
  }
  if (finalText.length > MAX_TOTAL_CHARS) {
    return NextResponse.json({ success: false, error: { message: `Text too long — maximum ${MAX_TOTAL_CHARS} characters (${finalText.length} received). Please shorten files/text. / النص طويل جداً` } }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return NextResponse.json({ success: false, error: { message: "GEMINI_API_KEY not configured on server" } }, { status: 500 });

  // 5) استدعاء Gemini بالنص المستخرج فقط — المفتاح يبقى على الخادم
  async function callGemini(model: string) {
    const payload = {
      contents: [{ role: "user", parts: [{ text: buildPrompt({ title, text: finalText, outputLanguage }) }] }],
      generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 12288, responseMimeType: "application/json", responseSchema: SCHEMA },
    };
    const r = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey! },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    });
    const j: any = await r.json().catch(() => ({}));
    return { r, j };
  }

  const candidates = [DEFAULT_MODEL, ...FALLBACKS.filter((m) => m !== DEFAULT_MODEL)];
  let last: any = null;
  for (const m of candidates) {
    const { r, j } = await callGemini(m);
    last = { r, j, m };
    if (r.ok) {
      const raw: string = (j.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("").trim();
      if (!raw) return NextResponse.json({ success: false, error: { message: "Gemini returned empty" } }, { status: 502 });
      let data: any;
      try {
        let t = raw.trim();
        const f = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (f) t = f[1];
        const s = t.indexOf("{"),
          e = t.lastIndexOf("}");
        data = JSON.parse(t.slice(s, e + 1));
      } catch {
        return NextResponse.json({ success: false, error: { message: "Parse error from Gemini" } }, { status: 502 });
      }
      if (data.course_applications && !data.libyan_applications) data.libyan_applications = data.course_applications;

      // === الخطوة الثالثة: حفظ تلقائي في lectures_history ===
      // نولّد Markdown ثم نحفظ (professor_id = auth.uid())
      let savedId: string | null = null;
      try {
        const markdown = generateMarkdown(data, {
          title: title || pastedText.slice(0, 60),
          createdAt: new Date().toISOString(),
          model: m,
          outputLanguage,
        });
        const { data: inserted, error: insertError } = await supabase
          .from("lectures_history")
          .insert({
            professor_id: user.id,
            title: title || null,
            original_text: finalText,
            output_language: outputLanguage,
            generated_data: data,
            generated_markdown: markdown,
            input_chars: finalText.length,
            files_meta: extractMeta.length ? extractMeta : null,
            model_used: m,
          })
          .select("id")
          .single();
        if (!insertError && inserted) savedId = inserted.id;
        else if (insertError) console.error("lectures_history insert failed:", insertError.message);
      } catch (e) {
        console.error("lectures_history exception:", e);
      }

      return NextResponse.json({
        success: true,
        data,
        meta: {
          model: m,
          email: user.email,
          professorId: user.id,
          generatedAt: new Date().toISOString(),
          inputChars: finalText.length,
          filesProcessed: extractMeta,
          savedLectureId: savedId,
        },
      });
    }
    const msg = last?.j?.error?.message || "";
    if (!/not found|does not exist|no longer available|Unsupported/i.test(msg)) break;
  }
  return NextResponse.json({ success: false, error: { message: last?.j?.error?.message || "Gemini error" } }, { status: 502 });
}
