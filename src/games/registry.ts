import type { GameDef } from '../engine/types'
import SudokuBoard from './sudoku/SudokuBoard'
import QueensBoard from './queens/QueensBoard'
import ZipBoard from './zip/ZipBoard'
import PatchesBoard from './patches/PatchesBoard'
import { SUDOKU_MAX_LEVEL } from './sudoku/sudoku'
import { QUEENS_MAX_LEVEL } from './queens/queens'
import { ZIP_MAX_LEVEL } from './zip/zip'
import { PATCHES_MAX_LEVEL } from './patches/patches'
import TangoBoard from './tango/TangoBoard'
import NonogramBoard from './nonogram/NonogramBoard'
import WordyBoard from './wordy/WordyBoard'
import { TANGO_MAX_LEVEL } from './tango/tango'
import { NONOGRAM_MAX_LEVEL } from './nonogram/nonogram'
import { WORDY_MAX_LEVEL } from './wordy/wordy'

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
  {
    id: 'tango',
    name: 'Tango',
    emoji: '🌗',
    tagline: 'Balance the suns and moons',
    howTo: [
      'Fill the grid with ☀️ and 🌙 — every row and column gets the same number of each.',
      'Never three of the same in a row.',
      'Squares joined by = must match; squares joined by × must be different.',
    ],
    maxLevel: TANGO_MAX_LEVEL,
    Board: TangoBoard,
  },
  {
    id: 'nonogram',
    name: 'Picture Cross',
    emoji: '🖼️',
    tagline: 'Fill squares to reveal a picture',
    howTo: [
      'The numbers show runs of filled squares in that row or column, in order.',
      'A gap of at least one empty square sits between runs.',
      'Tap to fill a square, tap again for ✕ (definitely empty). Finish to reveal the picture!',
    ],
    maxLevel: NONOGRAM_MAX_LEVEL,
    Board: NonogramBoard,
  },
  {
    id: 'wordy',
    name: 'Wordy',
    emoji: '📝',
    tagline: 'Guess the secret word',
    howTo: [
      'Guess the secret word. After each guess the tiles change color.',
      '🟩 green = right letter, right spot. 🟨 yellow = right letter, wrong spot.',
      'You get 6 tries — extra tries are allowed but cost a star.',
    ],
    maxLevel: WORDY_MAX_LEVEL,
    Board: WordyBoard,
  },
]

export function gameById(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id)
}
