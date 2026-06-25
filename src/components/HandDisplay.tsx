import { motion, AnimatePresence } from 'framer-motion'
import type { HandResult } from '@/types'

interface Props {
  handResult: HandResult | null
  visible: boolean // 自分だけが見られる
}

export function HandDisplay({ handResult, visible }: Props) {
  if (!visible || !handResult) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="text-center"
      >
        <span className="inline-block bg-casino-gold/20 text-casino-gold border border-casino-gold/40 rounded-full px-4 py-1 text-sm font-semibold">
          {handResult.name}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
