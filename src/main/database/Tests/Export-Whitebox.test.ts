// White Box Unit Test - Statement Coverage:
// -    most of the code I have written is wrappers around SQLite database functions
//      so I will be testing the exportToJSON() function again for my white box. 
//     
// -    every statement in exportToJson is expected to be executed when a board has
//      at least one column and one card. The loop inside of this function is dependent 
//      on the number of columns returned by columnRepo.findByBoard(board_id). In order
//      to ensure full coverage, a test board is inserted with one column and card.
//
// -    the last control path to test is when a board is inserted with no columns or cards.
//      
//
//   function tested ( 8 assertions ):
//  
//   export function exportToJSON(board_id: number) {
//   
//       const boardRepo = new BoardRepository()
//       const columnRepo = new ColumnRepository()
//       const cardRepo = new CardRepository()
//   
//       let boardExp: BoardExport
//       let columnExp: ColumnExport [] = []
//   
//       const columns = columnRepo.findByBoard(board_id)
//   
//       for (const c of columns) {
//           const cards = cardRepo.findByColumn(c.id)
//           columnExp.push({column: c, cards: cards})
//       }
//   
//       boardExp = {
//           board: boardRepo.findByID(board_id),
//           columns: columnExp
//       }
//   
//       return JSON.stringify(boardExp, null, 2)
//   
//   }

import { setupTestDB } from './TestSetupDB'
import { exportToJSON } from '../Export'
import { BoardRepository } from '../BoardRepo'
import { Board } from '../../../shared/types';

beforeEach(() => {
    setupTestDB()
})

test("ensure each statement in exportToJSON is ran when a board, column, and card are present", () => {
    const json = exportToJSON(1)
    const parse = JSON.parse(json)

    // ASSERTIONS
    expect(parse).toHaveProperty('board')       // ensure that the JSON has the "board" key 
    expect(parse).toHaveProperty('columns')     // ensure that the JSON has the "column" key 
    expect(parse.columns[0]).toHaveProperty('cards')            // ensure that the first column array has the "cards" key 
    expect(parse.columns[0].cards.length).toBeGreaterThan(0)    // ensure that the cards array has over one entry inside it

})


test("test the export function when no columns or cards are present", () => {
    const boardRepo = new BoardRepository()

    boardRepo.save( {title: "board2", description: "some test board2", createdAt: Date.now(), userID: 1} as Board )

    const json = exportToJSON(2)
    const parse = JSON.parse(json)

    expect(parse).toHaveProperty('board')       // ensure that the JSON has the "board" key 
    expect(parse.board.title).toBe("board2")    // ensure that the JSON has the correct board title 
    expect(parse.board.description).toBe("some test board2")    // ensure that the JSON has the correct board description 
    expect(parse.columns.length).toBe(0)                        // ensure that no columns are present in the JSON

})