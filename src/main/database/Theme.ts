import { BoardRepository } from './BoardRepo'
import { Dashboard, DashboardExport } from '../../shared/types'
import { DatabaseConnection } from './DatabaseConnection'

export class ChangeTheme {
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('theme.db')
    }

    public addTheme(themeId: number, themeName: string, themeValue: string) {
        this.db.execute(
            `insert into theme 
            (id, name, value)
            values (?, ?, ?)
            `,
            [themeId, themeName, themeValue]
        )
    }

    public changeTheme(themeId: number, themeName: string, themeValue: string) {
        this.db.execute(
            `select * from theme where id = ?`,
            [themeId]
        )
    }
}