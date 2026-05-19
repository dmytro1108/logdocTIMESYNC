import { ipcMain, dialog, BrowserWindow} from 'electron';
import { BoardRepository } from './database/BoardRepo';
import { ColumnRepository } from './database/ColumnRepo';
import { CardRepository } from './database/CardRepo';
import { exportToJSON } from './database/Export';
import { Board, Column, Card } from '../shared/types';
import fs from 'fs'
import { error } from 'console';


export function registerBoardHandlers() {
    ipcMain.handle('board:create', async(_event, board) => {
        const boardRepo = new BoardRepository()
        const createdAt = Date.now()

        const newBoard: Board = {
            id: 0,
            title: board.title,
            description: board.description,
            createdAt: createdAt,
            userID: board.userID
        }

        const result = boardRepo.save(newBoard)
        return { ...newBoard, id: result.lastInsertRowid }
    })

    ipcMain.handle('board:getByUser', async(_event, userID) => {
        const boardRepo = new BoardRepository()
        return boardRepo.findByUser(userID)
    })

    ipcMain.handle('board:getByBoardID', async(_event, boardID) => {
        const boardRepo = new BoardRepository()
        return boardRepo.findByID(boardID)
    })

    ipcMain.handle('board:update', async(_event, board) => {
        const boardRepo = new BoardRepository()

        const updatedBoard: Board = {
            id: board.id,
            title: board.title,
            description: board.description,
            createdAt: board.createdAt,
            userID: board.userID
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

export function registerColumnHandlers() {
    ipcMain.handle('column:create', async(_event, column) => {
        const columnRepo = new ColumnRepository()
        const createdAt = Date.now()

        const newColumn = {
            id: 0,
            title: column.title,
            createdAt: createdAt,
            position: column.position,
            boardID: column.boardID
        }

        const result = columnRepo.save(newColumn)                                                                             
        return { ...newColumn, id: result.lastInsertRowid }
    })

    ipcMain.handle('column:getByBoard', async(_event, boardID) => {
        const columnRepo = new ColumnRepository()
        return columnRepo.findByBoard(boardID)
    })

    ipcMain.handle('column:update', async(_event, column) => {
        const columnRepo = new ColumnRepository()

        const updatedColumn = {
            id: column.id,
            title: column.title,
            createdAt: column.createdAt,
            position: column.position,
            boardID: column.boardID
        }

        return columnRepo.update(updatedColumn)
    })

    ipcMain.handle('column:delete', async(_event, columnID) => {
        const columnRepo = new ColumnRepository()
        return columnRepo.delete(columnID)
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

export function registerCardHandlers() {
    ipcMain.handle('card:create', async(_event, card) => {
        const cardRepo = new CardRepository()
        const createdAt = Date.now()

        const newCard = {
            id: 0,
            title: card.title,
            description: card.description,
            createdAt: createdAt,
            position: card.position,
            columnID: card.columnID
        }

        const result = cardRepo.save(newCard)                                                                                 
        return { ...newCard, id: result.lastInsertRowid }
    })

    ipcMain.handle('card:getByColumn', async(_event, columnID) => {
        const cardRepo = new CardRepository()
        return cardRepo.findByColumn(columnID)
    })

    ipcMain.handle('card:update', async(_event, card) => {
        const cardRepo = new CardRepository()

        const updatedCard = {
            id: card.id,
            title: card.title,
            description: card.description,
            createdAt: card.createdAt,
            position: card.position,
            columnID: card.columnID
        }

        return cardRepo.update(updatedCard)
    })

    ipcMain.handle('card:delete', async(_event, cardID) => {
        const cardRepo = new CardRepository()
        return cardRepo.delete(cardID)
    })
}