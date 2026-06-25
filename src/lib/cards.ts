import type { PlayingCard, Rank, Suit } from '@/types'

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${suit}-${rank}` })
    }
  }
  return deck
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealCards(deck: PlayingCard[], count: number): { dealt: PlayingCard[]; remaining: PlayingCard[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  }
}

/** 独立した52枚デッキからランダムにn枚抽出 */
export function drawRandom(count: number): PlayingCard[] {
  return shuffle(createDeck()).slice(0, count)
}

/** excludeIds に含まれるカードを除いた52枚デッキからn枚抽出 */
export function drawRandomExcluding(count: number, excludeIds: Set<string>): PlayingCard[] {
  const deck = shuffle(createDeck()).filter((c) => !excludeIds.has(c.id))
  return deck.slice(0, count)
}

export function rankLabel(rank: Rank): string {
  const labels: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
  return labels[rank] ?? String(rank)
}

export function suitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  }
  return symbols[suit]
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}
