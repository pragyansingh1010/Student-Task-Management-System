// ========================================
// STORAGE & CONSTANTS
// ========================================

const STORE_KEY = "taskflow-data-v1";

const COLORS = [
  "#6757f5",
  "#ef765d",
  "#2ba879",
  "#4e8df7",
  "#e7a33c",
  "#d75fc5"
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const isoDate = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const uid = prefix =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );

const fmtDate = date =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date(`${date}T12:00:00`))
    : "No date";

const fmtLongDate = date =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T12:00:00`));

const initials = name =>
  name
    .split(" ")
    .map(x => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();


// ========================================
// DEFAULT DATA
// ========================================

const defaults = () => ({
  profile: {
    name: "Alex Johnson",
    email: "alex.johnson@student.edu"
  },

  theme: "light",

  settings: {
    notifications: true,
    defaultPriority: "medium",
    pomodoro: 25
  },

  subjects: [
    {
      id: "s1",
      name: "Computer Science",
      color: "#6757f5",
      icon: "💻"
    },
    {
      id: "s2",
      name: "Physics",
      color: "#4e8df7",
      icon: "⚛️"
    },
    {
      id: "s3",
      name: "English Literature",
      color: "#ef765d",
      icon: "📚"
    },
    {
      id: "s4",
      name: "Mathematics",
      color: "#2ba879",
      icon: "∑"
    }
  ],

  tasks: [
    {
      id: "t1",
      title: "Finish data structures problem set",
      description: "Complete trees and graph traversal exercises.",
      subject: "Computer Science",
      dueDate: todayISO(),
      dueTime: "18:30",
      priority: "high",
      category: "Assignment",
      estimatedTime: 90,
      status: "pending",
      completed: false,
      createdAt: Date.now() - 86400000 * 2
    },

    {
      id: "t2",
      title: "Review electromagnetic induction",
      description: "Revise lecture notes and practice questions.",
      subject: "Physics",
      dueDate: todayISO(),
      dueTime: "20:00",
      priority: "medium",
      category: "Study",
      estimatedTime: 45,
      status: "pending",
      completed: false,
      createdAt: Date.now() - 86400000
    },

    {
      id: "t3",
      title: "Read The Great Gatsby · Chapter 4",
      description: "Prepare three discussion points for seminar.",
      subject: "English Literature",
      dueDate: isoDate(1),
      dueTime: "10:00",
      priority: "low",
      category: "Reading",
      estimatedTime: 30,
      status: "pending",
      completed: false,
      createdAt: Date.now()
    },

    {
      id: "t4",
      title: "Submit calculus worksheet",
      description: "Upload worksheet to the class portal.",
      subject: "Mathematics",
      dueDate: isoDate(-1),
      dueTime: "23:59",
      priority: "high",
      category: "Assignment",
      estimatedTime: 60,
      status: "completed",
      completed: true,
      completedAt: Date.now() - 86400000,
      createdAt: Date.now() - 86400000 * 4
    },

    {
      id: "t5",
      title: "Plan weekend study blocks",
      description: "Map out two focused sessions for each subject.",
      subject: "Mathematics",
      dueDate: isoDate(2),
      dueTime: "09:00",
      priority: "low",
      category: "Planning",
      estimatedTime: 20,
      status: "pending",
      completed: false,
      createdAt: Date.now() - 3600000
    }
  ],

  goals: [
    {
      id: "g1",
      title: "Complete 20 assignments",
      description: "Keep momentum across all subjects.",
      target: 20,
      current: 12,
      deadline: isoDate(25),
      unit: "assignments"
    },

    {
      id: "g2",
      title: "Study 30 hours this month",
      description: "Build a consistent study rhythm.",
      target: 30,
      current: 18,
      deadline: isoDate(20),
      unit: "hours"
    },

    {
      id: "g3",
      title: "Maintain a 7-day streak",
      description: "Show up for one meaningful session daily.",
      target: 7,
      current: 5,
      deadline: isoDate(7),
      unit: "days"
    }
  ],

  sessions: [
    {
      id: "f1",
      date: isoDate(-1),
      minutes: 25,
      taskId: "t4"
    },
    {
      id: "f2",
      date: isoDate(-2),
      minutes: 50
    },
    {
      id: "f3",
      date: isoDate(-3),
      minutes: 25
    }
  ],

  notifications: []
});


// ========================================
// APPLICATION STATE
// ========================================

let state =
  JSON.parse(localStorage.getItem(STORE_KEY) || "null") || defaults();

let currentView = "dashboard";
let calendarCursor = new Date();
let selectedDate = todayISO();
let selectedFocusTask = "";
let timerMode = "focus";
let timerSeconds = state.settings.pomodoro * 60;
let timerRunning = false;
let timerInterval = null;


// ========================================
// DOM HELPERS
// ========================================

const $ = s => document.querySelector(s);

const $$ = s => [...document.querySelectorAll(s)];


// ========================================
// DATA & UTILITY FUNCTIONS
// ========================================

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function subjectByName(name) {
  return state.subjects.find(s => s.name === name);
}

function subjectColor(name) {
  return subjectByName(name)?.color || "#9aa4b5";
}

function completedTasks() {
  return state.tasks.filter(t => t.completed);
}

function overdueTasks() {
  return state.tasks.filter(
    t => !t.completed && t.dueDate && t.dueDate < todayISO()
  );
}

function streak() {
  let n = 0;
  let d = new Date();

  const days = new Set(state.sessions.map(s => s.date));

  while (days.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }

  return n;
}

function stats() {
  const total = state.tasks.length;
  const done = completedTasks().length;

  return {
    total,
    done,
    pending: total - done,
    overdue: overdueTasks().length,
    percent: total ? Math.round((done / total) * 100) : 0,
    today: state.tasks.filter(t => t.dueDate === todayISO()).length,
    hours:
      Math.round(
        (state.sessions.reduce((a, s) => a + s.minutes, 0) / 60) * 10
      ) / 10,
    streak: streak()
  };
}


// ========================================
// UI COMPONENT HELPERS
// ========================================

function taskRow(t) {
  return `
    <div class="task-row ${t.completed ? "done" : ""}" data-task="${t.id}">
      <button
        class="check"
        data-action="toggle-task"
        data-id="${t.id}"
        aria-label="Mark task complete"
      >
        <i class="icon-check"></i>
      </button>

      <div class="task-info">
        <p class="task-title">${esc(t.title)}</p>

        <div class="task-meta">
          <span>
            <i class="icon-book-open"></i>
            ${esc(t.subject || "General")}
          </span>

          <span>·</span>

          <span>
            <i class="icon-clock-3"></i>
            ${
              t.dueDate === todayISO()
                ? t.dueTime || "Today"
                : fmtDate(t.dueDate)
            }
          </span>
        </div>
      </div>

      <span class="priority ${t.priority}">
        ${t.priority}
      </span>

      <div class="task-actions">
        <button
          class="icon-btn"
          data-action="edit-task"
          data-id="${t.id}"
          aria-label="Edit"
        >
          <i class="icon-pencil"></i>
        </button>

        <button
          class="icon-btn"
          data-action="delete-task"
          data-id="${t.id}"
          aria-label="Delete"
        >
          <i class="icon-trash-2"></i>
        </button>
      </div>
    </div>
  `;
}

function emptyState(icon, title, text, action, label) {
  return `
    <div class="empty-state">
      <div class="empty-icon">
        <i class="${icon}"></i>
      </div>

      <h3>${title}</h3>

      <p>${text}</p>

      ${
        action
          ? `
            <button
              class="button primary"
              data-action="${action}"
            >
              <i class="icon-plus"></i>
              ${label}
            </button>
          `
          : ""
      }
    </div>
  `;
}

function statCard(icon, color, label, value, trend = "") {
  return `
    <div class="stat-card">
      <div class="stat-icon ${color}">
        <i class="${icon}"></i>
      </div>

      <span>${label}</span>

      <strong>${value}</strong>

      ${
        trend
          ? `<small class="trend">${trend}</small>`
          : ""
      }
    </div>
  `;
}


// ========================================
// VIEW RENDERING
// ========================================

function renderDashboard() {
  const s = stats();

  const todayTasks = state.tasks
    .filter(t => t.dueDate === todayISO())
    .sort(
      (a, b) =>
        a.completed - b.completed ||
        a.dueTime?.localeCompare(b.dueTime || "")
    );

  $("#dashboardView").innerHTML = `
    <div class="hero">
      <div>
        <p class="eyebrow">Your productivity snapshot</p>

        <h2>
          Good ${
            new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
              ? "afternoon"
              : "evening"
          },
          ${esc(state.profile.name.split(" ")[0])} 👋
        </h2>

        <p>
          Here's what's happening with your productivity today.
        </p>
      </div>

      <div class="hero-date">
        <strong>${fmtLongDate(todayISO())}</strong>

        <span>
          ${s.today}
          task${s.today === 1 ? "" : "s"}
          scheduled for today
        </span>
      </div>
    </div>

    <div class="stats-grid">
      ${statCard(
        "icon-list-check",
        "purple",
        "Total tasks",
        s.total,
        "All your work in one place"
      )}

      ${statCard(
        "icon-circle-check",
        "green",
        "Completed",
        s.done,
        `${s.percent}% completion rate`
      )}

      ${statCard(
        "icon-hourglass",
        "orange",
        "Pending",
        s.pending,
        "Keep your momentum"
      )}

      ${statCard(
        "icon-triangle-alert",
        "red",
        "Overdue",
        s.overdue,
        s.overdue ? "Needs attention" : "You're all caught up"
      )}

      ${statCard(
        "icon-book-marked",
        "blue",
        "Study hours",
        s.hours,
        "From focus sessions"
      )}

      ${statCard(
        "icon-flame",
        "orange",
        "Current streak",
        `${s.streak} days`,
        "Show up every day"
      )}
    </div>

    <div class="dashboard-grid">
      <div>
        <div class="section-heading">
          <div>
            <h2>Today's tasks</h2>
            <p>Your priorities for the day</p>
          </div>

          <button
            class="button ghost"
            data-view="tasks"
          >
            View all
            <i class="icon-arrow-up-right"></i>
          </button>
        </div>

        <div class="card">
          ${
            todayTasks.length
              ? `
                <div class="task-list">
                  ${todayTasks.map(taskRow).join("")}
                </div>
              `
              : emptyState(
                  "icon-sparkles",
                  "No tasks today",
                  "A clear day is a great day to plan ahead.",
                  "add-task",
                  "Create a task"
                )
          }
        </div>
      </div>

      <div>
        <div class="section-heading">
          <div>
            <h2>Weekly progress</h2>
            <p>Completed tasks this week</p>
          </div>
        </div>

        <div class="card mini-chart">
          ${weeklyBars()}

          <div
            class="progress-ring"
            style="--percent:${s.percent}"
          >
            <div class="ring-content">
              <strong>${s.percent}%</strong>
              <span>complete</span>
            </div>
          </div>

          <div class="insight">
            <strong>
              ${s.percent >= 70 ? "Great rhythm" : "Small steps add up"}.
            </strong>

            ${
              s.percent >= 70
                ? "You're making excellent progress this week."
                : "Complete one more task today to build momentum."
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function weeklyBars() {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const now = new Date();
  const arr = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);

    d.setDate(now.getDate() - i);

    const iso = d.toISOString().slice(0, 10);

    arr.push(
      state.tasks.filter(
        t =>
          t.completed &&
          t.completedAt &&
          new Date(t.completedAt)
            .toISOString()
            .slice(0, 10) === iso
      ).length
    );
  }

  const max = Math.max(...arr, 1);

  return `
    <div class="bars">
      ${arr
        .map(
          (v, i) => `
            <div class="bar-col">
              <div
                class="bar"
                style="height:${Math.max((v / max) * 100, 4)}%"
              ></div>

              <span>${labels[i]}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTasks() {
  let list = [...state.tasks];

  const q = $("#globalSearch").value.toLowerCase();

  const status = $("#taskStatus")?.value || "all";
  const priority = $("#taskPriority")?.value || "all";
  const subject = $("#taskSubject")?.value || "all";
  const sort = $("#taskSort")?.value || "newest";

  if (q) {
    list = list.filter(t =>
      `${t.title} ${t.description} ${t.subject} ${t.category}`
        .toLowerCase()
        .includes(q)
    );
  }

  if (status === "pending") {
    list = list.filter(t => !t.completed);
  }

  if (status === "completed") {
    list = list.filter(t => t.completed);
  }

  if (status === "overdue") {
    list = list.filter(t => overdueTasks().includes(t));
  }

  if (priority !== "all") {
    list = list.filter(t => t.priority === priority);
  }

  if (subject !== "all") {
    list = list.filter(t => t.subject === subject);
  }

  const ranks = {
    high: 3,
    medium: 2,
    low: 1
  };

  list.sort((a, b) =>
    sort === "oldest"
      ? a.createdAt - b.createdAt
      : sort === "due"
      ? a.dueDate.localeCompare(b.dueDate)
      : sort === "priority"
      ? ranks[b.priority] - ranks[a.priority]
      : sort === "alpha"
      ? a.title.localeCompare(b.title)
      : b.createdAt - a.createdAt
  );

  const grid = $("#taskGridMode")?.classList.contains("active");

  const body = list.length
    ? grid
      ? `
        <div class="task-grid">
          ${list
            .map(
              t => `
                <div class="task-card">
                  <div class="task-top">
                    <span class="priority ${t.priority}">
                      ${t.priority} priority
                    </span>

                    <button
                      class="icon-btn"
                      data-action="delete-task"
                      data-id="${t.id}"
                    >
                      <i class="icon-trash-2"></i>
                    </button>
                  </div>

                  <h3>${esc(t.title)}</h3>

                  <p>
                    ${esc(t.description || "No description added.")}
                  </p>

                  <div class="task-footer">
                    <span>
                      <i class="icon-book-open"></i>
                      ${esc(t.subject || "General")}
                    </span>

                    <button
                      class="button ${
                        t.completed ? "secondary" : "primary"
                      }"
                      data-action="toggle-task"
                      data-id="${t.id}"
                    >
                      ${t.completed ? "Completed" : "Complete"}
                    </button>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      `
      : `
        <div class="card task-board">
          ${list.map(taskRow).join("")}
        </div>
      `
    : emptyState(
        "icon-search-x",
        "No results found",
        "Try a different search or clear your filters."
      );

  $("#tasksView").innerHTML = `
    <div class="page-intro">
      <h2>My tasks</h2>
      <p>
        Stay on top of assignments, study sessions, and everything in between.
      </p>
    </div>

    <div class="toolbar">
      <label class="search-box">
        <i class="icon-search"></i>

        <input
          id="taskSearch"
          type="search"
          value="${esc(q)}"
          placeholder="Search your tasks..."
        />
      </label>

      <select class="select" id="taskStatus">
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
      </select>

      <select class="select" id="taskPriority">
        <option value="all">All priorities</option>
        <option value="high">High priority</option>
        <option value="medium">Medium priority</option>
        <option value="low">Low priority</option>
      </select>

      <select class="select" id="taskSubject">
        <option value="all">All subjects</option>
        ${state.subjects
          .map(
            x => `
              <option>${esc(x.name)}</option>
            `
          )
          .join("")}
      </select>

      <select class="select" id="taskSort">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="due">Due date</option>
        <option value="priority">Priority</option>
        <option value="alpha">Alphabetical</option>
      </select>

      <span class="spacer"></span>

      <div class="view-toggle">
        <button
          class="${grid ? "" : "active"}"
          id="taskListMode"
        >
          <i class="icon-list"></i>
        </button>

        <button
          class="${grid ? "active" : ""}"
          id="taskGridMode"
        >
          <i class="icon-grid-2x2"></i>
        </button>
      </div>

      <button
        class="button primary"
        data-action="add-task"
      >
        <i class="icon-plus"></i>
        Add task
      </button>
    </div>

    <div id="taskResults">
      ${body}
    </div>
  `;

  [
    "taskSearch",
    "taskStatus",
    "taskPriority",
    "taskSubject",
    "taskSort",
    "taskListMode",
    "taskGridMode"
  ].forEach(id =>
    $("#" + id)?.addEventListener(
      id.includes("Mode") ? "click" : "input",
      () => {
        if (id === "taskSearch") {
          $("#globalSearch").value = $("#taskSearch").value;
        }

        renderTasks();
      }
    )
  );
}

function renderCalendar() {
  const y = calendarCursor.getFullYear();
  const m = calendarCursor.getMonth();

  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();

  const start = (first.getDay() + 6) % 7;

  let cells = "";

  for (let i = 0; i < start; i++) {
    cells += `<div class="cal-day other"></div>`;
  }

  for (let d = 1; d <= days; d++) {
    const iso =
      `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(
        2,
        "0"
      )}`;

    const tasks = state.tasks.filter(t => t.dueDate === iso);

    cells += `
      <div
        class="cal-day ${iso === todayISO() ? "today" : ""} ${
          iso === selectedDate ? "selected" : ""
        }"
        data-date="${iso}"
      >
        <div class="day-number">${d}</div>

        ${tasks
          .slice(0, 2)
          .map(
            t => `
              <div class="cal-task">
                ${esc(t.title)}
              </div>
            `
          )
          .join("")}

        ${
          tasks.length > 2
            ? `
              <div class="cal-task">
                +${tasks.length - 2} more
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  const picked = state.tasks.filter(
    t => t.dueDate === selectedDate
  );

  $("#calendarView").innerHTML = `
    <div class="page-intro">
      <h2>Calendar</h2>
      <p>
        See your workload at a glance and make space for focused work.
      </p>
    </div>

    <div class="calendar-wrap">
      <div class="card calendar-card">
        <div class="calendar-head">
          <div class="calendar-nav">
            <button
              class="icon-btn"
              data-action="prev-month"
            >
              <i class="icon-chevron-left"></i>
            </button>

            <button
              class="button secondary"
              data-action="today"
            >
              Today
            </button>

            <button
              class="icon-btn"
              data-action="next-month"
            >
              <i class="icon-chevron-right"></i>
            </button>
          </div>

          <h2>
            ${new Intl.DateTimeFormat("en-US", {
              month: "long",
              year: "numeric"
            }).format(calendarCursor)}
          </h2>
        </div>

        <div class="calendar-grid">
          ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            .map(x => `<div class="day-label">${x}</div>`)
            .join("")}

          ${cells}
        </div>
      </div>

      <div class="card date-detail">
        <h3>${fmtLongDate(selectedDate)}</h3>

        <p>
          ${picked.length}
          task${picked.length === 1 ? "" : "s"}
          due on this date
        </p>

        ${
          picked.length
            ? `
              <div class="task-list">
                ${picked.map(taskRow).join("")}
              </div>
            `
            : emptyState(
                "icon-calendar-plus",
                "Nothing scheduled",
                "Keep this day open or add something important.",
                "add-task",
                "Add task"
              )
        }
      </div>
    </div>
  `;
}

function renderSubjects() {
  const cards = state.subjects
    .map(s => {
      const ts = state.tasks.filter(
        t => t.subject === s.name
      );

      const done = ts.filter(t => t.completed).length;

      const pct = ts.length
        ? Math.round((done / ts.length) * 100)
        : 0;

      return `
        <div class="card subject-card">
          <button
            class="icon-btn card-menu"
            data-action="edit-subject"
            data-id="${s.id}"
          >
            <i class="icon-more-horizontal"></i>
          </button>

          <div
            class="subject-color"
            style="background:${s.color}"
          >
            ${s.icon}
          </div>

          <h3>${esc(s.name)}</h3>

          <p>
            ${
              ts.length
                ? `${ts.filter(t => !t.completed).length}
                   upcoming task${
                     ts.filter(t => !t.completed).length === 1
                       ? ""
                       : "s"
                   }`
                : "No tasks yet"
            }
          </p>

          <div class="subject-stats">
            <div>
              <span>Tasks</span>
              <strong>${ts.length}</strong>
            </div>

            <div>
              <span>Done</span>
              <strong>${done}</strong>
            </div>

            <div>
              <span>Progress</span>
              <strong>${pct}%</strong>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  $("#subjectsView").innerHTML = `
    <div class="page-intro">
      <h2>Subjects</h2>
      <p>
        Organize your workload by class and see where your energy goes.
      </p>
    </div>

    <div class="section-heading">
      <h2>Your subjects</h2>

      <button
        class="button primary"
        data-action="add-subject"
      >
        <i class="icon-plus"></i>
        Add subject
      </button>
    </div>

    <div class="subject-grid">
      ${
        cards ||
        emptyState(
          "icon-book-open",
          "No subjects yet",
          "Add your first subject to organize your tasks.",
          "add-subject",
          "Create subject"
        )
      }
    </div>
  `;
}

