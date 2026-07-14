import { PlayingCard, CardBack } from './PlayingCard'
import type { PlayingCard as PlayingCardType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  cards: PlayingCardType[]
  revealedCount: number
  highlightCards?: PlayingCardType[]
  small?: boolean
  fluid?: boolean
  /** カード1枚あたりの横幅上限 */
  maxWClass?: string
  /** カード1枚あたりの高さ上限 */
  maxHClass?: string
}

export function CommunityCards({ cards, revealedCount, highlightCards = [], small, fluid, maxWClass, maxHClass }: Props) {
  const highlightIds = new Set(highlightCards.map((c) => c.id))

  const isFluid = fluid || Boolean(maxWClass)
  const wrapperClass = maxWClass
    ? `flex-1 min-w-0 ${maxWClass}`
    : isFluid
    ? 'flex-1 min-w-8 max-w-14 sm:min-w-12 sm:max-w-20 md:min-w-16 md:max-w-28 lg:min-w-20 lg:max-w-36'
    : undefined

  return (
    <div className={`flex flex-col items-center gap-1 ${isFluid ? 'w-full' : ''}`}>
      <p className="text-xs text-white/60 uppercase tracking-wider">コミュニティカード</p>
      <div className={isFluid ? 'w-full flex flex-nowrap justify-center gap-1.5' : 'flex gap-1.5 justify-center'}>
        {Array.from({ length: 5 }, (_, i) => {
          const card = cards[i]
          const revealed = i < revealedCount
          return (
            <motion.div
              key={i}
              className={wrapperClass}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {revealed && card ? (
                <PlayingCard card={card} small={small} fluid={isFluid} maxHClass={maxHClass} highlighted={highlightIds.has(card.id)} />
              ) : (
                <CardBack small={small} fluid={isFluid} maxHClass={maxHClass} />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
