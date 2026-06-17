import { DatabaseConnection } from './DatabaseConnection';
import { Dashboard } from '../../shared/types';

// mileage tool will be able to insert logged miles into the database
// and get them back out for display in the UI. This class will be used by the mileage tool to interact with the database
export class MileageLogRepo {
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('toolflow.db')
    }
    /*
        id integer primary key,
        dateCreated integer,
        startMiles integer,
        endMiles integer,
        totalMiles integer,
        fromLocation varchar(255),
        toLocation varchar(255)
    */
    // from and to are optional
    public saveMiles(startMiles: number, endMiles: number, fromLocation: '', toLocation: '') {
        const totalMiles = endMiles - startMiles
        const dateCreated = Date.now()
        return this.db.execute(
            `
            INSERT INTO mileage_log 
            (dateCreated, startMiles, endMiles, totalMiles, fromLocation, toLocation)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [dateCreated, startMiles, endMiles, totalMiles, fromLocation, toLocation]
          )
    }

    public retrieveAllMiles() {
        return this.db.query(
            `
            SELECT * FROM mileage_log
            ORDER BY dateCreated DESC
          `
        )
    }
    public deleteMilesById(id: number) {
        return this.db.execute(`
          DELETE FROM mileage_log
          WHERE id = ?
        `, [id])
      }
      
      public deleteAllMiles() {
        return this.db.execute(`
          DELETE FROM mileage_log
        `, [])
      }
}