# Kanban App Build Plan

## Architecture Overview

**Renderer (React UI)**  
- Displays the board, columns, and cards.  
- No direct access to the database or Node APIs.

**Preload (Security Bridge)**  
- Exposes a safe, limited API to the renderer.

**Main Process (Electron backend)**  
- Handles IPC calls and database logic.

**SQLite Database**  
- Stores boards, columns, and cards locally.

---

### Backend (Main Process)

**1. `src/main/database.ts`**
- Initialize SQLite connection.
- Create tables:
  - boards
  - columns
  - cards
- Implement CRUD functions for these tables.

**2. `src/main/ipc-handlers.ts`**
- Register IPC handlers.
- Each handler calls functions from `database.ts`.
- Keep logic thin and focused on routing requests.

---

### Frontend (Renderer)

**3. `src/renderer/src/ipc.ts`**
- Wrapper functions for `window.api` calls.
- Keeps React components clean and decoupled from IPC.

**4. `src/renderer/src/components/Board.tsx`**
- Top-level Kanban board component.
- Renders all columns.

**5. `src/renderer/src/components/Column.tsx`**
- Renders a single column.
- Displays its list of cards.
- Handles adding new cards.

**6. `src/renderer/src/components/Card.tsx`**
- Renders a single card.
- Handles card-level actions (edit/delete if needed).

---

## Files to Edit

### Backend

**`src/main/index.ts`**
- Initialize the database on app startup.
- Import and register IPC handlers.
- Do not place SQL or UI logic directly here.

---

### Security Bridge

**`src/preload/index.ts`**
- Replace the empty API object.
- Expose safe functions such as:
  - `getBoard()`
  - `createColumn()`
  - `createCard()`
  - `moveCard()`
  - `deleteCard()`
- Each function uses `ipcRenderer.invoke()`.

---

### Frontend

**`src/renderer/src/App.tsx`**
- Remove demo UI.
- Render the Kanban board (e.g., `<Board />`).
- Load initial data through `ipc.ts`.

---

## Files to Delete

**`src/renderer/src/components/Versions.tsx`**
- Demo-only component.
- Remove it and any references in `App.tsx`.

---

## Files to Leave Alone

### Configuration files
- `package.json`
- `tsconfig*.json`
- `electron.vite.config.ts`
- `eslint.config.mjs`

### Build/output directories
- `build/`
- `out/`
- `node_modules/`

### Assets
- `src/renderer/src/assets/`
- Only modify if adding custom icons or styles.

---

## Dependencies to Install

Run:

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
