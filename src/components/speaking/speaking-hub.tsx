'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Footer from '../landing/footer'
import { PandaSticker, PushPin, Reveal, StarDoodle, WashiTape } from '../landing/decor'
import { useToast } from '@/hooks/use-toast'
import { SCENARIOS } from './speaking-data-more'
import type { AnswerVariant, Scenario, ScenarioTone, Tier } from './speaking-data'
import { useAsr, useTts } from './use-speech'

/* ============================================================
   Luyện nói cùng AI — hội thoại giọng nói tiếng Trung
   Route: #/speaking
   6 tình huống × 2 cấp độ (Sơ cấp HSK 1–3 · Cao cấp HSK 4–6)
   Luồng: AI hỏi (đọc bằng giọng zh-CN) → người học trả lời bằng
   microphone (nhận diện giọng nói) → AI nhận diện, phát hiện lỗi,
   gợi ý câu tự nhiên hơn, giải thích và chấm độ hoàn thành.
   ------------------------------------------------------------
   Không có mic / trình duyệt không hỗ trợ? Bấm 💬 Chọn câu mẫu.
   ============================================================ */

const TONE: Record<ScenarioTone, { ring: string; tile: string; tape: string }> = {
  pink: { ring: 'ring-[#f3c4d3]', tile: 'bg-[var(--pastel-pink)] text-[#8a4a63]', tape: 'var(--pastel-pink)' },
  butter: { ring: 'ring-[#f2e2b8]', tile: 'bg-[var(--pastel-butter)] text-[#8a6a1f]', tape: 'var(--pastel-butter)' },
  mint: { ring: 'ring-[#cfe6d6]', tile: 'bg-[var(--pastel-mint)] text-[#3f6b50]', tape: 'var(--pastel-mint)' },
  sky: { ring: 'ring-[#cfe0ef]', tile: 'bg-[var(--pastel-sky)] text-[#46688f]', tape: 'var(--pastel-sky)' },
  lilac: { ring: 'ring-[#e2d6f0]', tile: 'bg-[var(--pastel-lilac)] text-[#6d5a94]', tape: 'var(--pastel-lilac)' },
  peach: { ring: 'ring-[#f3dcc6]', tile: 'bg-[var(--pastel-peach)] text-[#a05a3a]', tape: 'var(--pastel-peach)' },
}

const RATING_META = {
  excellent: { label: 'Tuyệt vời', emoji: '🌟', cls: 'bg-[var(--pastel-mint)] text-[#3f6b50] ring-[#cfe6d6]', score: 100 },
  good: { label: 'Tốt', emoji: '👍', cls: 'bg-[var(--pastel-butter)] text-[#8a6a1f] ring-[#f2e2b8]', score: 82 },
  fair: { label: 'Khá tốt', emoji: '✏️', cls: 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]', score: 65 },
  miss: { label: 'Cần luyện thêm', emoji: '💡', cls: 'bg-[var(--pastel-sky)] text-[#46688f] ring-[#cfe0ef]', score: 50 },
} as const

type RatingKey = keyof typeof RATING_META

type Phase = 'ready' | 'ai' | 'listen' | 'analyze' | 'feedback' | 'done'

type Feedback = { said: string; key: RatingKey; variant: AnswerVariant | null }
type TurnRecord = Feedback & { ideal: AnswerVariant }

