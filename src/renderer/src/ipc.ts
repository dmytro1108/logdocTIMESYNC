import { Dashboard} from '../../shared/types'

// IPC wrapper functions for database operations
// Use these instead of calling ipcRenderer.invoke...

// Boards
export async function createBoard(title: string, description: string, userID: number): Promise<Dashboard> {
  return window.electron.ipcRenderer.invoke('board:create', { title, description, userID })
}

export async function getBoardByID(boardID: number): Promise<Dashboard> {
  return window.electron.ipcRenderer.invoke('board:getByBoardID', boardID)
}

export async function getBoardsByUser(userID: number): Promise<Dashboard[]> {
  return window.electron.ipcRenderer.invoke('board:getByUser', userID)
}

export async function updateBoard(board: Dashboard): Promise<void> {
  return window.electron.ipcRenderer.invoke('board:update', board)
}

export async function deleteBoard(boardID: number): Promise<void> {
  return window.electron.ipcRenderer.invoke('board:delete', boardID)
}

export async function exportToFile(boardID: number): Promise<{ success: boolean, canceled?: boolean, error?: string }> {
  return window.electron.ipcRenderer.invoke('board:exportBoardToFile', boardID)
}

// milage log
export async function logMiles(startMiles: number, endMiles: number, fromLocation: '', toLocation: ''): Promise<void> {
  return window.electron.ipcRenderer.invoke('mileage:log', { startMiles, endMiles, fromLocation, toLocation })
}

export async function retrieveAllMiles(): Promise<any[]> {
  return window.electron.ipcRenderer.invoke('mileage:retrieveAll')
}

export async function deleteMilesById(id: number) {
  return window.electron.ipcRenderer.invoke('mileage:deleteById', id)
}

export async function deleteAllMiles() {
  return window.electron.ipcRenderer.invoke('mileage:deleteAll')
}

// theme
export async function addTheme(themeId: number, themeName: string, themeValue: string) {
  return window.electron.ipcRenderer.invoke('theme:add', themeId, themeName, themeValue)
}

export async function changeTheme(themeId: number, themeName: string, themeValue: string) {
  return window.electron.ipcRenderer.invoke('theme:change', themeId, themeName, themeValue)
}

// Accounts
export async function login(username: string, password: string): Promise<{ response: number, email?: string }> {
  return window.electron.ipcRenderer.invoke('account:login', username, password)
}

export async function signup(username: string, email: string, password: string): Promise<{ response: number }> {
  return window.electron.ipcRenderer.invoke('account:signup', username, email, password)
}

// path for file (for document drag and drop)
export async function getPathForFile(file: File): Promise<string> {
  return (window as any).getPathForFile(file)
}

//OCR
export async function performOCR(filePath: string): Promise<string> {
  return window.electron.ipcRenderer.invoke('document:OCR', filePath)
}

// Receipt tool
export async function runReceiptTool(filePath: string): Promise<string> {
  return window.electron.ipcRenderer.invoke('document:receiptTool', filePath)
}

// Compatible file
export async function compatibleFile(filePath: string): Promise<string> {
  return window.electron.ipcRenderer.invoke('document:compatibleFile', filePath)
}
