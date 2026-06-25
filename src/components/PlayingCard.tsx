import { motion } from 'framer-motion'
import type { PlayingCard as PlayingCardType } from '@/types'
import { rankLabel, suitSymbol, isRedSuit } from '@/lib/cards'
import { cn } from '@/lib/utils'

interface Props {
  card?: PlayingCardType
  faceDown?: boolean
  highlighted?: boolean
  small?: boolean
  className?: string
}

export function PlayingCard({ card, faceDown = false, highlighted = false, small = false, className }: Props) {
  const base = small
    ? 'w-10 h-14 text-xs rounded-md'
    : 'w-16 h-24 text-sm rounded-lg'

  if (faceDown || !card) {
    return (
      <motion.div
        initial={{ rotateY: 180 }}
        animate={{ rotateY: 0 }}
        className={cn(
          base,
          'flex items-center justify-center bg-casino-card-back border border-white/20 shadow-md',
          highlighted && 'ring-2 ring-casino-gold',
          className,
        )}
      >
        <div className="w-full h-full rounded-md bg-[repeating-linear-gradient(45deg,#1a472a,#1a472a_4px,#1d5030_4px,#1d5030_8px)]" />
      </motion.div>
    )
  }

  const red = isRedSuit(card.suit)

  return (
    <motion.div
      initial={{ rotateY: 90 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        base,
        'flex flex-col justify-between p-1 bg-white border border-gray-200 shadow-md select-none',
        red ? 'text-red-600' : 'text-gray-900',
        highlighted && 'ring-2 ring-casino-gold ring-offset-1',
        className,
      )}
    >
      <div className="flex flex-col items-start leading-none">
        <span className="font-bold">{rankLabel(card.rank)}</span>
        <span>{suitSymbol(card.suit)}</span>
      </div>
      <div className="flex items-center justify-center text-2xl leading-none">
        {suitSymbol(card.suit)}
      </div>
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className="font-bold">{rankLabel(card.rank)}</span>
        <span>{suitSymbol(card.suit)}</span>
      </div>
    </motion.div>
  )
}

export function CardBack({ small, className }: { small?: boolean; className?: string }) {
  return <PlayingCard faceDown small={small} className={className} />
}
