// BoardRepo Structure Test
// -    ensure that all values placed inside test Board are accurate
// -    ensures that after an update() all values were correctly changed in the DB
// -    these tests serve as a reference for me as I get comfortable with the testing framework ( this file is not for credit ) 


import { setupTestDB } from './TestSetupDB'
import { BoardRepository } from '../BoardRepo'
import { Board } from '../../../shared/types';

beforeEach(() => {
    setupTestDB()
})

test('findByID returns correct board', () => {
    const boardRepo = new BoardRepository()
    const board = boardRepo.findByID(1)
    expect(board.title).toBe("board1")
    expect(board.description).toBe("some test board1")
})

test('update returns the correct board', () => {
    const boardRepo = new BoardRepository()
    const newBoard = { id: 1, title: "updatedBoard", description: "some new test board1", userID: 1 } as Board
    boardRepo.update(newBoard)
    const board = boardRepo.findByID(1)
    expect(board.title).toBe("updatedBoard")
    expect(board.description).toBe("some new test board1")
})