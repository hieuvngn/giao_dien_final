/* ============================================================
   AI Mistake Analyzer — engine phân tích & lưu lịch sử lỗi
   ------------------------------------------------------------
   - analyzeSentence(): quét câu theo kho quy luật (mistake-data)
   - glossSentence(): tách từ → pinyin + nghĩa Việt, dùng lại
     605 mục từ vựng thật của ROADMAP_LEVELS + từ điển bổ sung
   - buildConclusion(): tổng hợp lịch sử lỗi → quy luật nổi bật
   - loadMistakes / saveMistakes: localStorage (错题本 cá nhân)
   ============================================================ */

import { ROADMAP_LEVELS } from '@/data/roadmap'
import {
  ADVICE_MAP,
  DEFAULT_DRILLS,
  DRILLS,
  ERROR_PATTERNS,
  SEED_SENTENCES,
  TYPE_META,
  type ErrorPattern,
  type MistakeType,
} from './mistake-data'

/* ---------- kiểu dữ liệu ---------- */

export type Gloss = { pinyin: string; vi: string | null }

export type MistakeIssue = {
  patternId: string
  type: MistakeType
  topic: string
  issue: string
  explain: string
  knowledge: string[]
  level: string
  raw: string
  corrected: string
  spot: { a: string; b: string } | null
  gloss: Gloss | null
}

export type AnalysisResult = { raw: string; issues: MistakeIssue[] }

export type MistakeRecord = {
  id: string
  raw: string
  corrected: string
  type: MistakeType
  topic: string
  issue: string
  explain: string
  knowledge: string[]
  level: string
  createdAt: number
  resolved: boolean
  source: 'seed' | 'ai'
}

export type KnowledgeStat = { key: string; count: number; pct: number }

export type Conclusion = {
  total: number
  open: number
  stats: KnowledgeStat[]
  byType: { type: MistakeType; count: number }[]
  top: KnowledgeStat | null
  strength: 'rõ rệt' | 'cần chú ý'
  headline: string
  body: string
  advice: string
  drills: { emoji: string; label: string }[]
}

/* ---------- từ điển phục vụ pinyin / nghĩa ---------- */

type DictEntry = { pinyin: string; vi: string }

/* 605 mục từ vựng thật trong các lộ trình */
const DICT = new Map<string, DictEntry>()
for (const level of ROADMAP_LEVELS) {
  for (const lesson of level.vocab) {
    for (const w of lesson.words) {
      if (!DICT.has(w.cn)) DICT.set(w.cn, { pinyin: w.pinyin, vi: w.vi })
    }
  }
}

