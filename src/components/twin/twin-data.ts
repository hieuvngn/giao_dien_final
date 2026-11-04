/* ============================================================
   AI Learning Twin — Bản sao năng lực tiếng Trung (能力画像)
   Route: #/twin
   ------------------------------------------------------------
   Nguyên tắc kiến trúc (điểm khác biệt của tính năng):
   1. THU THẬP — mỗi kết quả học tập (flashcard, shadowing, dictation,
      đề thi, luyện viết...) được ghi lại thành sự kiện kèm đúng/sai
      và thời gian phản hồi.
   2. TÍNH CHỈ SỐ — 6 chỉ số năng lực được TÍNH CỤC BỘ từ các sự kiện
      (hàm thuần dưới đây), cập nhật sau mỗi phiên học, không cần AI.
   3. AI CHỈ VIẾT NHẬN XÉT — mô hình ngôn ngữ chỉ nhận bảng chỉ số
      cuối cùng để diễn giải thành lời nhận xét + đề xuất, không phải
      phân tích lại toàn bộ dữ liệu mỗi lần.
   Toàn bộ hàm trong file này là hàm thuần (pure) — không React,
   không mutate biến ngoài scope → an toàn với react-compiler.
   ============================================================ */

export type SkillKey =
  | 'vocab'
  | 'grammar'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'reaction'

export type TwinWindow = 7 | 30

export type SkillMeta = {
  key: SkillKey
  emoji: string
  label: string
  cn: string
  color: string
  question: string
}

export const SKILLS: SkillMeta[] = [
  { key: 'vocab', emoji: '📗', label: 'Từ vựng', cn: '词汇', color: '#d2495f', question: 'Nhớ tốt hay thường xuyên quên?' },
  { key: 'grammar', emoji: '🧩', label: 'Ngữ pháp', cn: '语法', color: '#e88aa6', question: 'Hiểu cấu trúc hay chỉ ghi nhớ máy móc?' },
  { key: 'listening', emoji: '🎧', label: 'Nghe hiểu', cn: '听力', color: '#6f93bd', question: 'Nhận ra từ khi nghe hay chỉ khi nhìn chữ?' },
  { key: 'reading', emoji: '📖', label: 'Đọc hiểu', cn: '阅读', color: '#9b8fc9', question: 'Có khả năng suy luận nội dung không?' },
  { key: 'writing', emoji: '✍️', label: 'Viết', cn: '写作', color: '#c99a4b', question: 'Thường mắc lỗi gì khi viết?' },
  { key: 'reaction', emoji: '⚡', label: 'Phản xạ', cn: '反应', color: '#3f6b50', question: 'Mất bao lâu để trả lời?' },
]

export function skillMeta(key: SkillKey): SkillMeta {
  return SKILLS.find((s) => s.key === key) ?? SKILLS[0]
}

/* ================= dữ liệu tổng hợp đã thu thập ================= */

export type WritingIssue = { cn: string; pinyin: string; vi: string; count: number }

export type WindowAgg = {
  events: number // tổng số kết quả học tập đã thu thập trong kỳ
  minutes: number
  streak: number
  lastUpdated: string
  vocabReviews: number
  vocabCorrect: number
  vocabReadTotal: number // đếm "nhìn chữ Hán có nhận ra nghĩa không"
  vocabReadKnown: number
  vocabListenTotal: number // đếm "nghe audio có nhận ra từ không"
  vocabListenKnown: number
  grammarTotal: number
  grammarCorrect: number
  grammarDeep: number // đúng nhờ ÁP DỤNG cấu trúc (không chỉ nhận ra mẫu quen)
  readingTotal: number
  readingCorrect: number
  readingInfer: number // câu trả lời đúng nhờ suy luận ngữ cảnh
  writingTotal: number
  writingClean: number // câu viết không lỗi
  writingIssues: WritingIssue[]
  reactionSamples: number
  reactionAvgMs: number
  reactionFastPct: number // % trả lời nhanh dưới 2 giây
}

