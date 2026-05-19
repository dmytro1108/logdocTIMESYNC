# Local SQLite Setup

## Overview
Kanflow uses two separate SQLite databases to manage persistent data locally, located in the application's userData folder.

1. **`kanflow.db`**: Stores application state, such as Kanban boards, columns, and cards.
2. **`accounts.db`**: Stores user authentication data, specifically the `users` table.

The separation of databases is designed to support the eventual migration of the `accounts.db` to a MariaDB cloud service while maintaining `kanflow.db` locally.

## Location
The databases are created automatically on application startup. You can find them in the system's `userData` directory for your platform:

* **Windows**: `%APPDATA%\kanflow-temp\`
* **macOS**: `~/Library/Application Support/kanflow-temp/`
* **Linux**: `~/.config/kanflow-temp/`

Both files `kanflow.db` and `accounts.db` will be located inside this directory.

## Interacting with the Databases
For debugging or querying the databases directly, you can use any standard SQLite client.

### Using the SQLite CLI:
To inspect `accounts.db`:
```bash
sqlite3 "path/to/userData/accounts.db"
```
Check the tables:
```sql
sqlite> .tables
```
Query the users:
```sql
sqlite> SELECT * FROM users;
```

Similarly, for `kanflow.db`:
```bash
sqlite3 "path/to/userData/kanflow.db"
```

## Running the Application Locally
When you run the development server via `npm run dev`, both databases will automatically be created and seeded with demo data if they do not exist.

**Seeded Data:**
* A demo user will be created in `accounts.db` (`username: 'demo'`, `password: 'demo'`).