/* Bổ sung trợ từ, lượng từ và từ phổ biến có thể chưa có trong lộ trình */
const SUPPLEMENT: Record<string, DictEntry> = {
  了: { pinyin: 'le', vi: '(trợ từ hoàn thành)' },
  没: { pinyin: 'méi', vi: 'chưa · không' },
  没有: { pinyin: 'méiyǒu', vi: 'không có · chưa' },
  在: { pinyin: 'zài', vi: 'ở · đang' },
  给: { pinyin: 'gěi', vi: 'cho' },
  得: { pinyin: 'de', vi: '(bổ ngữ trạng thái)' },
  把: { pinyin: 'bǎ', vi: '(câu chữ 把)' },
  一: { pinyin: 'yī', vi: 'một' },
  二: { pinyin: 'èr', vi: 'hai' },
  两: { pinyin: 'liǎng', vi: 'hai (đếm)' },
  几: { pinyin: 'jǐ', vi: 'vài · mấy' },
  个: { pinyin: 'gè', vi: '(lượng từ)' },
  碗: { pinyin: 'wǎn', vi: 'bát' },
  本: { pinyin: 'běn', vi: 'quyển' },
  条: { pinyin: 'tiáo', vi: 'chiếc (dài)' },
  瓶: { pinyin: 'píng', vi: 'chai' },
  杯: { pinyin: 'bēi', vi: 'cốc' },
  双: { pinyin: 'shuāng', vi: 'đôi' },
  件: { pinyin: 'jiàn', vi: 'chiếc (áo)' },
  张: { pinyin: 'zhāng', vi: 'tờ' },
  场: { pinyin: 'chǎng', vi: 'buổi' },
  棵: { pinyin: 'kē', vi: 'cây' },
  只: { pinyin: 'zhī', vi: 'con' },
  支: { pinyin: 'zhī', vi: 'cây (bút)' },
  部: { pinyin: 'bù', vi: 'chiếc (máy)' },
  台: { pinyin: 'tái', vi: 'máy' },
  副: { pinyin: 'fù', vi: 'bộ' },
  朵: { pinyin: 'duǒ', vi: 'bông' },
  封: { pinyin: 'fēng', vi: 'lá (thư)' },
  根: { pinyin: 'gēn', vi: 'cây (dài)' },
  块: { pinyin: 'kuài', vi: 'viên · tệ' },
  座: { pinyin: 'zuò', vi: 'tòa' },
  首: { pinyin: 'shǒu', vi: 'bài (hát)' },
  节: { pinyin: 'jié', vi: 'tiết' },
  头: { pinyin: 'tóu', vi: 'con (gia súc)' },
  完: { pinyin: 'wán', vi: 'xong' },
  穿: { pinyin: 'chuān', vi: 'mặc' },
  食堂: { pinyin: 'shítáng', vi: 'căng tin' },
  图书馆: { pinyin: 'túshūguǎn', vi: 'thư viện' },
  啤酒: { pinyin: 'píjiǔ', vi: 'bia' },
  面条: { pinyin: 'miàntiáo', vi: 'mì sợi' },
  裤子: { pinyin: 'kùzi', vi: 'quần' },
  作业: { pinyin: 'zuòyè', vi: 'bài tập' },
  电视: { pinyin: 'diànshì', vi: 'tivi' },
  电脑: { pinyin: 'diànnǎo', vi: 'máy tính' },
  北京: { pinyin: 'Běijīng', vi: 'Bắc Kinh' },
  大学: { pinyin: 'dàxué', vi: 'đại học' },
  明天: { pinyin: 'míngtiān', vi: 'ngày mai' },
  昨天: { pinyin: 'zuótiān', vi: 'hôm qua' },
  下周: { pinyin: 'xiàzhōu', vi: 'tuần sau' },
  每天: { pinyin: 'měitiān', vi: 'mỗi ngày' },
  学习: { pinyin: 'xuéxí', vi: 'học tập' },
  会见: { pinyin: 'huìjiàn', vi: 'gặp gỡ' },
  做完: { pinyin: 'zuò wán', vi: 'làm xong' },
  去: { pinyin: 'qù', vi: 'đi' },
  来: { pinyin: 'lái', vi: 'đến' },
  吃: { pinyin: 'chī', vi: 'ăn' },
  喝: { pinyin: 'hē', vi: 'uống' },
  看: { pinyin: 'kàn', vi: 'xem · đọc' },
  买: { pinyin: 'mǎi', vi: 'mua' },
  做: { pinyin: 'zuò', vi: 'làm' },
  写: { pinyin: 'xiě', vi: 'viết' },
  说: { pinyin: 'shuō', vi: 'nói' },
  听: { pinyin: 'tīng', vi: 'nghe' },
  读: { pinyin: 'dú', vi: 'đọc' },
  见: { pinyin: 'jiàn', vi: 'gặp' },
  用: { pinyin: 'yòng', vi: 'dùng' },
  快: { pinyin: 'kuài', vi: 'nhanh' },
  很: { pinyin: 'hěn', vi: 'rất' },
}
for (const [cn, entry] of Object.entries(SUPPLEMENT)) {
  if (!DICT.has(cn)) DICT.set(cn, entry)
}

/* ---------- tách từ & phiên âm ---------- */

export type Token = { cn: string; pinyin?: string; vi?: string }

const MAX_TOKEN = 4

export function segment(s: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < s.length) {
    let matched = false
    for (let len = Math.min(MAX_TOKEN, s.length - i); len >= 2; len--) {
      const sub = s.slice(i, i + len)
      const e = DICT.get(sub)
      if (e) {
        out.push({ cn: sub, pinyin: e.pinyin, vi: e.vi })
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      const ch = s[i]
      const e = DICT.get(ch)
      out.push(e ? { cn: ch, pinyin: e.pinyin, vi: e.vi } : { cn: ch })
      i += 1
    }
  }
  return out
}

export function glossSentence(s: string): Gloss | null {
  const tokens = segment(s)
  if (!tokens.length) return null
  const pinyin = tokens.map((t) => t.pinyin ?? t.cn).join(' ')
  const vi = tokens.every((t) => t.vi) ? tokens.map((t) => t.vi).join(' ') : null
  return { pinyin, vi }
}

/* ---------- tìm đoạn bị sửa (điểm sửa) ---------- */

function changedSpot(before: string, after: string): { a: string; b: string } | null {
  let i = 0
  while (i < before.length && i < after.length && before[i] === after[i]) i++
  let j = 0
  while (j < before.length - i && j < after.length - i && before[before.length - 1 - j] === after[after.length - 1 - j]) j++
  const a = before.slice(i, before.length - j)
  const b = after.slice(i, after.length - j)
  if (a === b) return null
  if (a.length + b.length > 20) return null
  return { a, b }
}

/* ---------- analyzer ---------- */

const endsQuestion = (s: string) =>
  /吗$|没(去|来|吃|喝|看|买|做|写|说|学|见|找)|什么|哪|谁|几|呢$/.test(s)

