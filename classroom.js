/**
 * classroom.js — Classroom management module
 * ============================================================================
 * إدارة الصف: الحضور والغياب + الدرجات
 * (أعمال السنة — الحضور والغياب — الاختبارات والامتحانات)
 * ----------------------------------------------------------------------------
 * Attendance & gradebook UI + logic. Receives shared context from app.js
 * (dependency injection — no circular imports).
 * ========================================================================== */

let ctx = null; // { t, el, toast, formatDate, state, db }

const state = {
  sessionDate: '',
  students: [],
  attendance: [], // rows for current session
  attendanceAll: [], // all rows for the course (for rate %)
  gradeItems: [],
  grades: [],
  gradeCategory: 'coursework',
};

const CATEGORIES = ['coursework', 'attendance', 'exam'];

function categoryLabel(cat) {
  return {
    coursework: ctx.t('cat_coursework'),
    attendance: ctx.t('cat_attendance'),
    exam: ctx.t('cat_exam'),
  }[cat] || cat;
}

function statusLabel(st) {
  return {
    present: ctx.t('status_present'),
    absent: ctx.t('status_absent'),
    late: ctx.t('status_late'),
  }[st] || st;
}

function courseId() {
  return ctx.state.selectedCourseId || null;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ==========================================================================
 * Attendance (الحضور والغياب)
 * ======================================================================== */

async function loadAttendance() {
  const cid = courseId();
  if (!cid) return;
  const [{ data: students }, { data: sessionRows }, { data: allRows }] = await Promise.all([
    ctx.db.fetchStudents(cid),
    ctx.db.fetchAttendance({ courseId: cid, sessionDate: state.sessionDate }),
    ctx.db.fetchAttendance({ courseId: cid }),
  ]);
  state.students = students || [];
  state.attendance = sessionRows || [];
  state.attendanceAll = allRows || [];
}

function renderAttendance() {
  const wrap = document.getElementById('attendance-body');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (!courseId()) {
    wrap.appendChild(emptyState());
    return;
  }

  // Session date + summary bar
  const bar = ctx.el('div', 'flex flex-wrap items-end gap-3 mb-5');
  const dateBox = ctx.el('div');
  dateBox.appendChild(ctx.el('label', 'block text-sm font-bold text-slate-700 mb-1.5', ctx.t('session_date')));
  const dateInput = ctx.el('input', 'rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5');
  dateInput.type = 'date';
  dateInput.value = state.sessionDate;
  dateInput.addEventListener('change', async () => {
    state.sessionDate = dateInput.value || today();
    await loadAttendance();
    renderAttendance();
  });
  dateBox.appendChild(dateInput);
  bar.appendChild(dateBox);

  const counts = { present: 0, absent: 0, late: 0 };
  state.attendance.forEach((r) => {
    if (counts[r.status] != null) counts[r.status] += 1;
  });
  const summary = ctx.el('div', 'flex flex-wrap gap-2 ms-auto');
  [
    ['present', counts.present, 'bg-green-100 text-green-800'],
    ['absent', counts.absent, 'bg-red-100 text-red-800'],
    ['late', counts.late, 'bg-amber-100 text-amber-800'],
  ].forEach(([k, n, cls]) => {
    summary.appendChild(ctx.el('span', `px-3 py-1.5 rounded-full text-xs font-extrabold ${cls}`, `${statusLabel(k)}: ${n}`));
  });
  bar.appendChild(summary);
  wrap.appendChild(bar);

  // Add-student form
  const form = ctx.el('form', 'flex flex-wrap gap-2 mb-5');
  const nameInput = ctx.el('input', 'flex-1 min-w-[160px] rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5 text-sm');
  nameInput.placeholder = ctx.t('student_name_ph');
  nameInput.maxLength = 120;
  nameInput.required = true;
  const numberInput = ctx.el('input', 'w-[140px] rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5 text-sm');
  numberInput.placeholder = ctx.t('student_number_ph');
  numberInput.maxLength = 40;
  const addBtn = ctx.el('button', 'px-5 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-900 transition');
  addBtn.type = 'submit';
  addBtn.textContent = ctx.t('btn_add_student');
  form.appendChild(nameInput);
  form.appendChild(numberInput);
  form.appendChild(addBtn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = nameInput.value.trim();
    if (!fullName) return;
    const { data, error } = await ctx.db.addStudent({
      courseId: courseId(),
      fullName,
      studentNumber: numberInput.value.trim(),
    });
    if (error || !data) {
      ctx.toast(ctx.t('toast_error'), 'error');
      return;
    }
    state.students.push(data);
    nameInput.value = '';
    numberInput.value = '';
    renderAttendance();
    ctx.toast(ctx.t('toast_student_added'));
  });
  wrap.appendChild(form);

  // Students list
  const list = ctx.el('div', 'space-y-2.5');
  if (!state.students.length) {
    list.appendChild(ctx.el('p', 'text-sm text-slate-400 text-center py-6', ctx.t('no_students')));
  }
  state.students.forEach((student) => {
    const row = ctx.el('div', 'flex flex-wrap items-center gap-2 rounded-2xl border-2 border-slate-100 p-3');
    const info = ctx.el('div', 'flex-1 min-w-[150px]');
    info.appendChild(ctx.el('p', 'font-bold text-slate-800 text-sm', student.full_name));
    if (student.student_number) {
      info.appendChild(ctx.el('p', 'text-xs text-slate-400', `${ctx.t('student_number_label')}: ${student.student_number}`));
    }
    row.appendChild(info);

    // attendance rate (all sessions)
    const rowsForStudent = state.attendanceAll.filter((r) => r.student_id === student.id);
    if (rowsForStudent.length) {
      const presentish = rowsForStudent.filter((r) => r.status !== 'absent').length;
      const pct = Math.round((presentish / rowsForStudent.length) * 100);
      row.appendChild(ctx.el('span', 'px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold', `${ctx.t('attendance_rate')}: ${pct}%`));
    }

    const current = state.attendance.find((r) => r.student_id === student.id)?.status;
    const btns = ctx.el('div', 'flex items-center gap-1.5');
    [
      ['present', 'bg-green-600 hover:bg-green-700', 'bg-green-100 text-green-800 border-green-600'],
      ['absent', 'bg-red-600 hover:bg-red-700', 'bg-red-100 text-red-800 border-red-600'],
      ['late', 'bg-amber-500 hover:bg-amber-600', 'bg-amber-100 text-amber-800 border-amber-500'],
    ].forEach(([status, inactiveCls, activeCls]) => {
      const active = current === status;
      const btn = ctx.el(
        'button',
        `px-3 py-1.5 rounded-lg text-xs font-bold transition ${active ? `border-2 ${activeCls}` : `text-white ${inactiveCls}`}`,
        statusLabel(status)
      );
      btn.addEventListener('click', async () => {
        const { error } = await ctx.db.upsertAttendance({
          studentId: student.id,
          courseId: courseId(),
          sessionDate: state.sessionDate,
          status,
        });
        if (error) {
          ctx.toast(ctx.t('toast_error'), 'error');
          return;
        }
        const idx = state.attendance.findIndex((r) => r.student_id === student.id);
        if (idx >= 0) state.attendance[idx].status = status;
        else state.attendance.push({ student_id: student.id, status });
        // refresh all-rows cache
        const allIdx = state.attendanceAll.findIndex((r) => r.student_id === student.id && r.session_date === state.sessionDate);
        if (allIdx >= 0) state.attendanceAll[allIdx].status = status;
        else state.attendanceAll.push({ student_id: student.id, status, session_date: state.sessionDate });
        renderAttendance();
      });
      btns.appendChild(btn);
    });

    const delBtn = ctx.el('button', 'px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition', ctx.t('btn_delete'));
    delBtn.addEventListener('click', async () => {
      if (!confirm(ctx.t('confirm_delete_student'))) return;
      await ctx.db.deleteStudent(student.id);
      state.students = state.students.filter((s) => s.id !== student.id);
      renderAttendance();
      renderGrades();
      ctx.toast(ctx.t('toast_deleted'));
    });
    btns.appendChild(delBtn);

    row.appendChild(btns);
    list.appendChild(row);
  });
  wrap.appendChild(list);
}

