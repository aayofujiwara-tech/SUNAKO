import { Button } from './ui/button'
import { CountdownBar } from './CountdownBar'
import { RefreshCw, Swords, Shield, CheckCircle } from 'lucide-react'
import type { GamePhase } from '@/types'

interface Props {
  phase: GamePhase
  playerFoldsUsed: number
  maxFolds: number
  onExchange: () => void
  onDeclare: () => void
  onAccept: () => void
  onFold: () => void
  disabled?: boolean
}

export function ActionButtons({
  phase,
  playerFoldsUsed,
  maxFolds,
  onExchange,
  onDeclare,
  onAccept,
  onFold,
  disabled = false,
}: Props) {
  const isOpponentDeclared = phase === 'opponent_declared'
  const isPlayerDeclared = phase === 'player_declared'
  const isPlaying = phase === 'playing'
  const canAct = isPlaying || isOpponentDeclared
  const foldsLeft = maxFolds - playerFoldsUsed
  const noFoldsLeft = foldsLeft <= 0

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      <CountdownBar active={isOpponentDeclared || isPlayerDeclared} />

      <div className="grid grid-cols-3 gap-2">
        {/* 交換 */}
        <Button
          variant="exchange"
          size="lg"
          disabled={disabled || (!isPlaying && !isOpponentDeclared)}
          onClick={onExchange}
          className="flex-col h-16 gap-1"
        >
          <RefreshCw size={18} />
          <span className="text-xs">交換</span>
        </Button>

        {/* 宣言 / 受ける */}
        {isOpponentDeclared ? (
          <Button
            variant="accept"
            size="lg"
            disabled={disabled}
            onClick={onAccept}
            className="flex-col h-16 gap-1"
          >
            <CheckCircle size={18} />
            <span className="text-xs">受ける</span>
          </Button>
        ) : (
          <Button
            variant="declare"
            size="lg"
            disabled={disabled || !canAct || isPlayerDeclared}
            onClick={onDeclare}
            className="flex-col h-16 gap-1"
          >
            <Swords size={18} />
            <span className="text-xs">宣言</span>
          </Button>
        )}

        {/* フォールド */}
        <Button
          variant="fold"
          size="lg"
          disabled={disabled || !isOpponentDeclared || noFoldsLeft}
          onClick={onFold}
          className="flex-col h-16 gap-1 relative"
        >
          <Shield size={18} />
          <span className="text-xs">フォールド</span>
          {!noFoldsLeft && (
            <span className="absolute top-1 right-1 text-[10px] bg-white/20 rounded px-1">残{foldsLeft}</span>
          )}
        </Button>
      </div>

      {isPlayerDeclared && (
        <p className="text-center text-sm text-casino-gold animate-pulse">
          相手の応答を待っています…
        </p>
      )}
    </div>
  )
}