const normCn = (s: string) => s.toLowerCase().replace(/[\s，。！？、·．.,!?;；:："'()（）""''…—~–-]/g, '')

/* ---------- thanh sóng âm ---------- */

function WaveBars({ active, color = '#e8737f' }: { active: boolean; color?: string }) {
  return (
    <span className="flex h-5 items-end gap-[3px]" aria-hidden="true">
      {[0.55, 0.95, 0.65, 1, 0.5].map((h, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full"
          style={{ background: color }}
          animate={active ? { scaleY: [0.35, 1, 0.5], height: `${h * 100}%` } : { scaleY: 0.4, height: `${h * 100}%` }}
          transition={active ? { duration: 0.65, repeat: Infinity, repeatType: 'mirror', delay: i * 0.09 } : { duration: 0.25 }}
        />
      ))}
    </span>
  )
}

/* ---------- hàng nội dung dạng nhãn ---------- */

function Row({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-dashed border-[#ead9cd] px-1 py-3 last:border-b-0">
      <span className="w-20 shrink-0 pt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
        {icon} {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/* ---------- thẻ phản hồi của AI ---------- */

function FeedbackCard({ fb }: { fb: Feedback }) {
  const meta = RATING_META[fb.key]
  const v = fb.variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="paper-scrap rounded-3xl p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-bold text-[#4f3d4a]">
          Đánh giá câu trả lời <span className="ml-1 font-cn text-xs text-[#b58fa0]">点评</span>
        </p>
        <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${meta.cls}`}>
          {meta.emoji} {meta.label}
        </span>
      </div>

      <div className="mt-2">
        <Row label="Bạn đã nói" icon="🎤">
          <p className="font-cn text-lg leading-snug text-[#4f3d4a]">{fb.said}</p>
          {v && <p className="mt-0.5 text-[11px] font-semibold italic text-[#b58fa0]">{v.pinyin}</p>}
        </Row>

        {v?.suggestCn && (
          <Row label="AI đề xuất" icon="✨">
            <p className="font-cn text-lg leading-snug text-[#3f6b50]">{v.suggestCn}</p>
            {v.suggestPinyin && <p className="mt-0.5 text-[11px] font-semibold italic text-[#7fae8f]">{v.suggestPinyin}</p>}
            {v.suggestVi && <p className="mt-0.5 text-[11px] font-bold text-[#8d7484]">→ {v.suggestVi}</p>}
          </Row>
        )}

        {v?.explain && (
          <Row label="Giải thích" icon="📖">
            <p className="text-xs font-semibold leading-relaxed text-[#5d4a57]">{v.explain}</p>
          </Row>
        )}

        {!v && (
          <Row label="Gợi ý" icon="💡">
            <p className="text-xs font-semibold leading-relaxed text-[#5d4a57]">
              Câu của bạn chưa khớp các mẫu trong tình huống này. Hãy thử nói lại theo câu đề xuất bên dưới nhé!
            </p>
          </Row>
        )}
      </div>
    </motion.div>
  )
}

/* ---------- bong bóng câu hỏi của AI (hiện suốt hội thoại) ---------- */

function AiBubble({
  step,
  speaking,
  onReplay,
}: {
  step: DialogueStep
  speaking: boolean
  onReplay?: () => void
}) {
  return (
    <div className="paper-scrap relative rounded-3xl p-4 sm:p-5">
      <PushPin color="#e8737f" className="absolute right-6 top-2.5 scale-75" />
      <div className="flex items-start gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--pastel-butter)] text-2xl shadow-inner"
          aria-hidden="true"
        >
          🐼
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
              {speaking ? 'AI đang nói…' : 'AI hỏi'}
            </p>
            <WaveBars active={speaking} />
            {onReplay && !speaking && (
              <button
                type="button"
                onClick={onReplay}
                className="ml-auto rounded-lg bg-white/70 px-2.5 py-1 text-[10px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                🔊 Nghe lại
              </button>
            )}
          </div>
          <p className="mt-1.5 font-cn text-2xl leading-snug text-[#4f3d4a]">{step.aiCn}</p>
          <p className="mt-1 text-xs font-semibold italic text-[#b58fa0]">{step.aiPinyin}</p>
          <p className="mt-1 text-xs font-bold text-[#5d4a57]">🇻🇳 {step.aiVi}</p>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Phòng hội thoại
   ============================================================ */

function ConversationRoom({ scenario, tier, onExit }: { scenario: Scenario; tier: Tier; onExit: () => void }) {
  const { toast } = useToast()
  const tts = useTts()
  const asr = useAsr()

  const dialogue = scenario.dialogues[tier]
  const steps = dialogue.steps

  const [phase, setPhase] = useState<Phase>('ready')
  const [stepIdx, setStepIdx] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [interim, setInterim] = useState('')
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [records, setRecords] = useState<TurnRecord[]>([])

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      try {
        window.speechSynthesis?.cancel()
      } catch {
        /* bỏ qua */
      }
    },
    [],
  )

  const step = steps[Math.min(stepIdx, steps.length - 1)]
  const rate = tier === 'beginner' ? 0.8 : 0.95

  const speakStep = (i: number, afterDone?: () => void) => {
    const st = steps[i]
    tts.speak(st.aiCn, rate, () => {
      setPhase((p) => (p === 'ai' ? 'listen' : p))
      afterDone?.()
    })
  }

  const startConversation = () => {
    setStepIdx(0)
    setScores([])
    setRecords([])
    setFeedback(null)
    setPhase('ai')
    speakStep(0)
  }

  const goToStep = (i: number) => {
    setStepIdx(i)
    setFeedback(null)
    setInterim('')
    setHintOpen(false)
    setFallbackOpen(false)
    setPhase('ai')
    speakStep(i)
  }

  const processAnswer = (said: string) => {
    asr.stop()
    tts.stop()
    setInterim('')
    setFallbackOpen(false)
    setPhase('analyze')
    timers.current.push(
      setTimeout(() => {
        const v = step.answers.find((a) => normCn(a.cn) === normCn(said)) ?? null
        const key: RatingKey = v ? (v.rating as RatingKey) : 'miss'
        setFeedback({ said, key, variant: v })
        setScores((prev) => [...prev, RATING_META[key].score])
        setRecords((prev) => [...prev, { said, key, variant: v, ideal: step.answers[0] }])
        setPhase('feedback')
      }, 1200),
    )
  }

  const toggleMic = () => {
    if (asr.listening) {
      asr.stop()
      return
    }
    setFallbackOpen(false)
    setHintOpen(false)
    if (!asr.supported) {
      toast({
        title: 'Trình duyệt không hỗ trợ nhận diện giọng nói 🙈',
        description: 'Hãy dùng nút 💬 Chọn câu mẫu bên dưới — hoặc mở Chrome / Edge để nói thật.',
      })
      setFallbackOpen(true)
      return
    }
    asr.start({
      onFinal: (t) => processAnswer(t),
      onInterim: (t) => setInterim(t),
      onError: (kind) => {
        const msg =
          kind === 'not-allowed'
            ? 'Chưa cấp quyền microphone 🎤'
            : kind === 'no-speech'
              ? 'Không nghe thấy giọng nói 🙉'
              : 'Nhận diện giọng nói gặp sự cố 😥'
        toast({ title: msg, description: 'Bạn có thể dùng nút 💬 Chọn câu mẫu để tiếp tục luyện.' })
        setFallbackOpen(true)
      },
    })
  }

  const completion = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const avg = scores.length === steps.length ? completion : 0
  const stars = avg >= 90 ? 3 : avg >= 70 ? 2 : 1

  return (
    <div className="space-y-4">
      {/* ===== thanh trên: quay lại + tiêu đề + tiến độ ===== */}
      <div className="paper-scrap flex flex-wrap items-center gap-3 rounded-3xl px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white/70 px-3 py-2 text-[11px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-white"
        >
          ← Tình huống
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-[#4f3d4a]">
            {scenario.emoji} {scenario.name} <span className="ml-1 font-cn text-[#b58fa0]">{scenario.cn}</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--cream)] sm:w-40">
              <span
                className="block h-full rounded-full bg-[var(--pastel-pink)] transition-all duration-500"
                style={{ width: `${phase === 'done' ? 100 : (Math.min(scores.length, steps.length) / steps.length) * 100}%` }}
              />
            </span>
            <span className="text-[10px] font-extrabold text-[#b58fa0]">
              {phase === 'done' ? 'Hoàn thành' : `Bước ${Math.min(stepIdx + 1, steps.length)}/${steps.length}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[var(--pastel-lilac)]/60 px-2.5 py-1 text-[10px] font-extrabold text-[#6d5a94] ring-1 ring-[#e2d6f0]">
            {dialogue.hskLabel}
          </span>
          <button
            type="button"
            onClick={() => tts.setMuted(!tts.muted)}
            aria-label={tts.muted ? 'Bật tiếng đọc của AI' : 'Tắt tiếng đọc của AI'}
            className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--cream)] text-sm ring-1 ring-[#ead9cd] transition hover:bg-[var(--pastel-butter)]/60"
          >
            {tts.muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ===== sẵn sàng ===== */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="paper-scrap relative rounded-3xl p-5 sm:p-7"
          >
            <WashiTape color={TONE[scenario.tone].tape} pattern="dots" rotate={-4} className="-top-2.5 right-8 h-5 w-14" />
            <div className="flex flex-col items-center py-4 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/70 text-5xl shadow-inner" aria-hidden="true">
                {scenario.emoji}
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-[#4f3d4a]">
                {scenario.name} · <span className="font-cn text-[#e88aa6]">{scenario.cn}</span>
              </h2>
              <p className="mt-1 max-w-md text-xs font-semibold leading-relaxed text-[#8d7484]">
                {dialogue.hskLabel} · {steps.length} lượt đối thoại. AI sẽ mở đầu — bạn nghe rồi{' '}
                <b className="text-[#c2547e]">trả lời bằng giọng nói</b>. AI nhận diện, sửa lỗi và chấm độ hoàn thành.
              </p>
              <button
                type="button"
                onClick={startConversation}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#d2495f] px-7 py-3.5 font-display text-sm font-extrabold text-white shadow-[0_4px_0_0_#b23a4f] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                🎙️ Bắt đầu hội thoại
              </button>
              <p className="mt-3 text-[10px] font-semibold text-[#b58fa0]">
                {asr.supported ? '🎤 Trình duyệt của bạn hỗ trợ nhận diện giọng nói zh-CN' : '💡 Trình duyệt này không có mic AI — sẽ dùng chế độ chọn câu mẫu'}
              </p>
            </div>
          </motion.div>
        )}

        {/* ===== AI đang hỏi ===== */}
        {phase === 'ai' && (
          <motion.div key={`ai-${stepIdx}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            <AiBubble step={step} speaking={tts.speaking} onReplay={() => speakStep(stepIdx)} />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPhase('listen')}
                className="rounded-xl bg-[#4f3d4a] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#3a2d36] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                ✓ Đã nghe, đến lượt tôi ➜
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== đến lượt người học ===== */}
        {phase === 'listen' && (
          <motion.div key={`listen-${stepIdx}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            <AiBubble step={step} speaking={false} onReplay={() => speakStep(stepIdx)} />
            <div className="paper-scrap flex flex-col items-center rounded-3xl p-5 sm:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">Đến lượt bạn trả lời</p>

              <button
                type="button"
                onClick={toggleMic}
                aria-label={asr.listening ? 'Dừng ghi âm' : 'Bấm để nói'}
                className={`relative mt-4 grid h-20 w-20 place-items-center rounded-full text-3xl text-white shadow-[0_5px_0_0_#b23a4f] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
                  asr.listening ? 'bg-[#e8737f]' : 'bg-[#d2495f]'
                }`}
              >
                {asr.listening && <span className="absolute inset-0 animate-ping rounded-full bg-[#e8737f]/40" aria-hidden="true" />}
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="2.5" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
                </svg>
              </button>

              <div className="mt-3 flex min-h-7 items-center gap-2">
                {asr.listening ? (
                  <>
                    <WaveBars active color="#d2495f" />
                    <p className="text-xs font-extrabold text-[#c2547e]">Đang nghe… {interim && <span className="font-cn font-bold">“{interim}”</span>}</p>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-[#8d7484]">Bấm micro rồi nói câu trả lời bằng tiếng Trung</p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setHintOpen((v) => !v)}
                  aria-expanded={hintOpen}
                  className="rounded-xl bg-[var(--pastel-butter)]/70 px-3.5 py-2 text-[11px] font-extrabold text-[#8a6a1f] ring-1 ring-[#f2e2b8] transition-all hover:-translate-y-0.5"
                >
                  💡 Gợi ý câu mẫu
                </button>
                <button
                  type="button"
                  onClick={() => setFallbackOpen((v) => !v)}
                  aria-expanded={fallbackOpen}
                  className="rounded-xl bg-white/70 px-3.5 py-2 text-[11px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  💬 Chọn câu mẫu (không dùng mic)
                </button>
              </div>

              {hintOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 w-full rounded-2xl bg-[var(--pastel-butter)]/40 p-3.5 ring-1 ring-[#f2e2b8]">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a6a1f]">Câu trả lời mẫu</p>
                  <p className="mt-1 font-cn text-lg text-[#4f3d4a]">{step.answers[0].cn}</p>
                  <p className="text-[11px] font-semibold italic text-[#b58fa0]">{step.answers[0].pinyin}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#8d7484]">→ {step.answers[0].vi}</p>
                </motion.div>
              )}

              {fallbackOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 w-full">
                  <p className="mb-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
                    Chọn câu bạn muốn nói (mô phỏng giọng nói)
                  </p>
                  <div className="grid gap-1.5">
                    {step.answers.map((a) => (
                      <button
                        key={a.cn}
                        type="button"
                        onClick={() => processAnswer(a.cn)}
                        className="flex items-center gap-3 rounded-2xl bg-white/70 px-3.5 py-2.5 text-left ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-mint)]/40"
                      >
                        <span className="font-cn text-base text-[#4f3d4a]">{a.cn}</span>
                        <span className="ml-auto hidden text-[10px] font-semibold text-[#b58fa0] sm:block">{a.vi}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== AI phân tích ===== */}
        {phase === 'analyze' && (
          <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <AiBubble step={step} speaking={false} />
            <div className="paper-scrap flex items-center justify-center gap-3 rounded-3xl p-8">
              <WaveBars active color="#8b7fc4" />
              <p className="text-xs font-extrabold text-[#6d5a94]">AI đang phân tích câu trả lời của bạn… 🔍</p>
            </div>
          </motion.div>
        )}

        {/* ===== phản hồi ===== */}
        {phase === 'feedback' && feedback && (
          <motion.div key={`fb-${stepIdx}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            <AiBubble step={step} speaking={false} />
            <FeedbackCard fb={feedback} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#b58fa0]">Độ hoàn thành hiện tại: {completion}%</span>
              <button
                type="button"
                onClick={() => (stepIdx + 1 < steps.length ? goToStep(stepIdx + 1) : setPhase('done'))}
                className="rounded-xl bg-[#4f3d4a] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#3a2d36] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                {stepIdx + 1 < steps.length ? 'Tiếp tục ➜' : 'Xem kết quả 🏁'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== tổng kết ===== */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="paper-scrap relative rounded-3xl p-5 sm:p-7">
            <StarDoodle className="absolute right-6 top-4 h-6 w-6" />
            <div className="flex flex-col items-center text-center">
              <p className="font-display text-lg font-bold text-[#4f3d4a]">
                Hoàn thành tình huống <span className="ml-1 font-cn text-[#e88aa6]">{scenario.cn}</span>
              </p>
              <div className="mt-2 flex gap-1 text-3xl" aria-label={`${stars} trên 3 sao`}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
                    aria-hidden="true"
                  >
                    {i < stars ? '⭐' : '☆'}
                  </motion.span>
                ))}
              </div>
              <p className="mt-2 font-display text-3xl font-extrabold text-[#c2547e]">{avg}%</p>
              <p className="mt-1 max-w-md text-xs font-semibold text-[#8d7484]">
                {stars === 3
                  ? 'Hoàn thành xuất sắc! Bạn nói rất tự nhiên và đúng mẫu 👏'
                  : stars === 2
                    ? 'Khá tốt! Vài chỗ nhỏ cần chỉnh thêm — đọc lại phần giải thích nhé.'
                    : 'Đã hoàn thành! Nghe lại phản hồi của AI rồi luyện lại để đạt 3 sao 💪'}
              </p>

              {records.some((r) => r.key !== 'excellent') && (
                <div className="mt-4 w-full text-left">
                  <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">Những câu nên cải thiện</p>
                  <ul className="space-y-1.5">
                    {records
                      .filter((r) => r.key !== 'excellent')
                      .map((r, i) => (
                        <li key={i} className="rounded-2xl bg-[var(--cream)] px-3.5 py-2.5 ring-1 ring-[#ead9cd]">
                          <p className="text-[11px] font-bold text-[#8d7484]">
                            🎤 <span className="font-cn text-sm text-[#4f3d4a]">{r.said}</span>
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#3f6b50]">
                            ✨ <span className="font-cn text-sm">{r.variant?.suggestCn ?? r.ideal.cn}</span>
                          </p>
                          {(r.variant?.explain || r.ideal.explain) && (
                            <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-[#8d7484]">📖 {r.variant?.explain ?? r.ideal.explain}</p>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScores([])
                    setRecords([])
                    setStepIdx(0)
                    setFeedback(null)
                    setPhase('ready')
                  }}
                  className="rounded-xl bg-white/70 px-4 py-2.5 text-xs font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  🔄 Luyện lại
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-xl bg-[#d2495f] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#b23a4f] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  📚 Chọn tình huống khác
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
   Trang chính: chọn tình huống
   ============================================================ */

const HOW_IT_WORKS = [
  { icon: '🎧', label: 'AI mở đầu', desc: 'Nghe giọng đọc tiếng Trung theo tình huống thật' },
  { icon: '🎤', label: 'Bạn nói', desc: 'Trả lời bằng microphone — nhận diện giọng zh-CN' },
  { icon: '🔍', label: 'AI nhận diện & sửa lỗi', desc: 'So câu nói với mẫu chuẩn, phát hiện lỗi lượng từ, ngữ pháp' },
  { icon: '📊', label: 'Đánh giá hoàn thành', desc: 'Câu đề xuất + giải thích + điểm hoàn thành từng bước' },
]

export default function SpeakingHub() {
  const [tier, setTier] = useState<Tier>('beginner')
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === scenarioId) ?? null, [scenarioId])

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6e9] text-[#5d4a57]">
      <main className="relative flex-1 pb-16 pt-20 sm:pt-24">
        <div aria-hidden="true" className="dot-grid absolute inset-0" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {!scenario ? (
              /* ================= chọn tình huống ================= */
              <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
                <Reveal>
                  <header className="paper-scrap relative rounded-3xl px-5 py-6 sm:px-8 sm:py-7">
                    <WashiTape color="var(--pastel-sky)" pattern="dots" rotate={-5} className="-top-3 left-10 h-6 w-20" />
                    <PushPin color="#7fb3d5" className="absolute right-8 top-3 scale-75" />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="leading-tight">
                          <span className="relative inline-block px-3 py-0.5">
                            <span aria-hidden="true" className="absolute inset-0 -rotate-1 rounded-md bg-[var(--pastel-sky)] opacity-80" />
                            <span className="relative font-display text-2xl font-bold text-[#4f3d4a] sm:text-3xl">Luyện nói cùng AI</span>
                            <span className="relative ml-2 hidden font-cn text-2xl text-[#46688f] sm:inline" aria-hidden="true">
                              口语对话
                            </span>
                          </span>
                        </h1>
                        <p className="mt-2 max-w-lg text-sm font-semibold leading-relaxed text-[#8d7484]">
                          Không phải chatbot gõ chữ — đây là người đối thoại <b className="text-[#46688f]">bằng giọng nói</b>. AI hỏi trước, bạn
                          nói bằng micro, AI nhận diện, sửa lỗi và chấm độ hoàn thành tình huống.
                        </p>
                      </div>
                      <span aria-hidden="true" className="hidden shrink-0 text-5xl sm:block">
                        🎙️
                      </span>
                    </div>

                    <div className="absolute -bottom-5 right-6 hidden sm:block">
                      <PandaSticker className="h-16 w-16" />
                    </div>
                  </header>
                </Reveal>

                {/* cấp độ */}
                <Reveal delay={0.05}>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1.5 rounded-2xl bg-white/60 p-1.5 ring-1 ring-[#ead9cd]" role="tablist" aria-label="Chọn cấp độ">
                      {(
                        [
                          { id: 'beginner' as Tier, cn: '初级', label: 'Sơ cấp', hsk: 'HSK 1–3', cls: 'bg-[var(--pastel-mint)] text-[#3f6b50]' },
                          { id: 'advanced' as Tier, cn: '高级', label: 'Cao cấp', hsk: 'HSK 4–6', cls: 'bg-[var(--pastel-lilac)] text-[#6d5a94]' },
                        ]
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          role="tab"
                          aria-selected={tier === t.id}
                          onClick={() => setTier(t.id)}
                          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                            tier === t.id ? `${t.cls} shadow-sm ring-1 ring-black/5` : 'text-[#6f5a68] hover:bg-[var(--pastel-butter)]/50'
                          }`}
                        >
                          <span className="font-cn">{t.cn}</span>
                          {t.label} · {t.hsk}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold text-[#b58fa0]">
                      {tier === 'beginner' ? 'Câu ngắn, AI đọc chậm, gợi ý nhiều' : 'Câu dài, AI đọc tốc độ thật, lỗi tinh tế hơn'}
                    </p>
                  </div>
                </Reveal>

                {/* 6 tình huống */}
                <section aria-label="Danh sách tình huống" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {SCENARIOS.map((s, i) => {
                    const tone = TONE[s.tone]
                    return (
                      <Reveal key={s.id} delay={0.04 * i}>
                        <button
                          type="button"
                          onClick={() => setScenarioId(s.id)}
                          className={`paper-scrap group relative flex h-full w-full flex-col rounded-3xl p-4 text-left ring-1 ${tone.ring} transition-all hover:-translate-y-1 hover:shadow-lg`}
                        >
                          <WashiTape color={tone.tape} pattern="stripes" rotate={i % 2 === 0 ? -6 : 5} className="-top-2 left-6 h-4 w-12" />
                          <div className="flex items-center justify-between">
                            <span className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl shadow-inner ${tone.tile}`} aria-hidden="true">
                              {s.emoji}
                            </span>
                            <span className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
                              {s.dialogues[tier].hskLabel}
                            </span>
                          </div>
                          <h3 className="mt-2.5 font-display text-sm font-bold text-[#4f3d4a]">
                            {s.name} <span className="ml-1 font-cn text-[#b58fa0]">{s.cn}</span>
                          </h3>
                          <p className="mt-1 flex-1 text-[11px] font-semibold leading-relaxed text-[#8d7484]">{s.desc}</p>
                          <p className="mt-2.5 flex items-center gap-1 border-t border-dashed border-[#ead9cd] pt-2.5 text-[11px] font-extrabold text-[#c2547e]">
                            {s.dialogues[tier].steps.length} lượt đối thoại
                            <span className="ml-auto transition-transform group-hover:translate-x-1" aria-hidden="true">
                              →
                            </span>
                          </p>
                        </button>
                      </Reveal>
                    )
                  })}
                </section>

                {/* cách hoạt động */}
                <Reveal delay={0.1}>
                  <section aria-label="Cách hoạt động" className="paper-scrap mt-5 rounded-3xl p-4 sm:p-5">
                    <h2 className="font-display text-sm font-bold text-[#4f3d4a]">
                      Cách hoạt động <span className="ml-1 font-cn text-xs text-[#b58fa0]">对话流程</span>
                    </h2>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {HOW_IT_WORKS.map((h, i) => (
                        <div key={h.label} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-[#f2e4da]">
                          <div className="flex items-center gap-2">
                            <span className="text-xl" aria-hidden="true">
                              {h.icon}
                            </span>
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--pastel-pink)] text-[10px] font-extrabold text-[#8a4a63]">
                              {i + 1}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs font-extrabold text-[#4f3d4a]">{h.label}</p>
                          <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-[#8d7484]">{h.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 rounded-xl bg-[var(--pastel-sky)]/35 px-3.5 py-2.5 text-[10px] font-semibold leading-relaxed text-[#46688f] ring-1 ring-[#cfe0ef]">
                      💡 Nói to, rõ ràng và dùng đúng câu mẫu đã học. Trình duyệt Chrome / Edge hỗ trợ nhận diện giọng nói tốt nhất — nếu
                      không có microphone, bấm 💬 Chọn câu mẫu trong phòng hội thoại để luyện tiếp.
                    </p>
                  </section>
                </Reveal>
              </motion.div>
            ) : (
              /* ================= phòng hội thoại ================= */
              <motion.div key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ConversationRoom scenario={scenario} tier={tier} onExit={() => setScenarioId(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  )
}
