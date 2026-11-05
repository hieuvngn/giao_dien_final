'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Footer from '../landing/footer'
import { PushPin, Reveal, SectionHeading, WashiTape } from '../landing/decor'
import { PARAGRAPH_SAMPLES, VOCAB_PRESETS, charPinyin, wordPinyin } from '@/lib/data'
import { MEANING_MAP, type DbWord } from '@/lib/vocab-db'
import { RADICALS, type Radical } from '@/data/radicals'
import { useToast } from '@/hooks/use-toast'
import WordPicker from './word-picker'
import StrokeChar from './stroke-char'
import CharEditor, { type CharMeta } from './char-editor'
import TemplateGallery from './template-gallery'
import {
  BACKDROPS,
  DEFAULT_CFG,
  LINE_COLORS,
  MAX_WORDS,
  PRINT_CAP,
  RAINBOW_CELLS,
  SHEET_HEAD,
  STROKE_RANGES,
  bgCssOf,
  pageBgTone,
  type LayoutMode,
  type LineColor,
  type PaperType,
  type RadFilter,
  type SheetCfg,
  type Template,
} from './templates'

/* ============================================================
   Tạo vở tập viết chữ Hán — Route: #/create-file
   Luồng 3 bước theo tham chiếu xiehanzi.com:
   1️⃣ Chữ cần luyện (nhập tay / thư viện · sửa nghĩa & phiên âm)
   2️⃣ Chọn mẫu giấy (24 mẫu · 6 nhóm · tìm kiếm · yêu thích)
   3️⃣ Xuất PDF (in / lưu bài tập / chia sẻ liên kết)
   ============================================================ */

type CellItem = { ch: string; py: string; v?: 'model' | 'trace' | 'stroke' | 'pinyin' }
type InfoRow = { n: number; cn: string; py: string; vi: string }
type StrokeBlock = { word: string; py: string; vi: string; rows: (CellItem | null)[][] }
type BigBand = { ch: string; py: string; vi: string }

const isHan = (c: string) => /\p{Script=Han}/u.test(c)
const radicalMeaning = (c: string) => RADICALS.find((r) => r.char === c || r.variant === c)?.meaning ?? ''
const blankRow = (cols: number): (CellItem | null)[] => Array<CellItem | null>(cols).fill(null)

/* nghĩa Việt: chỉnh tay → kho từ → nghĩa bộ thủ */
const viOf = (w: string, meta: CharMeta) => meta[w]?.vi || MEANING_MAP.get(w) || (w.length === 1 ? radicalMeaning(w) : '')

/* ================= dựng trang — bố cục CHUẨN TỪNG CHỮ ================= */

function buildSheets(words: string[], repeat: number, cols: number, rows: number, modelCell: boolean, meta: CharMeta, showPinyin: boolean): (CellItem | null)[][][] {
  const pages: (CellItem | null)[][][] = []
  let page: (CellItem | null)[][] = []
  const pushRow = (row: (CellItem | null)[]) => {
    page.push(row)
    if (page.length === rows) {
      pages.push(page)
      page = []
    }
  }
  words.forEach((w) => {
    const chars = [...w]
    const perRow = Math.max(1, Math.floor(cols / chars.length))
    const sampleRow: (CellItem | null)[] = []
    if (modelCell) {
      for (let k = 0; k < perRow; k++) {
        chars.forEach((ch) => sampleRow.push({ ch, py: meta[ch]?.py || charPinyin(ch) }))
      }
    } else if (showPinyin) {
      /* tắt "hàng mẫu có chữ" → vẫn in hàng PHIÊN ÂM để người học tự viết chữ
         (trước đây hàng này bị bỏ trống hoàn toàn → trang in không có chữ nào) */
      for (let k = 0; k < perRow; k++) {
        chars.forEach((ch) => sampleRow.push({ ch, py: meta[ch]?.py || charPinyin(ch), v: 'pinyin' }))
      }
    }
    while (sampleRow.length < cols) sampleRow.push(null)
    pushRow(sampleRow)
    for (let r = 1; r < repeat; r++) pushRow(blankRow(cols))
  })
  if (page.length) pages.push(page)
  return pages.length ? pages : [blankPage(cols, rows)]
}

function blankPage(cols: number, rows: number): (CellItem | null)[][] {
  return Array.from({ length: rows }, () => blankRow(cols))
}

/* ================= dựng trang — bố cục BỘ THỦ ================= */

function buildRadicalSheets(list: Radical[], practiceRows: number, cols: number, rows: number): (CellItem | null)[][][] {
  const pages: (CellItem | null)[][][] = []
  let page: (CellItem | null)[][] = []
  const pushRow = (row: (CellItem | null)[]) => {
    page.push(row)
    if (page.length === rows) {
      pages.push(page)
      page = []
    }
  }
  list.forEach((r) => {
    const row: (CellItem | null)[] = [{ ch: r.char, py: r.pinyin }]
    for (const w of r.words) {
      if (row.length >= cols) break
      row.push({ ch: w.c, py: w.p })
    }
    while (row.length < cols) row.push(null)
    pushRow(row)
    for (let p = 0; p < practiceRows; p++) pushRow(blankRow(cols))
  })
  if (page.length) pages.push(page)
  return pages.length ? pages : [blankPage(cols, rows)]
}

/* ================= dựng trang — bố cục VĂN BẢN LIÊN TỤC ================= */

function buildFlowPages(text: string, cols: number, rows: number, meta: CharMeta): (CellItem | null)[][][] {
  const chars = [...text].filter((c) => c.trim() !== '')
  if (!chars.length) return [blankPage(cols, rows)]
  const pyCache = new Map<string, string>()
  const perPage = cols * rows
  const pages: (CellItem | null)[][][] = []
  for (let i = 0; i < chars.length; i += perPage) {
    const slice = chars.slice(i, i + perPage)
    const page: (CellItem | null)[][] = []
    for (let r = 0; r < rows; r++) {
      const rowCells: (CellItem | null)[] = slice.slice(r * cols, (r + 1) * cols).map((c) => {
        let py = pyCache.get(c)
        if (py === undefined) {
          py = isHan(c) ? meta[c]?.py || charPinyin(c) : ''
          pyCache.set(c, py)
        }
        return { ch: c, py } as CellItem
      })
      while (rowCells.length < cols) rowCells.push(null)
      page.push(rowCells)
    }
    pages.push(page)
  }
  return pages
}

/* ================= dựng trang — bố cục THỨ TỰ NÉT ================= */

function buildStrokePages(words: string[], repeat: number, cols: number, rows: number, meta: CharMeta): StrokeBlock[][] {
  const blocks: StrokeBlock[] = words.map((w) => {
    const chars = [...w]
    const py = meta[w]?.py || wordPinyin(w)
    const vi = viOf(w, meta)
    const modelRow: (CellItem | null)[] = []
    for (let c = 0; c < cols; c++) modelRow.push({ ch: chars[c % chars.length], py: meta[chars[c % chars.length]]?.py || charPinyin(chars[c % chars.length]), v: 'model' })
    const rowsAll: (CellItem | null)[][] = [modelRow]
    for (let r = 0; r < Math.max(0, repeat - 1); r++) {
      const row: (CellItem | null)[] = []
      for (let c = 0; c < cols; c++) row.push({ ch: chars[c % chars.length], py: '', v: 'trace' })
      rowsAll.push(row)
    }
    return { word: w, py, vi, rows: rowsAll }
  })
  const perPage = Math.max(1, Math.floor((rows + 0.55) / (repeat + 0.45)))
  const pages: StrokeBlock[][] = []
  for (let i = 0; i < blocks.length; i += perPage) pages.push(blocks.slice(i, i + perPage))
  return pages.length ? pages : [[]]
}

/* ================= dựng trang — bố cục Ô CHỮ LỚN ================= */

function buildBigPages(words: string[], rows: number, meta: CharMeta): BigBand[][] {
  const bands: BigBand[] = []
  const seen = new Set<string>()
  words.forEach((w) =>
    [...w].forEach((c) => {
      if (!isHan(c) || seen.has(c)) return
      seen.add(c)
      bands.push({ ch: c, py: meta[c]?.py || charPinyin(c), vi: viOf(c, meta) })
    }),
  )
  const perPage = Math.max(1, Math.floor(rows / 2))
  const pages: BigBand[][] = []
  for (let i = 0; i < bands.length; i += perPage) pages.push(bands.slice(i, i + perPage))
  return pages.length ? pages : [[]]
}

/* ================= dựng trang — bố cục BẢNG THÔNG TIN ================= */

function buildInfoRows(words: string[], meta: CharMeta): InfoRow[] {
  return words.map((w, i) => ({ n: i + 1, cn: w, py: meta[w]?.py || wordPinyin(w), vi: viOf(w, meta) }))
}

