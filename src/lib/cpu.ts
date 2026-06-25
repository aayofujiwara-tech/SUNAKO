import type { PlayerState, GameSettings, CpuDifficulty, HandResult, PlayingCard } from '@/types'
import { evaluateBestHand, compareHands } from './handEvaluator'

export type CpuDecision = 'exchange' | 'declare' | 'wait' | 'accept' | 'fold'

interface CpuContext {
  cpuState: PlayerState
  playerHasDeclared: boolean
  settings: GameSettings
  communityCards?: PlayingCard[]
  playerExchangeCount?: number
}

// フラッシュドロー（同スート3枚以上）またはストレートドロー（連続3ランク以上）の有無
function hasDrawPotential(holeCards: PlayingCard[], communityCards: PlayingCard[]): boolean {
  const all = [...holeCards, ...communityCards]
  if (all.length < 3) return false

  const suitCounts: Record<string, number> = {}
  for (const c of all) suitCounts[c.suit] = (suitCounts[c.suit] ?? 0) + 1
  if (Object.values(suitCounts).some((n) => n >= 3)) return true

  const ranks = [...new Set(all.map((c) => c.rank))].sort((a, b) => a - b)
  let maxConsec = 1
  let cur = 1
  for (let i = 1; i < ranks.length; i++) {
    cur = ranks[i] === ranks[i - 1] + 1 ? cur + 1 : 1
    if (cur > maxConsec) maxConsec = cur
  }
  return maxConsec >= 3
}

export function cpuDecideAction(ctx: CpuContext): CpuDecision {
  const { cpuState, playerHasDeclared, settings, communityCards = [], playerExchangeCount = 0 } = ctx
  const difficulty = settings.cpuDifficulty

  const allCards = [...cpuState.hand, ...communityCards]
  const hand = allCards.length > 0 ? evaluateBestHand(allCards) : null
  const value = hand?.value ?? 0 // 1=ハイカード … 10=ロイヤルフラッシュ

  if (playerHasDeclared) {
    return decideFoldOrAccept(value, difficulty, cpuState.foldsUsed, settings.maxFolds)
  }

  return decideTurnAction(value, difficulty, cpuState, settings, communityCards, playerExchangeCount)
}

function decideTurnAction(
  value: number,
  difficulty: CpuDifficulty,
  cpuState: PlayerState,
  settings: GameSettings,
  communityCards: PlayingCard[],
  playerExchangeCount: number,
): CpuDecision {
  const isModeBB = settings.mode === 'B'
  const revealedCount = communityCards.length
  const foldsLeft = settings.maxFolds - cpuState.foldsUsed

  switch (difficulty) {
    case 'easy': {
      if (value >= 5) return 'declare'                               // ストレート以上：即宣言
      if (value >= 3) return 'declare'                               // ツーペア・スリーカード：宣言
      if (value === 2) return Math.random() < 0.5 ? 'declare' : 'exchange' // ワンペア：50/50
      return 'exchange'                                               // ハイカード：交換
    }

    case 'normal': {
      if (value >= 5) return 'declare'
      if (value >= 3) return 'declare'
      if (value === 2) return Math.random() < 0.7 ? 'declare' : 'exchange'
      // ハイカード
      if (isModeBB && revealedCount < 4 && hasDrawPotential(cpuState.hand, communityCards)) {
        return 'wait' // ドロー狙いで待機
      }
      if (playerExchangeCount >= 2 && Math.random() < 0.25) return 'declare' // ブラフ
      return 'exchange'
    }

    case 'hard': {
      if (value >= 5) return 'declare'
      if (value >= 3) return 'declare'
      if (value === 2) return Math.random() < 0.8 ? 'declare' : 'exchange'
      // ハイカード
      if (isModeBB && revealedCount < 3 && hasDrawPotential(cpuState.hand, communityCards)) {
        return 'wait' // 序盤はドロー待ち
      }
      // 相手のフォールド残数が少ないほど積極的にブラフ
      const bluffChance = 0.2 + (foldsLeft / settings.maxFolds) * 0.3
      if (Math.random() < bluffChance) return 'declare'
      if (playerExchangeCount >= 1 && Math.random() < 0.3) return 'declare'
      return 'exchange'
    }
  }
}

function decideFoldOrAccept(
  value: number,
  difficulty: CpuDifficulty,
  foldsUsed: number,
  maxFolds: number,
): CpuDecision {
  const foldsLeft = maxFolds - foldsUsed
  if (foldsLeft === 0) return 'accept' // フォールド不可

  switch (difficulty) {
    case 'easy':
      if (value <= 1) return 'fold'                                 // ハイカードはフォールド
      return Math.random() < 0.5 ? 'accept' : 'fold'

    case 'normal':
      if (value >= 5) return 'accept'                               // ストレート以上：必ず受ける
      if (value >= 3) return Math.random() < 0.7 ? 'accept' : 'fold'
      if (value === 2) return Math.random() < 0.4 ? 'accept' : 'fold'
      return 'fold'                                                  // ハイカード：フォールド

    case 'hard':
      if (value >= 5) return 'accept'
      if (value >= 3) return Math.random() < 0.85 ? 'accept' : 'fold'
      if (value === 2) return foldsLeft > 1 ? 'fold' : (Math.random() < 0.5 ? 'accept' : 'fold')
      return foldsLeft > 1 ? 'fold' : 'accept'                     // ハイカード：残数温存
  }
}

// 難易度別の思考時間
export function cpuThinkTime(difficulty: CpuDifficulty): number {
  switch (difficulty) {
    case 'easy':   return 2000 + Math.random() * 2000  // 2〜4秒
    case 'normal': return 1000 + Math.random() * 1000  // 1〜2秒
    case 'hard':   return 500  + Math.random() * 500   // 0.5〜1秒
  }
}

export function cpuCompareAndDecide(cpuHand: HandResult, playerHand: HandResult): 'player' | 'cpu' | 'draw' {
  const cmp = compareHands(cpuHand, playerHand)
  if (cmp > 0) return 'cpu'
  if (cmp < 0) return 'player'
  return 'draw'
}