function renderGoals() {
  const cards = state.goals
    .map(g => {
      const pct = Math.min(
        100,
        Math.round((g.current / g.target) * 100)
      );

      return `
        <div class="card goal-card">
          <button
            class="icon-btn card-menu"
            data-action="edit-goal"
            data-id="${g.id}"
          >
            <i class="icon-more-horizontal"></i>
          </button>

          <div class="goal-head">
            <div class="goal-icon">
              <i class="icon-target"></i>
            </div>

            <div>
              <h3>${esc(g.title)}</h3>
              <p>${esc(g.description)}</p>
            </div>
          </div>

          <div class="goal-progress">
            <span style="width:${pct}%"></span>
          </div>

          <div class="goal-bottom">
            <span>
              <strong>${g.current}</strong>
              /
              ${g.target}
              ${esc(g.unit || "done")}
            </span>

            <span>
              ${pct}% · ${fmtDate(g.deadline)}
            </span>
          </div>
        </div>
      `;
    })
    .join("");

  $("#goalsView").innerHTML = `
    <div class="page-intro">
      <h2>Goals</h2>
      <p>
        Turn your intentions into visible progress and celebrate the small wins.
      </p>
    </div>

    <div class="section-heading">
      <h2>Study goals</h2>

      <button
        class="button primary"
        data-action="add-goal"
      >
        <i class="icon-plus"></i>
        Add goal
      </button>
    </div>

    <div class="goal-grid">
      ${
        cards ||
        emptyState(
          "icon-target",
          "No goals yet",
          "Set your first study goal and make it measurable.",
          "add-goal",
          "Create goal"
        )
      }
    </div>
  `;
}

