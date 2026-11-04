/* ============================================================
   Chấm điểm chữ viết tay — hàm thuần, chạy ở module level
   (an toàn với quy tắc react-compiler: không mutate khi render).
   ------------------------------------------------------------
   Nguyên lý: so nét người viết với "medians" (đường tâm mỗi nét)
   trong dữ liệu hanzi-writer-data:
   - Hệ toạ độ SVG của glyph: viewBox "-90 -90 1204 1204", path
     được biến đổi bằng scale(1,-1) translate(0,-900)
     → điểm dữ liệu [x, y] hiển thị tại (x, 900 − y).
   - Nét người viết lưu sẵn trong đúng hệ toạ độ SVG đó, nên chỉ
     cần lấy mẫu lại (resample) và đo khoảng cách trung bình.
   ============================================================ */

export type Pt = { x: number; y: number }

/* Một nét mực: điểm đã đổi sang toạ độ SVG glyph + áp lực từng điểm */
export type InkStroke = { points: Pt[]; pressures: number[] }

export const VIEW_SIZE = 1204
export const VIEW_OFFSET = -90
export const BASELINE = 900

/* px/py theo pixel của ô vuông (size = cạnh ô) → toạ độ SVG glyph */
export function canvasPoint(px: number, py: number, size: number): Pt {
  const f = VIEW_SIZE / size
  return { x: VIEW_OFFSET + px * f, y: VIEW_OFFSET + py * f }
}

/* toạ độ SVG glyph → pixel trong ô vuông hiện tại (để vẽ lại) */
export function pointToCanvas(p: Pt, size: number): Pt {
  const f = size / VIEW_SIZE
  return { x: (p.x - VIEW_OFFSET) * f, y: (p.y - VIEW_OFFSET) * f }
}

/* medians (y hướng lên) → đường tâm ở hệ SVG (y hướng xuống) */
export function medianPoints(medians: number[][]): Pt[] {
  return medians.filter((m) => m.length >= 2).map((m) => ({ x: m[0], y: BASELINE - m[1] }))
}

function pathLength(pts: Pt[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return len
}

/* Lấy mẫu lại đường thành n điểm cách đều (theo chiều dài cung) */
function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return []
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }))
  const total = pathLength(pts)
  if (total <= 0) return Array.from({ length: n }, () => ({ ...pts[0] }))
  const step = total / (n - 1)
  const out: Pt[] = [{ ...pts[0] }]
  let idx = 1
  let acc = 0
  let prev = pts[0]
  while (out.length < n && idx < pts.length) {
    const cur = pts[idx]
    const d = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    if (acc + d >= step) {
      const t = (step - acc) / d
      const p = { x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t }
      out.push(p)
      prev = p
      acc = 0
    } else {
      acc += d
      prev = cur
      idx++
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] })
  return out
}

const SAMPLES = 28

function meanDistance(a: Pt[], b: Pt[]): number {
  const ra = resample(a, SAMPLES)
  const rb = resample(b, SAMPLES)
  let sum = 0
  for (let i = 0; i < SAMPLES; i++) {
    sum += Math.hypot(ra[i].x - rb[i].x, ra[i].y - rb[i].y)
  }
  return sum / SAMPLES
}

/* Vượt quá ngưỡng này coi như không khớp với nét nào (đơn vị SVG) */
const MATCH_LIMIT = 360

export type StrokeScore = {
  index: number // chỉ số nét người viết
  target: number | null // nét mẫu được ghép (null = nét thừa)
  score: number // 0–100
  dist: number // khoảng cách trung bình (SVG units)
}

export type CheckResult = {
  strokeTotal: number
  perStroke: StrokeScore[]
  missing: number[]
  extra: number[]
  orderOk: boolean
  overall: number // 0–100
  verdict: { label: string; emoji: string; cls: string }
}

