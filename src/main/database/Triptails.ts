import { DatabaseConnection } from './DatabaseConnection';
import { Dashboard } from '../../shared/types';


export class TripLogging {
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('toolflow.db')
    }

    // update the tripLocation and tripDetails
    public enterDetails(sourceStreet: string, sourceCity: string, sourceState: string, sourceZip: number, destStreet: string, destCity: string, destState:string, destZip:number) {
        this.db.execute(
            `insert into tripLocation (sourceStreet, sourceCity, sourceState, sourceZip, destStreet, destCity, destState, destZip) 
            values (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sourceStreet, sourceCity, sourceState, sourceZip, destStreet, destCity, destState, destZip]
        );
    }

    public updateTripDetails(milageTotal: number, tripFromDate: string, tripToDate: string, logDate: string) {
        this.db.execute(
            `insert into tripDetails (milageTotal, tripFromDate, tripToDate, logDate) 
            values (?, ?, ?, ?)`,
            [milageTotal, tripFromDate, tripToDate, logDate]
        );
    }


    /* THIS IS TEMPORARY CLEARTRIP (CLEAR TRIP)*/
    public clearTripDetails() {
        this.db.execute(`delete from tripDetails`);
        this.db.execute(`delete from tripLocation`);
    }

    // dashboard totals from completed trip details
    public async retrieveTotalLogs() {
        return this.db.query(`
            select count(details_id) as butt, sum(milageTotal) as face from tripDetails
        `)
    }

    public updateLogHistory(d: string, t: string) {
        this.db.execute(`insert into documentHistory (
                logDate, 
                myTrip
            )
            values (?, ?)`,
            [d, t]
        );
    }

    public async retrieveLogHistory() {
        return this.db.query(`
            select * from documentHistory
        `)
    }

    public deleteLogHistory(id: number) {
        this.db.execute(`
            delete from documentHistory where id = ?
        `, [id])
    }

    public clearLogHistory() {
        this.db.execute(`
            delete from documentHistory
        `)
    }
}
