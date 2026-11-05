# Daylight

A responsive, local-first todo prototype built with Next.js, React, TypeScript, and CSS. No external service, account, API key, or database is required.

## Run locally

```sh
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open `http://localhost:3000`.

## Features

- Add and edit tasks with optional due dates, category, and importance.
- Complete or reopen tasks, delete with undo, and clear completed tasks.
- Filter by all tasks, today, important, completed, or category.
- Search titles and sort by creation, due date, or alphabetical order.
- Progress summary, friendly empty states, keyboard-accessible native dialogs, and phone layout.
- Browser localStorage persistence with schema validation and a visible warning when storage fails.

## Checks

With the dev server running:

```sh
npm run lint
npx tsc --noEmit
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

Set `BASE_URL` to test another running app URL. Playwright covers the complete task lifecycle, persistence, filters, search, sorting, form validation, empty-state persistence, and mobile creation/overflow checks. Tests start with fresh browser contexts.

## Prototype choices

- Single-user app without login or cloud sync; tasks are specific to the current browser and origin. Clearing site storage removes them.
- The first visit includes five editable sample tasks to demonstrate the app. An intentionally empty saved workspace stays empty after reload.
- Fixed Personal, Work, and Learning categories; dates follow the user's local time zone. Today means tasks due today.
- Deletion offers one-level undo; bulk clearing completed tasks is permanent.
- No reminders, backend, analytics, or external font/image dependencies. Multi-device persistence would require a backend/database and a user identity or shared workspace mechanism.
- Dependency patches were applied to the starter. The production dependency audit is clean; the full audit still reports eight moderate findings in development-only lint tooling. No forced major lint-tool dependency overrides were applied.