export const WINDOWS: Record<TwinWindow, WindowAgg> = {
  7: {
    events: 48,
    minutes: 132,
    streak: 7,
    lastUpdated: '5 phút trước',
    vocabReviews: 50,
    vocabCorrect: 43,
    vocabReadTotal: 24,
    vocabReadKnown: 20,
    vocabListenTotal: 24,
    vocabListenKnown: 13,
    grammarTotal: 23,
    grammarCorrect: 16,
    grammarDeep: 14,
    readingTotal: 17,
    readingCorrect: 11,
    readingInfer: 7,
    writingTotal: 9,
    writingClean: 5,
    writingIssues: [
      { cn: '了', pinyin: 'le', vi: 'cách dùng trợ từ 了', count: 2 },
      { cn: '量词', pinyin: 'liàngcí', vi: 'lượng từ', count: 2 },
      { cn: '状语', pinyin: 'zhuàngyǔ', vi: 'trật tự trạng ngữ', count: 1 },
    ],
    reactionSamples: 46,
    reactionAvgMs: 2850,
    reactionFastPct: 46,
  },
  30: {
    events: 214,
    minutes: 486,
    streak: 12,
    lastUpdated: '5 phút trước',
    vocabReviews: 184,
    vocabCorrect: 151,
    vocabReadTotal: 55,
    vocabReadKnown: 47,
    vocabListenTotal: 52,
    vocabListenKnown: 27,
    grammarTotal: 44,
    grammarCorrect: 30,
    grammarDeep: 19,
    readingTotal: 36,
    readingCorrect: 22,
    readingInfer: 12,
    writingTotal: 20,
    writingClean: 11,
    writingIssues: [
      { cn: '了', pinyin: 'le', vi: 'cách dùng trợ từ 了', count: 4 },
      { cn: '量词', pinyin: 'liàngcí', vi: 'lượng từ', count: 3 },
      { cn: '状语', pinyin: 'zhuàngyǔ', vi: 'trật tự trạng ngữ', count: 2 },
    ],
    reactionSamples: 138,
    reactionAvgMs: 2900,
    reactionFastPct: 44,
  },
}

/* Điểm của kỳ trước (cùng độ dài kỳ) — để tính xu hướng */
const PREV_SCORES: Record<TwinWindow, Record<SkillKey, number>> = {
  7: { vocab: 83, grammar: 67, listening: 51, reading: 61, writing: 57, reaction: 57 },
  30: { vocab: 79, grammar: 66, listening: 49, reading: 58, writing: 58, reaction: 56 },
}

/* ================= tính chỉ số 6 chiều ================= */

export type TwinIndices = {
  window: TwinWindow
  scores: Record<SkillKey, number>
  trends: Record<SkillKey, number>
  overall: number
  trend: number
  vocabReadPct: number
  vocabListenPct: number
  readListenGap: number
  reactionAvgSec: string
  weakest: SkillKey
  strongest: SkillKey
  agg: WindowAgg
}

const pctOf = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0

/* Phản xạ: 1,5s ≈ 92 điểm · 2,9s ≈ 58 điểm · trên 4s dưới 40 điểm */
const reactionScore = (avgMs: number): number =>
  Math.max(0, Math.min(100, Math.round(130 - (avgMs / 1000) * 25)))

const WEIGHTS: Record<SkillKey, number> = {
  vocab: 0.22,
  grammar: 0.18,
  listening: 0.2,
  reading: 0.18,
  writing: 0.12,
  reaction: 0.1,
}

