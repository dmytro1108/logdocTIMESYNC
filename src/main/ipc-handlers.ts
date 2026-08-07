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

import { TripLogging } from './database/Triptails'
export function registerTripHandlers() {
    const l = new TripLogging()

    ipcMain.handle('trip:enterDetails', async(_event, data) => {
        return l.enterDetails(
            data.sourceStreet,
            data.sourceCity,
            data.sourceState,
            data.sourceZip,
            data.destStreet,
            data.destCity,
            data.destState,
            data.destZip
        )
    })

    ipcMain.handle('trip:updateDetails', async(_event, data) => {
        return l.updateTripDetails(
            data.milageTotal,
            data.tripFromDate,
            data.tripToDate,
            data.logDate
        )
    })

    ipcMain.handle('trip:retrieveTotalLogs', async(_event) => {
        return l.retrieveTotalLogs()
    })

    ipcMain.handle('trip:clearTripDetails', async(_event) => {
        return l.clearTripDetails()
    })

    // log history handlers
    ipcMain.handle('trip:updateLogHistory', async(_event, d, t) => {
        return l.updateLogHistory(d, t)
    })
    
    ipcMain.handle('trip:retrieveLogHistory', async(_event) => {
        return l.retrieveLogHistory()
    }) 

    ipcMain.handle('trip:deleteLogHistory', async(_event, id) => {
        return l.deleteLogHistory(id)
    })

    ipcMain.handle('trip:clearLogHistory', async(_event) => {
        return l.clearLogHistory()
    })
}

ipcMain.handle("document:distanceTool", async (_event, loc1, loc2) => {    
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, "distanceTool", "distanceProcessing.py")
    
    const pythonPath = "your python executable" // replace with the actual path to your Python executable
    
    return new Promise<number>((resolve, reject) => {
        execFile(pythonPath, [scriptPath, loc1, loc2], (error, stdout, stderr) => {

            if (0) console.log("this is the stdout: "+ stdout)

            // log the details
            const l = new TripLogging()
            const now = new Date().toLocaleString()

            l.updateTripDetails(
                parseFloat(stdout),
                "",
                "",
                now
            )

            resolve(parseFloat(stdout))
        })
    }) 
})

import { ChangeTheme } from './database/Theme'
export function registerThemeHandlers() {
    const theme = new ChangeTheme()

    ipcMain.handle('theme:change', async(_event, themeId, themeName, themeValue, themeStatus) => {
        theme.changeTheme(themeId, themeName, themeValue, themeStatus)
    })

    ipcMain.handle('theme:current', async(_event) => {
        return await theme.currTheme()
    })
}

// execute OCR command on file and return text
// provided a file path run tesseract <filpath> outputbase -l eng --psm 3
ipcMain.handle('document:OCR', async(_event, filePath: string) => {
    const projectRoot = process.cwd()
    const outDir = path.join(projectRoot, "receiptTool", "detections")
    const scriptPath = path.join(projectRoot, "receiptTool", "deterministicProcessing.py")
    const dumpDir = path.join(outDir, "llm_receipt_dump.txt")

    return new Promise<string>((resolve, reject) => {
        const pythonPath = "your python executable" // replace with the actual path to your Python executable

        execFile(pythonPath, [scriptPath, filePath, '--out', outDir], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message)
                return
            }
            if (fs.existsSync(dumpDir)) {
                resolve(fs.readFileSync(dumpDir, "utf8"))
                return
            }

            resolve("")
        })
    })
})

ipcMain.handle("document:receiptTool", async (_event, filePath: string) => {
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, "receiptTool", "steadyProcessing.py")
    const outDir = path.join(projectRoot, "receiptTool", "detections")
    const dumpDir = path.join(outDir, "llm_receipt_dump.txt")

    return new Promise<string>((resolve, reject) => {

        const pythonPath = "your python executable" // replace with the actual path to your Python executable

        execFile(pythonPath, [scriptPath, filePath, "--out", outDir, "--ai", "true"], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message)
                return
            }

            if (fs.existsSync(dumpDir)) {
                resolve(fs.readFileSync(dumpDir, "utf8")) // resolve(stdout) if you want the raw output from the script instead of the contents of the dump file
                return
            }

            resolve("")
        })
    })
})

ipcMain.handle("document:compatibleFile", async (_event, filePath: string) => {
    return new Promise<string>((resolve, reject) => {
        const parsedPath = path.parse(filePath) // build a path as the output
        const outputPath = path.join(parsedPath.dir, parsedPath.name + "_converted.jpg")

        execFile("ffmpeg", ["-y", "-i", filePath, outputPath], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message)
                return
            }

            resolve(outputPath)
        })
    })
})