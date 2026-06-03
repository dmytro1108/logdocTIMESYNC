# ToolFlow (legacy name: Kanflow)

ToolFlow is an Electron desktop prototype for **local driver workflow utilities**, not a full Kanban product.

Today, the app is centered on:
- local account sign-up/login
- mileage logging and history
- receipt/image OCR workflows
- simple JSON export from the dashboard view

You will still see older Kanban-oriented naming in parts of the codebase (`kanflow-temp`, `Kan-App Workspace`, old docs/classes), but the current user-facing direction is utility tools.

## What the app currently does

### 1) Local account flow
- Sign up and log in through IPC handlers in the Electron main process
- User records stored in local SQLite (`accounts.db`)
- Demo account seeded on startup (`demo` / `demo`)

### 2) Mileage tracker
- Log start and end odometer values
- Auto-calculate total miles
- Enforce basic validation:
  - numbers must be valid
  - end miles cannot be less than start miles
  - new start miles cannot be less than last logged end miles
- View mileage history
- Delete one log or clear all logs

### 3) Document OCR tool
- Drag-and-drop receipt/image files (`.png`, `.jpg`, `.jpeg`)
- Runs two OCR paths:
  - Tesseract CLI (`document:OCR`)
  - Python receipt pipeline (`document:receiptTool`) under `receiptTool/`
- Displays OCR output in-app

### 4) Export
- Exports dashboard-style JSON via save dialog (`board:exportJsonToFile`)

## Architecture

```text
src/
  main/
    index.ts                 Electron app lifecycle + DB initialization
    ipc-handlers.ts          IPC routes for accounts, mileage, OCR, export
    database/                SQLite connection + repositories
  preload/
    index.ts                 Safe API bridge to renderer
  renderer/src/
    main.tsx                 Main React UI and tool shell
    ipc.ts                   Renderer IPC wrappers
    components/              Accounts, Mileage, Document, etc.
  shared/
    types.ts                 Shared TypeScript interfaces
```

## Local data and files

- `toolflow.db`: mileage logs and board-related tables
- `accounts.db`: local user records
- Both are created in Electron `userData`
- Receipt tool artifacts are written under `receiptTool/detections/`

See: `SETUP_SQLITE.md`

## Requirements

Base app:
- Node.js + npm

For OCR features:
- `tesseract` available on system PATH
- Python 3 environment with the receipt tool dependencies (`cv2`, `numpy`, `Pillow`, `transformers`, `torch`, `tqdm`)

If OCR dependencies are missing, account and mileage features can still run.

## Development

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Current state (important)

This repository is a **work-in-progress hybrid**:
- the shipped UI is tool-centric (accounts + mileage + OCR)
- legacy Kanban naming and partially migrated modules are still present
- some board/database paths are not fully aligned yet

Use this repo as a local desktop prototype focused on utility workflows, with ongoing cleanup of legacy structure.