export function computeTwinIndices(window: TwinWindow): TwinIndices {
  const a = WINDOWS[window]

  const scores = {} as Record<SkillKey, number>
  scores.vocab = pctOf(a.vocabCorrect, a.vocabReviews)
  scores.grammar = pctOf(a.grammarCorrect, a.grammarTotal)
  scores.listening = pctOf(a.vocabListenKnown, a.vocabListenTotal)
  scores.reading = pctOf(a.readingCorrect, a.readingTotal)
  scores.writing = pctOf(a.writingClean, a.writingTotal)
  scores.reaction = reactionScore(a.reactionAvgMs)

  const trends = {} as Record<SkillKey, number>
  for (const s of SKILLS) trends[s.key] = scores[s.key] - PREV_SCORES[window][s.key]

  let overall = 0
  for (const s of SKILLS) overall += scores[s.key] * WEIGHTS[s.key]
  overall = Math.round(overall)

  const vocabReadPct = pctOf(a.vocabReadKnown, a.vocabReadTotal)
  const vocabListenPct = pctOf(a.vocabListenKnown, a.vocabListenTotal)

  const sorted = [...SKILLS].sort((x, y) => scores[y.key] - scores[x.key])

  return {
    window,
    scores,
    trends,
    overall,
    trend: overall - Math.round(
      SKILLS.reduce((sum, s) => sum + PREV_SCORES[window][s.key] * WEIGHTS[s.key], 0),
    ),
    vocabReadPct,
    vocabListenPct,
    readListenGap: vocabReadPct - vocabListenPct,
    reactionAvgSec: (a.reactionAvgMs / 1000).toFixed(1).replace('.', ','),
    weakest: sorted[sorted.length - 1].key,
    strongest: sorted[0].key,
    agg: a,
  }
}

/* ================= nhãn cấp độ ================= */

export function overallLevel(trend: number): { label: string; emoji: string; note: string } {
  if (trend >= 2) return { label: 'Đang tiến bộ', emoji: '📈', note: 'điểm tăng so với kỳ trước' }
  if (trend > -2) return { label: 'Ổn định', emoji: '➡️', note: 'duy trì đều' }
  return { label: 'Cần đẩy nhanh', emoji: '🔥', note: 'hơi chững lại, cần luyện thêm' }
}

export function estHsk(overall: number): string {
  if (overall < 40) return 'HSK 1'
  if (overall < 52) return 'HSK 1.5'
  if (overall < 64) return 'HSK 2'
  if (overall < 72) return 'HSK 2.5'
  if (overall < 80) return 'HSK 3'
  return 'HSK 3.5+'
}

export const trendLabel = (v: number): string => (v > 0 ? `+${v}` : `${v}`)

/* ================= AI viết nhận xét =================
   Lưu ý kiến trúc: hàm này MÔ PHỎNG bước "AI diễn giải" — nó chỉ nhận
   bảng chỉ số TwinIndices (đã tính cục bộ) và ghép lời nhận xét, không
   đụng tới dữ liệu thô. Đổi sang LLM thật sau này chỉ cần thay hàm này. */

export type Suggestion = { emoji: string; label: string; desc: string; href: string }

export type AiComment = { paragraphs: string[]; suggestions: Suggestion[] }

function qual(v: number): string {
  if (v >= 75) return 'khá tốt'
  if (v >= 60) return 'tạm ổn'
  return 'còn hạn chế'
}

