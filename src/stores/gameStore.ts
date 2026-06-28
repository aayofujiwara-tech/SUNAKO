import { create } from 'zustand'
import type { GameState, GameSettings, PlayerState } from '@/types'
import { drawRandom, drawRandomExcluding } from '@/lib/cards'
import { evaluateBestHand, compareHands } from '@/lib/handEvaluator'

export const CPU_EXCHANGE_ANIMATION_MS = 600

const DEFAULT_SETTINGS: GameSettings = {
  mode: 'A',
  matchType: 'cpu',
  maxFolds: 2,
  countdownSeconds: 5,
  targetScore: 3,
  communityRevealInterval: 2,
  cpuDifficulty: 'normal',
}

function defaultPlayer(): PlayerState {
  return {
    hand: [],
    foldsUsed: 0,
    score: 0,
    hasDeclared: false,
    handResult: null,
    isExchanging: false,
  }
}

function dealNewCards(settings: GameSettings) {
  const handSize = settings.mode === 'A' ? 7 : 2
  const communityCards = settings.mode === 'B' ? drawRandom(5) : []
  const communityIds = new Set(communityCards.map((c) => c.id))
  const playerHand = settings.mode === 'B'
    ? drawRandomExcluding(handSize, communityIds)
    : drawRandom(handSize)
  const usedIds = new Set([...communityIds, ...playerHand.map((c) => c.id)])
  const opponentHand = drawRandomExcluding(handSize, usedIds)
  return {
    communityCards,
    playerHand,
    opponentHand,
    playerResult: evaluateBestHand(playerHand),
    opponentResult: evaluateBestHand(opponentHand),
  }
}

interface GameActions {
  // Setup
  setSettings: (s: Partial<GameSettings>) => void
  startGame: () => void
  dealRound: () => void

  // Player actions
  playerExchange: () => void
  playerDeclare: () => void
  playerAccept: () => void
  playerFold: () => void

  // CPU / online responses
  cpuExchange: () => void
  cpuDeclare: () => void
  cpuAccept: () => void
  cpuFold: () => void

  // Mode B community
  revealNextCommunityCard: () => void

  // Showdown / fold continuation
  resolveShowdown: () => void
  continueFold: () => void
  nextRound: () => void
  resetGame: () => void

  // Countdown
  tickCountdown: () => void
  startCountdown: () => void

  // Online
  setRoomCode: (code: string) => void
  setIsHost: (v: boolean) => void
  applyRemoteState: (partial: Partial<GameState>) => void
}

type Store = GameState & GameActions

