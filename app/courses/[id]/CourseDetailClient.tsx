"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

type Course = { id: string; teacher_id: string; title: string; code: string; description: string | null; created_at: string; students_count?: number; lectures_count?: number; isTeacher?: boolean };

export default function CourseDetailClient({ courseId, currentEmail, role, isAdmin }: { courseId: string; currentEmail: string; role: string | null; isAdmin: boolean }) {
  const { locale } = useI18n();
  const isRTL = locale === "ar";
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState<"lectures" | "students" | "attendance" | "coursework" | "exams">("lectures");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // students
  const [students, setStudents] = useState<any[]>([]);
  const [enrollEmails, setEnrollEmails] = useState("");

  // lectures
  const [lectures, setLectures] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedLecture, setSelectedLecture] = useState("");

  // records
  const [attendance, setAttendance] = useState<any[]>([]);
  const [coursework, setCoursework] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // forms
  const [attStudent, setAttStudent] = useState("");
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState<"present" | "absent" | "late" | "excused">("present");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeScore, setGradeScore] = useState("");
  const [gradeMax, setGradeMax] = useState("100");
  const [gradeStudent, setGradeStudent] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examScore, setExamScore] = useState("");
  const [examMax, setExamMax] = useState("100");
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [examStudent, setExamStudent] = useState("");

  const isTeacher = course?.isTeacher || isAdmin || role === "admin" || role === "teacher";

  async function fetchCourse() {
    const res = await fetch(`/api/courses/${courseId}`);
    const j = await res.json();
    if (j.success) setCourse(j.data);
    else setMsg({ type: "error", text: j.error?.message });
    setLoading(false);
  }

  async function fetchStudents() {
    const res = await fetch(`/api/courses/${courseId}/enroll`);
    const j = await res.json();
    if (j.success) setStudents(j.data || []);
  }

  async function fetchLectures() {
    const res = await fetch(`/api/courses/${courseId}/lectures`);
    const j = await res.json();
    if (j.success) setLectures(j.data || []);
  }

  async function fetchHistory() {
    const res = await fetch("/api/history?limit=50");
    const j = await res.json();
    if (j.success) setHistory(j.data || []);
  }

  async function fetchRecords(type: string) {
    const res = await fetch(`/api/courses/${courseId}/records?type=${type}`);
    const j = await res.json();
    if (j.success) {
      if (type === "attendance") setAttendance(j.data || []);
      if (type === "coursework") setCoursework(j.data || []);
      if (type === "exams") setExams(j.data || []);
    }
  }

  useEffect(() => {
    fetchCourse();
    fetchStudents();
    fetchLectures();
    fetchRecords("attendance");
    fetchRecords("coursework");
    fetchRecords("exams");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isTeacher && tab === "lectures") fetchHistory();
    if (tab === "attendance") fetchRecords("attendance");
    if (tab === "coursework") fetchRecords("coursework");
    if (tab === "exams") fetchRecords("exams");
  }, [tab]);

  async function handleEnroll() {
    if (!enrollEmails.trim()) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: enrollEmails }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setMsg({ type: "success", text: isRTL ? `تم تسجيل ${j.added} طالب` : `Enrolled ${j.added} student(s)` });
      setEnrollEmails("");
      fetchStudents();
    } catch (e: any) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleRemoveStudent(email: string) {
    if (!confirm(isRTL ? `إزالة ${email}؟` : `Remove ${email}?`)) return;
    const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await res.json();
    if (j.success) fetchStudents();
    else setMsg({ type: "error", text: j.error?.message });
  }

  async function handlePublish() {
    if (!selectedLecture) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/lectures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecture_id: selectedLecture }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setMsg({ type: "success", text: isRTL ? "تم النشر" : "Published" });
      fetchLectures();
    } catch (e: any) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleUnpublish(lecture_id: string) {
    const res = await fetch(`/api/courses/${courseId}/lectures`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lecture_id }) });
    const j = await res.json();
    if (j.success) fetchLectures();
  }

  async function addRecord(type: string) {
    let body: any = { type };
    if (type === "attendance") {
      if (!attStudent) return setMsg({ type: "error", text: isRTL ? "اختر طالب" : "Select student" });
      body = { type, student_email: attStudent, session_date: attDate, status: attStatus };
    } else if (type === "coursework") {
      if (!gradeStudent || !gradeTitle) return setMsg({ type: "error", text: isRTL ? "العنوان والطالب مطلوبان" : "Title and student required" });
      body = { type, student_email: gradeStudent, title: gradeTitle, score: Number(gradeScore), max_score: Number(gradeMax) };
    } else if (type === "exams") {
      if (!examStudent || !examTitle) return setMsg({ type: "error", text: isRTL ? "العنوان والطالب مطلوبان" : "Title and student required" });
      body = { type, student_email: examStudent, exam_title: examTitle, score: Number(examScore), max_score: Number(examMax), exam_date: examDate };
    }
    try {
      const res = await fetch(`/api/courses/${courseId}/records`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!j.success) throw new Error(j.error?.message);
      setMsg({ type: "success", text: isRTL ? "تم الحفظ" : "Saved" });
      if (type === "attendance") { setAttStudent(""); fetchRecords("attendance"); }
      if (type === "coursework") { setGradeTitle(""); setGradeScore(""); fetchRecords("coursework"); }
      if (type === "exams") { setExamTitle(""); setExamScore(""); fetchRecords("exams"); }
    } catch (e: any) { setMsg({ type: "error", text: e.message }); }
  }

  async function deleteRecord(type: string, id: string) {
    if (!confirm(isRTL ? "حذف هذا السجل؟" : "Delete this record?")) return;
    const res = await fetch(`/api/courses/${courseId}/records`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    const j = await res.json();
    if (j.success) {
      if (type === "attendance") fetchRecords("attendance");
      if (type === "coursework") fetchRecords("coursework");
      if (type === "exams") fetchRecords("exams");
    } else setMsg({ type: "error", text: j.error?.message });
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 text-center">Loading…</div>;
  if (!course) return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-red-600">{msg?.text || "Course not found"}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <Link href="/courses" className="text-xs font-bold text-[#0F4C5C] hover:underline">← {isRTL ? "العودة إلى المقررات" : "Back to courses"}</Link>

      <div className="mt-4 bg-white rounded-3xl shadow border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-br from-[#0B3C49] via-[#0F4C5C] to-[#14657A] text-white p-8">
          <h1 className="text-2xl font-black">{course.title} <span className="ms-2 text-sm font-bold bg-white/20 border border-white/20 rounded-full px-3 py-1">{course.code}</span></h1>
          {course.description && <p className="text-white/80 mt-2 text-sm">{course.description}</p>}
          <p className="text-white/60 text-xs mt-2">{new Date(course.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US")} • {course.students_count ?? students.length} {isRTL ? "طلاب" : "students"} • Role: {role} {isTeacher ? (isRTL ? "(أستاذ)" : "(Teacher)") : (isRTL ? "(طالب)" : "(Student)")}</p>
        </div>

        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border-b">
          {[
            { id: "lectures", label: isRTL ? "المحاضرات" : "Lectures" },
            { id: "students", label: isRTL ? "الطلاب" : "Students" },
            { id: "attendance", label: isRTL ? "الحضور" : "Attendance" },
            { id: "coursework", label: isRTL ? "أعمال السنة" : "Coursework" },
            { id: "exams", label: isRTL ? "الاختبارات" : "Exams" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 rounded-xl text-xs font-black ${tab === t.id ? "bg-[#0F4C5C] text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{t.label}</button>
          ))}
        </div>

        {msg && <div className={`mx-6 mt-4 text-xs rounded-xl p-3 border ${msg.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-red-600 bg-red-50 border-red-100"}`}>{msg.text}</div>}

        <div className="p-6">
          {tab === "lectures" && (
            <div className="space-y-6">
              {isTeacher && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-sm text-[#0B3C49]">{isRTL ? "نشر محاضرة في المقرر" : "Publish lecture to course"}</h3>
                  <p className="text-xs text-slate-500 mt-1">{isRTL ? "اختر محاضرة من سجلك لنشرها — سيظهر لطلابك في مقررهم." : "Choose a lecture from your history to publish — students will see it in their course."}</p>
                  <div className="flex gap-2 mt-3">
                    <select value={selectedLecture} onChange={e => setSelectedLecture(e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="">{isRTL ? "اختر محاضرة…" : "Choose lecture…"}</option>
                      {history.map(h => <option key={h.id} value={h.id}>{h.title || h.original_text?.slice(0, 40) || h.id} — {new Date(h.created_at).toLocaleDateString()}</option>)}
                    </select>
                    <button onClick={handlePublish} className="px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black">{isRTL ? "نشر" : "Publish"}</button>
                  </div>
                  {history.length === 0 && <p className="text-xs text-slate-400 mt-2">{isRTL ? "لا يوجد محاضرات في سجلك — ولّد واحدة أولاً" : "No lectures in your history — generate one first"}</p>}
                </div>
              )}

              {lectures.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">{isRTL ? "لا يوجد محاضرات منشورة بعد" : "No published lectures yet"}</p>
              ) : (
                <div className="space-y-4">
                  {lectures.map((cl: any) => (
                    <div key={cl.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="font-bold text-sm text-[#0B3C49]">{cl.lecture?.title || (isRTL ? "بدون عنوان" : "Untitled")}</h4>
                      <p className="text-xs text-slate-500 mt-1">{new Date(cl.published_at).toLocaleString(isRTL ? "ar-EG" : "en-US")} • {cl.lecture?.output_language}</p>
                      <p className="text-xs leading-6 text-slate-700 mt-3 bg-[#F2F9FB] border border-[#E6F2F5] rounded-xl p-3 whitespace-pre-wrap max-h-60 overflow-auto">{cl.lecture?.generated_markdown?.slice(0, 3000) || JSON.stringify(cl.lecture?.generated_data?.summary || "").slice(0, 1000)}</p>
                      {isTeacher && <button onClick={() => handleUnpublish(cl.lecture.id)} className="mt-3 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold">{isRTL ? "إلغاء النشر" : "Unpublish"}</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "students" && (
            <div className="space-y-4">
              {isTeacher ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-black text-sm text-[#0B3C49]">{isRTL ? "الطلاب المسجلون" : "Enrolled students"}</h3>
                    <p className="text-xs text-slate-500 mt-1">{isRTL ? "أضف الطلاب بالبريد — سيتم إضافتهم تلقائياً كـ student إن لم يكونوا موجودين." : "Add students by email — they will be auto-added as student if not exists."}</p>
                    <textarea value={enrollEmails} onChange={e => setEnrollEmails(e.target.value)} placeholder={isRTL ? "بريد الطلاب — فاصلة أو سطر جديد: sara@uni.ly, ahmed@uni.ly" : "student emails — comma or new line"} rows={3} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <button onClick={handleEnroll} className="mt-2 px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black">{isRTL ? "تسجيل الطلاب" : "Enroll students"}</button>
                  </div>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b bg-slate-50 font-black text-sm text-[#0B3C49]">{isRTL ? "القائمة" : "List"} ({students.length})</div>
                    {students.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">{isRTL ? "لا يوجد طلاب مسجلون بعد" : "No students enrolled yet"}</p> : (
                      <ul className="divide-y divide-slate-100">
                        {students.map(s => (
                          <li key={s.id} className="flex justify-between items-center px-4 py-3 text-sm">
                            <span className="font-bold text-slate-700">{s.student_email}</span>
                            <button onClick={() => handleRemoveStudent(s.student_email)} className="px-3 py-1 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold">{isRTL ? "إزالة" : "Remove"}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-black text-sm text-[#0B3C49]">{isRTL ? "زملاؤك في المقرر" : "Classmates"}</h3>
                  <ul className="mt-3 space-y-1">
                    {students.map(s => <li key={s.id} className="text-xs text-slate-600">{s.student_email} {s.student_email.toLowerCase() === currentEmail.toLowerCase() && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] ms-1">{isRTL ? "أنت" : "you"}</span>}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === "attendance" && (
            <div className="space-y-4">
              {isTeacher && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-sm text-[#0B3C49]">{isRTL ? "تسجيل حضور" : "Record attendance"}</h3>
                  <div className="grid sm:grid-cols-3 gap-2 mt-3">
                    <select value={attStudent} onChange={e => setAttStudent(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="">{isRTL ? "اختر طالب…" : "Choose student…"}</option>
                      {students.map(s => <option key={s.id} value={s.student_email}>{s.student_email}</option>)}
                    </select>
                    <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <select value={attStatus} onChange={e => setAttStatus(e.target.value as any)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="present">{isRTL ? "حاضر" : "Present"}</option>
                      <option value="absent">{isRTL ? "غائب" : "Absent"}</option>
                      <option value="late">{isRTL ? "متأخر" : "Late"}</option>
                      <option value="excused">{isRTL ? "بعذر" : "Excused"}</option>
                    </select>
                  </div>
                  <button onClick={() => addRecord("attendance")} className="mt-3 px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black">{isRTL ? "حفظ الحضور" : "Save attendance"}</button>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 font-black text-sm text-[#0B3C49]">{isRTL ? "سجل الحضور" : "Attendance"} ({attendance.length})</div>
                {attendance.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">{isRTL ? "لا يوجد سجل حضور بعد" : "No attendance records yet"}</p> : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2 text-start">{isRTL ? "الطالب" : "Student"}</th><th className="px-3 py-2">{isRTL ? "التاريخ" : "Date"}</th><th className="px-3 py-2">{isRTL ? "الحالة" : "Status"}</th>{isTeacher && <th className="px-3 py-2">{isRTL ? "حذف" : "Del"}</th>}</tr></thead>
                    <tbody className="divide-y divide-slate-100">{attendance.map(a => <tr key={a.id}><td className="px-3 py-2 font-bold">{a.student_email}</td><td className="px-3 py-2 text-center">{a.session_date}</td><td className="px-3 py-2 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${a.status === "present" ? "bg-emerald-100 text-emerald-700" : a.status === "absent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{a.status}</span></td>{isTeacher && <td className="px-3 py-2 text-center"><button onClick={() => deleteRecord("attendance", a.id)} className="text-red-600 font-bold">×</button></td>}</tr>)}</tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {tab === "coursework" && (
            <div className="space-y-4">
              {isTeacher && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-sm text-[#0B3C49]">{isRTL ? "إضافة درجة أعمال سنة" : "Add coursework grade"}</h3>
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <select value={gradeStudent} onChange={e => setGradeStudent(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="">{isRTL ? "اختر طالب…" : "Choose student…"}</option>
                      {students.map(s => <option key={s.id} value={s.student_email}>{s.student_email}</option>)}
                    </select>
                    <input value={gradeTitle} onChange={e => setGradeTitle(e.target.value)} placeholder={isRTL ? "عنوان النشاط — مثال: واجب 1" : "Activity title — e.g., Homework 1"} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <input value={gradeScore} onChange={e => setGradeScore(e.target.value)} placeholder={isRTL ? "الدرجة" : "Score"} type="number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <input value={gradeMax} onChange={e => setGradeMax(e.target.value)} placeholder={isRTL ? "القصوى" : "Max"} type="number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <button onClick={() => addRecord("coursework")} className="mt-3 px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black">{isRTL ? "إضافة درجة" : "Add grade"}</button>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 font-black text-sm text-[#0B3C49]">{isRTL ? "درجات أعمال السنة" : "Coursework Grades"} ({coursework.length})</div>
                {coursework.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">{isRTL ? "لا يوجد درجات بعد" : "No grades yet"}</p> : (
                  <table className="w-full text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2 text-start">{isRTL ? "الطالب" : "Student"}</th><th className="px-3 py-2">{isRTL ? "العنوان" : "Title"}</th><th className="px-3 py-2">{isRTL ? "الدرجة" : "Score"}</th>{isTeacher && <th className="px-3 py-2">Del</th>}</tr></thead><tbody className="divide-y divide-slate-100">{coursework.map(g => <tr key={g.id}><td className="px-3 py-2 font-bold">{g.student_email}</td><td className="px-3 py-2">{g.title}</td><td className="px-3 py-2 text-center">{g.score}/{g.max_score}</td>{isTeacher && <td className="px-3 py-2 text-center"><button onClick={() => deleteRecord("coursework", g.id)} className="text-red-600">×</button></td>}</tr>)}</tbody></table>
                )}
              </div>
            </div>
          )}

          {tab === "exams" && (
            <div className="space-y-4">
              {isTeacher && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-sm text-[#0B3C49]">{isRTL ? "إضافة درجة اختبار" : "Add exam score"}</h3>
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <select value={examStudent} onChange={e => setExamStudent(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="">{isRTL ? "اختر طالب…" : "Choose student…"}</option>
                      {students.map(s => <option key={s.id} value={s.student_email}>{s.student_email}</option>)}
                    </select>
                    <input value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder={isRTL ? "عنوان الاختبار — مثال: النصفي" : "Exam title — e.g., Midterm"} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <input value={examScore} onChange={e => setExamScore(e.target.value)} placeholder={isRTL ? "الدرجة" : "Score"} type="number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <input value={examMax} onChange={e => setExamMax(e.target.value)} placeholder={isRTL ? "القصوى" : "Max"} type="number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
                  </div>
                  <button onClick={() => addRecord("exams")} className="mt-3 px-4 py-2 rounded-xl bg-[#0F4C5C] text-white text-xs font-black">{isRTL ? "إضافة درجة اختبار" : "Add exam score"}</button>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 font-black text-sm text-[#0B3C49]">{isRTL ? "درجات الاختبارات" : "Exam Scores"} ({exams.length})</div>
                {exams.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">{isRTL ? "لا يوجد درجات بعد" : "No scores yet"}</p> : (
                  <table className="w-full text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2 text-start">{isRTL ? "الطالب" : "Student"}</th><th className="px-3 py-2">{isRTL ? "الاختبار" : "Exam"}</th><th className="px-3 py-2">{isRTL ? "الدرجة" : "Score"}</th><th className="px-3 py-2 hidden sm:table-cell">{isRTL ? "التاريخ" : "Date"}</th>{isTeacher && <th className="px-3 py-2">Del</th>}</tr></thead><tbody className="divide-y divide-slate-100">{exams.map(g => <tr key={g.id}><td className="px-3 py-2 font-bold">{g.student_email}</td><td className="px-3 py-2">{g.exam_title}</td><td className="px-3 py-2 text-center">{g.score}/{g.max_score}</td><td className="px-3 py-2 text-center hidden sm:table-cell">{g.exam_date||"—"}</td>{isTeacher && <td className="px-3 py-2 text-center"><button onClick={() => deleteRecord("exams", g.id)} className="text-red-600">×</button></td>}</tr>)}</tbody></table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
