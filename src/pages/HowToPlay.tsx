import { useNavigate } from 'react-router-dom'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-casino-gold uppercase tracking-wider">{title}</h2>
      <div className="text-sm text-white/70 leading-relaxed flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function Rule({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-white/40 shrink-0">•</span>
      <span><span className="text-white font-medium">{label}</span>：{children}</span>
    </div>
  )
}

export function HowToPlay() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-casino-bg text-white flex flex-col">
      <div className="flex-none px-4 pt-4 pb-2">
        <button onClick={() => navigate('/')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← タイトル
        </button>
      </div>

      <div className="flex-1 px-5 pb-8 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-casino-gold">遊び方</h1>

        <Section title="ゲーム概要">
          <p>SUNAKOはリアルタイム2人対戦のポーカーゲームです。相手より強い役を作って宣言し、受けさせることで1点を獲得します。先に設定した目標点数に達したプレイヤーが勝利です。</p>
        </Section>

        <Section title="共通ルール">
          <Rule label="宣言">自分の手札に自信があるときに使います。相手は「受ける」か「フォールド」かを選びます。カウントダウン内に相手が行動しない場合は自動的にフォールド扱いになります。</Rule>
          <Rule label="受ける">宣言を受け入れてショーダウンします。役の強さを比較して強い方が1点を獲得します。</Rule>
          <Rule label="フォールド">宣言を拒否してこのラウンドを降ります。フォールドした側が1点を失います（正確にはフォールド回数を消費し、上限に達すると相手が1点獲得）。</Rule>
          <Rule label="交換">手札を新しいカードに引き直します。宣言前と、相手から宣言されたカウントダウン中に使用できます。</Rule>
        </Section>

        <Section title="モードA：ドローポーカー型">
          <p>プレイヤーは7枚の手札を持ちます。7枚の中からベスト5枚が自動で選ばれ、役として評価されます。</p>
          <p>交換すると手札7枚がすべて新しいカードに入れ替わります。</p>
        </Section>

        <Section title="モードB：テキサスホールデム型">
          <p>プレイヤーはそれぞれ2枚の手札（ホールカード）を持ち、時間の経過とともに公開される5枚のコミュニティカードを共有します。</p>
          <p>自分の手札2枚＋コミュニティカード5枚の合計7枚の中からベスト5枚が自動で選ばれます。</p>
          <p>交換すると自分のホールカード2枚のみが入れ替わります。コミュニティカードは変わりません。</p>
        </Section>

        <Section title="フォールド回数について">
          <p>各ラウンド（得点が動くまでの間）にフォールドできる回数には上限があります。</p>
          <Rule label="上限未満のフォールド">フォールドしてもそのラウンドは終わらず、手札が再配布されて続きます。</Rule>
          <Rule label="上限に達したフォールド">相手に1点が入り、新しいラウンドが始まります。</Rule>
          <p>フォールド残り回数はスコアパネルで確認できます。</p>
        </Section>

        <Section title="カスタムパラメータ">
          <Rule label="目標点数">この点数に先に達したプレイヤーが勝利します。</Rule>
          <Rule label="カウントダウン秒数">宣言後に相手が行動できる時間です。</Rule>
          <Rule label="フォールド上限">1ラウンドにフォールドできる最大回数です。</Rule>
          <Rule label="コミュニティ公開間隔">モードBでコミュニティカードが1枚ずつ公開される間隔です。</Rule>
        </Section>
      </div>
    </div>
  )
}
