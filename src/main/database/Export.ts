import { BoardRepository } from './BoardRepo'
import { ColumnRepository } from './ColumnRepo'
import { CardRepository } from './CardRepo'
import { BoardExport, ColumnExport } from '../../shared/types'

export function exportToJSON(board_id: number) {

    const boardRepo = new BoardRepository()
    const columnRepo = new ColumnRepository()
    const cardRepo = new CardRepository()

    let boardExp: BoardExport
    let columnExp: ColumnExport [] = []

    const columns = columnRepo.findByBoard(board_id)

    for (const c of columns) {
        const cards = cardRepo.findByColumn(c.id)
        columnExp.push({column: c, cards: cards})
    }

    boardExp = {
        board: boardRepo.findByID(board_id),
        columns: columnExp
    }

    return JSON.stringify(boardExp, null, 2)

}