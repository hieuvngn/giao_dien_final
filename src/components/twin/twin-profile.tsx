'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Footer from '../landing/footer'
import { PandaSticker, PushPin, Reveal, WashiTape } from '../landing/decor'
import { useToast } from '@/hooks/use-toast'
import { Badge, StatCard } from '@/components/admin/admin-ui'
import {
  RECENT_EVENTS,
  RING_FRACS,
  SKILLS,
  buildAiComment,
  computeTwinIndices,
  dayLabel,
  dimensionFacts,
  estHsk,
  fmtSec,
  overallLevel,
  radarLabelPos,
  radarPolygon,
  radarRing,
  radarVertex,
  skillMeta,
  trendLabel,
  type SkillKey,
  type TwinWindow,
} from './twin-data'

/* ============================================================
   AI Learning Twin — Bản sao năng lực tiếng Trung (能力画像)
   Route: #/twin
   ------------------------------------------------------------
   Trang "hồ sơ năng lực": thay vì đếm số từ đã học, hệ thống
   tính 6 chỉ số (từ vựng · ngữ pháp · nghe · đọc · viết · phản xạ)
   TỪ DỮ LIỆU HỌC TẬP ĐÃ THU THẬP, rồi chỉ dùng AI để VIẾT NHẬN XÉT
   & đề xuất bài tập phù hợp.
   ============================================================ */

/* ---------- Biểu đồ radar 6 chiều ---------- */

function RadarChart({ scores, animKey }: { scores: Record<SkillKey, number>; animKey: string }) {
  const values = SKILLS.map((s) => scores[s.key])
  return (
    <svg
      viewBox="0 0 300 244"
      className="mx-auto w-full max-w-[360px]"
      role="img"
      aria-label="Biểu đồ radar sáu chiều năng lực tiếng Trung"
    >
      {/* lưới lục giác */}
      {RING_FRACS.map((f) => (
        <polygon
          key={f}
          points={radarRing(f)}
          fill="none"
          stroke="#e5d7c5"
          strokeWidth={f === 1 ? 1.6 : 1}
          strokeDasharray={f === 1 ? undefined : '3 4'}
        />
      ))}
      {/* trục */}
      {SKILLS.map((s, i) => {
        const [x, y] = radarVertex(i, 100)
        return <line key={s.key} x1={150} y1={116} x2={x} y2={y} stroke="#e5d7c5" strokeWidth="1" />
      })}
      {/* vùng năng lực */}
      <motion.polygon
        key={animKey}
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        style={{ transformOrigin: '150px 116px' }}
        points={radarPolygon(values)}
        fill="rgba(232,138,166,0.30)"
        stroke="#c2547e"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* điểm đỉnh */}
      {SKILLS.map((s, i) => {
        const [x, y] = radarVertex(i, scores[s.key])
        return (
          <circle key={s.key} cx={x} cy={y} r="3.4" fill={s.color} stroke="#fffdf6" strokeWidth="1.4" />
        )
      })}
      {/* nhãn */}
      {SKILLS.map((s, i) => {
        const lp = radarLabelPos(i)
        return (
          <text key={s.key} x={lp.x} y={lp.y} textAnchor={lp.anchor} fontSize="9.5" fontWeight="700" fill="#5d4a57">
            <tspan x={lp.x} dy={lp.dy}>{s.emoji} {s.label}</tspan>
            <tspan x={lp.x} dy="11" fontSize="8.5" fill="#b58fa0">{scores[s.key]}%</tspan>
          </text>
        )
      })}
    </svg>
  )
}

/* ---------- Trang chính ---------- */