export function buildAiComment(idx: TwinIndices): AiComment {
  const paragraphs: string[] = []
  const suggestions: Suggestion[] = []
  const w = idx.weakest
  const wMeta = skillMeta(w)

  if (w === 'listening') {
    paragraphs.push(
      `Bạn có vốn từ ${qual(idx.scores.vocab)} nhưng khả năng nghe hiểu còn yếu.`,
    )
    if (idx.readListenGap >= 15) {
      paragraphs.push(
        `Đặc biệt, bạn thường nhận diện được từ khi nhìn thấy chữ Hán (nhớ khi đọc: ${idx.vocabReadPct}%) nhưng không nhận ra khi nghe người bản xứ phát âm (nhớ khi nghe: chỉ ${idx.vocabListenPct}%).`,
      )
    } else {
      paragraphs.push(
        `Tỷ lệ nhận diện từ khi nghe mới đạt ${idx.vocabListenPct}% — nên đổi thói quen học: nghe audio trước, nhìn chữ và phiên âm sau.`,
      )
    }
    suggestions.push(
      { emoji: '🎧', label: '10 phút Shadowing', desc: 'Bắt chước ngữ điệu người bản xứ — chữa "đọc được mà nghe không ra"', href: '#/shadowing' },
      { emoji: '🔊', label: '15 từ vựng luyện nghe', desc: 'Dictation: nghe trước – nhìn chữ sau', href: '#/review' },
    )
  } else if (w === 'vocab') {
    paragraphs.push(
      `Ghi nhớ từ vựng (${idx.scores.vocab}%) là điểm yếu rõ nhất hiện tại — những từ học cách đây hơn một tuần bắt đầu rơi khỏi trí nhớ trước khi kịp vào dài hạn.`,
    )
    suggestions.push(
      { emoji: '🔁', label: 'Ôn 20 thẻ sắp quên', desc: 'Lặp lại ngắt quãng theo lịch SRS', href: '#/review' },
      { emoji: '🃏', label: 'Chia lại bộ thẻ', desc: 'Tách từ dễ/quên ra hai nhóm', href: '#/my-decks' },
    )
  } else if (w === 'grammar') {
    paragraphs.push(
      `Ngữ pháp (${idx.scores.grammar}%) đang là mắt xích yếu: bạn nhận ra mẫu câu khi đọc nhưng chưa tự đặt được câu mới với cùng cấu trúc.`,
    )
    suggestions.push(
      { emoji: '🧩', label: 'Luyện 5 câu áp dụng', desc: 'Đặt câu mới với mẫu câu vừa học', href: '#/exam' },
    )
  } else if (w === 'reading') {
    paragraphs.push(
      `Đọc hiểu (${idx.scores.reading}%) còn chậm: bạn dịch được từng từ nhưng chưa luôn ghép được ý của cả đoạn.`,
    )
    suggestions.push(
      { emoji: '📖', label: 'Đọc 1 đoạn ngắn/ngày', desc: 'Đọc toàn đoạn rồi mới tra từ', href: '#/dictionary' },
    )
  } else if (w === 'writing') {
    paragraphs.push(
      `Khi viết (${idx.scores.writing}% câu sạch lỗi), bạn hay lặp lại cùng một nhóm lỗi — đây là lỗi "quen tay", cần sửa có chủ đích.`,
    )
    suggestions.push(
      { emoji: '📕', label: 'Xem sổ lỗi sai', desc: 'Ôn kiến thức liên quan đến lỗi đã lưu', href: '#/mistakes' },
    )
  } else {
    paragraphs.push(
      `Phản xạ của bạn (${idx.reactionAvgSec} giây/câu) còn chậm so với nhóm cùng cấp độ — hiểu nghĩa nhưng mất một nhịp để "lục lại".`,
    )
    suggestions.push(
      { emoji: '⚡', label: 'Trắc nghiệm nhanh 5 phút', desc: 'Đặt giới hạn thời gian để tăng tốc phản xạ', href: '#/exam' },
    )
  }

  /* quan sát "ghi nhớ máy móc" ở ngữ pháp */
  const rote = idx.agg.grammarCorrect - idx.agg.grammarDeep
  if (w !== 'grammar' && rote >= 5 && idx.scores.grammar >= 60) {
    paragraphs.push(
      `Ngữ pháp của bạn đang ở mức ${qual(idx.scores.grammar)}, nhưng có ${rote} câu bạn trả lời đúng nhờ "nhận ra mẫu quen" chứ chưa hẳn hiểu cấu trúc — hãy thử đặt câu mới với chính mẫu câu đó.`,
    )
  }

  /* lỗi viết lặp lại (nối với Sổ lỗi sai AI) */
  const top = idx.agg.writingIssues[0]
  if (top && top.count >= 2) {
    paragraphs.push(
      `Khi viết, lỗi bạn lặp lại nhiều nhất là ${top.vi} — ${top.count} lần trong ${idx.window} ngày qua.`,
    )
    if (w !== 'writing') {
      suggestions.push({
        emoji: '✍️',
        label: `Sửa 3 câu lỗi ${top.cn}`,
        desc: `Luyện lại lỗi ${top.vi} trong ngữ cảnh mới`,
        href: '#/mistakes',
      })
    }
  }

  paragraphs.push(
    `Nhìn tổng thể: ${overallLevel(idx.trend).label.toLowerCase()} (${trendLabel(idx.trend)} điểm so với kỳ trước, năng lực ước tính ${estHsk(idx.overall)}). Tập trung vào ${wMeta.label.toLowerCase()} trước — sẽ là hiệu quả nhất trong 2 tuần tới.`,
  )

  return { paragraphs, suggestions }
}

