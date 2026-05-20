import { BoardRepository } from './BoardRepo'
import { Dashboard, DashboardExport } from '../../shared/types'

export function exportToJSON(id: number) {

    const boardRepo = new BoardRepository()

    let boardExp: DashboardExport

    boardExp = {
        year: boardRepo.findByID(id).year,
        totalMiles: boardRepo.findByID(id).totalMiles,
        totalExpenses: boardRepo.findByID(id).totalExpenses,
        documentCount: boardRepo.findByID(id).documentCount,
        upcomingDeadlineCount: boardRepo.findByID(id).upcomingDeadlineCount,
        id: boardRepo.findByID(id).id
    }

    return JSON.stringify(boardExp, null, 2)

}