function renderFocus() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;

  $("#focusView").innerHTML = `
    <div class="page-intro">
      <h2>Focus mode</h2>
      <p>
        Protect your attention, one intentional session at a time.
      </p>
    </div>

    <div class="focus-layout">
      <div class="card timer-card">
        <div class="mode-tabs">
          ${["focus", "short", "long"]
            .map(
              m => `
                <button
                  class="${timerMode === m ? "active" : ""}"
                  data-action="set-mode"
                  data-mode="${m}"
                >
                  ${
                    m === "focus"
                      ? "Focus · 25m"
                      : m === "short"
                      ? "Short break · 5m"
                      : "Long break · 15m"
                  }
                </button>
              `
            )
            .join("")}
        </div>

        <div class="timer">
          ${String(mins).padStart(2, "0")}:
          ${String(secs).padStart(2, "0")}
        </div>

        <div class="timer-label">
          ${
            timerMode === "focus"
              ? "Deep work session"
              : timerMode === "short"
              ? "Recharge and reset"
              : "Take a longer breather"
          }
        </div>

        <div class="timer-actions">
          <button
            class="button secondary"
            data-action="reset-timer"
          >
            Reset
          </button>

          <button
            class="button primary"
            data-action="toggle-timer"
          >
            <i class="icon-${timerRunning ? "pause" : "play"}"></i>
            ${timerRunning ? "Pause" : "Start focus"}
          </button>

          <button
            class="button secondary"
            data-action="skip-timer"
          >
            Skip
          </button>
        </div>

        <div class="session-count">
          Sessions completed today
          <strong>
            ${
              state.sessions.filter(
                s => s.date === todayISO()
              ).length
            }
          </strong>
        </div>
      </div>

      <div class="card focus-side">
        <h3>Choose a task</h3>

        <p>
          Attach your session to a task to make your study time count.
        </p>

        <div class="task-picker">
          ${
            state.tasks
              .filter(t => !t.completed)
              .slice(0, 8)
              .map(
                t => `
                  <button
                    class="pick-task ${
                      selectedFocusTask === t.id
                        ? "selected"
                        : ""
                    }"
                    data-action="pick-task"
                    data-id="${t.id}"
                  >
                    ${esc(t.title)}

                    <br>

                    <small>
                      ${esc(t.subject || "General")}
                      ·
                      ${t.estimatedTime || 25}
                      min
                    </small>
                  </button>
                `
              )
              .join("") ||
            emptyState(
              "icon-check-check",
              "All caught up",
              "Add a task to focus on."
            )
          }
        </div>
      </div>
    </div>
  `;
}

