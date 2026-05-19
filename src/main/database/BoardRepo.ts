import { DatabaseConnection } from './DatabaseConnection';
import { Board } from '../../shared/types';

export class BoardRepository {
    
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('kanflow.db')
    }

    public save(board: Board) {
        return this.db.execute(
            `INSERT INTO boards (title, description, createdAt, userID) VALUES (?, ?, ?, ?)`, 
            [   board.title, 
                board.description, 
                board.createdAt, 
                board.userID
            ]
        )
    }

    public findByID(board_id: number): Board{
        return this.db.query(`SELECT * FROM boards WHERE id = ?`, [board_id])[0] as Board
    }

    public update(board: Board) {
        return this.db.execute(
            `UPDATE boards set title = ?, description = ? WHERE id = ?`,
            [   board.title, 
                board.description, 
                board.id
            ]
        )
    }

    public findByUser(userID: number): Board[] {
        return this.db.query(`SELECT * FROM boards WHERE userID = ?`, [userID]) as Board[]
    }

    public delete(board_id: number) {
        return this.db.execute(`DELETE FROM boards WHERE id = ?`, [board_id])
    }





}