export default function TwinProfile() {
  const { toast } = useToast()
  const [win, setWin] = useState<TwinWindow>(30)
  const [aiPhase, setAiPhase] = useState<'thinking' | 'done'>('done')
  const [aiRun, setAiRun] = useState(0)
  const [expanded, setExpanded] = useState<SkillKey | null>(null)
  const timerRef = useRef<number | null>(null)

  const idx = useMemo(() => computeTwinIndices(win), [win])
  const comment = useMemo(() => buildAiComment(idx), [idx])
  const level = overallLevel(idx.trend)
  const weakestMeta = skillMeta(idx.weakest)
  const strongestMeta = skillMeta(idx.strongest)

  /* dọn timer khi rời trang */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  /* mô phỏng bước "AI viết lời nhận xét" (chỉ số đã tính xong sẵn) */
  const runAi = (title: string, description: string) => {
    setAiPhase('thinking')
    setAiRun((v) => v + 1)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setAiPhase('done'), 1400)
    toast({ title, description })
  }

  const switchWindow = (d: TwinWindow) => {
    if (d === win) return
    setWin(d)
    runAi(
      `Đã cập nhật chỉ số theo ${d} ngày qua`,
      '6 chỉ số được tính lại ngay trên máy — AI đang viết lại nhận xét.',
    )
  }

  const hours = (idx.agg.minutes / 60).toFixed(1).replace('.', ',')

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6e9] text-[#5d4a57]">
      <main className="relative flex-1 pb-16 pt-20 sm:pt-24">
        <div aria-hidden="true" className="dot-grid absolute inset-0" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          {/* ================= header ================= */}
          <Reveal>
            <header className="paper-scrap relative rounded-3xl px-5 py-6 sm:px-8 sm:py-7">
              <WashiTape color="var(--pastel-butter)" pattern="dots" rotate={4} className="-top-3 right-12 h-6 w-20" />
              <PushPin color="#f0b429" className="absolute left-8 top-3 scale-75" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="leading-tight">
                    <span className="relative inline-block px-3 py-0.5">
                      <span aria-hidden="true" className="absolute inset-0 rotate-1 rounded-md bg-[var(--pastel-butter)] opacity-90" />
                      <span className="relative font-display text-2xl font-bold text-[#4f3d4a] sm:text-3xl">Bản sao năng lực tiếng Trung</span>
                      <span className="relative ml-2 hidden font-cn text-2xl text-[#b0762a] sm:inline" aria-hidden="true">
                        能力画像
                      </span>
                    </span>
                  </h1>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-[#8d7484]">
                    Không chỉ đếm bạn đã học bao nhiêu từ — AI Learning Twin <b className="text-[#b0762a]">theo dõi cách bạn nhớ, cách bạn quên,
                    cách bạn nghe và tốc độ phản xạ</b> để dựng một &ldquo;bản sao&rdquo; năng lực của chính bạn.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone="mint">{level.emoji} {level.label}</Badge>
                    <Badge tone="lilac">≈ {estHsk(idx.overall)} ước tính</Badge>
                    <Badge tone="pink">🔥 Chuỗi {idx.agg.streak} ngày</Badge>
                    <Badge tone="sky">Cập nhật {idx.agg.lastUpdated}</Badge>
                  </div>
                </div>
                <span aria-hidden="true" className="hidden shrink-0 text-5xl sm:block">🪞</span>
              </div>

              <div className="absolute -bottom-5 right-6 hidden sm:block">
                <PandaSticker className="h-16 w-16" />
              </div>
            </header>
          </Reveal>

          {/* ================= thẻ số liệu ================= */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard emoji="🧮" value={`${idx.overall}`} label="Điểm năng lực tổng" sub="thang điểm 100" tone="butter" delay={0} />
            <StatCard emoji="📈" value={trendLabel(idx.trend)} label="Xu hướng so kỳ trước" sub={level.note} tone="mint" delay={0.05} />
            <StatCard emoji="🗂️" value={`${idx.agg.events}`} label="Kết quả học tập đã thu thập" sub="flashcard · dictation · đề · viết" tone="sky" delay={0.1} />
            <StatCard emoji="⏱️" value={`${hours} giờ`} label="Thời gian học" sub={`trong ${win} ngày qua`} tone="lilac" delay={0.15} />
          </div>

          {/* ================= chọn kỳ tính chỉ số ================= */}
          <Reveal delay={0.05}>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5 rounded-2xl bg-white/60 p-1.5 ring-1 ring-[#ead9cd]" role="group" aria-label="Chọn kỳ tính chỉ số">
                {([7, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={win === d}
                    onClick={() => switchWindow(d)}
                    className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                      win === d ? 'bg-[#4f3d4a] text-white shadow-sm' : 'text-[#6f5a68] hover:bg-[var(--pastel-butter)]/50'
                    }`}
                  >
                    📆 {d} ngày qua
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-[#b58fa0]">
                Chỉ số được tính lại ngay trên máy mỗi khi đổi kỳ — AI chỉ viết lại lời nhận xét.
              </p>
            </div>
          </Reveal>

          {/* ================= radar + AI nhận xét ================= */}
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <Reveal className="lg:col-span-2">
              <section className="paper-scrap h-full rounded-3xl p-4 sm:p-5" aria-label="Bản đồ năng lực">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-[#4f3d4a]">🧭 Bản đồ năng lực</h2>
                  <Badge tone="cream">6 chiều</Badge>
                </div>
                <RadarChart scores={idx.scores} animKey={`w${win}`} />
                <p className="mt-2 border-t border-dashed border-[#ead9cd] pt-3 text-center text-[11px] font-semibold leading-relaxed text-[#8d7484]">
                  Điểm mạnh: <b style={{ color: strongestMeta.color }}>{strongestMeta.emoji} {strongestMeta.label} {idx.scores[idx.strongest]}%</b>
                  {' · '}Điểm cần cải thiện: <b style={{ color: weakestMeta.color }}>{weakestMeta.emoji} {weakestMeta.label} {idx.scores[idx.weakest]}%</b>
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-3">
              <section className="paper-scrap relative h-full rounded-3xl p-4 sm:p-5" aria-label="AI nhận xét">
                <PushPin color="#e8737f" className="absolute right-6 top-3 scale-75" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-[#4f3d4a]">🤖 AI nhận xét</h2>
                  <Badge tone="butter">AI chỉ viết lời nhận xét</Badge>
                </div>

                {aiPhase === 'thinking' ? (
                  <div className="space-y-3 py-4" aria-live="polite" aria-label="AI đang viết nhận xét">
                    <p className="text-xs font-bold text-[#b58fa0]">
                      AI đang đọc bảng chỉ số {idx.agg.events} kết quả học tập và viết nhận xét…
                    </p>
                    {[94, 100, 72].map((w) => (
                      <div key={w} className="h-3.5 animate-pulse rounded-full bg-[#f0e4d7]" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    key={aiRun}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mt-3 space-y-2.5"
                  >
                    {comment.paragraphs.map((p, i) => (
                      <p key={i} className="text-sm leading-relaxed text-[#5d4a57]">{p}</p>
                    ))}
                  </motion.div>
                )}

                <div className="mt-4 border-t border-dashed border-[#ead9cd] pt-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">Đề xuất hôm nay</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.suggestions.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        className="flex items-start gap-2 rounded-2xl bg-white/75 px-3.5 py-2 ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:ring-[#e88aa6]"
                      >
                        <span className="text-lg leading-none" aria-hidden="true">{s.emoji}</span>
                        <span>
                          <span className="block text-xs font-extrabold text-[#4f3d4a]">{s.label}</span>
                          <span className="block text-[10px] font-semibold text-[#8d7484]">{s.desc}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => runAi('AI đã viết lại nhận xét', 'Dùng chính bảng chỉ số hiện có — không phân tích lại dữ liệu thô.')}
                    className="rounded-xl bg-[#4f3d4a] px-4 py-2 text-xs font-extrabold text-white shadow-[0_3px_0_0_#3a2d36] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    🔄 Viết lại nhận xét
                  </button>
                  <p className="text-[10px] font-semibold text-[#b58fa0]">Dữ liệu thô không rời thiết bị của bạn.</p>
                </div>
              </section>
            </Reveal>
          </div>

          {/* ================= 6 thẻ năng lực ================= */}
          <Reveal delay={0.05}>
            <h2 className="mt-8 font-display text-lg font-bold text-[#4f3d4a]">
              Sáu góc nhìn năng lực <span className="font-cn text-[#e88aa6]">六个维度</span>
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#8d7484]">Bấm vào từng thẻ để xem chi tiết số liệu và nhận định của AI.</p>
          </Reveal>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map((s) => {
              const score = idx.scores[s.key]
              const t = idx.trends[s.key]
              const facts = dimensionFacts(idx, s.key)
              const open = expanded === s.key
              return (
                <div key={s.key} className={`paper-scrap rounded-2xl p-4 transition-shadow ${open ? 'ring-2 ring-[#e88aa6]' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : s.key)}
                    aria-expanded={open}
                    className="flex w-full items-start justify-between gap-2 text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ backgroundColor: `${s.color}1f` }} aria-hidden="true">
                        {s.emoji}
                      </span>
                      <span>
                        <span className="block font-display text-sm font-bold text-[#4f3d4a]">
                          {s.label} <span className="font-cn text-xs font-normal text-[#b58fa0]">{s.cn}</span>
                        </span>
                        <span className="block text-[10px] font-semibold text-[#8d7484]">{s.question}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-display text-xl font-extrabold leading-none" style={{ color: s.color }}>{score}%</span>
                      <span className={`mt-0.5 block text-[10px] font-extrabold ${t >= 0 ? 'text-[#3f6b50]' : 'text-[#c2435c]'}`}>
                        {t >= 0 ? '▲' : '▼'} {trendLabel(t)}
                      </span>
                    </span>
                  </button>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f0e4d7]" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      key={`${s.key}-${win}`}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2.5 border-t border-dashed border-[#ead9cd] pt-3">
                          {facts.lines.map((l) => (
                            <div key={l.label}>
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[11px] font-semibold text-[#5d4a57]">{l.label}</span>
                                <span className="shrink-0 text-[11px] font-extrabold text-[#4f3d4a]">{l.value}</span>
                              </div>
                              {l.pct !== null && (
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f0e4d7]" aria-hidden="true">
                                  <div className="h-full rounded-full" style={{ width: `${l.pct}%`, backgroundColor: `${s.color}99` }} />
                                </div>
                              )}
                            </div>
                          ))}
                          <p className="rounded-xl bg-[var(--cream)] px-3 py-2 text-[11px] font-semibold leading-relaxed text-[#6f5a68]">
                            💡 {facts.note}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* ================= dữ liệu thu thập + cách hoạt động ================= */}
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            <Reveal className="lg:col-span-3">
              <section className="paper-scrap h-full rounded-3xl p-4 sm:p-5" aria-label="Kết quả học tập đã thu thập">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-[#4f3d4a]">🧾 Kết quả học tập đã thu thập</h2>
                  <Badge tone="sky">{idx.agg.events} sự kiện / {win} ngày</Badge>
                </div>
                <ul className="mt-2">
                  {RECENT_EVENTS.map((e) => {
                    const meta = skillMeta(e.skill)
                    return (
                      <li key={e.id} className="flex items-start gap-3 border-b border-dashed border-[#e7dccb] py-2.5 last:border-0">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold leading-snug text-[#5d4a57]">
                            <span aria-hidden="true">{meta.emoji}</span> {e.text}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-bold text-[#b58fa0]">
                            {dayLabel(e.day)} · {e.time}{e.ms !== null ? ` · ${fmtSec(e.ms)}` : ''}
                          </span>
                        </span>
                        {e.ok === null ? (
                          <span className="shrink-0 rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">📊 đo</span>
                        ) : e.ok ? (
                          <span className="shrink-0 rounded-full bg-[var(--pastel-mint)] px-2 py-0.5 text-[10px] font-extrabold text-[#3f6b50] ring-1 ring-[#cfe6d6]">✓ đúng</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-[#fbe3e7] px-2 py-0.5 text-[10px] font-extrabold text-[#c2435c] ring-1 ring-[#f3c4d3]">✗ sai</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 border-t border-dashed border-[#ead9cd] pt-3 text-[11px] font-semibold leading-relaxed text-[#8d7484]">
                  Mỗi dòng ở trên là một &ldquo;viên gạch&rdquo; — chỉ số 6 chiều và lời nhận xét của AI được lắp từ tất cả chúng.
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-2">
              <section className="paper-scrap relative h-full rounded-3xl p-4 sm:p-5" aria-label="Cách bản sao năng lực hoạt động">
                <WashiTape color="var(--pastel-mint)" pattern="dots" rotate={-6} className="-top-3 left-8 h-5 w-16" />
                <h2 className="font-display text-base font-bold text-[#4f3d4a]">⚙️ Cách &ldquo;bản sao&rdquo; hoạt động</h2>
                <ol className="mt-3 space-y-3">
                  {[
                    { n: '1', title: 'Thu thập', desc: 'Mọi kết quả học tập (flashcard, shadowing, dictation, đề thi, luyện viết) được ghi lại kèm đúng/sai và thời gian phản hồi.' },
                    { n: '2', title: 'Tính chỉ số', desc: 'Hệ thống tổng hợp thành 6 chỉ số năng lực ngay trên thiết bị, cập nhật sau mỗi phiên học — không cần gọi AI.' },
                    { n: '3', title: 'AI viết lời nhận xét', desc: 'AI chỉ nhận bảng chỉ số cuối cùng để diễn giải & đề xuất bài tập — không phân tích lại toàn bộ dữ liệu mỗi lần.' },
                  ].map((st) => (
                    <li key={st.n} className="flex items-start gap-2.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--pastel-mint)] text-[11px] font-extrabold text-[#3f6b50]" aria-hidden="true">
                        {st.n}
                      </span>
                      <span>
                        <span className="block text-xs font-extrabold text-[#4f3d4a]">{st.title}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold leading-relaxed text-[#8d7484]">{st.desc}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 rounded-xl bg-[var(--pastel-butter)]/50 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-[#8a6a1f] ring-1 ring-[#f2e2b8]">
                  Điểm khác biệt: không phân tích từng lần học rời rạc, mà dựng nên <b>bức tranh năng lực liên tục</b> của bạn.
                </p>
              </section>
            </Reveal>
          </div>

          {/* ================= CTA ================= */}
          <Reveal delay={0.05}>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/60 px-5 py-4 ring-1 ring-[#ead9cd]">
              <p className="text-xs font-extrabold text-[#4f3d4a]">
                💪 Luyện đúng điểm yếu hôm nay để bản sao tuần sau tốt hơn:
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="#/shadowing" className="rounded-xl bg-[#4f3d4a] px-4 py-2 text-xs font-extrabold text-white shadow-[0_3px_0_0_#3a2d36] transition-all hover:-translate-y-0.5">
                  🎧 Vào Shadowing
                </a>
                <a href="#/review" className="rounded-xl bg-white/80 px-4 py-2 text-xs font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:text-[#c2547e]">
                  🔁 Ôn từ đã quên
                </a>
                <a href="#/mistakes" className="rounded-xl bg-white/80 px-4 py-2 text-xs font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:text-[#c2547e]">
                  📕 Xem sổ lỗi sai
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  )
}
