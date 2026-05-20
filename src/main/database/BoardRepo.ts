import { DatabaseConnection } from './DatabaseConnection';
import { Dashboard } from '../../shared/types';

export class BoardRepository {
    
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('toolflow.db')
    }

    public save(dashboard: Dashboard) {
        return this.db.execute(
            `INSERT INTO dashboards (year, totalMiles, totalExpenses, documentCount, upcomingDeadlineCount) VALUES (?, ?, ?, ?, ?)`,
            [   dashboard.year,
                dashboard.totalMiles,
                dashboard.totalExpenses,
                dashboard.documentCount,
                dashboard.upcomingDeadlineCount,
                dashboard.id
            ]
        )
    }

    public update(dashboard: Dashboard) {
        return this.db.execute(
            `UPDATE dashboards set year = ?, totalMiles = ?, totalExpenses = ?, documentCount = ?, upcomingDeadlineCount = ? WHERE id = ?`,
            [   dashboard.year,
                dashboard.totalMiles,
                dashboard.totalExpenses,
                dashboard.documentCount,
                dashboard.upcomingDeadlineCount,
                dashboard.id
                
            ]
        )
    }

    public findByID(dashboard_id: number): Dashboard[] {
        return this.db.query(`SELECT * FROM dashboards WHERE id = ?`, [dashboard_id]) as Dashboard[]
    }

    public delete(dashboard_id: number) {
        return this.db.execute(`DELETE FROM dashboards WHERE id = ?`, [dashboard_id])
    }
}

