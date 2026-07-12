import { BoardRepository } from './BoardRepo'
import { Dashboard, DashboardExport } from '../../shared/types'
import { DatabaseConnection } from './DatabaseConnection'

export class ChangeTheme {
    private db: DatabaseConnection

    constructor() {
        this.db = DatabaseConnection.getInstance('toolflow.db')
    }
    
    
    public changeTheme(themeId: number, themeName: string, themeValue: number, themeStatus: number) {
        this.db.execute(
            `update theme
            set status = ?
            where id = ?`,
            [themeStatus, themeId]
        )
        console.log("THEME DB INSTANCE:", this.db)

        // reset other theme status
        let otherThemeID = 1

        if (themeId == 1) {
            otherThemeID = 0
        } else {
            otherThemeID = 1
        }

        this.db.execute(
            `update theme
            set status = 0
            where id = ?`,
            [otherThemeID]
        )
    }

    public async currTheme() {
        // parse the theme table, if the table status is 1, return the theme
        return this.db.query( // query - not execute
            `select * from theme where status = 1 limit 1`
        )
    }
}