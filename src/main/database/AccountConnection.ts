import Database from 'better-sqlite3';

class AccountConnection {
    private static instance: AccountConnection;
    private db: Database.Database
    private dbPath: string;

    private constructor(dbPath: string) {
        this.dbPath = dbPath
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initializeSchema()
    }

    private initializeSchema() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            createdAt INTEGER,
            username TEXT UNIQUE,
            password TEXT,
            email TEXT
            )
        `).run()
    }

    // for testing only .. for use with temp databases
    public static resetInstance(): void {
        if (AccountConnection.instance) {
            AccountConnection.instance.db.close()
        }
        AccountConnection.instance = null as any
    }

    public static getInstance(dbPath: string) {
        if ( AccountConnection.instance == null ) {
            AccountConnection.instance = new AccountConnection(dbPath)
        }
        return AccountConnection.instance
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
}

export { AccountConnection };
