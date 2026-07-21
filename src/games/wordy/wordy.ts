import { makeRng, randInt } from '../../engine/rng'
import { WORDS_3, WORDS_4, WORDS_5 } from './words'

export const WORDY_MAX_LEVEL = 5

export function wordLength(level: number): number {
  const L = Math.min(Math.max(level, 1), WORDY_MAX_LEVEL)
  return L === 1 ? 3 : L <= 3 ? 4 : 5
}

export function answerFor(seed: string, level: number): string {
  const list = wordLength(level) === 3 ? WORDS_3 : wordLength(level) === 4 ? WORDS_4 : WORDS_5
  return list[randInt(makeRng(seed), list.length)].toUpperCase()
}

export type LetterState = 'correct' | 'present' | 'absent'

/** Standard Wordle scoring with correct duplicate-letter handling. */
export function scoreGuess(guess: string, answer: string): LetterState[] {
  const len = answer.length
  const result: LetterState[] = new Array(len).fill('absent')
  const remaining = new Map<string, number>()
  for (let i = 0; i < len; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct'
    else remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1)
  }
  for (let i = 0; i < len; i++) {
    if (result[i] === 'correct') continue
    const count = remaining.get(guess[i]) ?? 0
    if (count > 0) {
      result[i] = 'present'
      remaining.set(guess[i], count - 1)
    }
  }
  return result
}
