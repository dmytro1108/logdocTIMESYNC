import { expect, test } from 'vitest'
import Board from './src/renderer/src/components/Board.tsx'
import Column from './src/renderer/src/components/Column.tsx'
import MyCard from './src/renderer/src/components/Card.tsx'

/* integration test */
/**
 * Selected integration test aims to test that
 * the board, column and card are added correctly
 * by calling the addCard and addColumn methods.
 */

/* test board, column and card together */
test('board contains a column, and column contains a card ', () => {
  const b1 = new Board('b1', [], [], 0)
  const c1 = new Column('c1', 0, [])
  const card1 = new MyCard(0, 'c1', 'stuff')
  
  const newColList = c1.addCard(card1)
  const newBoardList = b1.addColumn(newColList)
  
  /* expect board to contain 1 column, and column to contain 1 card */ 
  expect(newBoardList.columns.length).toBe(1)
  expect(newBoardList.columns[0].cards.length).toBe(1)
})

