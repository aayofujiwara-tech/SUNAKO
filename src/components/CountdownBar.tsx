import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'

interface Props {
  active: boolean
}

export function CountdownBar({ active }: Props) {
  const { countdownRemaining, settings, tickCountdown } = useGameStore()

  useEffect(() => {
    if (!active || countdownRemaining <= 0) return
    const id = setInterval(() => tickCountdown(), 1000)
    return () => clearInterval(id)
  }, [active, countdownRemaining, tickCountdown])

  const pct = active ? (countdownRemaining / settings.countdownSeconds) * 100 : 100
  const urgent = countdownRemaining <= 3

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-white/70">カウントダウン</span>
            <span className={`text-sm font-bold tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {countdownRemaining}s
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${urgent ? 'bg-red-500' : 'bg-emerald-400'}`}
              style={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
