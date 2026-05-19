import { expect, test } from 'vitest'
import Board from './src/renderer/src/components/Board.tsx'
import Column from './src/renderer/src/components/Column.tsx'

  /* black box tests */
  /**
   * Selected black box tests expect that calling addBoard
   * and addColumn will update the list of boards and also
   * update the list of columns in the board. It also expects 
   * that properties are correctly assigned and retained by each object.
   */

  /* addBoard tests */ 
  test('board list correctly updates with each board object', () => {
    const b1 = new Board('b1', [], [], 0)
    const b2 = new Board('b2', [], [], 1)
  
    const newList = b1.addBoard(b2) 
  
    expect(newList.boards.length).toBe(1)
  })
  
  test('board stores provided name correctly', () => {
    const b1 = new Board('b1', [], [], 0)
    const b2 = new Board('b2', [], [], 1)
  
    const newList = b1.addBoard(b2)
  
    expect(newList.boards[0].board_name).toBe('b2')
  })

  
  /* addColumn tests */
  test('column stores provided name correctly', () => {
    const b1 = new Board('b1', [], [], 0)
  
    const c1 = new Column('c1', 0, [])
    const c2 = new Column('c2', 1, [])
  
    const newList = b1.addColumn(c2)
  
    expect(newList.columns[0].column_name).toBe('c2')
  })

  test('columns are correctly counted', () => {
    const b1 = new Board('b1', [], [], 0)
  
    const c1 = new Column('c1', 0, [])
    const c2 = new Column('c2', 1, [])
    
    const newList = b1.addColumn(c2)
    
    // expect that the length of columns is 1 after adding only one column
    expect(newList.columns.length).toBe(1)

    // expect that the length of columns is 2 after adding another column
    const updatedList = b1.addColumn(c1)
    expect (updatedList.columns.length).toBe(2)
  })
  
  test('test colID is correct', () => {
    const b1 = new Board('b1', [], [], 0)
  
    const c1 = new Column('c1', 0, [])
    const c2 = new Column('c2', 1, [])
  
    const newList = b1.addColumn(c2)

    // expect the colID of second column to be 1
    expect(newList.columns[0].colID).toBe(1)
  })
  
  test('board stores provided name correctly after adding columns', () => {
    const b1 = new Board('b1', [], [], 0)
  
    const c1 = new Column('c1', 0, [])
    const c2 = new Column('c2', 1, [])
  
    const newList = b1.addColumn(c2)
  
    // expect the board name to be b1 even when i added another column
    expect(newList.board_name).toBe('b1')
  })
