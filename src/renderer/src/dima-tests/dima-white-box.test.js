import { expect, test } from 'vitest'
import Column from './src/renderer/src/components/Column.tsx'
import Card from './src/renderer/src/components/Card.tsx'

/* white box test */
/**
 * Selected white box tests aim to test that the list structure 
 * of the column component are correctly updated during insertion 
 * of a card. The method addCard aims to store cards inside the columns internal list. 
 */

/* addCard tests */
test('cards length increments', () => {
  const c1 = new Column('c1', 0, [])
  const card1 = new Card(0, 'card1', 'stuff')

  const newList = c1.addCard(card1)

  /* quantity of cards that exists is exactly 1 in the column*/ 
  expect(newList.cards.length).toBe(1)
})

test('card title matches what is assigned to it', () => {
  const c1 = new Column('c1', 0, [])
  const card1 = new Card(0, 'card1', 'stuff')

  const newList = c1.addCard(card1)

  /* title of the card object is exactly "card1" */
  expect(newList.cards[0].title).toBe('card1')
})

test('names are consistently part of each seperate card ', () => {
  const c1 = new Column('c1', 0, [])
  const card1 = new Card(0, 'card1', 'stuff')
  const card2 = new Card (0, 'card2', 'stuff')

  const newList = c1.addCard(card1)

  /* title of the second card object is exactly "card1" */
  expect(newList.cards[0].title).toBe('card1')
})

test('column created with card changes shape after card is added', () => {
  const card1 = new Card(0, 'card1', 'stuff')
  const card2 = new Card(0, 'card2', 'stuff')

  const c1 = new Column('c1', 0, [card1])

  const currCards = c1.cards

  const newList = c1.addCard(card2)

  /* addition of a card changes the data structure that the column holds */
  expect(newList.cards).not.toBe(currCards)
})