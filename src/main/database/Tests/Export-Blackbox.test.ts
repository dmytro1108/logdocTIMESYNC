// Black Box Unit Tests:
// -    This file tests the functionality of my Board Export feature (coolcam)
// -    There are three tests present in this file:
//      -   test if string is returned by JSON.stringify ( does not count toward total, tests package and not my work)
//      -   ensure that JSON is correctly formatted after exportToJson() ( 9 assertions )
//      -   ensure that JSON export can handle multiple columns and cards for one board ( 13 assertions )

import { setupTestDB } from './TestSetupDB'
import { exportToJSON } from '../Export'
import { Column, Card } from '../../../shared/types';
import { ColumnRepository } from '../ColumnRepo'
import { CardRepository } from '../CardRepo'

beforeEach(() => {
    setupTestDB()
})

test('ensure string is returned from the Export function (JSON.stringify)', () => {
    const json = exportToJSON(1)
    expect(typeof json).toBe('string')
})

test('ensure correctly formatted JSON', () => {
    const json = exportToJSON(1)

    // parse the contents of the JSON object and validate that board, column, and cards are present
    const parse = JSON.parse(json)

    // validate board information 
    expect(parse.board.title).toBe("board1")
    expect(parse.board.description).toBe("some test board1")
    expect(parse.board.userID).toBe(1)

    // validate column information  
    expect(parse.columns[0].column.title).toBe("column1")
    expect(parse.columns[0].column.position).toBe(1)
    expect(parse.columns[0].column.boardID).toBe(1)

    // validate card information
    expect(parse.columns[0].cards.length).toBe(1)
    expect(parse.columns[0].cards[0].title).toBe("card1")
    expect(parse.columns[0].cards[0].description).toBe("some test card1")
})


test('handle an export with multiple columns and cards', () => {

    // add two more Column into Board
    const col2 = {title: "column2", createdAt: Date.now(), position: 2, boardID: 1} as Column
    const col3 = {title: "column3", createdAt: Date.now(), position: 3, boardID: 1} as Column

    // ensure that there are 2 cards in each of the three columns
    const card1_2 = {title: "card2 - col 1", description: "some test card, in the first column", createdAt: Date.now(), position: 2, columnID: 1} as Card
    const card2_1 = {title: "card1 - col 2", description: "some test card1, in the second column", createdAt: Date.now(), position: 1, columnID: 2} as Card
    const card2_2 = {title: "card2 - col 2", description: "some test card1, in the second column", createdAt: Date.now(), position: 2, columnID: 2} as Card
    const card3_1 = {title: "card1 - col 3", description: "some test card1, in the third column", createdAt: Date.now(), position: 1, columnID: 3} as Card
    const card3_2 = {title: "card2 - col 3", description: "some test card1, in the third column", createdAt: Date.now(), position: 2, columnID: 3} as Card

    const columnRepo = new ColumnRepository()
    const cardRepo = new CardRepository()

    // insert new columns and rows in Board
    columnRepo.save(col2)
    columnRepo.save(col3)
    cardRepo.save(card1_2)
    cardRepo.save(card2_1)
    cardRepo.save(card2_2)
    cardRepo.save(card3_1)
    cardRepo.save(card3_2)

    const parse = JSON.parse(exportToJSON(1))

    // test if all columns are present
    expect(parse.columns.length).toBe(3)               

    // test if each column was added into the export object
    expect(parse.columns[0].cards.length).toBe(2)       
    expect(parse.columns[1].cards.length).toBe(2)
    expect(parse.columns[2].cards.length).toBe(2)

    // test for column order
    expect(parse.columns[0].column.title).toBe("column1")
    expect(parse.columns[1].column.title).toBe("column2")
    expect(parse.columns[2].column.title).toBe("column3")

    // test for card order
    expect(parse.columns[0].cards[0].title).toBe("card1")
    expect(parse.columns[0].cards[1].title).toBe("card2 - col 1")
    expect(parse.columns[1].cards[0].title).toBe("card1 - col 2")
    expect(parse.columns[1].cards[1].title).toBe("card2 - col 2")
    expect(parse.columns[2].cards[0].title).toBe("card1 - col 3")
    expect(parse.columns[2].cards[1].title).toBe("card2 - col 3")

})