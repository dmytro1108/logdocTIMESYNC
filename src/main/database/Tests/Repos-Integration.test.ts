// Integration Unit Test:
// -    testing the functionality of the Board and Column classes and how they interact
//      during their creation ( 4 assertions )

import { DatabaseConnection } from '../DatabaseConnection'
import { BoardRepository } from '../BoardRepo'
import { ColumnRepository } from '../ColumnRepo'
import { Board, Column } from '../../../shared/types';

// insert default user for testing
beforeEach(() => {
    DatabaseConnection.resetInstance()
    const db = DatabaseConnection.getInstance(':memory:')
    /* db.execute(`INSERT INTO users (createdAt, username, password) VALUES (?, ?, ?)`, [Date.now(), 'testuser', 'password']) */
})


// insert a new board and column, reference the board when inserting the column, check if the column can be found with the boardID
test('ensure that columns add to provided board', () => {
    const boardRepo = new BoardRepository()
    const columnRepo = new ColumnRepository()

    boardRepo.save( {title: "board1", description: "some test board1", createdAt: Date.now(), userID: 1} as Board )
    columnRepo.save( {title: "column1", createdAt: Date.now(), position: 1, boardID: 1} as Column )
    
    const board = boardRepo.findByID(1)
    const columns = columnRepo.findByBoard(1)

    // ASSERTIONS
    expect(board).toHaveProperty('title', 'board1')         // assert that board title is inserted title
    expect(columns[0]).toHaveProperty('title', 'column1')   // assert that column title is inserted title
    expect(columns.length).toBeGreaterThan(0)               // assert the there is more than one column
    expect(columns[0]).toHaveProperty('boardID', 1)         // assert that the column has the inserted boardID

})