const VERDICTS = [
  { min: 85, label: 'Tuyệt vời!', emoji: '🌟', cls: 'bg-[var(--pastel-mint)] text-[#3f6b50] ring-[#cfe6d6]' },
  { min: 70, label: 'Khá tốt', emoji: '👍', cls: 'bg-[var(--pastel-butter)] text-[#8a6a1f] ring-[#f2e2b8]' },
  { min: 55, label: 'Tạm được', emoji: '✏️', cls: 'bg-[var(--pastel-pink)] text-[#8a4a63] ring-[#f3c4d3]' },
  { min: 0, label: 'Cần luyện thêm', emoji: '💪', cls: 'bg-[var(--pastel-sky)] text-[#46688f] ring-[#cfe0ef]' },
] as const

function verdictFor(score: number): CheckResult['verdict'] {
  return VERDICTS.find((v) => score >= v.min) ?? VERDICTS[VERDICTS.length - 1]
}

function strokeScore(dist: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - Math.max(0, dist - 40) * 0.55)))
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#3f6b50'
  if (score >= 45) return '#d8a13a'
  return '#d2495f'
}

/* So bộ nét người viết với một ký tự mẫu */
export function checkInk(strokes: InkStroke[], medians: number[][][]): CheckResult {
  const targets = medians.map(medianPoints)
  const strokeTotal = targets.length
  const users = strokes.map((s) => s.points).filter((p) => p.length > 0)

  /* ghép từng nét người viết ↔ nét mẫu */
  const pairs: (number | null)[] = Array(users.length).fill(null)
  const used = new Set<number>()

  if (users.length === strokeTotal) {
    /* đúng số nét → ghép trực tiếp theo thứ tự */
    for (let i = 0; i < users.length; i++) {
      pairs[i] = i
      used.add(i)
    }
  } else {
    users.forEach((u, i) => {
      let best = -1
      let bestD = Infinity
      targets.forEach((t, j) => {
        if (used.has(j)) return
        const d = meanDistance(u, t)
        if (d < bestD) {
          bestD = d
          best = j
        }
      })
      if (best >= 0 && bestD <= MATCH_LIMIT) {
        pairs[i] = best
        used.add(best)
      }
    })
  }

  const perStroke: StrokeScore[] = users.map((u, i) => {
    const j = pairs[i]
    if (j === null) return { index: i, target: null, score: 0, dist: Infinity }
    const d = meanDistance(u, targets[j])
    return { index: i, target: j, score: strokeScore(d), dist: d }
  })

  const matched = perStroke.filter((p) => p.target !== null)
  const avgMatched = matched.length
    ? matched.reduce((s, p) => s + p.score, 0) / matched.length
    : 0

  const missing: number[] = []
  for (let j = 0; j < strokeTotal; j++) if (!used.has(j)) missing.push(j)

  const extra = perStroke.filter((p) => p.target === null).map((p) => p.index)

  const orderOk = pairs.every((p, i) => p === i)

  let overall = Math.round((avgMatched * matched.length) / Math.max(1, strokeTotal))
  if (!orderOk) overall -= 8
  overall = Math.max(0, Math.min(100, overall))

  return {
    strokeTotal,
    perStroke,
    missing,
    extra,
    orderOk,
    overall,
    verdict: verdictFor(overall),
  }
}

/* Gợi ý sửa lỗi dạng câu chữ */
export function tipsFor(r: CheckResult): string[] {
  const tips: string[] = []
  if (r.strokeTotal === 0) return tips
  if (r.missing.length > 0) {
    tips.push(`Thiếu ${r.missing.length} nét (nét số ${r.missing.map((m) => m + 1).join(', ')}) — bật chữ mẫu mờ và đếm từng nét nhé.`)
  }
  if (r.extra.length > 0) {
    tips.push(`Thừa ${r.extra.length} nét — mỗi nét của chữ chỉ viết đúng một lần.`)
  }
  if (!r.orderOk && r.missing.length === 0 && r.extra.length === 0) {
    tips.push('Thứ tự nét chưa đúng — xem hoạt ảnh ở chế độ ① Học cách viết để ghi nhớ trình tự.')
  }
  const off = r.perStroke.filter((p) => p.target !== null && p.score < 55)
  if (off.length > 0 && r.missing.length === 0) {
    tips.push(`Nét số ${off.map((p) => p.index + 1).join(', ')} lệch khỏi đường mẫu — viết chậm hơn và đi sát theo nét mờ.`)
  }
  return tips
}