function chunkInfoPages(rowsAll: InfoRow[], per: number): (InfoRow | null)[][] {
  if (!rowsAll.length) return [Array<InfoRow | null>(per).fill(null)]
  const pages: (InfoRow | null)[][] = []
  for (let i = 0; i < rowsAll.length; i += per) {
    const chunk: (InfoRow | null)[] = rowsAll.slice(i, i + per)
    while (chunk.length < per) chunk.push(null)
    pages.push(chunk)
  }
  return pages
}

/* ================= trang giấy (dùng chung preview + in) ================= */

/* đường kẻ phụ trong ô (田/米) — tô màu theo lựa chọn của người dùng */
function Guide({ kind, color }: { kind: 'tian' | 'mi' | null; color: string }) {
  if (!kind) return null
  const path = kind === 'tian' ? 'M50 0v100M0 50h100' : 'M50 0v100M0 50h100M0 0l100 100M100 0L0 100'
  const svg = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${path}' stroke='${color}' stroke-width='1' stroke-dasharray='4 3' fill='none' vector-effect='non-scaling-stroke'/></svg>`,
  )}")`
  return <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: svg, backgroundSize: '100% 100%' }} />
}

function CellInner({
  it,
  showPinyin,
  showStroke,
  meta,
  trace = false,
}: {
  it: CellItem
  showPinyin: boolean
  showStroke: boolean
  meta: CharMeta
  trace?: boolean
}) {
  const py = meta[it.ch]?.py || it.py
  const han = isHan(it.ch)

  /* Ô CHỈ CÓ PHIÊN ÂM (hàng mẫu khi tắt "hàng mẫu có chữ") — vẽ SVG để
     kích thước không phụ thuộc đơn vị cqw (an toàn khi in mọi trình duyệt) */
  if (it.v === 'pinyin') {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <text x="50" y="70" textAnchor="middle" fontSize="24" fontWeight="600" fill="#e88aa6">
          {py}
        </text>
      </svg>
    )
  }

  /* chữ mờ để tô theo */
  if (trace) {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <text x="50" y="74" textAnchor="middle" fontSize="48" fill="#4f3d4a" opacity="0.16" className="font-cn">
          {it.ch}
        </text>
      </svg>
    )
  }

  /* chữ mẫu theo thứ tự nét: pinyin phía trên + StrokeChar bên dưới.
     Cả hai nằm trong 1 ô vuông nội bộ (74% chiều rộng ô) để không bị
     méo ở ô cao hơn rộng, và không dùng đơn vị cqw (an toàn khi in). */
  if (showStroke && han) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <span className="relative block w-[74%]" style={{ aspectRatio: '1' }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {showPinyin && py && (
              <text x="50" y="13" textAnchor="middle" fontSize="13" fontWeight="600" fill="#e88aa6">
                {py}
              </text>
            )}
          </svg>
          <span className="absolute left-0 top-[22%] block h-[78%] w-full">
            <StrokeChar ch={it.ch} />
          </span>
        </span>
      </div>
    )
  }

  /* chữ thường ± phiên âm */
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {showPinyin && py && (
        <text x="50" y="21" textAnchor="middle" fontSize="13" fontWeight="600" fill="#e88aa6">
          {py}
        </text>
      )}
      <text
        x="50"
        y={showPinyin && py ? 78 : 68}
        textAnchor="middle"
        fontSize="48"
        fill="#4f3d4a"
        className="font-cn"
      >
        {it.ch}
      </text>
    </svg>
  )
}

function PracticeCell({
  it,
  paper,
  line,
  colorful,
  showPinyin,
  showStroke,
  meta,
  fade = false,
  solidCell = '#fff',
}: {
  it: CellItem | null
  paper: PaperType
  line: { line: string; guide: string }
  colorful: boolean
  showPinyin: boolean
  showStroke: boolean
  meta: CharMeta
  fade?: boolean
  solidCell?: string
}) {
  const trace = it?.v === 'trace'
  const bg = colorful && it && !trace ? RAINBOW_CELLS[(it.ch.codePointAt(0) ?? 0) % RAINBOW_CELLS.length] : solidCell
  return (
    <div
      className={`han-cell grid place-items-center ${paper === 'line' ? 'han-line' : ''}`}
      style={{
        borderColor: line.line,
        background: bg,
        opacity: fade ? 1 : undefined,
      }}
    >
      <Guide kind={paper === 'tian' ? 'tian' : paper === 'mi' ? 'mi' : null} color={line.guide} />
      {it && (
        <div style={fade && !trace ? { opacity: 0.28 } : undefined} className="h-full w-full">
          <CellInner it={it} showPinyin={showPinyin} showStroke={showStroke} meta={meta} trace={trace} />
        </div>
      )}
    </div>
  )
}

function StrokeCell({ it, paper, line, meta }: { it: CellItem | null; paper: PaperType; line: { line: string; guide: string }; meta: CharMeta }) {
  return (
    <div
      className={`han-cell grid min-h-0 place-items-center ${paper === 'line' ? 'han-line' : ''}`}
      style={{ borderColor: line.line }}
    >
      <Guide kind={paper === 'tian' ? 'tian' : paper === 'mi' ? 'mi' : null} color={line.guide} />
      {it && <CellInner it={it} showPinyin showStroke={it.v !== 'trace'} meta={meta} trace={it.v === 'trace'} />}
    </div>
  )
}

