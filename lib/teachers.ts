// بيانات الأستاذات — إيناس + إيمان — كل واحدة بموادها وجدولها المستقل
export type Teacher = {
  username: string;        // اسم الدخول
  code: string;            // الكود الدائم — يُحفظ مشفراً في الخادم فقط
  displayName: string;
  displayNameAr: string;
  email: string;           // للربط مع Supabase/البريد الجامعي إن احتاج
  role: "teacher";
  subjects: {
    name: string;
    nameAr?: string;
    semester: string;      // السمستر
    yearLabel?: string;
    schedule: { day: string; dayAr: string; lecture: string; time: string }[];
  }[];
};

export const TEACHERS: Record<string, Teacher> = {
  Enas: {
    username: "Enas",
    code: "ENAS-7784",
    displayName: "Ms. Enas Mesbah Omar",
    displayNameAr: "أ. إيناس مصباح عمر",
    email: "enas.mesbah@sabratha.edu.ly",
    role: "teacher",
    subjects: [
      {
        name: "C A L L",
        nameAr: "C A L L",
        semester: "السمستر الثامن",
        yearLabel: "السنة الرابعة",
        schedule: [{ day: "Sunday", dayAr: "الأحد", lecture: "المحاضرة الثالثة", time: "12:30 ظهراً" }],
      },
      {
        name: "conversation2 listen & speaking",
        nameAr: "المحادثة والاستماع 2",
        semester: "السمستر الثاني",
        yearLabel: "السنة الأولى",
        schedule: [
          { day: "Monday", dayAr: "الإثنين", lecture: "المحاضرة الثالثة", time: "12:30 ظهراً" },
          { day: "Monday", dayAr: "الإثنين", lecture: "المحاضرة الرابعة", time: "2:00 ظهراً" },
        ],
      },
      {
        name: "technology in ELT",
        nameAr: "التكنولوجيا في تدريس اللغة الإنجليزية",
        semester: "السمستر السابع",
        yearLabel: "السنة الرابعة",
        schedule: [
          { day: "Wednesday", dayAr: "الأربعاء", lecture: "المحاضرة الثالثة", time: "12:30 ظهراً" },
          { day: "Thursday", dayAr: "الخميس", lecture: "المحاضرة الثالثة", time: "12:30 ظهراً" },
        ],
      },
      {
        name: "phonology",
        nameAr: "علم الأصوات",
        semester: "السمستر الرابع",
        yearLabel: "السنة الثانية",
        schedule: [
          { day: "Sunday", dayAr: "الأحد", lecture: "المحاضرة الثانية", time: "10:30 صباحاً" },
          { day: "Sunday", dayAr: "الأحد", lecture: "المحاضرة الرابعة", time: "2:00 ظهراً" },
          { day: "Wednesday", dayAr: "الأربعاء", lecture: "المحاضرة الرابعة", time: "2:00 ظهراً" },
        ],
      },
    ],
  },
  Eman: {
    username: "Eman",
    code: "EMAN-8485",
    displayName: "Ms. Eman",
    displayNameAr: "أ. إيمان",
    email: "eman@sabratha.edu.ly",
    role: "teacher",
    subjects: [
      {
        name: "writing 1",
        nameAr: "الكتابة ١",
        semester: "السمستر الأول",
        yearLabel: "السنة الأولى",
        schedule: [
          { day: "Tuesday", dayAr: "الثلاثاء", lecture: "المحاضرة الأولى", time: "9:00 صباحاً" },
          { day: "Tuesday", dayAr: "الثلاثاء", lecture: "المحاضرة الثانية", time: "10:30 صباحاً" },
          { day: "Thursday", dayAr: "الخميس", lecture: "المحاضرة الأولى", time: "9:00 صباحاً" },
          { day: "Thursday", dayAr: "الخميس", lecture: "المحاضرة الثانية", time: "10:30 صباحاً" },
        ],
      },
      {
        name: "Novel 2",
        nameAr: "الرواية ٢",
        semester: "السمستر السابع",
        yearLabel: "السنة الرابعة",
        schedule: [
          { day: "Wednesday", dayAr: "الأربعاء", lecture: "المحاضرة الأولى", time: "9:00 صباحاً" },
          { day: "Thursday", dayAr: "الخميس", lecture: "المحاضرة الثالثة", time: "12:30 ظهراً" },
        ],
      },
      {
        name: "Microteaching",
        nameAr: "التدريس المصغر",
        semester: "السمستر الثامن",
        yearLabel: "السنة الرابعة",
        schedule: [{ day: "Wednesday", dayAr: "الأربعاء", lecture: "المحاضرة الثانية", time: "10:30 صباحاً" }],
      },
    ],
  },
};

// خريطة سريعة بالحروف الصغيرة للبحث غير الحساس لحالة الأحرف
export const TEACHERS_BY_LOWER: Record<string, Teacher> = Object.fromEntries(
  Object.values(TEACHERS).map((t) => [t.username.toLowerCase(), t])
);

export function getTeacherByUsername(username: string): Teacher | null {
  if (!username) return null;
  return TEACHERS_BY_LOWER[username.trim().toLowerCase()] || null;
}
