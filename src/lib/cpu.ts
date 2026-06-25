import type { PlayerState, GameSettings, CpuDifficulty, HandResult } from '@/types'
import { evaluateBestHand, compareHands } from './handEvaluator'

export type CpuDecision = 'exchange' | 'declare' | 'wait' | 'accept' | 'fold'

interface CpuContext {
  cpuState: PlayerState
  playerHasDeclared: boolean
  settings: GameSettings
  communityCards?: import('@/types').PlayingCard[]
}

function getHandStrength(result: HandResult): 'weak' | 'medium' | 'strong' {
  if (result.value >= 7) return 'strong'
  if (result.value >= 4) return 'medium'
  return 'weak'
}

export function cpuDecideAction(ctx: CpuContext): CpuDecision {
  const { cpuState, playerHasDeclared, settings } = ctx
  const difficulty = settings.cpuDifficulty

  const allCards = [...cpuState.hand, ...(ctx.communityCards ?? [])]
  const hand = cpuState.hand.length > 0 ? evaluateBestHand(allCards) : null
  const strength = hand ? getHandStrength(hand) : 'weak'

  if (playerHasDeclared) {
    return decideFoldOrAccept(strength, difficulty, cpuState.foldsUsed, settings.maxFolds)
  }

  return decideTurnAction(strength, difficulty)
}

function decideFoldOrAccept(
  strength: 'weak' | 'medium' | 'strong',
  difficulty: CpuDifficulty,
  foldsUsed: number,
  maxFolds: number,
): CpuDecision {
  const foldsLeft = maxFolds - foldsUsed

  if (foldsLeft === 0) return 'accept'

  switch (difficulty) {
    case 'easy':
      // 50/50
      return Math.random() < 0.5 ? 'accept' : 'fold'
    case 'normal':
      if (strength === 'strong') return 'accept'
      if (strength === 'medium') return Math.random() < 0.6 ? 'accept' : 'fold'
      return Math.random() < 0.3 ? 'accept' : 'fold'
    case 'hard':
      if (strength === 'strong') return 'accept'
      if (strength === 'medium') return Math.random() < 0.8 ? 'accept' : 'fold'
      return foldsLeft > 1 ? 'fold' : 'accept'
  }
}

function decideTurnAction(strength: 'weak' | 'medium' | 'strong', difficulty: CpuDifficulty): CpuDecision {
  switch (difficulty) {
    case 'easy': {
      const r = Math.random()
      if (r < 0.4) return 'exchange'
      if (r < 0.7) return 'declare'
      return 'wait'
    }
    case 'normal':
      if (strength === 'strong') return 'declare'
      if (strength === 'medium') return Math.random() < 0.5 ? 'declare' : 'exchange'
      return Math.random() < 0.3 ? 'declare' : 'exchange'
    case 'hard':
      if (strength === 'strong') return 'declare'
      if (strength === 'medium') return Math.random() < 0.3 ? 'declare' : 'exchange'
      return 'exchange'
  }
}

export function cpuShouldBluff(difficulty: CpuDifficulty, strength: 'weak' | 'medium' | 'strong'): boolean {
  if (strength !== 'weak') return false
  switch (difficulty) {
    case 'easy': return Math.random() < 0.3
    case 'normal': return Math.random() < 0.15
    case 'hard': return Math.random() < 0.05
  }
}

export function cpuThinkTime(difficulty: CpuDifficulty): number {
  switch (difficulty) {
    case 'easy': return 500 + Math.random() * 1000
    case 'normal': return 800 + Math.random() * 1500
    case 'hard': return 1200 + Math.random() * 2000
  }
}

export function cpuCompareAndDecide(
  cpuHand: HandResult,
  playerHand: HandResult,
): 'player' | 'cpu' | 'draw' {
  const cmp = compareHands(cpuHand, playerHand)
  if (cmp > 0) return 'cpu'
  if (cmp < 0) return 'player'
  return 'draw'
}
