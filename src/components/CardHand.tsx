import { PlayingCard, CardBack } from './PlayingCard'
import type { PlayingCard as PlayingCardType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  cards: PlayingCardType[]
  faceDown?: boolean
  highlightCards?: PlayingCardType[]
  small?: boolean
  nowrap?: boolean
  label?: string
  isShuffling?: boolean
}

export function CardHand({ cards, faceDown = false, highlightCards = [], small = false, nowrap = false, label, isShuffling = false }: Props) {
  const highlightIds = new Set(highlightCards.map((c) => c.id))

  return (
    <div className={`flex flex-col items-center gap-1 ${nowrap ? 'w-full' : ''}`}>
      {label && <p className="text-xs text-white/60 uppercase tracking-wider">{label}</p>}
      <motion.div
        className={nowrap ? 'flex flex-nowrap w-full gap-1' : 'flex flex-wrap justify-center gap-1.5'}
        animate={{ opacity: isShuffling ? 0.15 : 1, scale: isShuffling ? 0.85 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {cards.map((card, i) =>
          faceDown ? (
            <motion.div
              key={i}
              className={nowrap ? 'flex-1 min-w-8 max-w-14 sm:min-w-12 sm:max-w-20 md:min-w-16 md:max-w-28 lg:min-w-20 lg:max-w-36' : undefined}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <CardBack small={small} fluid={nowrap} />
            </motion.div>
          ) : (
            <motion.div
              key={card.id}
              className={nowrap ? 'flex-1 min-w-8 max-w-14 sm:min-w-12 sm:max-w-20 md:min-w-16 md:max-w-28 lg:min-w-20 lg:max-w-36' : undefined}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <PlayingCard card={card} highlighted={highlightIds.has(card.id)} small={small} fluid={nowrap} />
            </motion.div>
          ),
        )}
      </motion.div>
    </div>
  )
}
