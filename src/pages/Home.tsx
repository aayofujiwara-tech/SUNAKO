import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { Button } from '@/components/ui/button'
import { isFirebaseConfigured } from '@/lib/firebase'
import { generateRoomCode } from '@/lib/utils'
import { createRoom, getRoom } from '@/lib/firebase'
import type { GameMode, CpuDifficulty } from '@/types'
import { drawRandom, drawRandomExcluding } from '@/lib/cards'
import { evaluateBestHand } from '@/lib/handEvaluator'

export function Home() {
  const navigate = useNavigate()
  const { settings, setSettings, setRoomCode, setIsHost } = useGameStore()
  const [tab, setTab] = useState<'cpu' | 'online'>('cpu')
  const [roomInput, setRoomInput] = useState('')
  const [joiningError, setJoiningError] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const firebaseOk = isFirebaseConfigured()

  function startCpuGame(mode: GameMode) {
    setSettings({ mode, matchType: 'cpu' })
    navigate(mode === 'A' ? '/game/a' : '/game/b')
  }

  async function createOnlineRoom(mode: GameMode) {
    if (!firebaseOk) return
    setIsLoading(true)
    try {
      const code = generateRoomCode()
      const handSize = mode === 'A' ? 7 : 2
      const communityCards = mode === 'B' ? drawRandom(5) : []
      const communityIds = new Set(communityCards.map((c) => c.id))
      const hostHand = communityIds.size > 0 ? drawRandomExcluding(handSize, communityIds) : drawRandom(handSize)
      const hostIds = new Set([...communityIds, ...hostHand.map((c) => c.id)])
      const guestHand = drawRandomExcluding(handSize, hostIds)

      await createRoom(code, {
        hostId: code + '-host',
        guestId: null,
        settings: { ...settings, mode, matchType: 'online' },
        phase: 'playing',
        host: { hand: hostHand, foldsUsed: 0, score: 0, hasDeclared: false, handResult: evaluateBestHand(hostHand), isExchanging: false },
        guest: { hand: guestHand, foldsUsed: 0, score: 0, hasDeclared: false, handResult: evaluateBestHand(guestHand), isExchanging: false },
        communityCards,
        revealedCommunityCount: 0,
        countdownStartAt: null,
        roundWinner: null,
        gameWinner: null,
        round: 1,
        createdAt: Date.now(),
      })

      setSettings({ mode, matchType: 'online' })
      setRoomCode(code)
      setIsHost(true)
      setCreatedCode(code)
    } catch (err) {
      console.error('[createOnlineRoom]', err)
      setJoiningError('ルーム作成に失敗しました。再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  async function joinRoom() {
    if (!firebaseOk || !roomInput.trim()) return
    setIsLoading(true)
    setJoiningError('')
    try {
      const code = roomInput.toUpperCase().trim()
      const room = await getRoom(code)
      if (!room) {
        setJoiningError('ルームが見つかりません')
        return
      }
      setSettings({ mode: room.settings.mode, matchType: 'online' })
      setRoomCode(code)
      setIsHost(false)
      navigate(room.settings.mode === 'A' ? '/game/a' : '/game/b')
    } catch (err) {
      console.error('[joinRoom]', err)
      setJoiningError('参加に失敗しました。再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-dvh overflow-y-auto bg-casino-bg text-white flex flex-col items-center justify-center p-6 gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-casino-gold">SUNAKO</h1>
        <p className="text-white/50 mt-2 text-sm">リアルタイム2人対戦ポーカー</p>
      </div>

      {/* Tab */}
      <div className="flex bg-black/30 rounded-xl p-1 gap-1">
        <button
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'cpu' ? 'bg-casino-gold text-casino-dark' : 'text-white/60 hover:text-white'}`}
          onClick={() => setTab('cpu')}
        >
          CPU対戦
        </button>
        <button
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'online' ? 'bg-casino-gold text-casino-dark' : 'text-white/60 hover:text-white'}`}
          onClick={() => setTab('online')}
        >
          オンライン
        </button>
      </div>

      {tab === 'cpu' && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {/* CPU difficulty */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/50 uppercase tracking-wider">CPU難易度</p>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as CpuDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setSettings({ cpuDifficulty: d })}
                  className={`py-2 rounded-lg text-sm border transition-colors ${
                    settings.cpuDifficulty === d
                      ? 'border-casino-gold bg-casino-gold/10 text-casino-gold'
                      : 'border-white/20 text-white/60 hover:border-white/40'
                  }`}
                >
                  {d === 'easy' ? '易しい' : d === 'normal' ? '普通' : '難しい'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="declare" size="lg" onClick={() => startCpuGame('A')}>
              <span className="flex flex-col items-center gap-0.5">
                <span>モードA</span>
                <span className="text-xs opacity-70">ドローポーカー</span>
              </span>
            </Button>
            <Button variant="accept" size="lg" onClick={() => startCpuGame('B')}>
              <span className="flex flex-col items-center gap-0.5">
                <span>モードB</span>
                <span className="text-xs opacity-70">テキサスホールデム</span>
              </span>
            </Button>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/how-to-play')} className="text-white/40">
              遊び方
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="text-white/40">
              カスタムパラメータ設定
            </Button>
          </div>
        </div>
      )}

      {tab === 'online' && (
        <div className="flex flex-col gap-5 w-full max-w-sm">
          {!firebaseOk && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {import.meta.env.DEV ? 'Firebase未設定です。.env.local を設定してください。' : 'オンライン機能は現在利用できません。'}
            </div>
          )}

          {createdCode ? (
            <div className="flex flex-col items-center gap-3 bg-black/30 rounded-xl p-5">
              <p className="text-white/60 text-sm">ルームコード（相手に教えてください）</p>
              <p className="text-4xl font-mono font-bold text-casino-gold tracking-widest">{createdCode}</p>
              <p className="text-white/40 text-xs">相手の参加を待っています…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="declare" disabled={!firebaseOk || isLoading} onClick={() => createOnlineRoom('A')}>
                  ルーム作成 (A)
                </Button>
                <Button variant="accept" disabled={!firebaseOk || isLoading} onClick={() => createOnlineRoom('B')}>
                  ルーム作成 (B)
                </Button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ルームコード入力"
                  maxLength={8}
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 font-mono tracking-widest text-center uppercase focus:outline-none focus:border-casino-gold"
                />
                <Button variant="default" disabled={!firebaseOk || !roomInput || isLoading} onClick={joinRoom}>
                  参加
                </Button>
              </div>
              {joiningError && <p className="text-red-400 text-sm text-center">{joiningError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