function renderAnalytics() {
  const s = stats();

  const subData = state.subjects.map(x => ({
    name: x.name,
    count: state.tasks.filter(
      t => t.subject === x.name && t.completed
    ).length
  }));

  const max = Math.max(
    ...subData.map(x => x.count),
    1
  );

  $("#analyticsView").innerHTML = `
    <div class="page-intro">
      <h2>Analytics</h2>
      <p>
        Understand your patterns and make your next week work better.
      </p>
    </div>

    <div class="analytics-grid">
      <div class="card chart-card">
        <h3>Tasks completed this week</h3>
        ${weeklyBars()}
      </div>

      <div class="card chart-card">
        <h3>Subject productivity</h3>

        <div class="metric-list">
          ${subData
            .map(
              x => `
                <div class="metric-row">
                  <label>${esc(x.name)}</label>

                  <div class="line">
                    <span
                      style="width:${(x.count / max) * 100}%"
                    ></span>
                  </div>

                  <strong>${x.count}</strong>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="card chart-card">
        <h3>Study time</h3>

        <div
          class="progress-ring"
          style="--percent:${Math.min(
            100,
            (s.hours / 30) * 100
          )}"
        >
          <div class="ring-content">
            <strong>${s.hours}h</strong>
            <span>logged</span>
          </div>
        </div>

        <div class="insight">
          <strong>Monthly target</strong>

          ${
            Math.max(0, 30 - s.hours)
          }
          hours remaining to reach your 30-hour study goal.
        </div>
      </div>

      <div class="card chart-card">
        <h3>Productivity highlights</h3>

        <div class="metric-list">
          <div class="metric-row">
            <label>Completion rate</label>

            <div class="line">
              <span style="width:${s.percent}%"></span>
            </div>

            <strong>${s.percent}%</strong>
          </div>

          <div class="metric-row">
            <label>Current streak</label>

            <div class="line">
              <span
                style="width:${Math.min(
                  100,
                  (s.streak / 7) * 100
                )}%"
              ></span>
            </div>

            <strong>${s.streak}d</strong>
          </div>

          <div class="metric-row">
            <label>Tasks today</label>

            <div class="line">
              <span
                style="width:${Math.min(
                  100,
                  (s.today / 5) * 100
                )}%"
              ></span>
            </div>

            <strong>${s.today}</strong>
          </div>
        </div>

        <div
          class="insight"
          style="margin:25px 0 0"
        >
          <strong>Most productive subject</strong>

          <br>

          ${
            subData.sort(
              (a, b) => b.count - a.count
            )[0]?.name || "Not enough data"
          }

          is leading your completed task count.
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  const p = state.profile;
  const st = state.settings;

  $("#settingsView").innerHTML = `
    <div class="page-intro">
      <h2>Settings</h2>
      <p>
        Make TaskFlow feel like your own personal study desk.
      </p>
    </div>

    <div class="settings-grid">
      <div class="card settings-card">
        <h3>Student profile</h3>

        <div class="form-row">
          <div class="field">
            <label for="profileName">
              Full name
            </label>

            <input
              id="profileName"
              value="${esc(p.name)}"
            >
          </div>

          <div class="field">
            <label for="profileEmail">
              Email
            </label>

            <input
              id="profileEmail"
              type="email"
              value="${esc(p.email)}"
            >
          </div>
        </div>

        <button
          class="button primary"
          data-action="save-profile"
        >
          Save profile
        </button>
      </div>

      <div class="card settings-card">
        <h3>Preferences</h3>

        <div class="switch-row">
          <span>Show notifications</span>

          <button
            class="switch ${st.notifications ? "on" : ""}"
            id="notificationSwitch"
            data-action="toggle-notifications"
          >
            <span></span>
          </button>
        </div>

        <div
          class="field"
          style="margin-top:17px"
        >
          <label>
            Default task priority
          </label>

          <select id="defaultPriority">
            <option
              value="low"
              ${st.defaultPriority === "low" ? "selected" : ""}
            >
              Low
            </option>

            <option
              value="medium"
              ${st.defaultPriority === "medium" ? "selected" : ""}
            >
              Medium
            </option>

            <option
              value="high"
              ${st.defaultPriority === "high" ? "selected" : ""}
            >
              High
            </option>
          </select>
        </div>

        <div class="field">
          <label>
            Default Pomodoro duration
          </label>

          <select id="pomodoroDuration">
            <option
              value="25"
              ${st.pomodoro == 25 ? "selected" : ""}
            >
              25 minutes
            </option>

            <option
              value="45"
              ${st.pomodoro == 45 ? "selected" : ""}
            >
              45 minutes
            </option>

            <option
              value="50"
              ${st.pomodoro == 50 ? "selected" : ""}
            >
              50 minutes
            </option>
          </select>
        </div>

        <button
          class="button primary"
          data-action="save-preferences"
        >
          Save preferences
        </button>
      </div>

      <div class="card settings-card">
        <h3>Data management</h3>

        <p
          style="
            color:var(--muted);
            font-size:12px;
            line-height:1.6
          "
        >
          Your workspace lives in your browser.
          Export a backup any time or restore from a
          previous JSON file.
        </p>

        <div
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap
          "
        >
          <button
            class="button secondary"
            data-action="export"
          >
            <i class="icon-download"></i>
            Export data
          </button>

          <button
            class="button secondary"
            data-action="import"
          >
            <i class="icon-upload"></i>
            Import data
          </button>

          <button
            class="button danger"
            data-action="reset-data"
          >
            Reset all data
          </button>
        </div>
      </div>
    </div>
  `;
}


