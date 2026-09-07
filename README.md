# TaskFlow

TaskFlow is a premium, browser-based student productivity dashboard for managing assignments, classes, deadlines, goals, focus sessions, and study analytics.

## Features

- Responsive SaaS-style dashboard with light and dark themes
- Persistent localStorage data model with realistic first-launch demo data
- Dashboard metrics calculated from actual tasks and focus sessions
- Full task management with search, filtering, sorting, list/grid views, priorities, and due dates
- Interactive monthly calendar with task badges and selected-date task detail
- Subject management with completion summaries
- Goal tracking with progress bars and deadlines
- Pomodoro focus mode with task selection, session recording, and configurable durations
- Analytics for weekly completion, subject productivity, study hours, streaks, and completion rates
- Dynamic notifications, reusable modals, toast feedback, profile settings
- JSON data export, validated import, and destructive reset confirmation
- Semantic controls, keyboard shortcuts, focus states, and mobile navigation

## Tech stack

TaskFlow uses only HTML, CSS, and vanilla JavaScript. It has no backend, build step, package manager, or frontend framework. Lucide icon font and Google Fonts are loaded through CDN links.

## Screenshots

Add screenshots of the dashboard, task manager, calendar, and focus mode here.

## How to run

Open `index.html` directly in a browser, or serve the folder with any static local server. No npm install or build process is required.

## Project structure

```text
taskflow/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Future improvements

- Optional cloud sync and authentication
- Drag-and-drop calendar scheduling
- More detailed time-series analytics
- Custom recurring tasks and reminders
- Collaborative study groups
