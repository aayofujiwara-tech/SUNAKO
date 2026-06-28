import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { CardHand } from '@/components/CardHand'
import { ScorePanel } from '@/components/ScorePanel'
import { ActionButtons } from '@/components/ActionButtons'
import { HandDisplay } from '@/components/HandDisplay'
import { RoundResult } from '@/components/RoundResult'
import { FoldNotification } from '@/components/FoldNotification'
import { StatusBanner } from '@/components/StatusBanner'
import { cpuDecideAction, cpuThinkTime } from '@/lib/cpu'
import { CPU_EXCHANGE_ANIMATION_MS } from '@/stores/gameStore'
import { subscribeRoom, updateRoom } from '@/lib/firebase'
import { drawRandom, drawRandomExcluding } from '@/lib/cards'
import { evaluateBestHand, compareHands } from '@/lib/handEvaluator'
import type { PlayingCard, RoomState } from '@/types'

export function GameModeA() {
  const navigate = useNavigate()
  const store = useGameStore()
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCpuTimer = () => {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)
  }

  const isOnline = store.settings.matchType === 'online'

  const runCpuTurn = useCallback((triggerPhase: string) => {
    const { opponent, settings } = useGameStore.getState()
    if (settings.matchType !== 'cpu') return

    if (triggerPhase === 'playing') {
      const { player } = useGameStore.getState()
      const decision = cpuDecideAction({ cpuState: opponent, playerHasDeclared: false, settings, cpuExchangeCount: 0, playerFoldsUsed: player.foldsUsed })
      const delay = cpuThinkTime(settings.cpuDifficulty)
      clearCpuTimer()
      cpuTimerRef.current = setTimeout(() => {
        const { phase: p } = useGameStore.getState()
        if (p !== 'playing') return
        if (decision === 'exchange') {
          useGameStore.getState().cpuExchange()
          const followUpDelay = Math.max(cpuThinkTime(settings.cpuDifficulty), CPU_EXCHANGE_ANIMATION_MS + 100)
          setTimeout(() => {
            const { phase: p2, settings: s2, opponent: o2, player: plr2 } = useGameStore.getState()
            if (p2 !== 'playing') return
            const d2 = cpuDecideAction({ cpuState: o2, playerHasDeclared: false, settings: s2, cpuExchangeCount: 1, playerFoldsUsed: plr2.foldsUsed })
            if (d2 === 'declare') useGameStore.getState().cpuDeclare()
          }, followUpDelay)
        } else if (decision === 'declare') {
          useGameStore.getState().cpuDeclare()
        }
      }, delay)
    } else if (triggerPhase === 'player_declared') {
      const { opponent: opp, countdownRemaining } = useGameStore.getState()
      const totalMs = countdownRemaining * 1000
      const ANIM_MS = 600
      const MIN_REMAINING_MS = 1500
      clearCpuTimer()

      const decideNow = (hasExchanged: boolean) => {
        const { phase: p, opponent: o, settings: s } = useGameStore.getState()
        if (p !== 'player_declared') return
        const d = cpuDecideAction({ cpuState: o, playerHasDeclared: true, settings: s, hasExchanged })
        if (d === 'accept') useGameStore.getState().cpuAccept()
        else useGameStore.getState().cpuFold()
      }

      const initialValue = opp.handResult?.value ?? 0

      if (initialValue >= 3) {
        cpuTimerRef.current = setTimeout(() => {
          if (useGameStore.getState().phase !== 'player_declared') return
          useGameStore.getState().cpuAccept()
        }, totalMs * 0.15)
      } else if (initialValue === 2) {
        const ratio = settings.cpuDifficulty === 'hard' ? 0.80 : 0.70
        if (totalMs * (1 - ratio) > MIN_REMAINING_MS) {
          cpuTimerRef.current = setTimeout(() => {
            if (useGameStore.getState().phase !== 'player_declared') return
            useGameStore.getState().cpuExchange()
            setTimeout(() => decideNow(true), ANIM_MS)
          }, totalMs * ratio)
        } else {
          cpuTimerRef.current = setTimeout(() => decideNow(false), totalMs * ratio)
        }
      } else if (settings.cpuDifficulty === 'easy') {
        if (totalMs * 0.30 > MIN_REMAINING_MS) {
          cpuTimerRef.current = setTimeout(() => {
            if (useGameStore.getState().phase !== 'player_declared') return
            useGameStore.getState().cpuExchange()
            setTimeout(() => decideNow(true), ANIM_MS)
          }, totalMs * 0.70)
        } else {
          cpuTimerRef.current = setTimeout(() => decideNow(false), totalMs * 0.20)
        }
      } else if (settings.cpuDifficulty === 'normal') {
        const startTime = Date.now()
        cpuTimerRef.current = setTimeout(() => {
          if (useGameStore.getState().phase !== 'player_declared') return
          useGameStore.getState().cpuExchange()
          setTimeout(() => {
            const { phase: p2, opponent: o2 } = useGameStore.getState()
            if (p2 !== 'player_declared') return
            if ((o2.handResult?.value ?? 0) >= 3) { useGameStore.getState().cpuAccept(); return }
            const secondDelay = Math.max(0, totalMs * 0.60 - (Date.now() - startTime))
            setTimeout(() => {
              if (useGameStore.getState().phase !== 'player_declared') return
              useGameStore.getState().cpuExchange()
              setTimeout(() => decideNow(true), ANIM_MS)
            }, secondDelay)
          }, ANIM_MS)
        }, totalMs * 0.30)
      } else {
        const startTime = Date.now()
        const tryExchange = (count: number) => {
          if (useGameStore.getState().phase !== 'player_declared') return
          useGameStore.getState().cpuExchange()
          setTimeout(() => {
            const { phase: p, opponent: o } = useGameStore.getState()
            if (p !== 'player_declared') return
            const newValue = o.handResult?.value ?? 0
            const remaining = totalMs - (Date.now() - startTime)
            if (newValue >= 3) { useGameStore.getState().cpuAccept(); return }
            if (remaining <= MIN_REMAINING_MS + ANIM_MS + 400 || count >= 10) {
              decideNow(true)
            } else {
              setTimeout(() => tryExchange(count + 1), 300)
            }
          }, ANIM_MS)
        }
        cpuTimerRef.current = setTimeout(() => tryExchange(0), 500)
      }
    }
  }, [])

  // ---- Online action handlers ----

  const onlineExchange = async () => {
    const { roomCode, isHost, player } = useGameStore.getState()
    const newHand = drawRandom(7)
    const handResult = evaluateBestHand(newHand)
    const myKey = isHost ? 'host' : 'guest'
    await updateRoom(roomCode!, { [myKey]: { ...player, hand: newHand, handResult, isExchanging: false } })
  }

  const onlineDeclare = async () => {
    const { roomCode, isHost, player } = useGameStore.getState()
    const fbPhase = isHost ? 'player_declared' : 'opponent_declared'
    const myKey = isHost ? 'host' : 'guest'
    await updateRoom(roomCode!, {
      phase: fbPhase,
      [myKey]: { ...player, hasDeclared: true },
      countdownStartAt: Date.now(),
    })
  }

  const onlineAccept = async () => {
    const { roomCode, isHost, player, opponent, settings } = useGameStore.getState()
    const playerResult = evaluateBestHand(player.hand)
    const opponentResult = evaluateBestHand(opponent.hand)
    const cmp = compareHands(playerResult, opponentResult)
    const localWinner = cmp > 0 ? 'player' : cmp < 0 ? 'opponent' : 'draw'
    const newPlayerScore = player.score + (localWinner === 'player' ? 1 : 0)
    const newOpponentScore = opponent.score + (localWinner === 'opponent' ? 1 : 0)
    const fbWinner: 'host' | 'guest' | 'draw' = localWinner === 'draw' ? 'draw'
      : localWinner === 'player' ? (isHost ? 'host' : 'guest')
      : (isHost ? 'guest' : 'host')
    const newHostScore = isHost ? newPlayerScore : newOpponentScore
    const newGuestScore = isHost ? newOpponentScore : newPlayerScore
    const fbGameWinner: 'host' | 'guest' | null =
      newHostScore >= settings.targetScore ? 'host'
      : newGuestScore >= settings.targetScore ? 'guest'
      : null
    await updateRoom(roomCode!, {
      phase: fbGameWinner ? 'game_over' : 'round_result',
      host: isHost ? { ...player, score: newPlayerScore, handResult: playerResult } : { ...opponent, score: newOpponentScore, handResult: opponentResult },
      guest: isHost ? { ...opponent, score: newOpponentScore, handResult: opponentResult } : { ...player, score: newPlayerScore, handResult: playerResult },
      roundWinner: fbWinner,
      gameWinner: fbGameWinner,
      foldedBy: null,
      countdownStartAt: null,
    })
  }

  const onlineFold = async () => {
    const { roomCode, isHost, player, opponent, settings } = useGameStore.getState()
    const newFoldsUsed = player.foldsUsed + 1
    const outOfFolds = newFoldsUsed >= settings.maxFolds
    const fbFoldedBy: 'host' | 'guest' = isHost ? 'host' : 'guest'
    const myKey = isHost ? 'host' : 'guest'
    const theirKey = isHost ? 'guest' : 'host'
    const updatedMe = { ...player, foldsUsed: newFoldsUsed }
    if (!outOfFolds) {
      await updateRoom(roomCode!, { phase: 'fold_result', foldedBy: fbFoldedBy, [myKey]: updatedMe, countdownStartAt: null })
      return
    }
    const newOpponentScore = opponent.score + 1
    const fbGameWinner: 'host' | 'guest' | null = isHost
      ? (newOpponentScore >= settings.targetScore ? 'guest' : null)
      : (newOpponentScore >= settings.targetScore ? 'host' : null)
    await updateRoom(roomCode!, {
      phase: 'fold_result',
      foldedBy: fbFoldedBy,
      roundWinner: isHost ? 'guest' : 'host',
      gameWinner: fbGameWinner,
      [myKey]: updatedMe,
      [theirKey]: { ...opponent, score: newOpponentScore },
      countdownStartAt: null,
    })
  }

  // ホストのみ次の手を配る
  const onlineDealNext = async (resetFolds: boolean) => {
    const { roomCode, isHost, player, opponent } = useGameStore.getState()
    if (!isHost) return
    const newHostHand = drawRandom(7)
    const usedIds = new Set(newHostHand.map((c: PlayingCard) => c.id))
    const newGuestHand = drawRandomExcluding(7, usedIds)
    const hostPlayer = isHost ? player : opponent
    const guestPlayer = isHost ? opponent : player
    await updateRoom(roomCode!, {
      phase: 'playing',
      host: { ...hostPlayer, hand: newHostHand, handResult: evaluateBestHand(newHostHand), hasDeclared: false, isExchanging: false, ...(resetFolds ? { foldsUsed: 0 } : {}) },
      guest: { ...guestPlayer, hand: newGuestHand, handResult: evaluateBestHand(newGuestHand), hasDeclared: false, isExchanging: false, ...(resetFolds ? { foldsUsed: 0 } : {}) },
      communityCards: [],
      revealedCommunityCount: 0,
      roundWinner: null,
      foldedBy: null,
      countdownStartAt: null,
    })
  }

  const onlineContinueFold = async () => {
    const { gameWinner, foldedBy, player, opponent, settings } = useGameStore.getState()
    if (!useGameStore.getState().isHost) return
    if (gameWinner) {
      await updateRoom(useGameStore.getState().roomCode!, { phase: 'game_over' })
      return
    }
    const folderFoldsUsed = foldedBy === 'player' ? player.foldsUsed : opponent.foldsUsed
    await onlineDealNext(folderFoldsUsed >= settings.maxFolds)
  }

  // Firebase subscription → local store を同期
  function applyRoomState(room: RoomState) {
    const ih = useGameStore.getState().isHost
    const myState = ih ? room.host : room.guest
    const theirState = ih ? room.guest : room.host

    let localPhase = room.phase
    if (!ih) {
      if (room.phase === 'player_declared') localPhase = 'opponent_declared'
      else if (room.phase === 'opponent_declared') localPhase = 'player_declared'
    }

    const mapW = (w: 'host' | 'guest' | 'draw' | null) => {
      if (!w) return null
      if (w === 'draw') return 'draw' as const
      return w === (ih ? 'host' : 'guest') ? 'player' as const : 'opponent' as const
    }
    const mapF = (f: 'host' | 'guest' | null) => {
      if (!f) return null
      return f === (ih ? 'host' : 'guest') ? 'player' as const : 'opponent' as const
    }

    let countdownRemaining = useGameStore.getState().countdownRemaining
    if (room.countdownStartAt && (localPhase === 'player_declared' || localPhase === 'opponent_declared')) {
      const elapsed = Math.floor((Date.now() - room.countdownStartAt) / 1000)
      countdownRemaining = Math.max(0, room.settings.countdownSeconds - elapsed)
    } else if (localPhase === 'playing') {
      countdownRemaining = 0
    }

    useGameStore.getState().applyRemoteState({
      phase: localPhase,
      player: myState,
      opponent: theirState,
      communityCards: room.communityCards ?? [],
      revealedCommunityCount: room.revealedCommunityCount ?? 0,
      roundWinner: mapW(room.roundWinner),
      gameWinner: mapW(room.gameWinner) as 'player' | 'opponent' | null,
      foldedBy: mapF(room.foldedBy ?? null),
      settings: room.settings,
      countdownRemaining,
    })
  }

  // マウント時：オンライン→Firebase購読、CPU→ゲーム開始
  useEffect(() => {
    useGameStore.getState().setSettings({ mode: 'A' })
    const { settings, roomCode } = useGameStore.getState()
    if (settings.matchType !== 'online') {
      useGameStore.getState().startGame()
      return
    }
    if (!roomCode) { navigate('/'); return }
    const unsub = subscribeRoom(roomCode, (room) => {
      if (!room) { navigate('/'); return }
      applyRoomState(room)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // CPU フェーズ変化に反応
  useEffect(() => {
    const { phase, settings } = store
    if (settings.matchType !== 'cpu') return
    if (phase === 'playing' || phase === 'player_declared') {
      runCpuTurn(phase)
    }
    return clearCpuTimer
  }, [store.phase, runCpuTurn])

  const handleNext = () => {
    if (isOnline) {
      if (store.gameWinner) { navigate('/'); return }
      onlineDealNext(true)
    } else {
      if (store.gameWinner) navigate('/')
      else store.nextRound()
    }
  }

  const showResult = store.phase === 'round_result' || store.phase === 'game_over'
  const showHand = store.phase === 'opponent_declared' || store.phase === 'round_result' || store.phase === 'game_over'

  return (
    <div className="h-dvh overflow-hidden bg-casino-bg text-white flex flex-col max-w-md mx-auto">
      <div className="flex-none px-4 pt-2 pb-1">
        <button onClick={() => navigate('/')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← タイトル
        </button>
      </div>

      {/* 相手エリア */}
      <section className="flex-none px-4 py-2 flex flex-col items-center gap-1 border-b border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-wider">
          {store.settings.matchType === 'cpu' ? 'CPU' : '相手'}
          {store.settings.matchType === 'cpu' &&
            ` (${store.settings.cpuDifficulty === 'easy' ? '易' : store.settings.cpuDifficulty === 'normal' ? '普' : '難'})`}
        </p>
        <CardHand cards={store.opponent.hand} faceDown nowrap isShuffling={store.opponent.isExchanging} />
        <p className="min-h-5 flex items-center justify-center text-center">
          {store.opponent.isExchanging
            ? <span className="text-xs text-white/40 animate-pulse">交換中…</span>
            : store.phase === 'opponent_declared'
            ? <span className="text-sm font-semibold text-red-400 animate-pulse">⚠ 宣言！</span>
            : null}
        </p>
      </section>

      {/* 中央スコアエリア */}
      <section className="flex-none px-4 py-1.5 flex justify-center">
        <ScorePanel
          playerScore={store.player.score}
          opponentScore={store.opponent.score}
          playerFolds={store.player.foldsUsed}
          opponentFolds={store.opponent.foldsUsed}
          maxFolds={store.settings.maxFolds}
          targetScore={store.settings.targetScore}
        />
      </section>

      {/* 自分エリア：残スペースを占有 */}
      <section className="flex-1 min-h-0 overflow-hidden px-4 py-2 flex flex-col items-center gap-1">
        <div className="flex-none w-full flex items-center justify-center">
          <StatusBanner phase={store.phase} />
        </div>
        <div className="flex-none w-full flex items-center justify-center">
          <HandDisplay handResult={store.player.handResult} visible={showHand} />
        </div>
        {/* 手札エリア：残高さを占有してカードを縦方向に中央寄せ */}
        <div className="flex-1 min-h-0 w-full flex items-center">
          <CardHand
            cards={store.player.hand}
            nowrap
            highlightCards={showHand ? (store.player.handResult?.bestFive ?? []) : []}
          />
        </div>
      </section>

      {/* アクションボタン */}
      <section className="flex-none p-4 border-t border-white/10">
        <ActionButtons
          phase={store.phase}
          playerFoldsUsed={store.player.foldsUsed}
          maxFolds={store.settings.maxFolds}
          onExchange={isOnline ? onlineExchange : store.playerExchange}
          onDeclare={isOnline ? onlineDeclare : store.playerDeclare}
          onAccept={isOnline ? onlineAccept : store.playerAccept}
          onFold={isOnline ? onlineFold : store.playerFold}
          disabled={store.phase === 'showdown' || showResult}
        />
      </section>

      {store.phase === 'fold_result' && store.foldedBy && (
        <FoldNotification
          foldedBy={store.foldedBy}
          foldsUsed={store.foldedBy === 'player' ? store.player.foldsUsed : store.opponent.foldsUsed}
          maxFolds={store.settings.maxFolds}
          onClose={isOnline ? onlineContinueFold : store.continueFold}
        />
      )}

      {showResult && (
        <RoundResult
          roundWinner={store.roundWinner}
          player={store.player}
          opponent={store.opponent}
          onNext={handleNext}
          isGameOver={store.phase === 'game_over'}
          gameWinner={store.gameWinner}
          foldedBy={store.foldedBy}
        />
      )}
    </div>
  )
}
