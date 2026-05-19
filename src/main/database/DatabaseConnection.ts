import Database from 'better-sqlite3';

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

        /*
        Commented out to separate accounts DB
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            createdAt INTEGER,
            username TEXT,
            password TEXT
            )
        `).run()
        */

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY,
            createdAt INTEGER,
            title TEXT,
            description TEXT,
            userID INTEGER
            /* FOREIGN KEY (userID) REFERENCES users(id) */
            )
        `).run()

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS columns (
            id INTEGER PRIMARY KEY,
            createdAt INTEGER,
            title TEXT, 
            position INTEGER,
            boardID INTEGER,
            FOREIGN KEY (boardID) REFERENCES boards(id) ON DELETE CASCADE
            UNIQUE(boardID, position)
            )
        `).run()

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY,
            createdAt INTEGER,
            title TEXT, 
            description TEXT,
            position INTEGER,
            columnID INTEGER,
            FOREIGN KEY (columnID) REFERENCES columns(id) ON DELETE CASCADE
            )
        `).run()

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




