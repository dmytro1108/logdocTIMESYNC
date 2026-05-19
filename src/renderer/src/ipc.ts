import { Board, Column, Card } from '../../shared/types' 

// IPC wrapper functions for database operations
// Use these instead of calling ipcRenderer.invoke...

// Boards
export async function createBoard(title: string, description: string, userID: number): Promise<Board> {
  return window.electron.ipcRenderer.invoke('board:create', { title, description, userID })
}

export async function getBoardByID(boardID: number): Promise<Board> {
  return window.electron.ipcRenderer.invoke('board:getByBoardID', boardID)
}

export async function getBoardsByUser(userID: number): Promise<Board[]> {
  return window.electron.ipcRenderer.invoke('board:getByUser', userID)
}

export async function updateBoard(board: Board): Promise<void> {
  return window.electron.ipcRenderer.invoke('board:update', board)
}

export async function deleteBoard(boardID: number): Promise<void> {
  return window.electron.ipcRenderer.invoke('board:delete', boardID)
}

export async function exportToFile(boardID: number): Promise<{ success: boolean, canceled?: boolean, error?: string }> {
  return window.electron.ipcRenderer.invoke('board:exportBoardToFile', boardID)
}

// Columns 
export async function createColumn(title: string, position: number, boardID: number): Promise<Column> {
  return window.electron.ipcRenderer.invoke('column:create', { title, position, boardID })
}

export async function getColumnsByBoard(boardID: number): Promise<Column[]> {
  return window.electron.ipcRenderer.invoke('column:getByBoard', boardID)
}

export async function updateColumn(column: Column): Promise<void> {
  return window.electron.ipcRenderer.invoke('column:update', column)
}

export async function deleteColumn(columnID: number): Promise<void> {
  return window.electron.ipcRenderer.invoke('column:delete', columnID)
}


// Cards 
export async function createCard(title: string, description: string, position: number, columnID: number): Promise<Card> {
  return window.electron.ipcRenderer.invoke('card:create', { title, description, position, columnID })
}

export async function getCardsByColumn(columnID: number): Promise<Card[]> {
  return window.electron.ipcRenderer.invoke('card:getByColumn', columnID)
}

export async function updateCard(card: Card): Promise<void> {
  return window.electron.ipcRenderer.invoke('card:update', card)
}

export async function deleteCard(cardID: number): Promise<void> {
  return window.electron.ipcRenderer.invoke('card:delete', cardID)
}

// Accounts
export async function login(username: string, password: string): Promise<{ response: number, email?: string }> {
  return window.electron.ipcRenderer.invoke('account:login', username, password)
}

export async function signup(username: string, email: string, password: string): Promise<{ response: number }> {
  return window.electron.ipcRenderer.invoke('account:signup', username, email, password)
}