// ========================================
// GLOBAL RENDER
// ========================================

function renderAll() {
  renderDashboard();
  renderTasks();
  renderCalendar();
  renderSubjects();
  renderGoals();
  renderFocus();
  renderAnalytics();
  renderSettings();

  $("#sideName").textContent = state.profile.name;
  $("#sideAvatar").textContent = initials(state.profile.name);
  $("#profileButton").textContent = initials(state.profile.name);
  $("#sideStreak").textContent = `${stats().streak} days`;
  $("#navTaskCount").textContent = stats().pending;

  document.body.classList.toggle(
    "dark",
    state.theme === "dark"
  );

  $(".theme-toggle span:not(.toggle-track)").textContent =
    state.theme === "dark"
      ? "Light mode"
      : "Dark mode";

  $(".theme-toggle i").className =
    `icon-${state.theme === "dark" ? "sun" : "moon"}`;
}


// ========================================
// MODALS & FORMS
// ========================================

function openModal(title, body, foot = "") {
  const m = $("#modal");

  m.innerHTML = `
    <div class="modal-head">
      <h2>${title}</h2>

      <button
        class="icon-btn"
        data-action="close-modal"
      >
        <i class="icon-x"></i>
      </button>
    </div>

    <div class="modal-body">
      ${body}
    </div>

    ${
      foot
        ? `<div class="modal-foot">${foot}</div>`
        : ""
    }
  `;

  $("#modalBackdrop").hidden = false;
}

