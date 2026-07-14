import { PlayingCard, CardBack } from './PlayingCard'
import type { PlayingCard as PlayingCardType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  cards: PlayingCardType[]
  faceDown?: boolean
  highlightCards?: PlayingCardType[]
  small?: boolean
  /** 親エリアの高さ(cqh)にカードを自動追従させる */
  fluid?: boolean
  isShuffling?: boolean
}

export function CardHand({ cards, faceDown = false, highlightCards = [], small = false, fluid = false, isShuffling = false }: Props) {
  const highlightIds = new Set(highlightCards.map((c) => c.id))

  return (
    <div className={fluid ? 'flex flex-col items-center gap-1 w-full flex-1 min-h-0' : 'flex flex-col items-center gap-1'}>
      <motion.div
        className={fluid ? 'card-container flex flex-nowrap w-full flex-1 min-h-0 gap-1 justify-center' : 'flex flex-wrap justify-center gap-1.5'}
        animate={{ opacity: isShuffling ? 0.15 : 1, scale: isShuffling ? 0.85 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {cards.map((card, i) =>
          faceDown ? (
            <motion.div
              key={i}
              className={fluid ? 'flex-1 min-w-0 h-full flex items-center justify-center' : undefined}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <CardBack small={small} fluid={fluid} />
            </motion.div>
          ) : (
            <motion.div
              key={card.id}
              className={fluid ? 'flex-1 min-w-0 h-full flex items-center justify-center' : undefined}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <PlayingCard card={card} highlighted={highlightIds.has(card.id)} small={small} fluid={fluid} />
            </motion.div>
          ),
        )}
      </motion.div>
    </div>
  )
}
