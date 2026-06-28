import { PlayingCard, CardBack } from './PlayingCard'
import type { PlayingCard as PlayingCardType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  cards: PlayingCardType[]
  revealedCount: number
  highlightCards?: PlayingCardType[]
  small?: boolean
  fluid?: boolean
}

export function CommunityCards({ cards, revealedCount, highlightCards = [], small, fluid }: Props) {
  const highlightIds = new Set(highlightCards.map((c) => c.id))

  return (
    <div className={`flex flex-col items-center gap-1 ${fluid ? 'w-full' : ''}`}>
      <p className="text-xs text-white/60 uppercase tracking-wider">コミュニティカード</p>
      <div className={fluid ? 'w-full flex flex-nowrap justify-center gap-1.5' : 'flex gap-1.5 justify-center'}>
        {Array.from({ length: 5 }, (_, i) => {
          const card = cards[i]
          const revealed = i < revealedCount
          return (
            <motion.div
              key={i}
              className={fluid ? 'flex-1 min-w-8 max-w-14 sm:min-w-12 sm:max-w-20 md:min-w-16 md:max-w-28 lg:min-w-20 lg:max-w-36' : undefined}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {revealed && card ? (
                <PlayingCard card={card} small={small} fluid={fluid} highlighted={highlightIds.has(card.id)} />
              ) : (
                <CardBack small={small} fluid={fluid} />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
