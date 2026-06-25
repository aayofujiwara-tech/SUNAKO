interface Props {
  playerScore: number
  opponentScore: number
  playerFolds: number
  opponentFolds: number
  maxFolds: number
  targetScore: number
}

export function ScorePanel({ playerScore, opponentScore, playerFolds, opponentFolds, maxFolds, targetScore }: Props) {
  return (
    <div className="flex items-center justify-center gap-6 bg-black/30 rounded-xl px-6 py-3 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-white/60 uppercase tracking-wider">相手</span>
        <span className="text-2xl font-bold text-white">{opponentScore}</span>
        <FoldPips used={opponentFolds} max={maxFolds} />
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-white/40">先取</span>
        <span className="text-3xl font-bold text-casino-gold">{targetScore}</span>
        <span className="text-xs text-white/40">ポイント</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-white/60 uppercase tracking-wider">あなた</span>
        <span className="text-2xl font-bold text-white">{playerScore}</span>
        <FoldPips used={playerFolds} max={maxFolds} />
      </div>
    </div>
  )
}

function FoldPips({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < used ? 'bg-red-500' : 'bg-white/30'}`}
          title={i < used ? 'フォールド済み' : 'フォールド残'}
        />
      ))}
    </div>
  )
}
