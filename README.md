# T-Tool

T-Tool is a desktop multitool for trucking users who need practical day-to-day tracking without assuming perfect organization habits.

This project started as KanFLOW, but it is now focused on trucking-oriented utility workflows (especially quick logging and simple record keeping).

## What T-Tool is for

- Help drivers log important info fast
- Keep key records in one local desktop app
- Reduce chaos for users who are busy, mobile, and not always organized
- Provide simple tools first, then grow into a broader trucking utility suite

## Current functionality

Based on the current codebase, T-Tool currently includes:

- **Account flow (local):** sign up and login backed by local SQLite
- **Mileage tool:**
  - Log starting and ending miles
  - Auto-calculate business miles
  - View mileage history
  - Delete individual logs or clear all logs
  - Basic guardrails (invalid numbers, decreasing mileage checks)
- **Data export:** export dashboard-style data to a JSON file
- **Local persistence:** SQLite databases created in the app user data directory

## Tech stack

- **Electron** + **React** + **TypeScript**
- **electron-vite** for development/build workflow
- **better-sqlite3** for local database storage

## Project structure (high level)

```text
src/
  main/        Electron main process, IPC handlers, SQLite repositories
  preload/     Secure bridge exposing Electron APIs to renderer
  renderer/    React UI and tool workflows
  shared/      Shared TypeScript types
```

## Getting started

```bash
npm install
npm run dev
```

## Useful scripts

```bash
npm run dev        # run app in development
npm run lint       # run eslint
npm run test       # run vitest
npm run build      # typecheck + production build
```

## Data storage notes

T-Tool currently uses local SQLite databases in the app's userData folder. See:

- `/home/runner/work/symmetrical-spork/symmetrical-spork/SETUP_SQLITE.md`

## Status

T-Tool is in active transition from a Kanban-first concept to a trucking-person multitool. You may still see legacy naming in parts of the code while the product direction is being aligned.
