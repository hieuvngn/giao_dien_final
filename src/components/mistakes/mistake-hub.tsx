'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Footer from '../landing/footer'
import { PandaSticker, PushPin, Reveal, StarDoodle, WashiTape } from '../landing/decor'
import { useToast } from '@/hooks/use-toast'
import {
  EXAMPLE_SENTENCES,
  ERROR_PATTERNS,
  TYPE_META,
  type MistakeType,
} from './mistake-data'
import {
  analyzeSentence,
  buildConclusion,
  buildSeedRecords,
  fmtDate,
  genId,
  knowledgeColor,
  loadMistakes,
  normSearch,
  saveMistakes,
  type AnalysisResult,
  type MistakeIssue,
  type MistakeRecord,
} from './mistake-engine'

/* ============================================================
   AI Mistake Analyzer — Phân tích lỗi sai cá nhân (错题本)
   Route: #/mistakes
   ------------------------------------------------------------
   3 tab: 🔍 Phân tích câu → 📕 Sổ lỗi sai → 📊 Quy luật của bạn
   AI không chỉ chấm đúng/sai: phân loại lỗi (ngữ pháp / trợ từ /
   lượng từ / trật tự từ), lưu lịch sử rồi kết luận quy luật sai
   của người học (ví dụ: 7/14 lỗi liên quan đến 了).
   Dữ liệu lưu tại localStorage — frontend demo.
   ============================================================ */

type TabId = 'analyze' | 'book' | 'report'

const TABS: { id: TabId; emoji: string; label: string; cn: string }[] = [
  { id: 'analyze', emoji: '🔍', label: 'Phân tích câu', cn: '分析' },
  { id: 'book', emoji: '📕', label: 'Sổ lỗi sai', cn: '错题本' },
  { id: 'report', emoji: '📊', label: 'Quy luật của bạn', cn: '规律' },
]

/* ---------- hàng nội dung dạng nhãn ---------- */

