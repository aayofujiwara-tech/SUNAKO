import { motion } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  foldedBy: 'player' | 'opponent'
  foldsUsed: number
  maxFolds: number
  onClose: () => void
}

const AUTO_CLOSE_MS = 2500

export function FoldNotification({ foldedBy, foldsUsed, maxFolds, onClose }: Props) {
  const isLastFold = foldsUsed >= maxFolds
  const remaining = maxFolds - foldsUsed

  useEffect(() => {
    const t = setTimeout(onClose, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-casino-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-3 text-center"
      >
        <p className="text-xl font-bold text-white">
          {foldedBy === 'opponent' ? '相手がフォールドしました' : 'あなたがフォールドしました'}
        </p>

        {isLastFold ? (
          <>
            <p className="text-sm text-white/50">フォールド上限に達しました</p>
            <p className="text-lg font-semibold text-casino-gold">
              {foldedBy === 'opponent' ? 'あなたに勝利点 +1' : '相手に勝利点 +1'}
            </p>
          </>
        ) : (
          <p className="text-sm text-white/50">
            フォールド残り <span className="text-white font-semibold">{remaining}</span> 回
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