function taskForm(task = {}) {
  const isEdit = !!task.id;

  return `
    <div class="form-row">
      <div class="field">
        <label for="taskTitle">
          Task title *
        </label>

        <input
          id="taskTitle"
          value="${esc(task.title)}"
          placeholder="e.g. Finish lab report"
        >
      </div>

      <div class="field">
        <label for="taskSubject">
          Subject
        </label>

        <select id="taskSubject">
          ${state.subjects
            .map(
              s => `
                <option
                  ${task.subject === s.name ? "selected" : ""}
                >
                  ${esc(s.name)}
                </option>
              `
            )
            .join("")}

          <option value="">
            General
          </option>
        </select>
      </div>
    </div>

    <div class="field">
      <label for="taskDescription">
        Description
      </label>

      <textarea
        id="taskDescription"
        placeholder="What needs to get done?"
      >${esc(task.description)}</textarea>
    </div>

    <div class="form-row">
      <div class="field">
        <label for="taskDate">
          Due date *
        </label>

        <input
          id="taskDate"
          type="date"
          value="${task.dueDate || selectedDate || todayISO()}"
        >
      </div>

      <div class="field">
        <label for="taskTime">
          Due time
        </label>

        <input
          id="taskTime"
          type="time"
          value="${task.dueTime || "18:00"}"
        >
      </div>
    </div>

    <div class="form-row">
      <div class="field">
        <label for="taskPriorityForm">
          Priority
        </label>

        <select id="taskPriorityForm">
          <option
            ${task.priority === "low" ? "selected" : ""}
          >
            low
          </option>

          <option
            ${
              !task.priority ||
              task.priority === "medium"
                ? "selected"
                : ""
            }
          >
            medium
          </option>

          <option
            ${task.priority === "high" ? "selected" : ""}
          >
            high
          </option>
        </select>
      </div>

      <div class="field">
        <label for="taskCategory">
          Category
        </label>

        <input
          id="taskCategory"
          value="${esc(task.category || "Assignment")}"
          placeholder="Assignment"
        >
      </div>
    </div>

    <div class="form-row">
      <div class="field">
        <label for="taskEstimate">
          Estimated minutes
        </label>

        <input
          id="taskEstimate"
          type="number"
          min="5"
          value="${task.estimatedTime || 30}"
        >
      </div>

      <div class="field">
        <label for="taskNotes">
          Optional notes
        </label>

        <input
          id="taskNotes"
          value="${esc(task.notes)}"
          placeholder="Add a quick note"
        >
      </div>
    </div>

    <div class="modal-foot">
      <button
        class="button secondary"
        data-action="close-modal"
      >
        Cancel
      </button>

      <button
        class="button primary"
        data-action="save-task"
        data-id="${isEdit ? task.id : ""}"
      >
        ${isEdit ? "Save changes" : "Add task"}
      </button>
    </div>
  `;
}

function openTaskModal(id) {
  openModal(
    id ? "Edit task" : "Add a new task",
    taskForm(
      id
        ? state.tasks.find(t => t.id === id)
        : {}
    )
  );
}

function openSubjectModal(id) {
  const s =
    state.subjects.find(x => x.id === id) || {};

  openModal(
    id ? "Edit subject" : "Add subject",
    `
      <div class="field">
        <label for="subjectName">
          Subject name *
        </label>

        <input
          id="subjectName"
          value="${esc(s.name)}"
          placeholder="e.g. Biology"
        >
      </div>

      <div class="form-row">
        <div class="field">
          <label for="subjectIcon">
            Icon
          </label>

          <input
            id="subjectIcon"
            value="${esc(s.icon || "📘")}"
          >
        </div>

        <div class="field">
          <label for="subjectColor">
            Color
          </label>

          <input
            id="subjectColor"
            type="color"
            value="${
              s.color ||
              COLORS[state.subjects.length % COLORS.length]
            }"
          >
        </div>
      </div>

      <div class="modal-foot">
        <button
          class="button secondary"
          data-action="close-modal"
        >
          Cancel
        </button>

        <button
          class="button primary"
          data-action="save-subject"
          data-id="${id || ""}"
        >
          Save subject
        </button>
      </div>
    `
  );
}

function openGoalModal(id) {
  const g =
    state.goals.find(x => x.id === id) || {};

  openModal(
    id ? "Edit goal" : "Create a goal",
    `
      <div class="field">
        <label for="goalTitle">
          Goal title *
        </label>

        <input
          id="goalTitle"
          value="${esc(g.title)}"
          placeholder="e.g. Practice Spanish daily"
        >
      </div>

      <div class="field">
        <label for="goalDescription">
          Description
        </label>

        <textarea id="goalDescription">
          ${esc(g.description)}
        </textarea>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="goalTarget">
            Target
          </label>

          <input
            id="goalTarget"
            type="number"
            min="1"
            value="${g.target || 10}"
          >
        </div>

        <div class="field">
          <label for="goalCurrent">
            Current progress
          </label>

          <input
            id="goalCurrent"
            type="number"
            min="0"
            value="${g.current || 0}"
          >
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="goalUnit">
            Unit
          </label>

          <input
            id="goalUnit"
            value="${esc(g.unit || "tasks")}"
          >
        </div>

        <div class="field">
          <label for="goalDeadline">
            Deadline
          </label>

          <input
            id="goalDeadline"
            type="date"
            value="${g.deadline || isoDate(30)}"
          >
        </div>
      </div>

      <div class="modal-foot">
        <button
          class="button secondary"
          data-action="close-modal"
        >
          Cancel
        </button>

        <button
          class="button primary"
          data-action="save-goal"
          data-id="${id || ""}"
        >
          Save goal
        </button>
      </div>
    `
  );
}

function toast(msg) {
  const el = document.createElement("div");

  el.className = "toast";

  el.innerHTML = `
    <i class="icon-check-circle-2"></i>
    ${esc(msg)}
  `;

  $("#toastRegion").append(el);

  setTimeout(() => el.remove(), 3000);
}


// ========================================
// NAVIGATION
// ========================================

