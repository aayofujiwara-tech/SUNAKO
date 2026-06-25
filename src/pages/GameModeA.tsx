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

export function GameModeA() {
  const navigate = useNavigate()
  const store = useGameStore()
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCpuTimer = () => {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)
  }

  // CPU turn logic
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
          // Wait for exchange animation to finish before re-evaluating
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
        // ツーペア以上：交換なし、すぐ受ける
        cpuTimerRef.current = setTimeout(() => {
          if (useGameStore.getState().phase !== 'player_declared') return
          useGameStore.getState().cpuAccept()
        }, totalMs * 0.15)
      } else if (initialValue === 2) {
        // ワンペア：1回交換して判断
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
        // ハイカード easy：1回だけ70%で交換
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
        // ハイカード normal：最大2回（30%・60%）
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
        // ハイカード hard：ギリギリまで連続交換
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

  // Start game on mount
  useEffect(() => {
    store.setSettings({ mode: 'A' })
    store.startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trigger CPU after phase changes
  useEffect(() => {
    const { phase, settings } = store
    if (settings.matchType !== 'cpu') return
    if (phase === 'playing' || phase === 'player_declared') {
      runCpuTurn(phase)
    }
    return clearCpuTimer
  }, [store.phase, runCpuTurn])

  const handleNext = () => {
    if (store.gameWinner) {
      navigate('/')
    } else {
      store.nextRound()
    }
  }

  const showResult = store.phase === 'round_result' || store.phase === 'game_over'
  const showHand = store.phase === 'playing' || store.phase === 'player_declared'

  return (
    <div className="min-h-dvh bg-casino-bg text-white flex flex-col">
      <div className="flex-none px-4 pt-3">
        <button onClick={() => navigate('/')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← タイトル
        </button>
      </div>

      {/* 相手エリア */}
      <section className="flex-none p-4 flex flex-col items-center gap-3 border-b border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-wider">
          {store.settings.matchType === 'cpu' ? 'CPU' : '相手'}
          {store.settings.matchType === 'cpu' &&
            ` (${store.settings.cpuDifficulty === 'easy' ? '易' : store.settings.cpuDifficulty === 'normal' ? '普' : '難'})`}
        </p>
        <CardHand
          cards={store.opponent.hand}
          faceDown
          isShuffling={store.opponent.isExchanging}
          label={`手札 ${store.opponent.hand.length}枚`}
        />
        {store.opponent.isExchanging && (
          <p className="text-xs text-white/40 animate-pulse">交換中…</p>
        )}
        {store.phase === 'opponent_declared' && (
          <p className="text-sm font-semibold text-red-400 animate-pulse">⚠ 宣言！</p>
        )}
      </section>

      {/* 中央スコアエリア */}
      <section className="flex-none p-3 flex justify-center">
        <ScorePanel
          playerScore={store.player.score}
          opponentScore={store.opponent.score}
          playerFolds={store.player.foldsUsed}
          opponentFolds={store.opponent.foldsUsed}
          maxFolds={store.settings.maxFolds}
          targetScore={store.settings.targetScore}
        />
      </section>

      {/* 自分エリア */}
      <section className="flex-1 p-4 flex flex-col items-center gap-3">
        <StatusBanner phase={store.phase} />
        <HandDisplay handResult={store.player.handResult} visible={showHand} />
        <CardHand
          cards={store.player.hand}
          highlightCards={showHand ? (store.player.handResult?.bestFive ?? []) : []}
          label={`手札 ${store.player.hand.length}枚`}
        />
      </section>

      {/* アクションボタン */}
      <section className="flex-none p-4 border-t border-white/10">
        <ActionButtons
          phase={store.phase}
          playerFoldsUsed={store.player.foldsUsed}
          maxFolds={store.settings.maxFolds}
          onExchange={store.playerExchange}
          onDeclare={store.playerDeclare}
          onAccept={store.playerAccept}
          onFold={store.playerFold}
          disabled={store.phase === 'showdown' || showResult}
        />
      </section>

      {store.phase === 'fold_result' && store.foldedBy && (
        <FoldNotification
          foldedBy={store.foldedBy}
          foldsUsed={store.foldedBy === 'player' ? store.player.foldsUsed : store.opponent.foldsUsed}
          maxFolds={store.settings.maxFolds}
          onClose={store.continueFold}
        />
      )}

      {/* ラウンド結果 */}
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
