import { motion } from 'framer-motion'
import type { PlayingCard as PlayingCardType } from '@/types'
import { rankLabel, suitSymbol, isRedSuit } from '@/lib/cards'
import { cn } from '@/lib/utils'

interface Props {
  card?: PlayingCardType
  faceDown?: boolean
  highlighted?: boolean
  small?: boolean
  fluid?: boolean
  className?: string
}

export function PlayingCard({ card, faceDown = false, highlighted = false, small = false, fluid = false, className }: Props) {
  const base = fluid
    ? 'w-full aspect-[2/3] text-[10px] rounded-sm'
    : small
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
        <div className="w-full h-full rounded-sm bg-[repeating-linear-gradient(45deg,#1a472a,#1a472a_4px,#1d5030_4px,#1d5030_8px)]" />
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
        'flex flex-col p-0.5 bg-white border border-gray-200 shadow-md select-none',
        red ? 'text-red-600' : 'text-gray-900',
        highlighted && 'ring-2 ring-casino-gold ring-offset-1',
        className,
      )}
    >
      <div className="flex flex-col items-start leading-none">
        <span className="font-bold">{rankLabel(card.rank)}</span>
        <span>{suitSymbol(card.suit)}</span>
      </div>
      <div className={`flex-1 flex items-center justify-center leading-none ${fluid ? 'text-lg' : 'text-2xl'}`}>
        {suitSymbol(card.suit)}
      </div>
    </motion.div>
  )
}

export function CardBack({ small, fluid, className }: { small?: boolean; fluid?: boolean; className?: string }) {
  return <PlayingCard faceDown small={small} fluid={fluid} className={className} />
}