function navigate(view) {
  currentView = view;

  $$(".view").forEach(x =>
    x.classList.toggle(
      "active",
      x.id === view + "View"
    )
  );

  $$(".nav-item").forEach(x =>
    x.classList.toggle(
      "active",
      x.dataset.view === view
    )
  );

  const names = {
    dashboard: "Student workspace",
    tasks: "Your tasks",
    calendar: "Plan your week",
    subjects: "Your courses",
    goals: "Progress tracker",
    focus: "Deep work",
    analytics: "Your insights",
    settings: "Workspace settings"
  };

  $("#viewEyebrow").textContent = names[view];

  $("#viewTitle").textContent =
    view === "dashboard"
      ? `Good ${
          new Date().getHours() < 18
            ? "afternoon"
            : "evening"
        }, ${state.profile.name.split(" ")[0]} 👋`
      : view.charAt(0).toUpperCase() +
        view.slice(1);

  if (window.innerWidth < 851) {
    $("#sidebar").classList.remove("open");
    $("#mobileBackdrop").classList.remove("open");
  }
}


// ========================================
// NOTIFICATIONS
// ========================================

function notifications() {
  const s = stats();
  const items = [];

  if (s.today) {
    items.push(
      `You have ${s.today} task${
        s.today === 1 ? "" : "s"
      } due today.`
    );
  }

  if (s.done >= 5) {
    items.push(
      `You completed ${s.done} tasks — great work!`
    );
  }

  if (s.streak >= 3) {
    items.push(
      `Your streak is now ${s.streak} days 🔥`
    );
  }

  state.tasks
    .filter(
      t =>
        t.dueDate === isoDate(1) &&
        !t.completed
    )
    .forEach(t =>
      items.push(
        `${t.subject || "Task"} assignment is due tomorrow.`
      )
    );

  return items.length
    ? items
    : [
        "You're all caught up. Enjoy the breathing room!"
      ];
}


// ========================================
// EVENT HANDLERS
// ========================================

function bindEvents() {
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");

    if (el) {
      const a = el.dataset.action;
      const id = el.dataset.id;

      if (a === "add-task") {
        openTaskModal();
      }

      if (a === "edit-task") {
        openTaskModal(id);
      }

      if (a === "delete-task") {
        confirmAction(
          "Delete this task?",
          "This cannot be undone.",
          () => {
            state.tasks = state.tasks.filter(
              t => t.id !== id
            );

            save();
            toast("Task deleted");
            renderAll();
          }
        );
      }

      if (a === "toggle-task") {
        const t = state.tasks.find(
          x => x.id === id
        );

        if (t) {
          t.completed = !t.completed;

          t.status = t.completed
            ? "completed"
            : "pending";

          if (t.completed) {
            t.completedAt = Date.now();
          }

          save();

          toast(
            t.completed
              ? "Task completed 🎉"
              : "Task marked pending"
          );

          renderAll();
        }
      }

      if (a === "save-task") {
        saveTask(id);
      }

      if (a === "close-modal") {
        $("#modalBackdrop").hidden = true;
      }

      if (a === "add-subject") {
        openSubjectModal();
      }

      if (a === "edit-subject") {
        openSubjectModal(id);
      }

      if (a === "save-subject") {
        saveSubject(id);
      }

      if (a === "add-goal") {
        openGoalModal();
      }

      if (a === "edit-goal") {
        openGoalModal(id);
      }

      if (a === "save-goal") {
        saveGoal(id);
      }

      if (a === "prev-month") {
        calendarCursor.setMonth(
          calendarCursor.getMonth() - 1
        );

        renderCalendar();
      }

      if (a === "next-month") {
        calendarCursor.setMonth(
          calendarCursor.getMonth() + 1
        );

        renderCalendar();
      }

      if (a === "today") {
        calendarCursor = new Date();
        selectedDate = todayISO();
        renderCalendar();
      }

      if (a === "pick-task") {
        selectedFocusTask = id;
        renderFocus();
      }

      if (a === "set-mode") {
        timerMode = el.dataset.mode;

        timerSeconds = {
          focus: state.settings.pomodoro * 60,
          short: 300,
          long: 900
        }[timerMode];

        renderFocus();
      }

      if (a === "toggle-timer") {
        toggleTimer();
      }

      if (a === "reset-timer") {
        clearInterval(timerInterval);

        timerRunning = false;

        timerSeconds = {
          focus: state.settings.pomodoro * 60,
          short: 300,
          long: 900
        }[timerMode];

        renderFocus();
      }

      if (a === "skip-timer") {
        timerSeconds = 0;
        finishSession();
      }

      if (a === "save-profile") {
        saveProfile();
      }

      if (a === "toggle-notifications") {
        state.settings.notifications =
          !state.settings.notifications;

        save();
        renderSettings();
      }

      if (a === "save-preferences") {
        savePreferences();
      }

      if (a === "export") {
        exportData();
      }

      if (a === "import") {
        $("#importInput").click();
      }

      if (a === "reset-data") {
        confirmAction(
          "Reset your workspace?",
          "All tasks, subjects, goals, and settings will be erased.",
          () => {
            state = defaults();
            save();
            renderAll();
            toast("Workspace reset");
          }
        );
      }
    }

    const viewEl =
      e.target.closest("[data-view]");

    if (
      viewEl &&
      !e.target.closest("[data-action]")
    ) {
      navigate(viewEl.dataset.view);
    }

    const day =
      e.target.closest(".cal-day[data-date]");

    if (day) {
      selectedDate = day.dataset.date;
      renderCalendar();
    }
  });

  $("#globalSearch").addEventListener(
    "input",
    () => {
      if (currentView === "tasks") {
        renderTasks();
      }
    }
  );

  $("#notificationBtn").addEventListener(
    "click",
    () => {
      const p = $("#notificationPanel");

      p.hidden = !p.hidden;

      p.innerHTML = `
        <h3>Notifications</h3>

        ${notifications()
          .map(
            x => `
              <div class="notification-item">
                ${esc(x)}
                <span>Just now</span>
              </div>
            `
          )
          .join("")}
      `;
    }
  );

  $("#themeToggle").addEventListener(
    "click",
    () => {
      state.theme =
        state.theme === "dark"
          ? "light"
          : "dark";

      save();
      renderAll();

      toast(
        `${
          state.theme === "dark"
            ? "Dark"
            : "Light"
        } mode enabled`
      );
    }
  );

  $("#mobileMenu").addEventListener(
    "click",
    () => {
      $("#sidebar").classList.add("open");
      $("#mobileBackdrop").classList.add("open");
    }
  );

  $("#mobileBackdrop").addEventListener(
    "click",
    () => {
      $("#sidebar").classList.remove("open");
      $("#mobileBackdrop").classList.remove("open");
    }
  );

  $("#sidebarClose").addEventListener(
    "click",
    () => {
      $("#sidebar").classList.remove("open");
      $("#mobileBackdrop").classList.remove("open");
    }
  );

  $("#importInput").addEventListener(
    "change",
    importData
  );

  document.addEventListener(
    "keydown",
    e => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k"
      ) {
        e.preventDefault();
        $("#globalSearch").focus();
      }

      if (e.key === "Escape") {
        $("#modalBackdrop").hidden = true;
        $("#notificationPanel").hidden = true;
      }
    }
  );
}


