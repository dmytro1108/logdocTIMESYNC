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
            (id, name, value, status)
            values (?, ?, ?, ?)
            `,
            [themeId, themeName, themeValue, 0]
        )
    }

    public changeTheme(themeId: number, themeName: string, themeValue: string) {
        this.db.execute(
            `select * from theme where id = ?`,
            [themeId]
        )
    }

    public async currTheme() {
        // parse the theme table, if the table status is 1, return the theme
        return await this.db.execute(
            `select * from theme where status = 1`
        )
    }
}