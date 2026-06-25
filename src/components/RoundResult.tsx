import { motion } from 'framer-motion'
import { CardHand } from './CardHand'
import { Button } from './ui/button'
import type { PlayerState } from '@/types'

interface Props {
  roundWinner: 'player' | 'opponent' | 'draw' | null
  player: PlayerState
  opponent: PlayerState
  onNext: () => void
  isGameOver: boolean
  gameWinner: 'player' | 'opponent' | null
}

export function RoundResult({ roundWinner, player, opponent, onNext, isGameOver, gameWinner }: Props) {
  const resultLabel =
    roundWinner === 'player' ? 'あなたの勝ち！' : roundWinner === 'opponent' ? '相手の勝ち' : '引き分け'
  const resultColor =
    roundWinner === 'player' ? 'text-casino-gold' : roundWinner === 'opponent' ? 'text-red-400' : 'text-white/70'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-casino-surface border border-white/10 rounded-2xl p-6 max-w-lg w-full flex flex-col gap-5"
      >
        {isGameOver && gameWinner && (
          <div className="text-center">
            <p className="text-white/60 text-sm uppercase tracking-widest mb-1">ゲーム終了</p>
            <p className={`text-4xl font-bold ${gameWinner === 'player' ? 'text-casino-gold' : 'text-red-400'}`}>
              {gameWinner === 'player' ? '🏆 あなたの勝利！' : '敗北…'}
            </p>
          </div>
        )}

        <p className={`text-2xl font-bold text-center ${resultColor}`}>{resultLabel}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-white/50 uppercase">相手の手</p>
            {opponent.handResult && (
              <span className="text-xs bg-white/10 rounded px-2 py-0.5 text-white">{opponent.handResult.name}</span>
            )}
            <CardHand cards={opponent.hand} highlightCards={opponent.handResult?.bestFive ?? []} small />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-white/50 uppercase">あなたの手</p>
            {player.handResult && (
              <span className="text-xs bg-white/10 rounded px-2 py-0.5 text-white">{player.handResult.name}</span>
            )}
            <CardHand
              cards={player.hand}
              highlightCards={player.handResult?.bestFive ?? []}
              small
            />
          </div>
        </div>

        <Button variant="default" size="lg" onClick={onNext} className="w-full">
          {isGameOver ? 'トップに戻る' : '次のラウンド →'}
        </Button>
      </motion.div>
    </motion.div>
  )
}
