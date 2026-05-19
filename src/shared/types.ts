// Type definitions for Board, Column, and Card
// use: import { Card, Column, Board } from '../../shared/types'

export interface Board {
    id: number;
    title: string;
    description: string;
    createdAt: number;
    userID: number;
}

export interface Column {
    id: number;
    title: string;
    createdAt: number;
    position: number;
    boardID: number;
}

export interface Card {
    id: number;
    title: string;
    description: string;
    createdAt: number;
    position: number;
    columnID: number;
}

// Type definitions for JSON export feature
// use: import { BoardExport, ColumnExport } from '../../shared/types'
export interface BoardExport {
    board: Board
    columns: ColumnExport[],
}

export interface ColumnExport {
    column: Column,
    cards: Card[]
}