/* ================= chi tiết từng chiều ================= */

export type FactLine = { label: string; value: string; pct: number | null }

export type DimensionFacts = { lines: FactLine[]; note: string }

export function dimensionFacts(idx: TwinIndices, key: SkillKey): DimensionFacts {
  const a = idx.agg
  switch (key) {
    case 'vocab':
      return {
        lines: [
          { label: 'Tỷ lệ nhớ khi ôn flashcard', value: `${idx.scores.vocab}%`, pct: idx.scores.vocab },
          { label: 'Nhận diện khi nhìn chữ Hán', value: `${idx.vocabReadPct}%`, pct: idx.vocabReadPct },
          { label: 'Nhận diện khi nghe (không nhìn chữ)', value: `${idx.vocabListenPct}%`, pct: idx.vocabListenPct },
        ],
        note:
          idx.readListenGap >= 15
            ? `Khoảng cách đọc–nghe là ${idx.readListenGap}%: chữ Hán "gợi nhớ" tốt hơn nhiều so với âm thanh → cần luyện nghe chủ động.`
            : 'Kênh nhìn và kênh nghe khá cân bằng — rất tốt!',
      }
    case 'grammar':
      return {
        lines: [
          { label: 'Đúng khi luyện tập ngữ pháp', value: `${idx.scores.grammar}%`, pct: idx.scores.grammar },
          {
            label: 'Đúng nhờ áp dụng cấu trúc (hiểu thật sự)',
            value: `${a.grammarDeep}/${a.grammarCorrect} câu`,
            pct: pctOf(a.grammarDeep, Math.max(1, a.grammarCorrect)),
          },
        ],
        note: `${Math.max(0, a.grammarCorrect - a.grammarDeep)} câu còn lại đúng nhờ nhận ra mẫu câu quen — ghi nhớ máy móc, chưa thành phản xạ.`,
      }
    case 'listening':
      return {
        lines: [
          { label: 'Nhận diện từ khi nghe', value: `${idx.vocabListenPct}%`, pct: idx.vocabListenPct },
          { label: 'Cùng nhóm từ đó khi nhìn chữ', value: `${idx.vocabReadPct}%`, pct: idx.vocabReadPct },
          { label: 'Shadowing đạt nhịp & ngữ điệu', value: '71%', pct: 71 },
        ],
        note: 'Điểm yếu lớn nhất hiện nay. Nguyên nhân thường gặp: học từ chủ yếu bằng mắt. Hãy nghe audio trước khi đọc phiên âm.',
      }
    case 'reading':
      return {
        lines: [
          { label: 'Đúng khi làm đọc hiểu', value: `${idx.scores.reading}%`, pct: idx.scores.reading },
          {
            label: 'Suy luận được từ mới qua ngữ cảnh',
            value: `${a.readingInfer}/${a.readingCorrect} câu`,
            pct: pctOf(a.readingInfer, Math.max(1, a.readingCorrect)),
          },
        ],
        note: 'Khả năng suy luận đang hình thành — đủ để bắt ý chính, chưa chắc với nội dung trừu tượng.',
      }
    case 'writing': {
      const maxIssue = Math.max(...a.writingIssues.map((i) => i.count), 1)
      return {
        lines: [
          { label: 'Câu viết không có lỗi', value: `${idx.scores.writing}%`, pct: idx.scores.writing },
          ...a.writingIssues.map((i) => ({
            label: `Lỗi: ${i.vi} · ${i.pinyin}`,
            value: `${i.count} lần`,
            pct: Math.round((i.count / maxIssue) * 100),
          })),
        ],
        note: `Lỗi lặp lại nhiều nhất: ${a.writingIssues[0]?.vi ?? '—'} — mở "Sổ lỗi sai AI" để ôn kiến thức liên quan.`,
      }
    }
    case 'reaction':
      return {
        lines: [
          { label: 'Thời gian trả lời trung bình', value: `${idx.reactionAvgSec} giây`, pct: idx.scores.reaction },
          { label: 'Trả lời nhanh (dưới 2 giây)', value: `${a.reactionFastPct}%`, pct: a.reactionFastPct },
        ],
        note: 'Từ bạn "nghe ra được" thường trả lời chậm hơn từ "nhìn ra được" — dấu hiệu nhận thức bằng tai chưa tự động.',
      }
    default:
      return { lines: [], note: '' }
  }
}

