import type { ComponentType } from 'react'

// Props every game board component receives from the GamePlay shell.
export interface GameBoardProps {
  seed: string
  level: number
  savedState: unknown
  mistakeHighlight: boolean
  onStateChange: (state: unknown) => void
  onUsedHint: () => void
  onSolved: () => void
}

export interface GameDef {
  id: string
  name: string
  emoji: string
  tagline: string
  howTo: string[]
  maxLevel: number
  Board: ComponentType<GameBoardProps>
}
