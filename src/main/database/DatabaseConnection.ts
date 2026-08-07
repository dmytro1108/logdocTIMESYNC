import Database from 'better-sqlite3';
import { create } from 'domain';

class DatabaseConnection {

    private static instance: DatabaseConnection;
    private db: Database.Database
    private dbPath: string;

    private constructor(dbPath: string) {
        this.dbPath = dbPath
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON') 
        this.initializeSchema()
    }

    private initializeSchema() {

        // for renderer
        this.db.prepare(`
            create table if not exists theme (
            id integer primary key,
            name varchar(255),
            value varchar(255),
            status integer
            )`).run()

        // dashboard and trip log
        this.db.prepare(`
            create table if not exists tripLocation (
            trip_id integer primary key,
            sourceStreet varchar(255),
            sourceCity varchar(255),
            sourceState varchar(255),
            sourceZip integer,
            destStreet varchar(255),
            destCity varchar(255),
            destState varchar(255),
            destZip integer
            )`).run()

        this.db.prepare(`
            create table if not exists tripDetails (
            details_id integer primary key,
            milageTotal integer,
            tripFromDate varchar(255),
            tripToDate varchar(255),
            logDate varchar(255)
            )`).run()

        this.db.prepare(`
            
            create table if not exists mileage_log (
            id integer primary key,
            dateCreated integer,
            startMiles integer,
            endMiles integer,
            totalMiles integer,
            fromLocation varchar(255),
            toLocation varchar(255)
            )`).run()

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY,
            dateCreated INTEGER,
            title TEXT,
            description TEXT,
            userID INTEGER
            /* FOREIGN KEY (userID) REFERENCES users(id) */
            )`).run()

        this.db.prepare(`
            create table if not exists documentHistory (
                id integer primary key,
                logDate varchar(255),
                myTrip varchar(255)
            )`).run()

    }

    // for testing only .. for use with temp databases
    public static resetInstance(): void {
        if (DatabaseConnection.instance) {
            DatabaseConnection.instance.db.close()
        }
        DatabaseConnection.instance = null as any
    }
    
    public static getInstance(dbPath: string) {
        if ( DatabaseConnection.instance == null ) {
            DatabaseConnection.instance = new DatabaseConnection(dbPath)
        }
        return DatabaseConnection.instance
    }

    public query(SQL: string, params:Array<any> = []) {
        return this.db.prepare(SQL).all(...params)
    }

    public execute(SQL: string, params: Array<any> = []) {
        return this.db.prepare(SQL).run(...params)
    }

    public transaction<T>(fn: () => T): T {
        const wrapped = this.db.transaction(fn);
        return wrapped();
    }   

    public close() {
        this.db.close()
    }

} export { DatabaseConnection };




