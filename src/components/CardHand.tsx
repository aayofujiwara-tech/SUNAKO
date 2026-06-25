import { PlayingCard, CardBack } from './PlayingCard'
import type { PlayingCard as PlayingCardType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  cards: PlayingCardType[]
  faceDown?: boolean
  highlightCards?: PlayingCardType[]
  small?: boolean
  label?: string
}

export function CardHand({ cards, faceDown = false, highlightCards = [], small = false, label }: Props) {
  const highlightIds = new Set(highlightCards.map((c) => c.id))

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className="text-xs text-white/60 uppercase tracking-wider">{label}</p>}
      <div className="flex flex-wrap justify-center gap-1.5">
        {cards.map((card, i) =>
          faceDown ? (
            <motion.div key={i} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <CardBack small={small} />
            </motion.div>
          ) : (
            <motion.div key={card.id} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <PlayingCard card={card} highlighted={highlightIds.has(card.id)} small={small} />
            </motion.div>
          ),
        )}
      </div>
    </div>
  )
}
