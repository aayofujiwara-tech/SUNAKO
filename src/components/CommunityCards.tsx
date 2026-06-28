import { PlayingCard, CardBack } from './PlayingCard'
import type { PlayingCard as PlayingCardType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  cards: PlayingCardType[]
  revealedCount: number
  highlightCards?: PlayingCardType[]
  small?: boolean
}

export function CommunityCards({ cards, revealedCount, highlightCards = [], small }: Props) {
  const highlightIds = new Set(highlightCards.map((c) => c.id))

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-white/60 uppercase tracking-wider">コミュニティカード</p>
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: 5 }, (_, i) => {
          const card = cards[i]
          const revealed = i < revealedCount
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {revealed && card ? (
                <PlayingCard card={card} small={small} highlighted={highlightIds.has(card.id)} />
              ) : (
                <CardBack small={small} />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