export const useGameStore = create<Store>()((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  phase: 'idle',
  player: defaultPlayer(),
  opponent: defaultPlayer(),
  communityCards: [],
  revealedCommunityCount: 0,
  countdownRemaining: 0,
  roundWinner: null,
  gameWinner: null,
  foldedBy: null,
  roomCode: null,
  isHost: false,

  setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

  startGame: () => {
    set({
      phase: 'dealing',
      player: defaultPlayer(),
      opponent: defaultPlayer(),
      communityCards: [],
      revealedCommunityCount: 0,
      roundWinner: null,
      gameWinner: null,
      foldedBy: null,
    })
    get().dealRound()
  },

  dealRound: () => {
    const { settings, player, opponent } = get()
    const { communityCards, playerHand, opponentHand, playerResult, opponentResult } = dealNewCards(settings)
    set({
      phase: 'playing',
      communityCards,
      revealedCommunityCount: 0,
      roundWinner: null,
      foldedBy: null,
      player: {
        ...player,
        hand: playerHand,
        hasDeclared: false,
        handResult: playerResult,
        isExchanging: false,
        foldsUsed: 0,
      },
      opponent: {
        ...opponent,
        hand: opponentHand,
        hasDeclared: false,
        handResult: opponentResult,
        isExchanging: false,
        foldsUsed: 0,
      },
    })
  },

  playerExchange: () => {
    const { settings, communityCards, revealedCommunityCount } = get()
    const handSize = settings.mode === 'A' ? 7 : 2
    const communityIds = new Set(communityCards.map((c) => c.id))
    const newHand = settings.mode === 'B'
      ? drawRandomExcluding(handSize, communityIds)
      : drawRandom(handSize)
    const evalCards = settings.mode === 'B'
      ? [...newHand, ...communityCards.slice(0, revealedCommunityCount)]
      : newHand
    const handResult = evaluateBestHand(evalCards)
    set((st) => ({
      player: { ...st.player, hand: newHand, handResult, isExchanging: false },
    }))
  },

  playerDeclare: () => {
    set((st) => ({
      phase: 'player_declared',
      player: { ...st.player, hasDeclared: true },
    }))
    get().startCountdown()
  },

  playerAccept: () => {
    set({ phase: 'showdown' })
    get().resolveShowdown()
  },

  playerFold: () => {
    const st = get()
    const newFoldsUsed = st.player.foldsUsed + 1
    const outOfFolds = newFoldsUsed >= st.settings.maxFolds

    if (!outOfFolds) {
      set({
        phase: 'fold_result',
        foldedBy: 'player',
        player: { ...st.player, foldsUsed: newFoldsUsed },
      })
      return
    }

    const newOpponentScore = st.opponent.score + 1
    const isGameOver = newOpponentScore >= st.settings.targetScore
    set({
      phase: 'fold_result',
      foldedBy: 'player',
      roundWinner: 'opponent',
      gameWinner: isGameOver ? 'opponent' : null,
      player: { ...st.player, foldsUsed: newFoldsUsed },
      opponent: { ...st.opponent, score: newOpponentScore },
    })
  },

  cpuExchange: () => {
    set((st) => ({ opponent: { ...st.opponent, isExchanging: true } }))
    setTimeout(() => {
      const { settings, communityCards, revealedCommunityCount, phase } = get()
      if (phase !== 'playing' && phase !== 'player_declared') {
        set((st) => ({ opponent: { ...st.opponent, isExchanging: false } }))
        return
      }
      const handSize = settings.mode === 'A' ? 7 : 2
      const communityIds = new Set(communityCards.map((c) => c.id))
      const newHand = settings.mode === 'B'
        ? drawRandomExcluding(handSize, communityIds)
        : drawRandom(handSize)
      const evalCards = settings.mode === 'B'
        ? [...newHand, ...communityCards.slice(0, revealedCommunityCount)]
        : newHand
      const handResult = evaluateBestHand(evalCards)
      set((st) => ({
        opponent: { ...st.opponent, hand: newHand, handResult, isExchanging: false },
      }))
    }, CPU_EXCHANGE_ANIMATION_MS)
  },

  cpuDeclare: () => {
    set((st) => ({
      phase: 'opponent_declared',
      opponent: { ...st.opponent, hasDeclared: true },
    }))
    get().startCountdown()
  },

  cpuAccept: () => {
    set({ phase: 'showdown' })
    get().resolveShowdown()
  },

  cpuFold: () => {
    const st = get()
    const newFoldsUsed = st.opponent.foldsUsed + 1
    const outOfFolds = newFoldsUsed >= st.settings.maxFolds

    if (!outOfFolds) {
      set({
        phase: 'fold_result',
        foldedBy: 'opponent',
        opponent: { ...st.opponent, foldsUsed: newFoldsUsed },
      })
      return
    }

    const newPlayerScore = st.player.score + 1
    const isGameOver = newPlayerScore >= st.settings.targetScore
    set({
      phase: 'fold_result',
      foldedBy: 'opponent',
      roundWinner: 'player',
      gameWinner: isGameOver ? 'player' : null,
      opponent: { ...st.opponent, foldsUsed: newFoldsUsed },
      player: { ...st.player, score: newPlayerScore },
    })
  },

  revealNextCommunityCard: () => {
    set((st) => {
      const next = st.revealedCommunityCount + 1
      if (next > 5) return {}

      const allPlayerCards = [...st.player.hand, ...st.communityCards.slice(0, next)]
      const allOpponentCards = [...st.opponent.hand, ...st.communityCards.slice(0, next)]

      return {
        revealedCommunityCount: next,
        player: { ...st.player, handResult: evaluateBestHand(allPlayerCards) },
        opponent: { ...st.opponent, handResult: evaluateBestHand(allOpponentCards) },
      }
    })
  },

  resolveShowdown: () => {
    const { player, opponent, settings, communityCards } = get()

    let playerHandResult = player.handResult
    let opponentHandResult = opponent.handResult
    if (settings.mode === 'B') {
      playerHandResult = evaluateBestHand([...player.hand, ...communityCards])
      opponentHandResult = evaluateBestHand([...opponent.hand, ...communityCards])
    }

    if (!playerHandResult || !opponentHandResult) return

    const cmp = compareHands(playerHandResult, opponentHandResult)
    const roundWinner = cmp > 0 ? 'player' : cmp < 0 ? 'opponent' : 'draw'
    const finalPlayer = playerHandResult
    const finalOpponent = opponentHandResult

    set((st) => {
      const newPlayerScore = st.player.score + (roundWinner === 'player' ? 1 : 0)
      const newOpponentScore = st.opponent.score + (roundWinner === 'opponent' ? 1 : 0)
      const gameWinner =
        newPlayerScore >= settings.targetScore
          ? 'player'
          : newOpponentScore >= settings.targetScore
            ? 'opponent'
            : null

      return {
        roundWinner,
        phase: gameWinner ? 'game_over' : 'round_result',
        gameWinner,
        foldedBy: null,
        revealedCommunityCount: settings.mode === 'B' ? 5 : st.revealedCommunityCount,
        player: { ...st.player, score: newPlayerScore, handResult: finalPlayer },
        opponent: { ...st.opponent, score: newOpponentScore, handResult: finalOpponent },
      }
    })
  },

  continueFold: () => {
    const { foldedBy, player, opponent, settings, gameWinner } = get()

    if (gameWinner) {
      set({ phase: 'game_over' })
      return
    }

    const foldsUsed = foldedBy === 'player' ? player.foldsUsed : opponent.foldsUsed
    const isLastFold = foldsUsed >= settings.maxFolds

    if (isLastFold) {
      get().nextRound()
      return
    }

    // 非最終フォールド：フォールド残数を保持したまま新しい手を配る
    const { communityCards, playerHand, opponentHand, playerResult, opponentResult } = dealNewCards(settings)
    set({
      phase: 'playing',
      communityCards,
      revealedCommunityCount: 0,
      roundWinner: null,
      foldedBy: null,
      player: { ...player, hand: playerHand, hasDeclared: false, handResult: playerResult, isExchanging: false },
      opponent: { ...opponent, hand: opponentHand, hasDeclared: false, handResult: opponentResult, isExchanging: false },
    })
  },

  nextRound: () => {
    get().dealRound()
  },

  resetGame: () => {
    set({
      phase: 'idle',
      communityCards: [],
      revealedCommunityCount: 0,
      roundWinner: null,
      gameWinner: null,
      foldedBy: null,
      player: defaultPlayer(),
      opponent: defaultPlayer(),
    })
  },

  startCountdown: () => {
    const { settings } = get()
    set({ countdownRemaining: settings.countdownSeconds })
  },

  tickCountdown: () => {
    const st = get()
    const next = st.countdownRemaining - 1

    if (next <= 0 && st.phase === 'player_declared') {
      set({ countdownRemaining: 0 })
      if (st.settings.matchType !== 'online') get().cpuAccept()
      return
    }

    if (next <= 0 && st.phase === 'opponent_declared') {
      if (st.settings.matchType === 'online') {
        set({ countdownRemaining: 0 })
        return
      }
      const newFoldsUsed = st.player.foldsUsed + 1
      const outOfFolds = newFoldsUsed >= st.settings.maxFolds

      if (!outOfFolds) {
        set({
          countdownRemaining: 0,
          phase: 'fold_result',
          foldedBy: 'player',
          player: { ...st.player, foldsUsed: newFoldsUsed },
        })
        return
      }

      const newOpponentScore = st.opponent.score + 1
      const isGameOver = newOpponentScore >= st.settings.targetScore
      set({
        countdownRemaining: 0,
        phase: 'fold_result',
        foldedBy: 'player',
        roundWinner: 'opponent',
        gameWinner: isGameOver ? 'opponent' : null,
        player: { ...st.player, foldsUsed: newFoldsUsed },
        opponent: { ...st.opponent, score: newOpponentScore },
      })
      return
    }

    set({ countdownRemaining: Math.max(0, next) })
  },

  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (v) => set({ isHost: v }),
  applyRemoteState: (partial) => set(partial),
}))
