export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export interface PlayingCard {
  suit: Suit
  rank: Rank
  id: string
}

export type HandRankName =
  | 'ハイカード'
  | 'ワンペア'
  | 'ツーペア'
  | 'スリーオブアカインド'
  | 'ストレート'
  | 'フラッシュ'
  | 'フルハウス'
  | 'フォーオブアカインド'
  | 'ストレートフラッシュ'
  | 'ロイヤルフラッシュ'

export interface HandResult {
  name: HandRankName
  value: number // 1〜10 (比較用)
  bestFive: PlayingCard[]
  tiebreakers: number[]
}

export type GameMode = 'A' | 'B'
export type GamePhase =
  | 'idle'
  | 'dealing'
  | 'playing'
  | 'opponent_declared'
  | 'player_declared'
  | 'showdown'
  | 'fold_result'
  | 'round_result'
  | 'game_over'

export type CpuDifficulty = 'easy' | 'normal' | 'hard'
export type MatchType = 'cpu' | 'online'

export interface GameSettings {
  mode: GameMode
  matchType: MatchType
  maxFolds: number
  countdownSeconds: number
  targetScore: number
  communityRevealInterval: number // Mode B only (seconds)
  cpuDifficulty: CpuDifficulty
}

export interface PlayerState {
  hand: PlayingCard[]
  foldsUsed: number
  score: number
  hasDeclared: boolean
  handResult: HandResult | null
  isExchanging: boolean
}

export interface GameState {
  settings: GameSettings
  phase: GamePhase
  player: PlayerState
  opponent: PlayerState
  communityCards: PlayingCard[] // Mode B
  revealedCommunityCount: number // Mode B
  countdownRemaining: number
  roundWinner: 'player' | 'opponent' | 'draw' | null
  gameWinner: 'player' | 'opponent' | null
  foldedBy: 'player' | 'opponent' | null
  roomCode: string | null
  isHost: boolean
}

// Firebase room document shape
export interface RoomState {
  hostId: string
  guestId: string | null
  settings: GameSettings
  phase: GamePhase
  host: PlayerState
  guest: PlayerState
  communityCards: PlayingCard[]
  revealedCommunityCount: number
  countdownStartAt: number | null
  foldedBy: 'host' | 'guest' | null
  roundWinner: 'host' | 'guest' | 'draw' | null
  gameWinner: 'host' | 'guest' | null
  round: number
  createdAt: number
}
