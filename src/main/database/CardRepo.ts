import { DatabaseConnection } from './DatabaseConnection';
import { Card } from '../../shared/types';

export class CardRepository {
    
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('kanflow.db')
    }

    public save(card: Card) {
        return this.db.execute(
            `INSERT INTO cards (title, description, createdAt, position, columnID) VALUES (?, ?, ?, ?, ?)`, 
            [   card.title, 
                card.description, 
                card.createdAt, 
                card.position,
                card.columnID
            ]
        )
    }

    public findByID(id: number) {
        return this.db.query(`SELECT * FROM cards WHERE id = ?`, [id])
    }

    public findByColumn(column_id: number): Card[] {
        return this.db.query(`SELECT * FROM cards WHERE columnID = ? ORDER BY position`, [column_id]) as Card[]
    }

    public update(card: Card) {
        return this.db.execute(
            `UPDATE cards set title = ?, description = ?, position = ?, columnID = ? WHERE id = ?`,
            [   card.title, 
                card.description,
                card.position,
                card.columnID,
                card.id
            ]
        )
    }

    public delete(id: number) {
        return this.db.execute(`DELETE FROM cards WHERE id = ?`, [id])
    }
}