function Row({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-dashed border-[#ead9cd] px-1 py-3 last:border-b-0">
      <span className="w-24 shrink-0 pt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
        {icon} {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function TypeBadge({ type }: { type: MistakeType }) {
  const meta = TYPE_META[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${meta.cls}`}>
      {meta.emoji} {meta.label}
    </span>
  )
}

function KnowledgeChip({ k, onGo }: { k: string; onGo: (k: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onGo(k)}
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-bold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-butter)]/50"
    >
      <span className="h-2 w-2 rounded-full" style={{ background: knowledgeColor(k) }} aria-hidden="true" />
      {k}
    </button>
  )
}

/* ---------- thẻ một lỗi trong kết quả phân tích ---------- */

function IssueCard({ issue, index }: { issue: MistakeIssue; index: number }) {
  const { toast } = useToast()
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
      className="paper-scrap rounded-3xl p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#4f3d4a] px-2.5 py-1 text-[10px] font-extrabold text-white">Lỗi {index + 1}</span>
        <TypeBadge type={issue.type} />
        <span className="rounded-full bg-[var(--pastel-peach)] px-2.5 py-1 text-[10px] font-extrabold text-[#a05a3a] ring-1 ring-[#f3dcc6]">
          Chủ đề: {issue.topic}
        </span>
        <span className="ml-auto rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
          {issue.level}
        </span>
      </div>

      <div className="mt-1.5">
        <Row label="Vấn đề" icon="⚠️">
          <p className="text-xs font-bold leading-relaxed text-[#c2547e]">{issue.issue}</p>
        </Row>

        <Row label="Bạn đã viết" icon="✍️">
          <p className="font-cn text-lg leading-snug text-[#4f3d4a]">{issue.raw}</p>
          {issue.spot && (
            <p className="mt-1.5 inline-flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--pastel-pink)]/40 px-2.5 py-1 ring-1 ring-[#f3c4d3]">
              <span className="font-cn text-sm font-bold text-[#c2547e] line-through decoration-[#c2547e]/60">{issue.spot.a || '∅'}</span>
              <span className="text-[10px] font-extrabold text-[#8d7484]" aria-hidden="true">→</span>
              <span className="font-cn text-sm font-bold text-[#3f6b50]">{issue.spot.b || '(bỏ)'}</span>
            </p>
          )}
        </Row>

        <Row label="Câu sửa · AI đề xuất" icon="✨">
          <p className="font-cn text-lg leading-snug text-[#3f6b50]">{issue.corrected}</p>
          {issue.gloss && <p className="mt-0.5 text-[11px] font-semibold italic text-[#7fae8f]">{issue.gloss.pinyin}</p>}
          {issue.gloss?.vi && <p className="mt-0.5 text-[11px] font-bold text-[#8d7484]">→ {issue.gloss.vi}</p>}
        </Row>

        <Row label="Giải thích" icon="📖">
          <p className="text-xs font-semibold leading-relaxed text-[#5d4a57]">{issue.explain}</p>
        </Row>

        <Row label="Kiến thức liên quan" icon="🏷️">
          <div className="flex flex-wrap gap-1.5">
            {issue.knowledge.map((k) => (
              <KnowledgeChip
                key={k}
                k={k}
                onGo={(key) =>
                  toast({ title: `🔗 Bài học về ${key}`, description: 'Liên kết tới bài giảng chi tiết sắp ra mắt (demo).' })
                }
              />
            ))}
          </div>
        </Row>
      </div>
    </motion.div>
  )
}

/* ---------- thẻ một lỗi trong sổ lỗi sai ---------- */

function RecordCard({
  record,
  confirmDel,
  askDelete,
  cancelDelete,
  doDelete,
  toggleResolved,
  onGo,
}: {
  record: MistakeRecord
  confirmDel: boolean
  askDelete: () => void
  cancelDelete: () => void
  doDelete: () => void
  toggleResolved: () => void
  onGo: (k: string) => void
}) {
  return (
    <li className={`paper-scrap rounded-2xl p-3.5 transition-opacity ${record.resolved ? 'opacity-65' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
          {fmtDate(record.createdAt)}
        </span>
        <TypeBadge type={record.type} />
        <span className="text-[10px] font-bold text-[#b58fa0]">{record.topic}</span>
        <span className="rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]">
          {record.level}
        </span>
        <span className="text-[10px] font-bold text-[#b58fa0]">{record.source === 'ai' ? '🤖 AI chấm' : '📌 demo'}</span>
        {record.resolved && (
          <span className="rounded-full bg-[var(--pastel-mint)] px-2.5 py-1 text-[10px] font-extrabold text-[#3f6b50] ring-1 ring-[#cfe6d6]">
            ✅ Đã khắc phục
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <span className={`font-cn text-base leading-snug ${record.resolved ? 'text-[#b58fa0] line-through decoration-[#e88aa6]/60' : 'text-[#4f3d4a]'}`}>
          {record.raw}
        </span>
        <span className="hidden text-[#b58fa0] sm:inline" aria-hidden="true">→</span>
        <span className="font-cn text-base leading-snug text-[#3f6b50]">{record.corrected}</span>
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#8d7484]">⚠️ {record.issue}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {record.knowledge.map((k) => (
          <KnowledgeChip key={k} k={k} onGo={onGo} />
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleResolved}
            className="rounded-xl bg-white/70 px-3 py-1.5 text-[10px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-mint)]/40 hover:text-[#3f6b50]"
          >
            {record.resolved ? '↩️ Chưa xong' : '✅ Đã khắc phục'}
          </button>
          {confirmDel ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={doDelete}
                aria-label="Xác nhận xoá"
                title="Xác nhận xoá"
                className="grid h-7 w-7 place-items-center rounded-lg bg-[#d2495f] text-xs font-extrabold text-white"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                aria-label="Bỏ xoá"
                title="Bỏ xoá"
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/70 text-xs font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]"
              >
                ✕
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={askDelete}
              aria-label="Xoá lỗi này"
              title="Xoá lỗi này"
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/70 text-[11px] text-[#8d7484] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:text-[#d2495f]"
            >
              🗑
            </button>
          )}
        </span>
      </div>
    </li>
  )
}

/* ================= trang chính ================= */

export default function MistakeHub() {
  const { toast } = useToast()
  const [tab, setTab] = useState<TabId>('analyze')
  const [records, setRecords] = useState<MistakeRecord[]>([])
  const [input, setInput] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [thinking, setThinking] = useState(false)
  const [filter, setFilter] = useState<MistakeType | 'all'>('all')
  const [q, setQ] = useState('')
  const [confirmDelId, setConfirmDelId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadMistakes())
  }, [])

  const persist = (next: MistakeRecord[]) => {
    setRecords(next)
    saveMistakes(next)
  }

  const runAnalyze = (text: string) => {
    const t = text.trim()
    if (!t) {
      toast({ title: '✍️ Chưa có câu nào', description: 'Nhập một câu tiếng Trung, ví dụ: 我昨天去学校了没有。' })
      return
    }
    if (!/[\u4e00-\u9fff]/.test(t)) {
      toast({ title: '🀄 Câu chưa có chữ Hán', description: 'Hãy viết bằng tiếng Trung để AI đối chiếu quy luật lỗi.' })
      return
    }
    setInput(t)
    setAnalysis(null)
    setThinking(true)
    window.setTimeout(() => {
      setAnalysis(analyzeSentence(t))
      setThinking(false)
    }, 650)
  }

  const saveIssues = () => {
    if (!analysis || analysis.issues.length === 0) return
    const now = Date.now()
    const recs: MistakeRecord[] = analysis.issues.map((it, i) => ({
      id: `${genId()}-${i}`,
      raw: it.raw,
      corrected: it.corrected,
      type: it.type,
      topic: it.topic,
      issue: it.issue,
      explain: it.explain,
      knowledge: it.knowledge,
      level: it.level,
      createdAt: now,
      resolved: false,
      source: 'ai',
    }))
    persist([...recs, ...records])
    toast({ title: `💾 Đã lưu ${recs.length} lỗi vào 错题本`, description: 'Tab "Quy luật của bạn" sẽ cập nhật ngay.' })
    setAnalysis(null)
    setInput('')
  }

  const toggleResolved = (id: string) => {
    const next = records.map((r) => (r.id === id ? { ...r, resolved: !r.resolved } : r))
    persist(next)
    const rec = next.find((r) => r.id === id)
    if (rec?.resolved) toast({ title: '🎉 Giỏi lắm! Một lỗi đã được khắc phục', description: 'Lỗi này sẽ không còn tính vào quy luật.' })
  }

  const removeRecord = (id: string) => {
    persist(records.filter((r) => r.id !== id))
    setConfirmDelId(null)
    toast({ title: '🗑 Đã xoá lỗi khỏi sổ' })
  }

  const resetDemo = () => {
    persist(buildSeedRecords())
    setConfirmReset(false)
    toast({ title: '🔄 Đã nạp lại dữ liệu demo', description: '14 lỗi mẫu: 7 lỗi 了 · 4 lỗi lượng từ · 3 lỗi trật tự.' })
  }

  const conclusion = buildConclusion(records)
  const openCount = conclusion.open
  const patternTopics = [...new Set(ERROR_PATTERNS.map((p) => p.topic))]

  const filtered = records
    .filter((r) => (filter === 'all' ? true : r.type === filter))
    .filter((r) => {
      const needle = normSearch(q.trim())
      if (!needle) return true
      return normSearch(`${r.raw} ${r.corrected} ${r.topic} ${r.knowledge.join(' ')} ${r.issue}`).includes(needle)
    })
    .sort((a, b) => b.createdAt - a.createdAt)
  const shown = filtered.slice(0, 30)

  return (
    <div className="flex min-h-screen flex-col bg-[#fff6e9] text-[#5d4a57]">
      <main className="relative flex-1 pb-16 pt-20 sm:pt-24">
        <div aria-hidden="true" className="dot-grid absolute inset-0" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          {/* ================= header ================= */}
          <Reveal>
            <header className="paper-scrap relative rounded-3xl px-5 py-6 sm:px-8 sm:py-7">
              <WashiTape color="var(--pastel-lilac)" pattern="dots" rotate={-5} className="-top-3 left-10 h-6 w-20" />
              <PushPin color="#9a86c9" className="absolute right-8 top-3 scale-75" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="leading-tight">
                    <span className="relative inline-block px-3 py-0.5">
                      <span aria-hidden="true" className="absolute inset-0 -rotate-1 rounded-md bg-[var(--pastel-lilac)] opacity-80" />
                      <span className="relative font-display text-2xl font-bold text-[#4f3d4a] sm:text-3xl">Phân tích lỗi sai cá nhân</span>
                      <span className="relative ml-2 hidden font-cn text-2xl text-[#6d5a94] sm:inline" aria-hidden="true">
                        错题本
                      </span>
                    </span>
                  </h1>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-[#8d7484]">
                    Không chỉ báo đúng/sai — AI <b className="text-[#6d5a94]">phân loại lỗi</b> (ngữ pháp, trợ từ, lượng từ, trật tự từ),
                    <b className="text-[#6d5a94]"> lưu lại lịch sử</b> rồi tìm ra <b className="text-[#6d5a94]">quy luật sai</b> của bạn qua nhiều bài.
                  </p>
                </div>
                <span aria-hidden="true" className="hidden shrink-0 text-5xl sm:block">🧠</span>
              </div>

              <div className="absolute -bottom-5 right-6 hidden sm:block">
                <PandaSticker className="h-16 w-16" />
              </div>
            </header>
          </Reveal>

          {/* ================= tabs ================= */}
          <Reveal delay={0.05}>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white/60 p-1.5 ring-1 ring-[#ead9cd]" role="tablist" aria-label="Khu vực sổ lỗi sai">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                      tab === t.id
                        ? 'bg-[#4f3d4a] text-white shadow-sm'
                        : 'text-[#6f5a68] hover:bg-[var(--pastel-butter)]/50'
                    }`}
                  >
                    <span aria-hidden="true">{t.emoji}</span>
                    {t.label}
                    <span className="font-cn text-[11px] opacity-70">{t.cn}</span>
                    {t.id === 'book' && openCount > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-[var(--pastel-pink)] text-[#8a4a63]'}`}>
                        {openCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-[#b58fa0]">
                {records.length} lỗi trong sổ · {openCount} chưa khắc phục · lưu trên máy bạn
              </p>
            </div>
          </Reveal>

          <AnimatePresence mode="wait">
            {/* ================= tab 1: phân tích câu ================= */}
            {tab === 'analyze' && (
              <motion.section
                key="analyze"
                role="tabpanel"
                aria-label="Phân tích câu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-4 space-y-3"
              >
                <p className="text-[11px] font-bold text-[#8d7484]">
                  1️⃣ Viết câu · 2️⃣ AI phân loại lỗi · 3️⃣ Lưu vào sổ · 4️⃣ AI tìm quy luật sau nhiều bài
                </p>

                <div className="paper-scrap rounded-3xl p-4 sm:p-5">
                  <label htmlFor="mistake-input" className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">
                    Câu tiếng Trung của bạn
                  </label>
                  <textarea
                    id="mistake-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    placeholder="Ví dụ: 我昨天去学校了没有。"
                    className="mt-2 w-full resize-none rounded-2xl bg-white/80 px-4 py-3 font-cn text-lg text-[#4f3d4a] outline-none ring-1 ring-[#ead9cd] transition-shadow placeholder:text-[#c9a2b3] focus:ring-2 focus:ring-[#e88aa6]"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => runAnalyze(input)}
                      className="rounded-xl bg-[#4f3d4a] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#3a2d36] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      🔍 Phân tích với AI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInput('')
                        setAnalysis(null)
                      }}
                      className="rounded-xl bg-white/70 px-4 py-2.5 text-xs font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:text-[#c2547e]"
                    >
                      ✕ Xoá
                    </button>
                    <span className="ml-auto text-[10px] font-semibold text-[#b58fa0]">{input.trim().length} ký tự</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dashed border-[#ead9cd] pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">Thử câu mẫu:</span>
                    {EXAMPLE_SENTENCES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => runAnalyze(ex)}
                        className="rounded-full bg-[var(--pastel-butter)]/50 px-2.5 py-1 font-cn text-xs font-bold text-[#8a6a1f] ring-1 ring-[#f2e2b8] transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-butter)]"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI đang suy nghĩ */}
                {thinking && (
                  <div className="paper-scrap flex items-center justify-center gap-3 rounded-3xl p-8" aria-live="polite">
                    <motion.span
                      animate={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-2xl"
                      aria-hidden="true"
                    >
                      🤖
                    </motion.span>
                    <p className="text-xs font-extrabold text-[#6d5a94]">AI đang đối chiếu {ERROR_PATTERNS.length} quy luật lỗi thường gặp…</p>
                  </div>
                )}

                {/* kết quả */}
                {analysis && !thinking && (
                  <div className="space-y-3">
                    {analysis.issues.length > 0 ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="paper-scrap flex flex-wrap items-center gap-2.5 rounded-2xl px-4 py-3"
                        >
                          <span className="font-display text-sm font-bold text-[#4f3d4a]">
                            🔍 Phát hiện {analysis.issues.length} lỗi
                          </span>
                          <span className="text-[10px] font-semibold text-[#b58fa0]">trong câu: {analysis.raw}</span>
                          <span className="ml-auto flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={saveIssues}
                              className="rounded-xl bg-[var(--pastel-mint)] px-4 py-2 text-xs font-extrabold text-[#3f6b50] ring-1 ring-[#cfe6d6] transition-all hover:-translate-y-0.5"
                            >
                              💾 Lưu {analysis.issues.length} lỗi vào sổ
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAnalysis(null)
                                setInput('')
                              }}
                              className="rounded-xl bg-white/70 px-4 py-2 text-xs font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5"
                            >
                              🔄 Phân tích câu khác
                            </button>
                          </span>
                        </motion.div>
                        {analysis.issues.map((it, i) => (
                          <IssueCard key={`${it.patternId}-${i}`} issue={it} index={i} />
                        ))}
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="paper-scrap rounded-3xl p-5 text-center"
                      >
                        <StarDoodle className="mx-auto h-7 w-7" />
                        <p className="mt-2 font-display text-base font-bold text-[#3f6b50]">
                          🎉 Không phát hiện lỗi nào trong kho quy luật!
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-[11px] font-semibold leading-relaxed text-[#8d7484]">
                          Câu <span className="font-cn text-sm text-[#4f3d4a]">{analysis.raw}</span> có thể đã đúng, hoặc thuộc dạng lỗi AI
                          chưa học. Hiện AI nhận diện các quy luật sau:
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                          {patternTopics.map((t) => (
                            <span key={t} className="rounded-full bg-[var(--pastel-mint)]/40 px-2.5 py-1 text-[10px] font-bold text-[#3f6b50] ring-1 ring-[#cfe6d6]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.section>
            )}

            {/* ================= tab 2: sổ lỗi sai ================= */}
            {tab === 'book' && (
              <motion.section
                key="book"
                role="tabpanel"
                aria-label="Sổ lỗi sai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-4 space-y-3"
              >
                <div className="paper-scrap flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'grammar', 'particle', 'measure', 'order'] as const).map((f) => {
                      const n = f === 'all' ? records.length : records.filter((r) => r.type === f).length
                      const label = f === 'all' ? 'Tất cả' : TYPE_META[f].label
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFilter(f)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-all ${
                            filter === f
                              ? 'bg-[#4f3d4a] text-white shadow-sm'
                              : 'bg-white/70 text-[#6f5a68] ring-1 ring-[#ead9cd] hover:-translate-y-0.5'
                          }`}
                        >
                          {f === 'all' ? '🗂' : TYPE_META[f].emoji} {label} · {n}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm theo câu, chủ đề, kiến thức…"
                    aria-label="Tìm trong sổ lỗi sai"
                    className="ml-auto w-full max-w-56 rounded-xl bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#4f3d4a] outline-none ring-1 ring-[#ead9cd] transition-shadow placeholder:text-[#c9a2b3] focus:ring-2 focus:ring-[#e88aa6]"
                  />
                </div>

                {shown.length > 0 ? (
                  <>
                    <ul className="space-y-2.5">
                      {shown.map((r) => (
                        <RecordCard
                          key={r.id}
                          record={r}
                          confirmDel={confirmDelId === r.id}
                          askDelete={() => setConfirmDelId(r.id)}
                          cancelDelete={() => setConfirmDelId(null)}
                          doDelete={() => removeRecord(r.id)}
                          toggleResolved={() => toggleResolved(r.id)}
                          onGo={(key) =>
                            toast({ title: `🔗 Bài học về ${key}`, description: 'Liên kết tới bài giảng chi tiết sắp ra mắt (demo).' })
                          }
                        />
                      ))}
                    </ul>
                    {filtered.length > shown.length && (
                      <p className="text-center text-[10px] font-bold text-[#b58fa0]">
                        … và {filtered.length - shown.length} lỗi cũ hơn nữa
                      </p>
                    )}
                  </>
                ) : (
                  <div className="paper-scrap rounded-3xl p-8 text-center">
                    <span className="text-4xl" aria-hidden="true">📖</span>
                    <p className="mt-2 font-display text-sm font-bold text-[#4f3d4a]">
                      {records.length === 0 ? 'Sổ lỗi sai còn trống' : 'Không có lỗi nào khớp bộ lọc'}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-[#8d7484]">
                      {records.length === 0
                        ? 'Vào tab "Phân tích câu", viết một câu tiếng Trung và lưu lỗi lại nhé!'
                        : 'Thử đổi bộ lọc hoặc từ khoá tìm kiếm.'}
                    </p>
                  </div>
                )}
              </motion.section>
            )}

            {/* ================= tab 3: quy luật & báo cáo ================= */}
            {tab === 'report' && (
              <motion.section
                key="report"
                role="tabpanel"
                aria-label="Quy luật của bạn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-4 space-y-3"
              >
                {/* AI kết luận */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="paper-scrap relative overflow-hidden rounded-3xl p-5 sm:p-6"
                  style={{ background: 'linear-gradient(130deg, rgba(226,214,240,0.55), rgba(255,253,246,0.92) 55%, rgba(243,196,211,0.35))' }}
                >
                  <StarDoodle className="absolute right-6 top-4 h-6 w-6" color="#c9a2b3" />
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-2xl shadow-sm" aria-hidden="true">
                      🤖
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a6a1f]">
                        AI kết luận · phân tích {conclusion.open} lỗi chưa khắc phục
                      </p>
                      <p className="font-display text-lg font-bold leading-snug text-[#4f3d4a] sm:text-xl">{conclusion.headline}</p>
                    </div>
                    <span className="ml-auto hidden rounded-full bg-[var(--pastel-butter)] px-3 py-1 text-[10px] font-extrabold text-[#8a6a1f] ring-1 ring-[#f2e2b8] sm:block">
                      Mức độ: {conclusion.strength}
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-xs font-semibold leading-relaxed text-[#5d4a57]">{conclusion.body}</p>

                  <div className="mt-3.5 rounded-2xl bg-[var(--pastel-butter)]/50 p-3.5 ring-1 ring-[#f2e2b8]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a6a1f]">💊 Cách chữa</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#5d4a57]">{conclusion.advice}</p>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58fa0]">Luyện tập chú trọng:</span>
                    {conclusion.drills.map((d) => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => toast({ title: `🚀 ${d.label}`, description: 'Đã thêm vào kế hoạch ôn tập tuần này (demo).' })}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-extrabold text-[#6f5a68] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-lilac)]/40 hover:text-[#6d5a94]"
                      >
                        {d.emoji} {d.label}
                      </button>
                    ))}
                  </div>
                </motion.div>

                <div className="grid gap-3 lg:grid-cols-5">
                  {/* thanh quy luật theo kiến thức */}
                  <Reveal className="lg:col-span-3">
                    <div className="paper-scrap h-full rounded-3xl p-4 sm:p-5">
                      <h3 className="font-display text-sm font-bold text-[#4f3d4a]">
                        Quy luật theo kiến thức <span className="ml-1 font-cn text-xs text-[#b58fa0]">知识规律</span>
                      </h3>
                      {conclusion.stats.length > 0 ? (
                        <ul className="mt-4 space-y-3">
                          {conclusion.stats.slice(0, 6).map((s, i) => (
                            <li key={s.key}>
                              <div className="flex items-baseline justify-between gap-2 text-[11px] font-bold text-[#5d4a57]">
                                <span className="truncate">{s.key}</span>
                                <span className="shrink-0 text-[#b58fa0]">
                                  {s.count} lần · {s.pct}%
                                </span>
                              </div>
                              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--cream)] ring-1 ring-[#ead9cd]">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(s.pct, 6)}%` }}
                                  transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                  className="h-full rounded-full"
                                  style={{ background: knowledgeColor(s.key) }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-[11px] font-semibold text-[#8d7484]">Chưa có dữ liệu — hãy lưu vài lỗi trước nhé!</p>
                      )}
                    </div>
                  </Reveal>

                  {/* theo loại lỗi */}
                  <Reveal delay={0.08} className="lg:col-span-2">
                    <div className="paper-scrap h-full rounded-3xl p-4 sm:p-5">
                      <h3 className="font-display text-sm font-bold text-[#4f3d4a]">
                        Theo loại lỗi <span className="ml-1 font-cn text-xs text-[#b58fa0]">错误类型</span>
                      </h3>
                      <ul className="mt-3.5 space-y-2">
                        {conclusion.byType.map(({ type, count }) => {
                          const meta = TYPE_META[type]
                          return (
                            <li key={type} className="flex items-center gap-2.5 rounded-2xl bg-[var(--cream)] px-3 py-2 ring-1 ring-[#ead9cd]">
                              <span className="text-base" aria-hidden="true">{meta.emoji}</span>
                              <span className="text-[11px] font-extrabold text-[#5d4a57]">{meta.label}</span>
                              <span className="ml-auto font-display text-sm font-extrabold" style={{ color: meta.color }}>
                                {count}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </Reveal>
                </div>

                {/* lỗi mới nhất */}
                {records.length > 0 && (
                  <Reveal delay={0.1}>
                    <div className="paper-scrap rounded-3xl p-4 sm:p-5">
                      <h3 className="font-display text-sm font-bold text-[#4f3d4a]">
                        Lỗi mới nhất <span className="ml-1 font-cn text-xs text-[#b58fa0]">最近</span>
                      </h3>
                      <ul className="mt-3 space-y-1.5">
                        {[...records]
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .slice(0, 5)
                          .map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--cream)] px-3 py-2 ring-1 ring-[#ead9cd]">
                              <span className="text-[10px] font-extrabold text-[#b58fa0]">{fmtDate(r.createdAt)}</span>
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_META[r.type].color }} aria-hidden="true" />
                              <span className={`font-cn text-sm ${r.resolved ? 'text-[#b58fa0] line-through' : 'text-[#4f3d4a]'}`}>{r.raw}</span>
                              <span className="text-[10px] text-[#b58fa0]" aria-hidden="true">→</span>
                              <span className="font-cn text-sm text-[#3f6b50]">{r.corrected}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </Reveal>
                )}

                {/* vùng dữ liệu */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <p className="text-[10px] font-semibold text-[#b58fa0]">
                    📌 Sổ lỗi sai của bạn lưu ngay trên thiết bị (localStorage) — AI kết luận lại mỗi khi có lỗi mới.
                  </p>
                  {confirmReset ? (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-[#c2547e]">Nạp lại 14 lỗi demo?</span>
                      <button
                        type="button"
                        onClick={resetDemo}
                        className="rounded-xl bg-[#d2495f] px-3.5 py-2 text-[11px] font-extrabold text-white"
                      >
                        ✓ Nạp lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="rounded-xl bg-white/70 px-3.5 py-2 text-[11px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd]"
                      >
                        ✕ Thôi
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="ml-auto rounded-xl bg-white/70 px-4 py-2 text-[11px] font-extrabold text-[#8d7484] ring-1 ring-[#ead9cd] transition-all hover:-translate-y-0.5 hover:text-[#c2547e]"
                    >
                      🔄 Nạp lại dữ liệu demo
                    </button>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  )
}
