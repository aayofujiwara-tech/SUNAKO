import { motion, AnimatePresence } from 'framer-motion'
import type { GamePhase } from '@/types'

interface Props {
  phase: GamePhase
}

const MESSAGES: Partial<Record<GamePhase, string>> = {
  player_declared: '宣言しました！相手の返答を待っています…',
  opponent_declared: '相手が宣言！ 受けるかフォールドを選んでください',
  showdown: '役比べ！',
}

export function StatusBanner({ phase }: Props) {
  const msg = MESSAGES[phase]
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          key={phase}
          className="text-center bg-casino-gold/10 border border-casino-gold/30 rounded-lg px-4 py-2 text-sm text-casino-gold font-medium"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