/* ==========================================================================
 * Grades (الدرجات)
 * ======================================================================== */

async function loadGrades() {
  const cid = courseId();
  if (!cid) return;
  const [{ data: items }, { data: students }] = await Promise.all([
    ctx.db.fetchGradeItems(cid),
    ctx.db.fetchStudents(cid),
  ]);
  state.gradeItems = items || [];
  state.students = students || state.students;
  const { data: grades } = await ctx.db.fetchGrades(state.gradeItems.map((i) => i.id));
  state.grades = grades || [];
}

function renderGrades() {
  const wrap = document.getElementById('grades-body');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (!courseId()) {
    wrap.appendChild(emptyState());
    return;
  }

  // Category tabs
  const tabs = ctx.el('div', 'flex flex-wrap gap-2 mb-5');
  CATEGORIES.forEach((cat) => {
    const active = state.gradeCategory === cat;
    const btn = ctx.el(
      'button',
      `px-4 py-2 rounded-2xl text-sm font-bold border-2 transition ${active ? 'tab-active border-brand-800' : 'bg-white border-slate-200 text-brand-800 hover:border-brand-300'}`,
      categoryLabel(cat)
    );
    btn.addEventListener('click', () => {
      state.gradeCategory = cat;
      renderGrades();
    });
    tabs.appendChild(btn);
  });
  wrap.appendChild(tabs);

  const items = state.gradeItems.filter((i) => i.category === state.gradeCategory);

  // Add item form
  const form = ctx.el('form', 'flex flex-wrap gap-2 mb-5');
  const titleInput = ctx.el('input', 'flex-1 min-w-[180px] rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5 text-sm');
  titleInput.placeholder = ctx.t('grade_item_ph');
  titleInput.maxLength = 120;
  titleInput.required = true;
  const maxInput = ctx.el('input', 'w-[110px] rounded-xl border-2 border-slate-200 focus:border-brand-600 outline-none px-4 py-2.5 text-sm');
  maxInput.type = 'number';
  maxInput.min = '1';
  maxInput.max = '1000';
  maxInput.placeholder = ctx.t('max_score_ph');
  maxInput.value = '20';
  const addBtn = ctx.el('button', 'px-5 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-900 transition');
  addBtn.type = 'submit';
  addBtn.textContent = ctx.t('btn_add_grade_item');
  form.appendChild(titleInput);
  form.appendChild(maxInput);
  form.appendChild(addBtn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;
    const { data, error } = await ctx.db.addGradeItem({
      courseId: courseId(),
      category: state.gradeCategory,
      title,
      maxScore: Number(maxInput.value) || 100,
    });
    if (error || !data) {
      ctx.toast(ctx.t('toast_error'), 'error');
      return;
    }
    state.gradeItems.push(data);
    titleInput.value = '';
    renderGrades();
    ctx.toast(ctx.t('toast_grade_item_added'));
  });
  wrap.appendChild(form);

  if (!items.length) {
    wrap.appendChild(ctx.el('p', 'text-sm text-slate-400 text-center py-6', ctx.t('no_grade_items')));
    return;
  }
  if (!state.students.length) {
    wrap.appendChild(ctx.el('p', 'text-sm text-slate-400 text-center py-6', ctx.t('no_students')));
    return;
  }

  // Gradebook table (mobile: horizontal scroll)
  const scroll = ctx.el('div', 'overflow-x-auto rounded-2xl border-2 border-slate-100');
  const table = ctx.el('table', 'w-full text-sm');
  const thead = ctx.el('thead', 'bg-brand-50');
  const headRow = ctx.el('tr');
  headRow.appendChild(ctx.el('th', 'text-start font-extrabold text-brand-900 p-3 whitespace-nowrap', ctx.t('student_name_label')));
  items.forEach((item) => {
    const th = ctx.el('th', 'text-center font-extrabold text-brand-900 p-3 whitespace-nowrap');
    th.appendChild(ctx.el('div', 'text-xs sm:text-sm', item.title));
    const sub = ctx.el('div', 'text-[10px] text-slate-500 flex items-center justify-center gap-1.5 mt-0.5');
    sub.appendChild(ctx.el('span', '', `/${item.max_score}`));
    const del = ctx.el('button', 'text-red-400 hover:text-red-600 font-bold', '✕');
    del.title = ctx.t('btn_delete');
    del.addEventListener('click', async () => {
      if (!confirm(ctx.t('confirm_delete_grade_item'))) return;
      await ctx.db.deleteGradeItem(item.id);
      state.gradeItems = state.gradeItems.filter((i) => i.id !== item.id);
      state.grades = state.grades.filter((g) => g.item_id !== item.id);
      renderGrades();
      ctx.toast(ctx.t('toast_deleted'));
    });
    sub.appendChild(del);
    th.appendChild(sub);
    headRow.appendChild(th);
  });
  headRow.appendChild(ctx.el('th', 'text-center font-extrabold text-gold-700 p-3 whitespace-nowrap', ctx.t('total_label')));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = ctx.el('tbody');
  state.students.forEach((student) => {
    const tr = ctx.el('tr', 'border-t border-slate-100');
    const nameTd = ctx.el('td', 'p-3 font-bold text-slate-800 whitespace-nowrap');
    nameTd.appendChild(ctx.el('div', '', student.full_name));
    if (student.student_number) nameTd.appendChild(ctx.el('div', 'text-xs text-slate-400 font-normal', student.student_number));
    tr.appendChild(nameTd);

    let earned = 0;
    let possible = 0;
    items.forEach((item) => {
      possible += Number(item.max_score) || 0;
      const grade = state.grades.find((g) => g.item_id === item.id && g.student_id === student.id);
      if (grade && grade.score != null) earned += Number(grade.score) || 0;

      const td = ctx.el('td', 'p-2 text-center');
      const input = ctx.el('input', 'w-16 text-center rounded-lg border-2 border-slate-200 focus:border-brand-600 outline-none py-1.5 text-sm');
      input.type = 'number';
      input.min = '0';
      input.max = String(item.max_score);
      input.step = '0.5';
      input.value = grade && grade.score != null ? String(grade.score) : '';
      input.addEventListener('change', async () => {
        const { error } = await ctx.db.upsertGrade({
          itemId: item.id,
          studentId: student.id,
          score: input.value,
        });
        if (error) {
          ctx.toast(ctx.t('toast_error'), 'error');
          return;
        }
        const idx = state.grades.findIndex((g) => g.item_id === item.id && g.student_id === student.id);
        const val = input.value === '' ? null : Number(input.value);
        if (idx >= 0) state.grades[idx].score = val;
        else state.grades.push({ item_id: item.id, student_id: student.id, score: val });
        renderGrades();
      });
      td.appendChild(input);
      tr.appendChild(td);
    });

    const totalTd = ctx.el('td', 'p-3 text-center font-extrabold text-gold-700 whitespace-nowrap', `${earned} / ${possible}`);
    tr.appendChild(totalTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroll.appendChild(table);
  wrap.appendChild(scroll);

  wrap.appendChild(ctx.el('p', 'text-xs text-slate-400 mt-3', ctx.t('grades_hint')));
}

/* ==========================================================================
 * Shared
 * ======================================================================== */

function emptyState() {
  const box = ctx.el('div', 'rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center');
  box.appendChild(ctx.el('p', 'text-slate-500 font-bold', ctx.t('classroom_need_course')));
  const btn = ctx.el('button', 'mt-4 px-6 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-900 transition', ctx.t('btn_go_courses'));
  btn.addEventListener('click', () => {
    document.getElementById('course-section')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('course-select')?.focus();
  });
  box.appendChild(btn);
  return box;
}

function switchClassroomTab(name) {
  document.querySelectorAll('.classroom-tab-btn').forEach((btn) => {
    btn.classList.toggle('tab-active', btn.dataset.ctab === name);
  });
  document.getElementById('classroom-attendance')?.classList.toggle('hidden', name !== 'attendance');
  document.getElementById('classroom-grades')?.classList.toggle('hidden', name !== 'grades');
}

/** Called by app.js when the selected course changes. */
export async function setCourse() {
  state.sessionDate = state.sessionDate || today();
  await Promise.all([loadAttendance(), loadGrades()]);
  renderAttendance();
  renderGrades();
}

export async function refreshAll() {
  await setCourse();
}

/** Initialise the module with shared context. */
export function initClassroom(context) {
  ctx = context;
  state.sessionDate = today();

  document.querySelectorAll('.classroom-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchClassroomTab(btn.dataset.ctab));
  });
  switchClassroomTab('attendance');
}

export { state as classroomState, categoryLabel, statusLabel };
