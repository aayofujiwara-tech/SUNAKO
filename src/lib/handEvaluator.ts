import type { PlayingCard, HandResult, HandRankName } from '@/types'

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c])
  const withoutFirst = combinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

function evaluateFive(cards: PlayingCard[]): HandResult {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank)
  const ranks = sorted.map((c) => c.rank)
  const suits = sorted.map((c) => c.suit)

  const isFlush = suits.every((s) => s === suits[0])
  const isStraight = checkStraight(ranks)
  const rankCounts = countRanks(ranks)
  const counts = Object.values(rankCounts).sort((a, b) => b - a)

  // A-2-3-4-5 wheel: Ace acts as 1, so effective high card is 5, not 14
  const isWheel = ranks[0] === 14 && ranks[1] === 5
  const straightTiebreakers = isWheel ? [5, 4, 3, 2, 1] : ranks

  if (isFlush && isStraight) {
    if (!isWheel && ranks[0] === 14 && ranks[1] === 13) {
      return makeResult('ロイヤルフラッシュ', 10, sorted, ranks)
    }
    return makeResult('ストレートフラッシュ', 9, sorted, straightTiebreakers)
  }
  if (counts[0] === 4) return makeResult('フォーオブアカインド', 8, sorted, quadsOrder(rankCounts))
  if (counts[0] === 3 && counts[1] === 2) return makeResult('フルハウス', 7, sorted, fullHouseOrder(rankCounts))
  if (isFlush) return makeResult('フラッシュ', 6, sorted, ranks)
  if (isStraight) return makeResult('ストレート', 5, sorted, straightTiebreakers)
  if (counts[0] === 3) return makeResult('スリーオブアカインド', 4, sorted, tripsOrder(rankCounts))
  if (counts[0] === 2 && counts[1] === 2) return makeResult('ツーペア', 3, sorted, twoPairOrder(rankCounts))
  if (counts[0] === 2) return makeResult('ワンペア', 2, sorted, onePairOrder(rankCounts))
  return makeResult('ハイカード', 1, sorted, ranks)
}

function checkStraight(ranks: number[]): boolean {
  const sorted = [...ranks].sort((a, b) => b - a)
  // Normal straight
  if (sorted[0] - sorted[4] === 4 && new Set(sorted).size === 5) return true
  // Wheel (A-2-3-4-5)
  if (sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2) return true
  return false
}

function countRanks(ranks: number[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const r of ranks) counts[r] = (counts[r] ?? 0) + 1
  return counts
}

function quadsOrder(rankCounts: Record<number, number>): number[] {
  const quad = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] === 4))
  const kicker = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] !== 4))
  return [quad, kicker]
}

function fullHouseOrder(rankCounts: Record<number, number>): number[] {
  const trips = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] === 3))
  const pair = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] === 2))
  return [trips, pair]
}

function tripsOrder(rankCounts: Record<number, number>): number[] {
  const trips = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] === 3))
  const kickers = Object.keys(rankCounts)
    .filter((r) => rankCounts[Number(r)] === 1)
    .map(Number)
    .sort((a, b) => b - a)
  return [trips, ...kickers]
}

function twoPairOrder(rankCounts: Record<number, number>): number[] {
  const pairs = Object.keys(rankCounts)
    .filter((r) => rankCounts[Number(r)] === 2)
    .map(Number)
    .sort((a, b) => b - a)
  const kicker = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] === 1))
  return [...pairs, kicker]
}

function onePairOrder(rankCounts: Record<number, number>): number[] {
  const pair = Number(Object.keys(rankCounts).find((r) => rankCounts[Number(r)] === 2))
  const kickers = Object.keys(rankCounts)
    .filter((r) => rankCounts[Number(r)] === 1)
    .map(Number)
    .sort((a, b) => b - a)
  return [pair, ...kickers]
}

function makeResult(name: HandRankName, value: number, bestFive: PlayingCard[], tiebreakers: number[]): HandResult {
  return { name, value, bestFive, tiebreakers }
}

export function evaluateBestHand(cards: PlayingCard[]): HandResult {
  if (cards.length < 5) {
    return { name: 'ハイカード', value: 1, bestFive: cards, tiebreakers: cards.map((c) => c.rank).sort((a, b) => b - a) }
  }
  const combos = combinations(cards, 5)
  let best: HandResult | null = null
  for (const combo of combos) {
    const result = evaluateFive(combo)
    if (!best || compareHands(result, best) > 0) {
      best = result
    }
  }
  return best!
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.value !== b.value) return a.value - b.value
  for (let i = 0; i < Math.min(a.tiebreakers.length, b.tiebreakers.length); i++) {
    if (a.tiebreakers[i] !== b.tiebreakers[i]) return a.tiebreakers[i] - b.tiebreakers[i]
  }
  return 0
}