// ========================================
// DATA OPERATIONS
// ========================================

function saveTask(id) {
  const title = $("#taskTitle").value.trim();
  const date = $("#taskDate").value;

  if (!title || !date) {
    toast("Add a title and due date");
    return;
  }

  const data = {
    title,
    description: $("#taskDescription").value.trim(),
    subject: $("#taskSubject").value,
    dueDate: date,
    dueTime: $("#taskTime").value,
    priority: $("#taskPriorityForm").value,
    category:
      $("#taskCategory").value.trim() ||
      "General",
    estimatedTime:
      Number($("#taskEstimate").value) || 30,
    notes: $("#taskNotes").value.trim()
  };

  if (id) {
    Object.assign(
      state.tasks.find(t => t.id === id),
      data
    );
  } else {
    state.tasks.unshift({
      id: uid("task"),
      ...data,
      status: "pending",
      completed: false,
      createdAt: Date.now()
    });
  }

  save();

  $("#modalBackdrop").hidden = true;

  toast(
    id ? "Task updated" : "Task added"
  );

  renderAll();
}

function saveSubject(id) {
  const name = $("#subjectName").value.trim();

  if (!name) {
    toast("Add a subject name");
    return;
  }

  if (id) {
    Object.assign(
      state.subjects.find(s => s.id === id),
      {
        name,
        icon:
          $("#subjectIcon").value ||
          "📘",
        color: $("#subjectColor").value
      }
    );
  } else {
    state.subjects.push({
      id: uid("subject"),
      name,
      icon:
        $("#subjectIcon").value ||
        "📘",
      color: $("#subjectColor").value
    });
  }

  save();

  $("#modalBackdrop").hidden = true;

  toast(
    id
      ? "Subject updated"
      : "Subject created"
  );

  renderAll();
}

function saveGoal(id) {
  const title = $("#goalTitle").value.trim();

  if (!title) {
    toast("Add a goal title");
    return;
  }

  const data = {
    title,
    description:
      $("#goalDescription").value.trim(),
    target:
      Number($("#goalTarget").value) || 1,
    current:
      Number($("#goalCurrent").value) || 0,
    unit:
      $("#goalUnit").value.trim() ||
      "tasks",
    deadline:
      $("#goalDeadline").value
  };

  if (id) {
    Object.assign(
      state.goals.find(g => g.id === id),
      data
    );
  } else {
    state.goals.push({
      id: uid("goal"),
      ...data
    });
  }

  save();

  $("#modalBackdrop").hidden = true;

  toast(
    id
      ? "Goal updated"
      : "Goal created"
  );

  renderAll();
}

function confirmAction(
  title,
  text,
  callback
) {
  openModal(
    title,
    `
      <p
        style="
          color:var(--muted);
          line-height:1.6
        "
      >
        ${text}
      </p>
    `,
    `
      <button
        class="button secondary"
        data-action="close-modal"
      >
        Cancel
      </button>

      <button
        class="button danger"
        id="confirmButton"
      >
        Confirm
      </button>
    `
  );

  $("#confirmButton").onclick = () => {
    callback();
    $("#modalBackdrop").hidden = true;
  };
}


// ========================================
// TIMER / FOCUS LOGIC
// ========================================

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);

    timerRunning = false;

    renderFocus();

    return;
  }

  timerRunning = true;

  timerInterval = setInterval(() => {
    timerSeconds--;

    if (timerSeconds <= 0) {
      finishSession();
    } else {
      renderFocus();
    }
  }, 1000);

  renderFocus();
}

function finishSession() {
  clearInterval(timerInterval);

  timerRunning = false;

  if (timerMode === "focus") {
    state.sessions.push({
      id: uid("session"),
      date: todayISO(),
      minutes: state.settings.pomodoro,
      taskId: selectedFocusTask || null
    });

    if (selectedFocusTask) {
      const t = state.tasks.find(
        x => x.id === selectedFocusTask
      );

      if (t) {
        t.focusMinutes =
          (t.focusMinutes || 0) +
          state.settings.pomodoro;
      }
    }

    save();

    toast(
      "Focus session complete 🎉"
    );
  }

  timerSeconds = {
    focus: state.settings.pomodoro * 60,
    short: 300,
    long: 900
  }[timerMode];

  renderAll();
}


// ========================================
// PROFILE & PREFERENCES
// ========================================

function saveProfile() {
  state.profile.name =
    $("#profileName").value.trim() ||
    "Alex Johnson";

  state.profile.email =
    $("#profileEmail").value.trim();

  save();
  renderAll();

  toast("Profile saved");
}

function savePreferences() {
  state.settings.defaultPriority =
    $("#defaultPriority").value;

  state.settings.pomodoro =
    Number($("#pomodoroDuration").value);

  save();

  timerSeconds =
    state.settings.pomodoro * 60;

  renderAll();

  toast("Preferences saved");
}


// ========================================
// IMPORT / EXPORT
// ========================================

function exportData() {
  const blob = new Blob(
    [JSON.stringify(state, null, 2)],
    {
      type: "application/json"
    }
  );

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download =
    `taskflow-backup-${todayISO()}.json`;

  a.click();

  URL.revokeObjectURL(a.href);

  toast("Data exported");
}

function importData(e) {
  const file = e.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const incoming =
        JSON.parse(reader.result);

      if (
        !incoming.tasks ||
        !incoming.subjects ||
        !incoming.profile
      ) {
        throw Error();
      }

      state = {
        ...defaults(),
        ...incoming
      };

      save();
      renderAll();

      toast(
        "Data imported successfully"
      );
    } catch {
      toast(
        "Invalid TaskFlow backup file"
      );
    }

    e.target.value = "";
  };

  reader.readAsText(file);
}


// ========================================
// INITIALIZATION
// ========================================

bindEvents();
renderAll();