export function analyzeSentence(input: string): AnalysisResult {
  const trimmed = input.trim()
  if (!trimmed) return { raw: trimmed, issues: [] }

  const m = trimmed.match(/^(.*?)([。．.？！?!！~～]*)$/u)
  const core = m?.[1] ?? trimmed
  const tailPunct = m?.[2] ?? ''

  let cur = core
  const issues: MistakeIssue[] = []
  for (const p of ERROR_PATTERNS) {
    if (!p.test(cur)) continue
    const fixedCore = p.fix(cur)
    if (fixedCore === cur) continue
    const correctedCore = p.flip ? fixedCore.replace(/^我/, '你') : fixedCore
    const corrected = correctedCore + (endsQuestion(correctedCore) ? '？' : '。')
    issues.push({
      patternId: p.id,
      type: p.type,
      topic: p.topic,
      issue: p.issue,
      explain: p.explain,
      knowledge: p.knowledge,
      level: p.level,
      raw: trimmed,
      corrected,
      spot: changedSpot(core, fixedCore),
      gloss: glossSentence(correctedCore),
    })
    cur = fixedCore
  }
  return { raw: trimmed, issues }
}

/* ---------- kết luận quy luật ---------- */

export function buildConclusion(records: MistakeRecord[]): Conclusion {
  const open = records.filter((r) => !r.resolved)
  const counts = new Map<string, number>()
  for (const r of open) {
    for (const k of r.knowledge) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const stats: KnowledgeStat[] = [...counts.entries()]
    .map(([key, count]) => ({ key, count, pct: open.length ? Math.round((count / open.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))

  const byType = (Object.keys(TYPE_META) as MistakeType[]).map((type) => ({
    type,
    count: open.filter((r) => r.type === type).length,
  }))

  const top = stats[0] ?? null
  const strength: Conclusion['strength'] = top && top.count >= 3 && top.pct >= 40 ? 'rõ rệt' : 'cần chú ý'
  const second = stats[1] ? `, tiếp theo là ${stats[1].key} (${stats[1].count} lần)` : ''
  const headline = top
    ? top.key === '了'
      ? 'Bạn đang gặp vấn đề với cách sử dụng 了'
      : `Bạn đang gặp vấn đề với ${top.key}`
    : 'Chưa đủ dữ liệu để kết luận'
  const body = top
    ? `Trong ${open.length} lỗi gần đây, có ${top.count} lần liên quan đến ${top.key} (${top.pct}%)${second}. AI đã nối các lỗi rải rác thành một quy luật — thay vì sửa từng câu riêng lẻ, hãy tập trung chữa một điểm kiến thức.`
    : 'Hãy vào tab "Phân tích câu", viết vài câu tiếng Trung và lưu lỗi lại — sau vài bài, AI sẽ bắt đầu nhận ra quy luật sai của bạn.'

  return {
    total: records.length,
    open: open.length,
    stats,
    byType,
    top,
    strength,
    headline,
    body,
    advice: top ? (ADVICE_MAP[top.key] ?? 'Tiếp tục ghi nhận lỗi để AI tìm quy luật nhé!') : 'Chưa có lời khuyên nào.',
    drills: top ? (DRILLS[top.key] ?? DEFAULT_DRILLS) : DEFAULT_DRILLS,
  }
}

/* ---------- lưu trữ cá nhân (localStorage) ---------- */

const STORE_KEY = 'nkhn.mistakes.v1'

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function saveMistakes(records: MistakeRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(records))
  } catch {
    /* bỏ qua lỗi lưu trữ */
  }
}

/* 14 lỗi hạt giống đúng theo kịch bản demo: 7 了 · 4 lượng từ · 3 trật tự */
export function buildSeedRecords(): MistakeRecord[] {
  const out: MistakeRecord[] = []
  SEED_SENTENCES.forEach((seed, idx) => {
    const { issues } = analyzeSentence(seed.raw)
    const it = issues[0]
    if (!it) return
    out.push({
      id: `seed-${idx + 1}`,
      raw: it.raw,
      corrected: it.corrected,
      type: it.type,
      topic: it.topic,
      issue: it.issue,
      explain: it.explain,
      knowledge: it.knowledge,
      level: it.level,
      createdAt: Date.now() - seed.daysAgo * 86_400_000 - idx * 3_600_000,
      resolved: false,
      source: 'seed',
    })
  })
  return out
}

export function loadMistakes(): MistakeRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length >= 0) return parsed as MistakeRecord[]
    }
  } catch {
    /* dữ liệu hỏng → nạp lại seed */
  }
  const seeded = buildSeedRecords()
  saveMistakes(seeded)
  return seeded
}

/* ---------- tiện ích nhỏ ---------- */

export const normSearch = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')

export function knowledgeColor(key: string): string {
  if (key.includes('了')) return '#8b7fc4'
  if (key.includes('Lượng từ')) return '#f0b429'
  if (key.includes('两')) return '#7fae8f'
  if (key.includes('吗')) return '#e8737f'
  if (key.includes('Trật tự') || key.includes('在 +') || key.includes('SVO') || key.includes('给') || key.includes('都')) return '#6d93bd'
  if (key.includes('得')) return '#c2547e'
  if (key.includes('把')) return '#a05a3a'
  return '#b58fa0'
}

export function fmtDate(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export type { ErrorPattern }
