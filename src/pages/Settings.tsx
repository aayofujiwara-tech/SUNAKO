import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm text-white/70">{label}</label>
        <span className="text-casino-gold font-bold tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-casino-gold h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-white/30">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const { settings, setSettings } = useGameStore()

  return (
    <div className="h-dvh overflow-hidden bg-casino-bg text-white flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">カスタムパラメータ</h1>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-8 max-w-md mx-auto w-full">
        <section className="flex flex-col gap-5">
          <h2 className="text-xs text-white/40 uppercase tracking-wider">両モード共通</h2>

          <Slider
            label="フォールド回数"
            value={settings.maxFolds}
            min={1}
            max={10}
            unit="回"
            onChange={(v) => setSettings({ maxFolds: v })}
          />
          <Slider
            label="カウントダウン秒数"
            value={settings.countdownSeconds}
            min={3}
            max={30}
            unit="秒"
            onChange={(v) => setSettings({ countdownSeconds: v })}
          />
          <Slider
            label="勝利ポイント（先取）"
            value={settings.targetScore}
            min={1}
            max={20}
            unit="点"
            onChange={(v) => setSettings({ targetScore: v })}
          />
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-xs text-white/40 uppercase tracking-wider">モードB専用</h2>
          <Slider
            label="コミュニティめくれ間隔"
            value={settings.communityRevealInterval}
            min={1}
            max={10}
            step={0.5}
            unit="秒"
            onChange={(v) => setSettings({ communityRevealInterval: v })}
          />
        </section>

        <Button variant="default" size="lg" onClick={() => navigate('/')}>
          設定を保存して戻る
        </Button>

        <button
          onClick={() => {
            setSettings({ maxFolds: 3, countdownSeconds: 10, targetScore: 5, communityRevealInterval: 3 })
          }}
          className="text-white/30 text-sm hover:text-white/50 transition-colors"
        >
          デフォルトに戻す
        </button>
      </main>
    </div>
  )
}
