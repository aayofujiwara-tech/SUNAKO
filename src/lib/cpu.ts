import type { PlayerState, GameSettings, CpuDifficulty, HandResult, PlayingCard } from '@/types'
import { evaluateBestHand, compareHands } from './handEvaluator'

export type CpuDecision = 'exchange' | 'declare' | 'wait' | 'accept' | 'fold'

interface CpuContext {
  cpuState: PlayerState
  playerHasDeclared: boolean
  settings: GameSettings
  communityCards?: PlayingCard[]
  playerExchangeCount?: number
  hasExchanged?: boolean // 宣言応答時に交換済みか（2回交換を防ぐ）
  cpuExchangeCount?: number  // playing中にCPUが交換した回数
  playerFoldsUsed?: number   // プレイヤーのフォールド消費数（hard ブラフ判断用）
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
  const {
    cpuState, playerHasDeclared, settings,
    communityCards = [], playerExchangeCount = 0, hasExchanged = false,
    cpuExchangeCount = 0, playerFoldsUsed = 0,
  } = ctx
  const difficulty = settings.cpuDifficulty

  const allCards = [...cpuState.hand, ...communityCards]
  const hand = allCards.length > 0 ? evaluateBestHand(allCards) : null
  const value = hand?.value ?? 0 // 1=ハイカード … 10=ロイヤルフラッシュ

  if (playerHasDeclared) {
    return decideFoldOrAccept(value, difficulty, cpuState.foldsUsed, settings.maxFolds, hasExchanged)
  }

  return decideTurnAction(value, difficulty, cpuState, settings, communityCards, playerExchangeCount, cpuExchangeCount, playerFoldsUsed)
}

function decideTurnAction(
  value: number,
  difficulty: CpuDifficulty,
  cpuState: PlayerState,
  settings: GameSettings,
  communityCards: PlayingCard[],
  playerExchangeCount: number,
  cpuExchangeCount: number,
  playerFoldsUsed: number,
): CpuDecision {
  const isModeBB = settings.mode === 'B'
  const revealedCount = communityCards.length
  const playerFoldsLeft = settings.maxFolds - playerFoldsUsed

  // 宣言に必要な最低役（交換回数で段階的に緩和）
  // 0回: スリーカード以上(4+)  1回: ツーペア以上(3+)  2+回: ワンペア以上(2+)
  const declareThreshold = cpuExchangeCount === 0 ? 4 : cpuExchangeCount === 1 ? 3 : 2

  switch (difficulty) {
    case 'easy': {
      // ブラフなし、しきい値以上のみ宣言
      if (value >= declareThreshold) return 'declare'
      return 'exchange'
    }

    case 'normal': {
      if (value >= declareThreshold) return 'declare'
      // ワンペア：1回交換後は60%で宣言
      if (value === 2 && cpuExchangeCount >= 1) return Math.random() < 0.60 ? 'declare' : 'exchange'
      // ハイカード：ドロー待機
      if (isModeBB && revealedCount < 4 && hasDrawPotential(cpuState.hand, communityCards)) {
        return 'wait'
      }
      // ブラフ上限10%（交換済み かつ 相手が2回以上交換した場合のみ）
      if (cpuExchangeCount >= 1 && playerExchangeCount >= 2 && Math.random() < 0.10) return 'declare'
      return 'exchange'
    }

    case 'hard': {
      if (value >= declareThreshold) return 'declare'
      // ワンペア：1回交換後は75%で宣言
      if (value === 2 && cpuExchangeCount >= 1) return Math.random() < 0.75 ? 'declare' : 'exchange'
      // ハイカード：ドロー待機
      if (isModeBB && revealedCount < 3 && hasDrawPotential(cpuState.hand, communityCards)) {
        return 'wait'
      }
      // ブラフ上限20%：交換済み かつ 相手のフォールド残数が1以下の時のみ
      if (cpuExchangeCount >= 1 && playerFoldsLeft <= 1 && Math.random() < 0.20) return 'declare'
      return 'exchange'
    }
  }
}

function decideFoldOrAccept(
  value: number,
  difficulty: CpuDifficulty,
  foldsUsed: number,
  maxFolds: number,
  hasExchanged: boolean,
): CpuDecision {
  const foldsLeft = maxFolds - foldsUsed
  if (foldsLeft === 0) return 'accept' // フォールド不可

  switch (difficulty) {
    case 'easy':
      // 交換なし：従来通り即断
      if (value <= 1) return 'fold'
      return Math.random() < 0.5 ? 'accept' : 'fold'

    case 'normal':
      if (value >= 5) return 'accept'
      if (value >= 3) return Math.random() < 0.7 ? 'accept' : 'fold'
      if (value === 2) return Math.random() < 0.4 ? 'accept' : 'fold'
      // ハイカード：未交換なら50%で交換を試みる
      if (!hasExchanged && Math.random() < 0.5) return 'exchange'
      return 'fold'

    case 'hard':
      if (value >= 5) return 'accept'
      if (value >= 3) return Math.random() < 0.85 ? 'accept' : 'fold'
      // ワンペア以下：未交換なら必ず交換してから判断
      if (!hasExchanged && value <= 2) return 'exchange'
      // 交換後：ワンペアなら受けるか確率判断、ハイカードならフォールド温存
      if (value === 2) return foldsLeft > 1 ? 'fold' : (Math.random() < 0.5 ? 'accept' : 'fold')
      return foldsLeft > 1 ? 'fold' : 'accept'
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
