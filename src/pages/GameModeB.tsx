import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { CardHand } from '@/components/CardHand'
import { CommunityCards } from '@/components/CommunityCards'
import { ScorePanel } from '@/components/ScorePanel'
import { ActionButtons } from '@/components/ActionButtons'
import { HandDisplay } from '@/components/HandDisplay'
import { RoundResult } from '@/components/RoundResult'
import { FoldNotification } from '@/components/FoldNotification'
import { StatusBanner } from '@/components/StatusBanner'
import { cpuDecideAction, cpuThinkTime } from '@/lib/cpu'

export function GameModeB() {
  const navigate = useNavigate()
  const store = useGameStore()
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const communityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)
    if (communityTimerRef.current) clearInterval(communityTimerRef.current)
  }

  const runCpuTurn = useCallback(() => {
    const { phase, opponent, settings, communityCards, revealedCommunityCount } = useGameStore.getState()
    if (settings.matchType !== 'cpu') return

    const decision = cpuDecideAction({
      cpuState: opponent,
      playerHasDeclared: phase === 'player_declared',
      settings,
      communityCards: communityCards.slice(0, revealedCommunityCount),
    })

    const delay = cpuThinkTime(settings.cpuDifficulty)
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)

    cpuTimerRef.current = setTimeout(() => {
      const { phase: currentPhase } = useGameStore.getState()
      if (currentPhase === 'playing') {
        if (decision === 'exchange') useGameStore.getState().cpuExchange()
        else if (decision === 'declare') useGameStore.getState().cpuDeclare()
      } else if (currentPhase === 'player_declared') {
        if (decision === 'accept') useGameStore.getState().cpuAccept()
        else useGameStore.getState().cpuFold()
      }
    }, delay)
  }, [])

  useEffect(() => {
    // mode を明示セットしてから開始（ページリフレッシュ時もデフォルト 'A' に戻らない）
    useGameStore.getState().setSettings({ mode: 'B' })
    useGameStore.getState().startGame()

    // コミュニティカードを時間経過で自動めくり（フェーズ変化に依存せず 1 本のタイマーで管理）
    const intervalMs = useGameStore.getState().settings.communityRevealInterval * 1000
    communityTimerRef.current = setInterval(() => {
      const { revealedCommunityCount, phase, settings } = useGameStore.getState()
      if (revealedCommunityCount >= 5) return
      if (phase === 'playing' || phase === 'player_declared' || phase === 'opponent_declared') {
        useGameStore.getState().revealNextCommunityCard()
        // コミュニティカードが増えるたびに CPU に再評価の機会を与える
        if (phase === 'playing' && settings.matchType === 'cpu') {
          runCpuTurn()
        }
      }
    }, intervalMs)

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const { phase, settings } = store
    if (settings.matchType !== 'cpu') return
    if (phase === 'playing' || phase === 'player_declared') runCpuTurn()
    return () => { if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current) }
  }, [store.phase, runCpuTurn])

  const handleNext = () => {
    if (store.gameWinner) {
      clearTimers()
      navigate('/')
    } else {
      // コミュニティタイマーはそのまま継続（nextRound で revealedCommunityCount が 0 にリセットされる）
      if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)
      store.nextRound()
    }
  }

  const showResult = store.phase === 'round_result' || store.phase === 'game_over'
  const showHand = store.phase === 'playing' || store.phase === 'player_declared'

  const highlightCards = showHand ? (store.player.handResult?.bestFive ?? []) : []

  return (
    <div className="min-h-dvh bg-casino-bg text-white flex flex-col">
      {/* 相手エリア */}
      <section className="flex-none p-4 flex flex-col items-center gap-2 border-b border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-wider">
          {store.settings.matchType === 'cpu' ? `CPU (${store.settings.cpuDifficulty})` : '相手'}
        </p>
        <CardHand cards={store.opponent.hand} faceDown small label="手札 2枚" />
        {store.phase === 'opponent_declared' && (
          <p className="text-sm font-semibold text-red-400 animate-pulse">⚠ 宣言！</p>
        )}
      </section>

      {/* コミュニティカード + スコア */}
      <section className="flex-none p-3 flex flex-col items-center gap-3">
        <CommunityCards
          cards={store.communityCards}
          revealedCount={store.revealedCommunityCount}
          highlightCards={highlightCards}
        />
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
          highlightCards={highlightCards}
          label="手札 2枚"
        />
        {store.revealedCommunityCount > 0 && (
          <p className="text-xs text-white/40">
            コミュニティ込みで最強5枚を自動選択中
          </p>
        )}
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
          disabled={showResult}
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

      {showResult && (
        <RoundResult
          roundWinner={store.roundWinner}
          player={store.player}
          opponent={store.opponent}
          onNext={handleNext}
          isGameOver={store.phase === 'game_over'}
          gameWinner={store.gameWinner}
          foldedBy={store.foldedBy}
          communityCards={store.communityCards}
        />
      )}
    </div>
  )
}
