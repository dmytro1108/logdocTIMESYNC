import { ipcMain, dialog, BrowserWindow} from 'electron';
import { BoardRepository } from './database/BoardRepo';
import { exportToJSON } from './database/Export';
import { Dashboard} from '../shared/types';
import { execFile } from 'child_process'
import fs from 'fs'
import { error } from 'console';


export function registerBoardHandlers() {
    ipcMain.handle('board:create', async(_event, board) => {
        const boardRepo = new BoardRepository()
        const createdAt = Date.now()

        const newBoard: Dashboard = {
            year: board.year,
            totalMiles: board.totalMiles,
            totalExpenses: board.totalExpenses,
            documentCount: board.documentCount,
            upcomingDeadlineCount: board.upcomingDeadlineCount,
            id: board.id
        }

        const result = boardRepo.save(newBoard)
        return { ...newBoard, id: result.lastInsertRowid }
    })

    ipcMain.handle('board:getByBoardID', async(_event, boardID) => {
        const boardRepo = new BoardRepository()
        return boardRepo.findByID(boardID)
    })

    ipcMain.handle('board:update', async(_event, board) => {
        const boardRepo = new BoardRepository()

        const updatedBoard: Dashboard = {
            year: board.year,
            totalMiles: board.totalMiles,
            totalExpenses: board.totalExpenses,
            documentCount: board.documentCount,
            upcomingDeadlineCount: board.upcomingDeadlineCount,
            id: board.id
        }
        return boardRepo.update(updatedBoard)
    })

    ipcMain.handle('board:delete', async(_event, boardID) => {
        const boardRepo = new BoardRepository()
        return boardRepo.delete(boardID)
    })

    ipcMain.handle('board:export', async(_event, boardID) => {
        return exportToJSON(boardID)
    })

    // Cheat for exporting board state from UI and not from database
    ipcMain.handle('board:exportJsonToFile', async(event, jsonString) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return { success: false, error: 'window not found' }
        try {
            const result = await dialog.showSaveDialog(win, {
                title: 'Export Board',
                defaultPath: 'boardExport.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]
            })
            if (result.canceled) return { success: false, canceled: true }
            fs.writeFileSync(result.filePath, jsonString)
            return { success: true }
        } catch (e) {
            return { success: false, error: e instanceof Error ? e.message : String(e) }
        }
    })

    // Export board from database to JSON
    ipcMain.handle('board:exportBoardToFile', async(event, boardID) => {
        const jsonString = exportToJSON(boardID)

        const win = BrowserWindow.fromWebContents(event.sender)                                                                                             
        if (!win) return { success: false, error: 'window not found' }
        
        try {
            const result = await dialog.showSaveDialog(win, {
                title: 'Export Board',                                                                                                                          
                defaultPath: 'boardExport.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]                                                                                               
            }) 
            if (result.canceled) {
                return { success: false, canceled: true }
            }
            fs.writeFileSync(result.filePath, jsonString)
        } catch (e) {
            if (e instanceof Error) {
                return { success: false, error: e.message }
            } 
        }
    })
}

import { AccountConnection } from './database/AccountConnection'

export function registerAccountHandlers() {
    ipcMain.handle('account:login', async(_event, username, password) => {
        const accountsDb = AccountConnection.getInstance('') // Instance should already exist from index.ts setup

        try {
            const user: any = accountsDb.query(
                `SELECT * FROM users WHERE username = ? AND password = ?`,
                [username, password]
            )

            if (user && user.length > 0) {
                return { response: 0, email: user[0].email }
            } else {
                const usernameExists: any = accountsDb.query(
                    `SELECT * FROM users WHERE username = ?`,
                    [username]
                )
                if (usernameExists && usernameExists.length > 0) {
                    return { response: 1 } // wrong password
                }
                return { response: 2 } // username does not exist
            }
        } catch (e) {
            console.error("Login Error: ", e)
            return { response: 10 }
        }
    })

    ipcMain.handle('account:signup', async(_event, username, email, password) => {
        const accountsDb = AccountConnection.getInstance('')
        const createdAt = Date.now()

        try {
            const existingUser: any = accountsDb.query(
                `SELECT * FROM users WHERE username = ?`,
                [username]
            )

            if (existingUser && existingUser.length > 0) {
                return { response: 1 } // username already taken
            }

            accountsDb.execute(
                `INSERT INTO users (createdAt, username, email, password) VALUES (?, ?, ?, ?)`,
                [createdAt, username, email, password]
            )
            return { response: 0 } // success
        } catch (e) {
             console.error("Signup Error: ", e)
             return { response: 10 }
        }
    })
}

// Handlers for mileage logging tool
import { MileageLogRepo } from './database/Tools'
import path from 'path';

export function registerMileageHandlers() {
    // save mileage log
    ipcMain.handle('mileage:log', async(_event, data) => {
        const mileageRepo = new MileageLogRepo()
      
        return mileageRepo.saveMiles(
          data.startMiles,
          data.endMiles,
          data.fromLocation,
          data.toLocation
        )
    })

    // get all mileage logs for display in UI
    ipcMain.handle('mileage:retrieveAll', async(_event) => {
        const mileageRepo = new MileageLogRepo()
        return mileageRepo.retrieveAllMiles()
    })

    // delete one record
    ipcMain.handle('mileage:deleteById', async (_event, id) => {
        const mileageRepo = new MileageLogRepo()
        return mileageRepo.deleteMilesById(Number(id))
    })
    
    // remove the entire log history
    ipcMain.handle('mileage:deleteAll', async () => {
        const mileageRepo = new MileageLogRepo()
        return mileageRepo.deleteAllMiles()
    })
}

// execute OCR command on file and return text
// provided a file path run tesseract <filpath> outputbase -l eng --psm 3
ipcMain.handle('document:OCR', async(_event, filePath: string) => {
    return new Promise<string>((resolve, reject) => {
        execFile('tesseract', [filePath, 'stdout', '-l', 'eng', '--psm', '3'], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message)
                return
            }

            resolve(stdout)
        })
    })
})

ipcMain.handle("document:receiptTool", async (_event, filePath: string) => {
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, "receiptTool", "receiptTool.py")
    const outDir = path.join(projectRoot, "receiptTool", "detections")
    const dumpDir = path.join(outDir, "llm_receipt_dump.txt")

    return new Promise<string>((resolve, reject) => {
        execFile("python3", [scriptPath, filePath, "--out", outDir, "--passes", "1,2,3"], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message)
                return
            }

            if (fs.existsSync(dumpDir)) {
                resolve(stdout)
                return
            }

            resolve(stdout)
        })
    })
})