/* ================= dòng sự kiện gần đây (feed) ================= */

export type FeedEvent = {
  id: string
  day: number // 0 = hôm nay, 1 = hôm qua...
  time: string
  skill: SkillKey
  text: string
  ok: boolean | null // null = sự kiện đo (không chấm đúng/sai)
  ms: number | null
}

export const RECENT_EVENTS: FeedEvent[] = [
  { id: 'e1', day: 0, time: '21:36', skill: 'listening', text: 'Dictation 听 "大学 dàxué" — không nhận ra khi nghe', ok: false, ms: 4200 },
  { id: 'e2', day: 0, time: '20:02', skill: 'vocab', text: 'Flashcard 钢琴 gāngqín — nhớ đúng', ok: true, ms: 2100 },
  { id: 'e3', day: 0, time: '19:40', skill: 'grammar', text: 'Quiz mẫu câu 是…的 — áp dụng cấu trúc đúng', ok: true, ms: null },
  { id: 'e4', day: 1, time: '22:15', skill: 'listening', text: 'Shadowing câu 12 — nhịp & ngữ điệu đạt', ok: true, ms: null },
  { id: 'e5', day: 1, time: '21:30', skill: 'writing', text: 'Luyện viết: "一个建议" → đúng là "一条建议" (lượng từ)', ok: false, ms: null },
  { id: 'e6', day: 1, time: '20:44', skill: 'reading', text: 'Đọc hiểu đoạn 4 — suy luận đúng nghĩa 打折', ok: true, ms: null },
  { id: 'e7', day: 2, time: '21:05', skill: 'reaction', text: 'Trắc nghiệm nhanh 10 câu — trung bình 3,1 giây/câu', ok: null, ms: 3100 },
  { id: 'e8', day: 2, time: '20:20', skill: 'vocab', text: 'Flashcard 护照 hùzhào — quên, đưa vào lịch ôn lại', ok: false, ms: 3800 },
  { id: 'e9', day: 3, time: '21:48', skill: 'listening', text: 'Dictation 听 "借 jiè" — nhận ra khi đọc, không nghe ra', ok: false, ms: 3900 },
  { id: 'e10', day: 3, time: '20:10', skill: 'grammar', text: 'Quiz 了 — nhận ra mẫu khi đọc, sai khi áp dụng', ok: false, ms: null },
]

export function dayLabel(day: number): string {
  if (day === 0) return 'Hôm nay'
  if (day === 1) return 'Hôm qua'
  return `${day} ngày trước`
}

export const fmtSec = (ms: number): string => `${(ms / 1000).toFixed(1).replace('.', ',')}s`

/* ================= hình học radar (pure) ================= */

export const RADAR = { cx: 150, cy: 116, r: 86 }
export const RING_FRACS = [0.25, 0.5, 0.75, 1]

export function radarVertex(i: number, value: number): [number, number] {
  const ang = (Math.PI / 3) * i - Math.PI / 2
  const rr = (Math.max(0, Math.min(100, value)) / 100) * RADAR.r
  return [RADAR.cx + rr * Math.cos(ang), RADAR.cy + rr * Math.sin(ang)]
}

export function radarPolygon(values: number[]): string {
  return values.map((v, i) => radarVertex(i, v).map((n) => n.toFixed(1)).join(',')).join(' ')
}

export function radarRing(frac: number): string {
  return radarPolygon(SKILLS.map(() => frac * 100))
}

export function radarLabelPos(
  i: number,
): { x: number; y: number; anchor: 'start' | 'middle' | 'end'; dy: number } {
  const ang = (Math.PI / 3) * i - Math.PI / 2
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  return {
    x: RADAR.cx + (RADAR.r + 10) * c,
    y: RADAR.cy + (RADAR.r + 10) * s,
    anchor: c > 0.35 ? 'start' : c < -0.35 ? 'end' : 'middle',
    dy: s < -0.35 ? -4 : s > 0.35 ? 13 : 4,
  }
}
