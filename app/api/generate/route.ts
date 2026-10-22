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
  // تحقق من الصلاحية — يدعم الجلسة الجديدة (teacher_session) والقديمة (Supabase)
  let authUser: { id: string; email: string } | null = null;
  let authSupabase: any = null; // لحفظ المحاضرات
  try {
    const { getAuthContext, getSupabase, getSupabaseBypass } = await import("@/lib/server/role");
    const ctx = await getAuthContext();
    if (ctx.isStudent || (ctx as any).studentEmail) {
      return NextResponse.json({ success: false, error: { message: "Forbidden — students cannot use Gemini generation. Only teachers can generate. / الطلاب لا يمكنهم استخدام التوليد" } }, { status: 403 });
    }
    if (ctx.isTeacher && (ctx as any).teacherUsername) {
      // الأستاذة عبر username+كود — مسموح
      authUser = { id: ctx.user!.id, email: ctx.user!.email };
      authSupabase = getSupabaseBypass();
    } else if (ctx.user) {
      // Supabase القديم — يجب أن يكون teacher/admin
      if (ctx.role === "student") {
        return NextResponse.json({ success: false, error: { message: "Forbidden — students cannot use Gemini generation. Only teachers can generate. / الطلاب لا يمكنهم استخدام التوليد" } }, { status: 403 });
      }
      authUser = { id: ctx.user.id, email: ctx.user.email };
      authSupabase = getSupabase();
    } else {
      return NextResponse.json({ success: false, error: { message: "Unauthorized — please sign in." } }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized — please sign in." } }, { status: 401 });
  }

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
      const allFiles = formData.getAll("files");
      for (const f of allFiles) {
        if (f instanceof File && f.name && f.size > 0) files.push(f);
      }
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

  let extractedCombined = "";
  let extractMeta: any[] = [];
  if (files.length > 0) {
    try {
      const { combinedText, results } = await extractTextsFromFiles(files);
      extractedCombined = combinedText;
      extractMeta = results.map((r) => ({ fileName: r.fileName, fileType: r.fileType, chars: r.chars }));
    } catch (e: any) {
      return NextResponse.json({ success: false, error: { message: e?.message || "File extraction failed" } }, { status: 400 });
    }
  }

  let finalText = [pastedText, extractedCombined].filter(Boolean).join("\n\n").trim();
  finalText = finalText.replace(/\n{3,}/g, "\n\n").trim();

  if (finalText.length < 40) {
    return NextResponse.json({ success: false, error: { message: "Text too short — need at least 40 characters from pasted text + uploaded files combined. / النص قصير — نحتاج 40 حرفاً على الأقل من النص + الملفات" } }, { status: 400 });
  }
  if (finalText.length > MAX_TOTAL_CHARS) {
    return NextResponse.json({ success: false, error: { message: `Text too long — maximum ${MAX_TOTAL_CHARS} characters (${finalText.length} received). Please shorten files/text. / النص طويل جداً` } }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return NextResponse.json({ success: false, error: { message: "GEMINI_API_KEY not configured on server" } }, { status: 500 });

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

      let savedId: string | null = null;
      try {
        const markdown = generateMarkdown(data, {
          title: title || pastedText.slice(0, 60),
          createdAt: new Date().toISOString(),
          model: m,
          outputLanguage,
        });
        // محاولة الحفظ — قد تفشل للأستاذة عبر teacher_session لأن professor_id يتطلب uuid حقيقي
        // نجعلها اختيارية: إذا فشلت نحاول بدون professor_id أو نتجاهل ونكمل
        let professorIdToSave: string | null = null;
        if (authUser) {
          // אם id يبدو uuid (يحتوي -) نستخدمه، وإلا نحاول جلبه من قاعدة البيانات
          const looksUuid = /^[0-9a-f-]{36}$/i.test(authUser.id);
          if (looksUuid) professorIdToSave = authUser.id;
          else if (authUser.id.startsWith("teacher:")) {
            try {
              const supa = authSupabase || (await import("@/lib/server/role")).getSupabaseBypass();
              const { data: existing } = await supa.from("courses").select("teacher_id").eq("teacher_username", (authUser.email.split("@")[0] === "enas.mesbah" ? "enas" : authUser.id.split(":")[1] || "enas")).limit(1).maybeSingle() as any;
              if (existing?.teacher_id) professorIdToSave = existing.teacher_id;
            } catch {}
          } else professorIdToSave = authUser.id;
        }
        const insertPayload: any = {
          title: title || null,
          original_text: finalText,
          output_language: outputLanguage,
          generated_data: data,
          generated_markdown: markdown,
          input_chars: finalText.length,
          files_meta: extractMeta.length ? extractMeta : null,
          model_used: m,
        };
        if (professorIdToSave) insertPayload.professor_id = professorIdToSave;
        const { data: inserted, error: insertError } = await authSupabase
          .from("lectures_history")
          .insert(insertPayload)
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
          email: authUser!.email,
          professorId: authUser!.id,
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
