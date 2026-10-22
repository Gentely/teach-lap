import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACKS = ["gemini-3-flash", "gemini-3-pro", "gemini-2.5-flash", "gemini-1.5-flash"];

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    core_concepts: { type: "array", items: { type: "object", properties: { term: { type: "string" }, definition: { type: "string" }, classroom_link: { type: "string" } }, required: ["term","definition","classroom_link"] } },
    key_takeaways: { type: "array", items: { type: "string" } },
    libyan_applications: { type: "array", items: { type: "string" } },
    scenario_qa: { type: "array", items: { type: "object", properties: { question: { type: "string" }, model_answer: { type: "string" } }, required: ["question","model_answer"] } },
    reflection_tasks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, prompt: { type: "string" }, type: { type: "string", enum: ["individual","group","discussion"] } }, required: ["title","prompt","type"] } },
    discussion_questions: { type: "array", items: { type: "string" } }
  },
  required: ["summary","core_concepts","key_takeaways","libyan_applications","scenario_qa","reflection_tasks","discussion_questions"]
};

// تم استبدال مصطلحات "Libyan" بمصطلحات محايدة في البرومبت
function buildPrompt({ title, text, outputLanguage }: { title: string; text: string; outputLanguage: string }) {
  const lang = outputLanguage === "ar" ? "Write ALL fields in Modern Standard Arabic." : outputLanguage === "bilingual" ? "Write ALL fields bilingually: Arabic then — EN — then English." : "Write ALL fields in clear academic English.";
  return `You are SABRATHA ELT Tech-Assistant, professor of Educational Technology & ELT. Students are English Dept, Sabratha University. Ground ideas in Course Context / Standard Classroom: large classes, limited devices, smartphones, intermittent internet.\n\n${lang}\n\nProduce EXACT JSON:\n1.summary 220-350w (link to SAMR/TPACK when relevant)\n2.core_concepts 5-8 {term,definition,classroom_link}\n3.key_takeaways 5-8\n4.libyan_applications→ rename to course_applications in output but keep key for compat — 4-6 strings each: tool + ELT skill + fit for Standard Classroom\n5.scenario_qa 4-6 {question,model_answer}\n6.reflection_tasks 3-5 {title,prompt,type}\n7.discussion_questions 3-5\nReturn ONLY JSON.\n\nTITLE: ${title || "(untitled)"}\nCONTENT:\n\"\"\"\n${text}\n\"\"\"\n`;
}

export async function POST(req: NextRequest) {
  // تحقق من القائمة البيضاء قبل السماح بالتوليد — يخفي مفتاح Gemini تماماً
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value, set: (n: string, v: string, o: any) => cookieStore.set({ name: n, value: v, ...o }), remove: (n: string, o: any) => cookieStore.set({ name: n, value: "", ...o }) },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ success: false, error: { message: "Unauthorized — please sign in." } }, { status: 401 });
  const { data: allowed } = await supabase.from("allowed_users").select("email").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!allowed) return NextResponse.json({ success: false, error: { message: `Email ${user.email} is not on the invited list.` } }, { status: 403 });

  const body = await req.json().catch(()=>null);
  if (!body) return NextResponse.json({ success:false, error:{message:"Invalid JSON"}},{status:400});
  const title = String(body.title||"").trim().slice(0,200);
  const text = String(body.text||"").trim();
  const outputLanguage = ["ar","en","bilingual"].includes(body.outputLanguage) ? body.outputLanguage : "en";
  if (text.length < 40) return NextResponse.json({ success:false, error:{message:"Text too short — minimum 40 chars"}},{status:400});
  if (text.length > 80000) return NextResponse.json({ success:false, error:{message:"Text too long — maximum 80k chars"}},{status:400});
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ success:false, error:{message:"GEMINI_API_KEY not configured on server"}},{status:500});

  async function call(model: string) {
    const payload = {
      contents: [{ role: "user", parts: [{ text: buildPrompt({ title, text, outputLanguage }) }] }],
      generationConfig: { temperature:0.6, topP:0.95, maxOutputTokens:12288, responseMimeType:"application/json", responseSchema: SCHEMA }
    };
    const r = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, { method:"POST", headers:{ "Content-Type":"application/json", "x-goog-api-key": key! }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
    const j:any = await r.json().catch(()=>({}));
    return { r, j };
  }

  const candidates = [DEFAULT_MODEL, ...FALLBACKS.filter(m=>m!==DEFAULT_MODEL)];
  let last:any=null;
  for (const m of candidates) {
    const { r, j } = await call(m);
    last={r,j,m};
    if (r.ok) {
      const raw:string = (j.candidates?.[0]?.content?.parts||[]).map((p:any)=>p.text||"").join("").trim();
      if(!raw) return NextResponse.json({success:false, error:{message:"Gemini returned empty"}},{status:502});
      let data:any; try{ let t=raw.trim(); const f=t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); if(f) t=f[1]; const s=t.indexOf("{"),e=t.lastIndexOf("}"); data=JSON.parse(t.slice(s,e+1)); } catch{ return NextResponse.json({success:false, error:{message:"Parse error from Gemini"}},{status:502}); }
      // توحيد تسمية الحقل للتوافق: libyan_applications هو نفسه Course Context
      if (data.course_applications && !data.libyan_applications) data.libyan_applications = data.course_applications;
      return NextResponse.json({ success:true, data, meta:{ model:m, email:user.email, generatedAt:new Date().toISOString() } });
    }
    const msg = last?.j?.error?.message || "";
    if (!/not found|does not exist|no longer available|Unsupported/i.test(msg)) break;
  }
  return NextResponse.json({ success:false, error:{ message: last?.j?.error?.message || "Gemini error" }},{status:502});
}