function Sheet({
  layout,
  cfg,
  cols,
  rows,
  gridData,
  infoRows,
  practiceCells,
  strokeBlocks = null,
  bigBands = null,
  traceCells = 8,
  wmText = '',
  charMeta,
  bgImg = '',
}: {
  layout: LayoutMode
  cfg: SheetCfg
  cols: number
  rows: number
  gridData: (CellItem | null)[][]
  infoRows: (InfoRow | null)[] | null
  practiceCells: number
  strokeBlocks?: StrokeBlock[] | null
  bigBands?: BigBand[] | null
  traceCells?: number
  wmText?: string
  charMeta: CharMeta
  bgImg?: string
}) {
  const { paper, colorful, showPinyin, showMeaning, showStroke, fadeModel, showHeader, footerText } = cfg
  const line = LINE_COLORS.find((l) => l.id === cfg.lineColor) ?? LINE_COLORS[0]
  const head = SHEET_HEAD[layout]
  const title = cfg.sheetTitle.trim() || head.vi
  /* có ảnh nền → ô hơi trong suốt để hoạ tiết lộ ra */
  const solidCell = bgImg ? 'rgba(255,255,255,0.62)' : '#fff'

  /* nền trang tối → chữ ngoài ô (đầu trang, chân trang, watermark) đổi màu sáng
     để không bị “tối trên tối” biến mất khi in PDF */
  const dark = pageBgTone(cfg) === 'dark'
  const inkPage = dark ? '#fffdf6' : undefined /* undefined → giữ màu mặc định */
  const inkSub = dark ? '#c9b3bf' : undefined
  const inkMuted = dark ? '#cfa9ba' : undefined
  const ruleColor = dark ? '#7a5f6d' : undefined

  const cellCommon = { paper, line, colorful, showPinyin, showStroke, meta: charMeta, solidCell }

  return (
    <div
      className="ink-exact relative flex h-full w-full flex-col text-[#4f3d4a]"
      style={{ background: bgCssOf(cfg), containerType: 'inline-size', color: inkPage }}
    >
      {/* hình nền tuỳ chỉnh (làm mờ để chữ vẫn rõ) */}
      {bgImg && (
        <div
          aria-hidden="true"
          className="ink-exact pointer-events-none absolute inset-0 z-0"
          style={{
            background: `linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url("${bgImg}") center/cover`,
          }}
        />
      )}

      {/* watermark in chéo giữa trang (preview + PDF) */}
      {wmText && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 grid select-none place-items-center overflow-hidden">
          <span
            className={`wm-mark font-display font-bold ${wmText.length > 14 ? 'wm-long' : wmText.length > 8 ? 'wm-mid' : 'wm-short'}`}
            style={{
              fontSize: wmText.length > 14 ? '8cqw' : wmText.length > 8 ? '11cqw' : '15cqw',
              color: dark ? 'rgba(255,214,224,0.17)' : undefined,
            }}
          >
            {wmText}
          </span>
        </div>
      )}

      {/* đầu trang vở */}
      {showHeader && (
        <div className="relative flex items-end justify-between gap-3 border-b-2 border-dashed border-[#eac6d2] pb-2" style={ruleColor ? { borderColor: ruleColor } : undefined}>
          <p className="font-display text-sm font-bold sm:text-base">
            {title} <span className="font-cn" style={{ color: dark ? '#e8b4c4' : head.color }}>{head.cn}</span>
          </p>
          <p className="text-[10px] font-semibold text-[#8d7484] sm:text-xs" style={{ color: inkSub }}>
            Tên <span className="inline-block w-16 border-b border-[#c9a2b3] sm:w-24" /> · Ngày{' '}
            <span className="inline-block w-12 border-b border-[#c9a2b3] sm:w-16" />
          </p>
        </div>
      )}

      {/* lưới ô tập viết — chuẩn · liên tục · bộ thủ */}
      {infoRows === null && layout !== 'stroke' && layout !== 'bigchar' && (
        <div
          className="relative mt-2 grid flex-1 gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {Array.from({ length: rows * cols }).map((_, i) => {
            const ri = Math.floor(i / cols)
            const ci = i % cols
            const it = gridData[ri]?.[ci] ?? null
            return <PracticeCell key={i} it={it} {...cellCommon} fade={fadeModel} />
          })}
        </div>
      )}

      {/* khối luyện THỨ TỰ NÉT: tiêu đề từ + hàng mẫu đỏ + hàng tô mờ */}
      {strokeBlocks && strokeBlocks.length > 0 && (
        <div className="relative mt-1.5 flex min-h-0 flex-1 flex-col gap-[2cqw]">
          {strokeBlocks.map((b, bi) => (
            <div key={bi} className="flex min-h-0 flex-1 flex-col gap-[1.2cqw]">
              <div className="flex items-center gap-[1.6cqw] border-b border-dashed border-[#eac6d2] pb-[0.5cqw]" style={ruleColor ? { borderColor: ruleColor } : undefined}>
                <span className="fs-sw font-cn font-bold leading-none text-[#4f3d4a]" style={{ fontSize: '4.6cqw', color: inkPage }}>
                  {b.word}
                </span>
                {showPinyin && (
                  <span className="fs-sp font-semibold leading-none text-[#e88aa6]" style={{ fontSize: '3.3cqw' }}>
                    {b.py}
                  </span>
                )}
                {showMeaning && b.vi && (
                  <span className="fs-sv min-w-0 truncate font-semibold leading-none text-[#8d7484]" style={{ fontSize: '3cqw', color: inkSub }}>
                    {b.vi}
                  </span>
                )}
                {showStroke && (
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    {[...b.word].slice(0, 4).map((c, ci) => (
                      <span key={`${c}-${ci}`} className="block shrink-0" style={{ width: '4.6%', aspectRatio: '1' }}>
                        <StrokeChar ch={c} />
                      </span>
                    ))}
                  </span>
                )}
                <span
                  className="fs-sc shrink-0 rounded-full bg-[var(--pastel-pink-soft)] px-[1.8cqw] py-[0.6cqw] font-bold text-[#8a4a63]"
                  style={{ fontSize: '2.5cqw' }}
                >
                  笔顺
                </span>
              </div>
              <div
                className="grid min-h-0 flex-1 gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${b.rows.length}, 1fr)` }}
              >
                {b.rows.flat().map((it, i) => (
                  <StrokeCell key={i} it={it} paper={paper} line={line} meta={charMeta} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* dải Ô CHỮ LỚN: chữ mẫu to + pinyin + nghĩa + hàng ô tô mờ */}
      {bigBands && bigBands.length > 0 && (
        <div className="relative mt-1.5 flex min-h-0 flex-1 flex-col gap-[2.4cqw]">
          {bigBands.map((b, bi) => (
            <div key={bi} className="flex min-h-0 flex-1 flex-col gap-[1.2cqw]">
              <div className="flex min-h-0 items-stretch gap-[2.4cqw]" style={{ flex: 1.25 }}>
                <div
                  className={`han-cell grid shrink-0 place-items-center self-center ${paper === 'line' ? 'han-line' : ''}`}
                  style={{ height: '92%', aspectRatio: '1', borderColor: line.line }}
                >
                  <Guide kind={paper === 'tian' ? 'tian' : paper === 'mi' ? 'mi' : null} color={line.guide} />
                  {showStroke ? (
                    <span className="relative block" style={{ width: '70%', aspectRatio: '1' }}>
                      <StrokeChar ch={b.ch} />
                    </span>
                  ) : (
                    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                      <text x="50" y="72" textAnchor="middle" fontSize="56" fill="#4f3d4a" className="font-cn">
                        {b.ch}
                      </text>
                    </svg>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-[1.2cqw]">
                  {showPinyin && (
                    <p className="fs-bp truncate font-bold leading-none text-[#e88aa6]" style={{ fontSize: '4.4cqw' }}>
                      {b.py}
                    </p>
                  )}
                  {showMeaning && (
                    <p className="fs-bm truncate font-semibold leading-none text-[#6f5a68]" style={{ fontSize: '3.6cqw', color: inkSub }}>
                      {b.vi || '—'}
                    </p>
                  )}
                  <p className="fs-bh truncate font-semibold leading-none text-[#b58fa0]" style={{ fontSize: '2.7cqw', color: inkMuted }}>
                    Tô theo chữ mẫu · 描红
                  </p>
                </div>
                {showStroke && (
                  <div className="shrink-0 self-center" style={{ height: '78%', aspectRatio: '1' }}>
                    <StrokeChar ch={b.ch} />
                  </div>
                )}
              </div>
              <div className="grid min-h-0 flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${traceCells}, 1fr)` }}>
                {Array.from({ length: traceCells }).map((_, ci) => (
                  <div
                    key={ci}
                    className={`han-cell grid min-h-0 place-items-center ${paper === 'line' ? 'han-line' : ''}`}
                    style={{ borderColor: line.line }}
                  >
                    <Guide kind={paper === 'tian' ? 'tian' : paper === 'mi' ? 'mi' : null} color={line.guide} />
                    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                      <text x="50" y="78" textAnchor="middle" fontSize="52" fill="#4f3d4a" opacity="0.15" className="font-cn">
                        {b.ch}
                      </text>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* bảng thông tin từ vựng */}
      {infoRows !== null && (
        <div className="relative mt-2 flex-1" style={{ containerType: 'inline-size' }}>
          <div
            className="grid h-full gap-[3px]"
            style={{
              gridTemplateColumns: `1.6rem 1.1fr 1.25fr 1.7fr repeat(${practiceCells}, minmax(0, 0.75fr))`,
              gridTemplateRows: `repeat(${rows + 1}, 1fr)`,
            }}
          >
            {/* hàng tiêu đề */}
            {['#', '汉字 · Chữ Hán', 'Pinyin', showMeaning ? 'Nghĩa Việt' : 'Tự điền nghĩa'].map((h) => (
              <div
                key={h}
                className="fs-ih grid place-items-center rounded-[2.5px] border border-[#ecc2cf] bg-[var(--pastel-pink-soft)] px-0.5 text-center font-bold text-[#8a4a63]"
                style={{ fontSize: '1.8cqw' }}
              >
                {h}
              </div>
            ))}
            <div
              className="fs-ih grid place-items-center rounded-[2.5px] border border-[#ecc2cf] bg-[var(--pastel-pink-soft)] px-0.5 text-center font-bold text-[#8a4a63]"
              style={{ fontSize: '1.8cqw', gridColumn: `span ${practiceCells}` }}
            >
              Luyện viết · 写
            </div>

            {/* các hàng từ */}
            {infoRows.map((r, ri) => (
              <Fragment key={ri}>
                <div
                  className="fs-in grid place-items-center overflow-hidden rounded-[2.5px] border border-[#ecc2cf] bg-white font-bold text-[#b58fa0]"
                  style={{ fontSize: '1.9cqw' }}
                >
                  {r ? r.n : ''}
                </div>
                <div
                  className={`fs-ic han-cell grid place-items-center overflow-hidden rounded-[2.5px] bg-white`}
                  style={{ fontSize: '4.6cqw', borderColor: line.line }}
                >
                  <span className="font-cn leading-tight" style={{ opacity: r ? 1 : 0 }}>
                    {r?.cn ?? '·'}
                  </span>
                </div>
                <div
                  className="fs-ip grid place-items-center overflow-hidden rounded-[2.5px] border border-[#ecc2cf] bg-white px-0.5 text-center font-semibold text-[#e88aa6]"
                  style={{ fontSize: '2.1cqw' }}
                >
                  {showPinyin ? r?.py : ''}
                </div>
                <div
                  className="fs-iv grid place-items-center overflow-hidden rounded-[2.5px] border border-[#ecc2cf] bg-white px-0.5 text-center font-semibold text-[#6f5a68]"
                  style={{ fontSize: '2cqw' }}
                >
                  {showMeaning ? r?.vi || '' : ''}
                </div>
                {Array.from({ length: practiceCells }).map((_, ci) => (
                  <div key={ci} className="han-cell" style={{ borderColor: line.line }} />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* chân trang nhỏ */}
      {footerText.trim() && (
        <p className="fs-ft relative mt-1.5 text-right font-semibold text-[#b58fa0]" style={{ fontSize: '2.4cqw', color: inkMuted }}>
          {footerText}
        </p>
      )}
    </div>
  )
}

/* ================= nhóm chức năng ================= */

function Group({
  n,
  title,
  cn,
  tape,
  children,
  id,
}: {
  n?: number
  title: string
  cn: string
  tape: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <div id={id} className="paper-scrap relative scroll-mt-28 rounded-2xl p-4">
      <WashiTape color={tape} pattern={n && n % 2 ? 'dots' : 'stripes'} rotate={n && n % 2 ? -4 : 4} className="-top-2.5 left-5 h-5 w-14" />
      <h3 className="font-display mb-3 flex items-baseline gap-2 text-sm font-bold text-[#4f3d4a]">
        {n !== undefined && (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--pastel-pink)] text-[11px] text-[#8a4a63]">{n}</span>
        )}
        {title} <span className="font-cn text-xs font-semibold text-[#b58fa0]">{cn}</span>
      </h3>
      {children}
    </div>
  )
}

function Accordion({ title, cn, defaultOpen = false, children }: { title: string; cn: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="paper-scrap rounded-2xl">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="font-display text-sm font-bold text-[#4f3d4a]">
          {title} <span className="font-cn text-xs font-semibold text-[#b58fa0]">{cn}</span>
        </span>
        <span className={`text-xs font-bold text-[#8d7484] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="border-t border-dashed border-[#ead9cd] px-4 py-3">{children}</div>}
    </div>
  )
}

function Stepper({ value, setValue, min, max, label }: { value: number; setValue: (n: number) => void; min: number; max: number; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-[#6f5a68]">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setValue(Math.max(min, value - 1))}
          aria-label={`Giảm ${label}`}
          className="grid h-7 w-7 place-items-center rounded-full bg-[var(--pastel-peach)] text-sm font-bold text-[#a05c33] transition-transform hover:scale-110"
        >
          −
        </button>
        <span className="w-7 text-center font-display text-sm font-bold text-[#4f3d4a]">{value}</span>
        <button
          onClick={() => setValue(Math.min(max, value + 1))}
          aria-label={`Tăng ${label}`}
          className="grid h-7 w-7 place-items-center rounded-full bg-[var(--pastel-peach)] text-sm font-bold text-[#a05c33] transition-transform hover:scale-110"
        >
          +
        </button>
      </div>
    </div>
  )
}

function Toggle({ on, setOn, label }: { on: boolean; setOn: (b: boolean) => void; label: string }) {
  return (
    <button onClick={() => setOn(!on)} aria-pressed={on} className="flex w-full items-center justify-between gap-2 py-1">
      <span className="text-xs font-semibold text-[#6f5a68]">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${on ? 'bg-[#e8737f]' : 'bg-[#e5d5dc]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

/* mini preview cho các bố cục */
function LayoutMini({ id }: { id: LayoutMode }) {
  const cls = 'han-cell grid h-4 w-4 place-items-center font-cn text-[9px] leading-none text-[#4f3d4a]'
  if (id === 'std')
    return (
      <div className="flex gap-0.5">
        <span className={`${cls} han-tian`}>你</span>
        <span className={cls} />
        <span className={cls} />
      </div>
    )
  if (id === 'info')
    return (
      <div className="flex h-4 flex-col gap-px">
        <span className="h-1.5 rounded-[1px] bg-[var(--pastel-pink)]" />
        <span className="h-1 rounded-[1px] bg-[var(--pastel-sky)]/70" />
      </div>
    )
  if (id === 'flow')
    return (
      <div className="flex gap-0.5">
        <span className={`${cls} han-tian`}>今</span>
        <span className={`${cls} han-tian`}>天</span>
        <span className={`${cls} han-tian`}>天</span>
      </div>
    )
  if (id === 'stroke')
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`${cls} !text-[#d2495f]`}>永</span>
        <span className={`${cls} !text-[#4f3d4a] opacity-30`}>永</span>
      </div>
    )
  if (id === 'bigchar')
    return (
      <div className="flex items-center gap-0.5">
        <span className="han-cell han-tian grid h-5 w-5 place-items-center font-cn text-[10px] leading-none">你</span>
        <span className={`${cls} opacity-30`}>你</span>
        <span className={cls} />
      </div>
    )
  return (
    <div className="flex gap-0.5">
      <span className={`${cls} han-tian`}>氵</span>
      <span className={cls}>河</span>
      <span className={cls} />
    </div>
  )
}

/* ================= lưu bài tập ================= */

type SaveItem = { id: string; name: string; ts: number; payload: { cfg: SheetCfg; wordsInput: string; para: string; charMeta: CharMeta; activeTpl: string } }

const LS_CFG = 'nkhn.ws.cfg'
const LS_FAVS = 'nkhn.ws.favs'
const LS_SAVES = 'nkhn.ws.saves'

const ZOOMS = [0.7, 0.85, 1, 1.15, 1.3]

/* ================= trang chính ================= */

export default function CreateFile() {
  const { toast } = useToast()

  const [cfg, setCfg] = useState<SheetCfg>(DEFAULT_CFG)
  const [activeTpl, setActiveTpl] = useState('classic')
  const [wordsInput, setWordsInput] = useState(VOCAB_PRESETS[0].words.map((w) => w.w).join('\n'))
  const [para, setPara] = useState(PARAGRAPH_SAMPLES[0].text)
  const [tab, setTab] = useState<'nhap' | 'thuvien'>('nhap')
  const [editOpen, setEditOpen] = useState(false)
  const [charMeta, setCharMeta] = useState<CharMeta>({})
  const [radFilter, setRadFilter] = useState<RadFilter>('all')
  const [pageIdx, setPageIdx] = useState(0)
  const [zoomIdx, setZoomIdx] = useState(2)
  const [fit, setFit] = useState(true)
  const [favs, setFavs] = useState<string[]>([])
  const [saves, setSaves] = useState<SaveItem[]>([])
  const [customImg, setCustomImg] = useState('')

  const loadedRef = useRef(false)

  /* ---------- khôi phục lần trước (localStorage + link chia sẻ) ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_CFG)
      if (raw) {
        const d = JSON.parse(raw) as Partial<{
          cfg: SheetCfg
          wordsInput: string
          para: string
          charMeta: CharMeta
          activeTpl: string
          customTitle: string
          customFooter: string
        }>
        if (d.cfg)
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCfg({ ...DEFAULT_CFG, ...d.cfg })
        if (typeof d.wordsInput === 'string') setWordsInput(d.wordsInput)
        if (typeof d.para === 'string') setPara(d.para)
        if (d.charMeta) setCharMeta(d.charMeta)
        if (typeof d.activeTpl === 'string') setActiveTpl(d.activeTpl)
      }
      const favsRaw = localStorage.getItem(LS_FAVS)
      if (favsRaw) setFavs(JSON.parse(favsRaw) as string[])
      const savesRaw = localStorage.getItem(LS_SAVES)
      if (savesRaw) setSaves(JSON.parse(savesRaw) as SaveItem[])
    } catch {
      /* bỏ qua dữ liệu hỏng */
    }
    // link chia sẻ: #/create-file?w=<danh sách từ>
    const h = window.location.hash
    const qi = h.indexOf('?w=')
    if (qi > -1) {
      const w = decodeURIComponent(h.slice(qi + 3))
      if (w.trim()) setWordsInput(w)
    }
    loadedRef.current = true
  }, [])

  /* ---------- tự lưu cài đặt soạn thảo ---------- */
  useEffect(() => {
    if (!loadedRef.current) return
    try {
      localStorage.setItem(LS_CFG, JSON.stringify({ cfg, wordsInput, para, charMeta, activeTpl }))
    } catch {
      /* hết chỗ — bỏ qua */
    }
  }, [cfg, wordsInput, para, charMeta, activeTpl])

  useEffect(() => {
    if (!loadedRef.current) return
    try {
      localStorage.setItem(LS_FAVS, JSON.stringify(favs))
    } catch {
      /* bỏ qua */
    }
  }, [favs])

  useEffect(() => {
    if (!loadedRef.current) return
    try {
      localStorage.setItem(LS_SAVES, JSON.stringify(saves))
    } catch {
      /* bỏ qua */
    }
  }, [saves])

  /* ---------- dữ liệu nguồn ---------- */
  /* khoảng trắng tách từ ghép: 中国 = 1 từ · 中 国 = 2 từ đơn */
  const words = useMemo(
    () =>
      wordsInput
        .split(/\r?\n/)
        .flatMap((l) => l.trim().split(/\s+/))
        .filter(Boolean)
        .slice(0, MAX_WORDS),
    [wordsInput],
  )
  const totalChars = useMemo(() => words.reduce((s, w) => s + [...w].length, 0), [words])
  const flowChars = useMemo(() => [...para].filter((c) => c.trim() !== '').length, [para])
  const radicals = useMemo(() => {
    const f = STROKE_RANGES.find((r) => r.id === radFilter) ?? STROKE_RANGES[0]
    return RADICALS.filter((r) => f.test(r.strokes))
  }, [radFilter])
  const uniqueChars = useMemo(
    () =>
      [...new Set([...(cfg.layout === 'flow' ? para : words.join(''))])].filter(
        (c) => isHan(c),
      ),
    [words, para, cfg.layout],
  )
  const charCount = useMemo(() => words.reduce((s, w) => s + [...w].filter(isHan).length, 0), [words])

  /* ---------- dựng trang theo bố cục ---------- */
  const sheets = useMemo(() => buildSheets(words, cfg.repeat, cfg.cols, cfg.rows, cfg.modelCell, charMeta, cfg.showPinyin), [words, cfg, charMeta])
  const radicalSheets = useMemo(() => buildRadicalSheets(radicals, cfg.practiceRows, cfg.cols, cfg.rows), [radicals, cfg])
  const flowPages = useMemo(() => buildFlowPages(para, cfg.cols, cfg.rows, charMeta), [para, cfg, charMeta])
  const infoPages = useMemo(() => chunkInfoPages(buildInfoRows(words, charMeta), Math.max(3, cfg.rows)), [words, charMeta, cfg])
  const strokePages = useMemo(() => buildStrokePages(words, cfg.repeat, cfg.cols, cfg.rows, charMeta), [words, cfg, charMeta])
  const bigPages = useMemo(() => buildBigPages(words, cfg.rows, charMeta), [words, cfg, charMeta])

  const gridPages = cfg.layout === 'flow' ? flowPages : cfg.layout === 'radical' ? radicalSheets : sheets
  const pages =
    cfg.layout === 'info'
      ? infoPages.length
      : cfg.layout === 'stroke'
        ? strokePages.length
        : cfg.layout === 'bigchar'
          ? bigPages.length
          : gridPages.length
  const safePage = Math.min(pageIdx, pages - 1)
  const lineColor = LINE_COLORS.find((l) => l.id === cfg.lineColor) ?? LINE_COLORS[0]

  /* ---------- hành động ---------- */
  const patch = (p: Partial<SheetCfg>) => {
    setCfg((c) => ({ ...c, ...p }))
  }

  const pickLayout = (l: LayoutMode) => {
    patch({ layout: l })
    if (l === 'stroke' && cfg.repeat < 2) patch({ layout: l, repeat: 2 })
    setPageIdx(0)
  }

  const applyTemplate = (t: Template) => {
    setCfg((c) => ({ ...DEFAULT_CFG, wmText: c.wmText, ...t.cfg }))
    setActiveTpl(t.id)
    if (t.presetWords) setWordsInput(t.presetWords.join('\n'))
    if (t.presetPara) setPara(t.presetPara)
    setPageIdx(0)
    toast({
      title: `📄 Đã áp dụng mẫu “${t.name}”`,
      description: t.presetWords ? 'Kèm danh sách từ của mẫu — bạn vẫn sửa được bên dưới.' : 'Tuỳ chọn hiển thị vẫn chỉnh tiếp được.',
    })
  }

  const toggleFav = (id: string) => {
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }

  const toggleWord = (cn: string) => {
    const lines = wordsInput.split(/\r?\n/).map((t) => t.trim()).filter(Boolean)
    if (lines.includes(cn)) {
      setWordsInput(lines.filter((l) => l !== cn).join('\n'))
      return
    }
    if (lines.length >= MAX_WORDS) {
      toast({ title: `Danh sách đã đủ ${MAX_WORDS} từ`, description: 'Xoá bớt để thêm từ mới nhé' })
      return
    }
    setWordsInput([...lines, cn].join('\n'))
  }

  const addMany = (ws: DbWord[]) => {
    const lines = wordsInput.split(/\r?\n/).map((t) => t.trim()).filter(Boolean)
    const have = new Set(lines)
    const add = ws.map((w) => w.cn).filter((cn) => !have.has(cn))
    if (!add.length) {
      toast({ title: '🧺 Tất cả từ khớp đều đã nằm trong danh sách' })
      return
    }
    const room = MAX_WORDS - lines.length
    if (room <= 0) {
      toast({ title: `Danh sách đã đủ ${MAX_WORDS} từ`, description: 'Xoá bớt để thêm từ mới nhé' })
      return
    }
    const added = add.slice(0, room)
    setWordsInput([...lines, ...added].join('\n'))
    toast({ title: `＋ Đã thêm ${added.length} từ vào danh sách` })
  }

  const loadParaSample = (text: string) => {
    setPara(text)
    setPageIdx(0)
  }

  const patchRadFilter = (id: RadFilter) => {
    setRadFilter(id)
    setPageIdx(0)
  }

  const onUploadBg = (file: File) => {
    if (file.size > 1.6 * 1024 * 1024) {
      toast({ title: 'Ảnh hơi nặng (>1.5MB)', description: 'Chọn ảnh nhỏ hơn để trang vở vẫn nhẹ nhé' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCustomImg(String(reader.result ?? ''))
      patch({ bg: 'custom' })
      toast({ title: '🖼 Đã đặt hình nền tuỳ chỉnh' })
    }
    reader.readAsDataURL(file)
  }

  const saveSheet = () => {
    const base = words.slice(0, 3).join(' ') || (cfg.layout === 'flow' ? [...para].slice(0, 6).join('') : 'Vở luyện')
    const item: SaveItem = {
      id: Date.now().toString(36),
      name: `${base}${base.length >= 18 ? '…' : ''}`,
      ts: Date.now(),
      payload: { cfg, wordsInput, para, charMeta, activeTpl },
    }
    setSaves((s) => [item, ...s].slice(0, 12))
    toast({ title: '💾 Đã lưu bài tập', description: 'Xem trong “Bộ cài đặt của tôi”.' })
  }

  const loadSave = (item: SaveItem) => {
    setCfg({ ...DEFAULT_CFG, ...item.payload.cfg })
    setWordsInput(item.payload.wordsInput)
    setPara(item.payload.para)
    setCharMeta(item.payload.charMeta ?? {})
    setActiveTpl(item.payload.activeTpl)
    setPageIdx(0)
    toast({ title: '📂 Đã mở bài tập đã lưu' })
  }

  const deleteSave = (id: string) => {
    setSaves((s) => s.filter((x) => x.id !== id))
    toast({ title: '🗑 Đã xoá bài lưu' })
  }

  const shareSheet = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/create-file?w=${encodeURIComponent(wordsInput)}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: '🔗 Đã sao chép liên kết chia sẻ', description: 'Gửi cho bạn bè để mở đúng danh sách từ.' })
    } catch {
      toast({ title: '🔗 Liên kết của bạn:', description: url.slice(0, 80) + '…' })
    }
  }

  const resetAll = () => {
    setCfg(DEFAULT_CFG)
    setCustomImg('')
    setPageIdx(0)
    toast({ title: '⟲ Đã đặt lại toàn bộ tuỳ chọn' })
  }

  /* ---------- nhãn số liệu theo bố cục ---------- */
  const estimate =
    cfg.layout === 'std'
      ? `${words.length} từ × ${cfg.repeat} hàng · khoảng ${pages} trang A4`
      : cfg.layout === 'info'
        ? `Bảng ${words.length} từ · ${cfg.practiceCells} ô luyện mỗi từ · khoảng ${pages} trang`
        : cfg.layout === 'flow'
          ? `${flowChars} chữ · khoảng ${pages} trang`
          : cfg.layout === 'stroke'
            ? `${words.length} từ · ${cfg.repeat} hàng mỗi từ (1 mẫu + ${Math.max(0, cfg.repeat - 1)} tô) · khoảng ${pages} trang`
            : cfg.layout === 'bigchar'
              ? `${charCount} chữ tách riêng · ${cfg.traceCells} ô tô mỗi chữ · khoảng ${pages} trang`
              : `${radicals.length} bộ thủ · khoảng ${pages} trang`

  const previewChars = cfg.layout === 'flow' ? flowChars : cfg.layout === 'radical' ? radicals.length : totalChars

  const sheetProps = {
    cfg,
    cols: cfg.cols,
    rows: cfg.rows,
    practiceCells: cfg.practiceCells,
    traceCells: cfg.traceCells,
    charMeta,
    bgImg: customImg,
  }

  return (
    <>
      {/* ================= GIAO DIỆN (ẩn khi in) ================= */}
      <div className="screen-root flex min-h-screen flex-col overflow-x-clip bg-[#fff6e9] text-[#5d4a57]">
        <main className="relative flex-1 pt-24 sm:pt-28">
          <div aria-hidden="true" className="dot-grid absolute inset-0" />

          <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="pt-4">
              <SectionHeading
                tag="Công cụ tạo tài liệu"
                tagColor="var(--pastel-peach)"
                title="Tạo Vở Tập Viết Chữ Hán"
                titleAccent="练字本"
                sub="25 mẫu giấy theo 6 nhóm · sửa nghĩa & phiên âm từng chữ · nền pastel, watermark PDF — soạn, xem trước rồi in."
              />
            </div>

            {/* ---------- 3 bước nhanh ---------- */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'sec-chu', n: 1, label: 'Chữ cần luyện', cn: '字' },
                { id: 'sec-mau', n: 2, label: 'Chọn mẫu giấy', cn: '样' },
                { id: 'sec-xuat', n: 3, label: 'Xuất PDF', cn: '印' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="paper-scrap flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold text-[#5d4a57] transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e8737f] text-[10px] text-white">{s.n}</span>
                  {s.label} <span className="font-cn text-[#b58fa0]">{s.cn}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
              {/* ================= CỘT TRÁI: PREVIEW ================= */}
              <Reveal className="lg:sticky lg:top-24">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display flex items-center gap-2 text-lg font-bold text-[#4f3d4a]">
                    Xem trước <span className="font-cn text-sm text-[#e88aa6]">预览</span>
                    <PushPin color="#e8737f" className="translate-y-0.5 scale-75" />
                  </h2>
                  <span className="rounded-full bg-[var(--pastel-mint)] px-3 py-1 text-[11px] font-bold text-[#3f6b50]">
                    {previewChars} ký tự · {pages} trang
                  </span>
                </div>

                {/* thanh công cụ xem trước: zoom + vừa khung */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--cream)] px-3 py-2 ring-1 ring-[#ead9cd]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setZoomIdx(Math.max(0, zoomIdx - 1))}
                      disabled={zoomIdx === 0}
                      aria-label="Thu nhỏ xem trước"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold text-[#6f5a68] ring-1 ring-[#ead9cd] disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-display text-xs font-bold text-[#4f3d4a]">
                      {Math.round(ZOOMS[zoomIdx] * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomIdx(Math.min(ZOOMS.length - 1, zoomIdx + 1))}
                      disabled={zoomIdx === ZOOMS.length - 1}
                      aria-label="Phóng to xem trước"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold text-[#6f5a68] ring-1 ring-[#ead9cd] disabled:opacity-40"
                    >
                      ＋
                    </button>
                  </div>
                  <button
                    onClick={() => setFit(!fit)}
                    aria-pressed={fit}
                    className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition-all ${
                      fit ? 'bg-[#4f3d4a] text-white shadow-[0_2px_0_0_#3a2d36]' : 'bg-white text-[#6f5a68] ring-1 ring-[#ead9cd] hover:bg-[var(--pastel-butter)]/50'
                    }`}
                  >
                    ⤢ Vừa khung
                  </button>
                </div>

                {/* khổ giấy A4 */}
                <div className="overflow-x-auto pb-2">
                  <div className={`paper-scrap relative mx-auto w-full rotate-[0.6deg] rounded-lg p-3 shadow-[0_18px_40px_-18px_rgba(93,74,87,0.35)] sm:p-4 ${fit ? 'max-w-[540px]' : 'max-w-[820px]'}`}>
                    <WashiTape color="var(--pastel-butter)" pattern="grid" rotate={-5} className="-top-2.5 right-10 z-10 h-5 w-16" />
                    <div
                      className="aspect-[210/297] w-full rounded-md ring-1 ring-[#ead9cd] transition-transform duration-300"
                      style={{ transform: `scale(${ZOOMS[zoomIdx]})`, transformOrigin: 'top center' }}
                    >
                      <Sheet
                        layout={cfg.layout}
                        {...sheetProps}
                        gridData={cfg.layout === 'info' || cfg.layout === 'stroke' || cfg.layout === 'bigchar' ? [] : gridPages[safePage] ?? []}
                        infoRows={cfg.layout === 'info' ? infoPages[safePage] ?? null : null}
                        strokeBlocks={cfg.layout === 'stroke' ? strokePages[safePage] ?? null : null}
                        bigBands={cfg.layout === 'bigchar' ? bigPages[safePage] ?? null : null}
                        wmText={cfg.wmOn ? cfg.wmText.trim() : ''}
                      />
                    </div>
                  </div>
                </div>

                {/* chuyển trang */}
                <div className="mx-auto mt-4 flex max-w-[540px] items-center justify-center gap-3">
                  <button
                    onClick={() => setPageIdx(Math.max(0, safePage - 1))}
                    disabled={safePage === 0}
                    className="paper-scrap rounded-full px-4 py-2 text-sm font-bold text-[#6f5a68] disabled:opacity-40"
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>
                  <span className="font-display text-sm font-bold text-[#4f3d4a]">
                    Trang {safePage + 1} / {pages}
                  </span>
                  <button
                    onClick={() => setPageIdx(Math.min(pages - 1, safePage + 1))}
                    disabled={safePage >= pages - 1}
                    className="paper-scrap rounded-full px-4 py-2 text-sm font-bold text-[#6f5a68] disabled:opacity-40"
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              </Reveal>

              {/* ================= CỘT PHẢI: CHỨC NĂNG ================= */}
              <div className="flex flex-col gap-5">
                {/* ============ 1 · CHỮ CẦN LUYỆN ============ */}
                <Reveal delay={0.04}>
                  <Group n={1} title="Chữ cần luyện" cn="生字" tape="var(--pastel-sky)" id="sec-chu">
                    {cfg.layout === 'radical' ? (
                      <p className="text-xs font-semibold leading-relaxed text-[#6f5a68]">
                        Mẫu <strong>Bộ thủ</strong> tự lấy kho {RADICALS.length} bộ thủ của trang — không cần nhập chữ. Chọn phạm vi số nét ở
                        phần tuỳ chỉnh nâng cao bên dưới.
                      </p>
                    ) : cfg.layout === 'flow' ? (
                      <div>
                        {/* mẫu đoạn văn nhanh */}
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {PARAGRAPH_SAMPLES.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => loadParaSample(s.text)}
                              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                                para === s.text
                                  ? 'bg-[#3f6b50] text-white shadow-[0_2px_0_0_#33593f]'
                                  : 'ring-1 ring-[#ead9cd] text-[#6f5a68] hover:bg-[var(--cream)]'
                              }`}
                            >
                              ¶ {s.name}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={para}
                          onChange={(e) => setPara(e.target.value)}
                          rows={4}
                          placeholder="Dán hoặc viết đoạn văn tiếng Trung muốn chép…"
                          className="custom-scroll font-cn w-full resize-none rounded-xl bg-[#fffdf6] p-3 text-sm leading-relaxed text-[#4f3d4a] ring-1 ring-[#ead9cd] focus:outline-none focus:ring-2 focus:ring-[#f0b9c9]"
                          aria-label="Đoạn văn muốn chép"
                        />
                        <p className="mt-2 text-[11px] font-semibold text-[#b58fa0]">
                          → {flowChars} chữ · mỗi trang chứa {cfg.cols * cfg.rows} chữ · dấu câu cũng chiếm một ô như giấy ô vuông thật
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* tab Nhập tay / Thư viện */}
                        <div className="mb-2.5 grid grid-cols-2 gap-1 rounded-xl bg-[var(--cream)] p-1 ring-1 ring-[#ead9cd]">
                          {(
                            [
                              { id: 'nhap', label: '✍️ Nhập tay' },
                              { id: 'thuvien', label: '📚 Thư viện' },
                            ] as const
                          ).map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setTab(t.id)}
                              aria-pressed={tab === t.id}
                              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
                                tab === t.id ? 'bg-[#4f3d4a] text-white shadow-[0_3px_0_0_#3a2d36]' : 'text-[#8d7484] hover:text-[#4f3d4a]'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {tab === 'nhap' ? (
                          <textarea
                            value={wordsInput}
                            onChange={(e) => setWordsInput(e.target.value)}
                            rows={4}
                            placeholder={'Gõ hoặc dán chữ Hán cần luyện, ví dụ:\n你好 谢谢\n中 国'}
                            className="custom-scroll font-cn w-full resize-none rounded-xl bg-[#fffdf6] p-3 text-sm leading-relaxed text-[#4f3d4a] ring-1 ring-[#ead9cd] focus:outline-none focus:ring-2 focus:ring-[#f0b9c9]"
                            aria-label="Danh sách từ vựng"
                          />
                        ) : (
                          <WordPicker selected={words} onToggle={toggleWord} onAddMany={addMany} />
                        )}

                        <p className="mt-2 text-[10.5px] font-semibold italic leading-snug text-[#b58fa0]">
                          Gõ dấu cách để tách từ ghép. Ví dụ: <span className="font-cn not-italic">中国</span> = 1 từ ghép,{' '}
                          <span className="font-cn not-italic">中 国</span> = 2 từ đơn.
                        </p>

                        {/* đếm + xoá */}
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[11px] font-bold text-[#b58fa0]">
                            {words.length} từ · {totalChars} chữ
                          </p>
                          <button
                            onClick={() => setWordsInput('')}
                            className="rounded-full px-3 py-1 text-[11px] font-bold text-[#c2547e] hover:bg-[var(--pastel-pink-soft)]"
                          >
                            Xoá hết
                          </button>
                        </div>

                        {/* chip chữ + phiên âm (tự động / chỉnh tay) */}
                        {uniqueChars.length > 0 && (
                          <div className="custom-scroll mt-1 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
                            {uniqueChars.slice(0, 20).map((c) => (
                              <span
                                key={c}
                                className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-[11px] font-semibold text-[#6f5a68] ring-1 ring-[#ead9cd]"
                              >
                                <span className="font-cn">{c}</span>{' '}
                                <span className="text-[#c2547e]">{charMeta[c]?.py || charPinyin(c)}</span>
                              </span>
                            ))}
                            {uniqueChars.length > 20 && (
                              <span className="self-center text-[11px] font-bold text-[#b58fa0]">+{uniqueChars.length - 20}…</span>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setEditOpen(!editOpen)}
                          aria-expanded={editOpen}
                          className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-[#46688f] ring-1 ring-[#ead9cd] transition-colors hover:bg-[var(--pastel-sky)]/30"
                        >
                          ✎ Sửa nghĩa và phiên âm
                        </button>
                        {editOpen && uniqueChars.length > 0 && (
                          <CharEditor chars={uniqueChars} meta={charMeta} onChange={setCharMeta} />
                        )}
                      </div>
                    )}
                  </Group>
                </Reveal>

                {/* ============ 2 · CHỌN MẪU GIẤY ============ */}
                <Reveal delay={0.06}>
                  <Group n={2} title="Chọn mẫu giấy" cn="纸样" tape="var(--pastel-pink)" id="sec-mau">
                    <TemplateGallery activeId={activeTpl} favs={favs} onPick={applyTemplate} onFav={toggleFav} />
                  </Group>
                </Reveal>

                {/* ============ TUỲ CHỈNH HIỂN THỊ ============ */}
                <Reveal delay={0.08}>
                  <Accordion title="Tùy chỉnh hiển thị" cn="显示" defaultOpen>
                    <div className="space-y-1">
                      <Toggle on={cfg.showPinyin} setOn={(b) => patch({ showPinyin: b })} label="Hiển thị phiên âm" />
                      <Toggle on={cfg.showMeaning} setOn={(b) => patch({ showMeaning: b })} label="Hiển thị nghĩa tiếng Việt" />
                      <Toggle on={cfg.showStroke} setOn={(b) => patch({ showStroke: b })} label="Hiển thị thứ tự nét" />
                      {(cfg.layout === 'std' || cfg.layout === 'flow' || cfg.layout === 'radical') && (
                        <Toggle on={cfg.fadeModel} setOn={(b) => patch({ fadeModel: b })} label="Chữ mẫu nhạt để tô theo" />
                      )}
                      {cfg.layout === 'std' && <Toggle on={cfg.modelCell} setOn={(b) => patch({ modelCell: b })} label="Hàng mẫu có chữ" />}
                      <Toggle on={cfg.colorful} setOn={(b) => patch({ colorful: b })} label="Ô màu cầu vồng (mỗi chữ một màu)" />

                      <div className="space-y-2.5 border-t border-dashed border-[#ead9cd] pt-2.5">
                        {(cfg.layout === 'std' || cfg.layout === 'stroke') && (
                          <Stepper
                            label="Số dòng luyện tập"
                            value={cfg.repeat}
                            setValue={(n) => {
                              patch({ repeat: n })
                              setPageIdx(0)
                            }}
                            min={cfg.layout === 'stroke' ? 2 : 1}
                            max={cfg.layout === 'stroke' ? 4 : 6}
                          />
                        )}
                        {cfg.layout === 'info' && (
                          <Stepper label="Ô luyện viết mỗi từ" value={cfg.practiceCells} setValue={(n) => patch({ practiceCells: n })} min={2} max={8} />
                        )}
                        {cfg.layout === 'radical' && (
                          <Stepper label="Hàng trống mỗi bộ thủ" value={cfg.practiceRows} setValue={(n) => patch({ practiceRows: n })} min={1} max={3} />
                        )}
                        {cfg.layout === 'bigchar' && (
                          <Stepper label="Số chữ gợi ý (ô tô mỗi chữ)" value={cfg.traceCells} setValue={(n) => patch({ traceCells: n })} min={4} max={12} />
                        )}
                        {cfg.layout === 'flow' && (
                          <p className="text-xs font-semibold text-[#6f5a68]">Đoạn văn chảy liên tục — không cần số dòng luyện tập.</p>
                        )}
                        <p className="text-[11px] font-semibold text-[#b58fa0]">→ {estimate}</p>
                      </div>
                    </div>
                  </Accordion>
                </Reveal>

                {/* ============ TUỲ CHỈNH NÂNG CAO ============ */}
                <Reveal delay={0.1}>
                  <Accordion title="Tùy chỉnh nâng cao" cn="高级">
                    <div className="space-y-4">
                      {/* ô chữ và màu sắc */}
                      <div>
                        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8d7484]">Ô chữ và màu sắc</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { id: 'tian', label: 'Ô chữ giữa', cn: '田字格' },
                              { id: 'mi', label: 'Ô tám hướng', cn: '米字格' },
                              { id: 'square', label: 'Ô vuông', cn: '方格' },
                              { id: 'line', label: 'Dòng kẻ', cn: '横线' },
                            ] as { id: PaperType; label: string; cn: string }[]
                          ).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => patch({ paper: p.id })}
                              aria-pressed={cfg.paper === p.id}
                              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                                cfg.paper === p.id
                                  ? 'bg-[var(--pastel-pink-soft)] ring-2 ring-[#f0b9c9]'
                                  : 'ring-1 ring-[#ead9cd] hover:bg-[var(--cream)]'
                              }`}
                            >
                              <span
                                className={`h-7 w-7 shrink-0 bg-white ${p.id === 'tian' ? 'han-cell han-tian' : p.id === 'mi' ? 'han-cell han-mi' : p.id === 'line' ? 'han-cell han-line' : 'han-cell'}`}
                              />
                              <span>
                                <span className="font-cn block text-xs font-bold text-[#4f3d4a]">{p.cn}</span>
                                <span className="block text-[9.5px] font-semibold text-[#8d7484]">{p.label}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {LINE_COLORS.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => patch({ lineColor: l.id })}
                              aria-pressed={cfg.lineColor === l.id}
                              className={`flex items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-[10.5px] font-bold transition-all ${
                                cfg.lineColor === l.id ? 'bg-[var(--pastel-pink-soft)] ring-2 ring-[#f0b9c9]' : 'ring-1 ring-[#ead9cd] hover:bg-[var(--cream)]'
                              }`}
                            >
                              <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5" style={{ background: l.line }} />
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* bố cục trang */}
                      <div className="border-t border-dashed border-[#ead9cd] pt-3">
                        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8d7484]">Bố cục trang</p>
                        <div className="space-y-2.5">
                          {cfg.layout !== 'bigchar' && cfg.layout !== 'info' && (
                            <Stepper label="Số ô mỗi hàng (cột)" value={cfg.cols} setValue={(n) => patch({ cols: n })} min={4} max={14} />
                          )}
                          {cfg.layout !== 'info' && (
                            <Stepper
                              label="Số hàng mỗi trang"
                              value={cfg.rows}
                              setValue={(n) => {
                                patch({ rows: n })
                                setPageIdx(0)
                              }}
                              min={3}
                              max={12}
                            />
                          )}
                          <p className="text-[11px] font-semibold text-[#b58fa0]">→ Mỗi trang có {cfg.cols * cfg.rows} ô tập viết · in tối đa {PRINT_CAP} trang</p>
                        </div>
                      </div>

                      {/* bộ thủ — phạm vi số nét */}
                      {cfg.layout === 'radical' && (
                        <div className="border-t border-dashed border-[#ead9cd] pt-3">
                          <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8d7484]">Phạm vi bộ thủ</p>
                          <div className="flex flex-wrap gap-1.5">
                            {STROKE_RANGES.map((f) => (
                              <button
                                key={f.id}
                              onClick={() => patchRadFilter(f.id)}
                                aria-pressed={radFilter === f.id}
                                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                  radFilter === f.id
                                    ? 'bg-[#c07a2c] text-white shadow-[0_2px_0_0_#a3652a]'
                                    : 'ring-1 ring-[#ead9cd] text-[#6f5a68] hover:bg-[var(--cream)]'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* đầu trang và chân trang */}
                      <div className="border-t border-dashed border-[#ead9cd] pt-3">
                        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8d7484]">Đầu trang và chân trang</p>
                        <div className="space-y-2">
                          <Toggle on={cfg.showHeader} setOn={(b) => patch({ showHeader: b })} label="Dòng đầu trang (tên · ngày)" />
                          <input
                            type="text"
                            value={cfg.sheetTitle}
                            onChange={(e) => patch({ sheetTitle: e.target.value })}
                            placeholder={SHEET_HEAD[cfg.layout].vi}
                            maxLength={40}
                            className="w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#4f3d4a] ring-1 ring-[#ead9cd] placeholder:text-[#c9a2b3] focus:outline-none focus:ring-2 focus:ring-[#f0b9c9]"
                            aria-label="Tiêu đề đầu trang"
                          />
                          <input
                            type="text"
                            value={cfg.footerText}
                            onChange={(e) => patch({ footerText: e.target.value })}
                            placeholder="Chân trang — vd: Lớp 5A · Bài 3"
                            maxLength={40}
                            className="w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#4f3d4a] ring-1 ring-[#ead9cd] placeholder:text-[#c9a2b3] focus:outline-none focus:ring-2 focus:ring-[#f0b9c9]"
                            aria-label="Chân trang"
                          />
                        </div>
                      </div>

                      {/* hình nền tuỳ chỉnh */}
                      <div className="border-t border-dashed border-[#ead9cd] pt-3">
                        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8d7484]">Hình nền tuỳ chỉnh</p>
                        <div className="flex flex-wrap gap-1.5">
                          {BACKDROPS.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => patch({ bg: b.id })}
                              aria-pressed={cfg.bg === b.id}
                              className={`flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[10.5px] font-bold transition-all ${
                                cfg.bg === b.id ? 'bg-[var(--pastel-pink-soft)] ring-2 ring-[#f0b9c9]' : 'ring-1 ring-[#ead9cd] hover:bg-[var(--cream)]'
                              }`}
                            >
                              <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-[#d8c7bd]" style={{ background: b.bg }} />
                              <span className="font-cn">{b.cn}</span>
                              <span className="text-[#8d7484]">{b.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10.5px] font-bold text-[#6f5a68] ring-1 ring-[#ead9cd] hover:bg-[var(--cream)]">
                            🎨 Màu tuỳ chọn
                            <input
                              type="color"
                              value={cfg.customColor}
                              onChange={(e) => patch({ bg: 'custom', customColor: e.target.value })}
                              className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                              aria-label="Chọn màu nền tuỳ chỉnh"
                            />
                          </label>
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10.5px] font-bold text-[#6f5a68] ring-1 ring-[#ead9cd] hover:bg-[var(--cream)]">
                            🖼 Tải ảnh nền
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) onUploadBg(f)
                                e.currentTarget.value = ''
                              }}
                              className="hidden"
                              aria-label="Tải ảnh nền tuỳ chỉnh"
                            />
                          </label>
                          {(customImg || cfg.bg === 'custom') && (
                            <button
                              onClick={() => {
                                setCustomImg('')
                                patch({ bg: 'white' })
                              }}
                              className="rounded-full px-3 py-1.5 text-[10.5px] font-bold text-[#c2547e] hover:bg-[var(--pastel-pink-soft)]"
                            >
                              ✕ Bỏ nền tuỳ chỉnh
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 text-[10.5px] font-semibold text-[#b58fa0]">→ Ảnh nền sẽ được làm mờ nhẹ để chữ vẫn rõ khi in.</p>
                      </div>
                    </div>
                  </Accordion>
                </Reveal>

                {/* ============ BỘ CÀI ĐẶT CỦA TÔI ============ */}
                <Reveal delay={0.12}>
                  <Accordion title="Bộ cài đặt của tôi" cn="我的设置">
                    {saves.length === 0 ? (
                      <p className="text-xs font-semibold text-[#8d7484]">
                        Chưa có bài nào được lưu. Bấm <strong className="text-[#4f3d4a]">“Lưu bài tập”</strong> ở phần Xuất PDF để giữ lại bản soạn —
                        cài đặt của bạn cũng được tự động ghi nhớ cho lần sau.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {saves.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-[#ead9cd]">
                            <span className="min-w-0 flex-1">
                              <span className="font-cn block truncate text-xs font-bold text-[#4f3d4a]">{s.name}</span>
                              <span className="block text-[9.5px] font-semibold text-[#b58fa0]">
                                {new Date(s.ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </span>
                            <button
                              onClick={() => loadSave(s)}
                              className="rounded-full bg-[var(--pastel-mint)]/70 px-2.5 py-1 text-[10.5px] font-extrabold text-[#3f6b50] hover:bg-[var(--pastel-mint)]"
                            >
                              Mở
                            </button>
                            <button
                              onClick={() => deleteSave(s.id)}
                              aria-label={`Xoá ${s.name}`}
                              className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-[#b58fa0] hover:bg-[var(--pastel-pink-soft)] hover:text-[#d2495f]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Accordion>
                </Reveal>

                {/* ============ 3 · XUẤT PDF ============ */}
                <Reveal delay={0.14}>
                  <Group n={3} title="Xuất PDF" cn="导出" tape="var(--pastel-mint)" id="sec-xuat">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          onClick={() => window.print()}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-2xl bg-[#e8737f] px-4 py-3 font-display text-sm font-bold text-white shadow-[0_4px_0_0_#d1708f]"
                        >
                          ⬇️ Xuất PDF
                        </motion.button>
                        <motion.button
                          onClick={() => window.print()}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-2xl bg-[#4f3d4a] px-4 py-3 font-display text-sm font-bold text-white shadow-[0_4px_0_0_#3a2d36]"
                        >
                          🖨 In
                        </motion.button>
                      </div>
                      <p className="text-center text-[11px] font-semibold text-[#b58fa0]">
                        Miễn phí, không cần đăng nhập — trong hộp thoại in chọn <strong className="text-[#6f5a68]">“Save as PDF”</strong> và bật{' '}
                        <strong className="text-[#6f5a68]">“Background graphics”</strong> để giữ màu.
                      </p>

                      {pageBgTone(cfg) === 'dark' && (
                        <p className="rounded-xl bg-[var(--pastel-peach)]/40 px-3 py-2 text-[10.5px] font-bold leading-relaxed text-[#a05a3a] ring-1 ring-[#f3dcc6]">
                          ⚠️ Bạn đang dùng nền màu tối — nhớ bật <strong>“Background graphics”</strong> khi in, nếu không đầu trang/chân trang sẽ rất khó đọc.
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={saveSheet}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-[#46688f] ring-1 ring-[#ead9cd] transition-colors hover:bg-[var(--pastel-sky)]/30"
                        >
                          🔖 Lưu bài tập
                        </button>
                        <button
                          onClick={shareSheet}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-[#46688f] ring-1 ring-[#ead9cd] transition-colors hover:bg-[var(--pastel-sky)]/30"
                        >
                          🔗 Chia sẻ
                        </button>
                      </div>

                      {/* watermark bản quyền cho PDF */}
                      <div className="rounded-xl bg-[var(--cream)] p-2.5 ring-1 ring-[#ead9cd]">
                        <Toggle on={cfg.wmOn} setOn={(b) => patch({ wmOn: b })} label="Watermark bản quyền" />
                        {cfg.wmOn && (
                          <input
                            type="text"
                            value={cfg.wmText}
                            maxLength={30}
                            onChange={(e) => patch({ wmText: e.target.value })}
                            placeholder="Tên sẽ in chéo giữa trang…"
                            className="mt-1.5 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#4f3d4a] ring-1 ring-[#ead9cd] placeholder:text-[#c9a2b3] focus:outline-none focus:ring-2 focus:ring-[#f0b9c9]"
                            aria-label="Nội dung watermark"
                          />
                        )}
                        <p className="mt-1.5 text-[10.5px] font-semibold leading-snug text-[#b58fa0]">
                          Watermark in chéo giữa mỗi trang PDF.
                        </p>
                      </div>

                      <button
                        onClick={resetAll}
                        className="paper-scrap w-full rounded-full px-4 py-2 text-xs font-bold text-[#6f5a68] transition-transform hover:-translate-y-0.5"
                      >
                        ⟲ Đặt lại mặc định
                      </button>
                    </div>
                  </Group>
                </Reveal>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* ================= BẢN IN (chỉ hiện khi in) ================= */}
      <div className="print-only" aria-hidden="true">
        {cfg.layout === 'info'
          ? infoPages.slice(0, PRINT_CAP).map((rowsData, p) => (
              <div key={p} className="print-page ink-exact" style={{ background: bgCssOf(cfg) }}>
                <Sheet layout="info" {...sheetProps} gridData={[]} infoRows={rowsData} wmText={cfg.wmOn ? cfg.wmText.trim() : ''} />
              </div>
            ))
          : cfg.layout === 'stroke'
            ? strokePages.slice(0, PRINT_CAP).map((blocks, p) => (
                <div key={p} className="print-page ink-exact" style={{ background: bgCssOf(cfg) }}>
                  <Sheet layout="stroke" {...sheetProps} gridData={[]} infoRows={null} strokeBlocks={blocks} wmText={cfg.wmOn ? cfg.wmText.trim() : ''} />
                </div>
              ))
            : cfg.layout === 'bigchar'
              ? bigPages.slice(0, PRINT_CAP).map((bands, p) => (
                  <div key={p} className="print-page ink-exact" style={{ background: bgCssOf(cfg) }}>
                    <Sheet layout="bigchar" {...sheetProps} gridData={[]} infoRows={null} bigBands={bands} wmText={cfg.wmOn ? cfg.wmText.trim() : ''} />
                  </div>
                ))
              : gridPages.slice(0, PRINT_CAP).map((rd, p) => (
                  <div key={p} className="print-page ink-exact" style={{ background: bgCssOf(cfg) }}>
                    <Sheet layout={cfg.layout} {...sheetProps} gridData={rd} infoRows={null} wmText={cfg.wmOn ? cfg.wmText.trim() : ''} />
                  </div>
                ))}
      </div>
    </>
  )
}
