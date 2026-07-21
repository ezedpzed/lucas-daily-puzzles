import type { GameDef } from '../engine/types'
import SudokuBoard from './sudoku/SudokuBoard'
import QueensBoard from './queens/QueensBoard'
import ZipBoard from './zip/ZipBoard'
import PatchesBoard from './patches/PatchesBoard'
import { SUDOKU_MAX_LEVEL } from './sudoku/sudoku'
import { QUEENS_MAX_LEVEL } from './queens/queens'
import { ZIP_MAX_LEVEL } from './zip/zip'
import { PATCHES_MAX_LEVEL } from './patches/patches'

export const GAMES: GameDef[] = [
  {
    id: 'sudoku',
    name: 'Mini Sudoku',
    emoji: '🔢',
    tagline: 'Fill every row, column, and box',
    howTo: [
      'Fill the grid so every row, every column, and every box has each number exactly once.',
      'Tap a square, then tap a number below to place it.',
      'Wrong numbers glow red. Use 💡 Hint if you get stuck!',
    ],
    maxLevel: SUDOKU_MAX_LEVEL,
    Board: SudokuBoard,
  },
  {
    id: 'zip',
    name: 'Zip',
    emoji: '🐍',
    tagline: 'Draw one path through every square',
    howTo: [
      'Drag a path starting at 1 that goes through every square.',
      'You must reach the numbers in order: 1, then 2, then 3...',
      'The path can’t cross itself. Drag backwards to erase.',
    ],
    maxLevel: ZIP_MAX_LEVEL,
    Board: ZipBoard,
  },
  {
    id: 'patches',
    name: 'Patches',
    emoji: '🧵',
    tagline: 'Cut the board into number patches',
    howTo: [
      'Divide the whole board into rectangle patches.',
      'Each patch must contain exactly one number — and cover exactly that many squares.',
      'Drag to draw a patch. Tap a patch to remove it.',
    ],
    maxLevel: PATCHES_MAX_LEVEL,
    Board: PatchesBoard,
  },
  {
    id: 'queens',
    name: 'Queens',
    emoji: '👑',
    tagline: 'One queen per row, column, and color',
    howTo: [
      'Place exactly one 👑 in every row, every column, and every color region.',
      'Queens can never touch each other — not even diagonally!',
      'Tap once to mark ✕ (no queen here), tap again to place a 👑.',
    ],
    maxLevel: QUEENS_MAX_LEVEL,
    Board: QueensBoard,
  },
]

export function gameById(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id)
}
