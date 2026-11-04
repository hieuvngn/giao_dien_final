'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { PushPin, WashiTape } from '../landing/decor'
import { findRoadmapLevel } from '@/data/roadmap'

/* ============================================================
   AppShell — header tối giản (logo · thông báo · tài khoản)
   + sidebar dọc đóng/mở (đóng = còn 1 icon nhỏ để mở lại)
   ============================================================ */

type NavItem = { href: string; char: string; label: string; kind: 'route' | 'anchor' }

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Bắt đầu',
    items: [{ href: '#/', char: '首', label: 'Trang chủ', kind: 'route' }],
  },
  {
    title: 'Lộ trình học',
    items: [
      { href: '#hsk', char: '考', label: 'HSK 3.0', kind: 'anchor' },
      { href: '#yct', char: '童', label: 'YCT', kind: 'anchor' },
      { href: '#boya', char: '博', label: 'Boya Chinese', kind: 'anchor' },
      { href: '#hanyu', char: '教', label: 'Giáo trình Hán ngữ', kind: 'anchor' },
    ],
  },
  {
    title: 'Học tập',
    items: [
      { href: '#/review', char: '复', label: 'Ôn tập & Thống kê', kind: 'route' },
      { href: '#/exam', char: '试', label: 'Đề thi & Luyện tập', kind: 'route' },
      { href: '#/leaderboard', char: '榜', label: 'Bảng xếp hạng', kind: 'route' },
      { href: '#/speaking', char: '说', label: 'Luyện nói cùng AI', kind: 'route' },
      { href: '#/mistakes', char: '错', label: 'Sổ lỗi sai AI', kind: 'route' },
      { href: '#/twin', char: '镜', label: 'Bản sao năng lực', kind: 'route' },
    ],
  },
  {
    title: 'Công cụ',
    items: [
      { href: '#/shadowing', char: '听', label: 'Shadowing', kind: 'route' },
      { href: '#/video', char: '影', label: 'AI Video Learning', kind: 'route' },
      { href: '#/create-file', char: '写', label: 'Tạo vở tập viết', kind: 'route' },
      { href: '#/writing', char: '笔', label: 'Luyện viết chữ Hán', kind: 'route' },
      { href: '#/dictionary', char: '词', label: 'Tra cứu từ điển', kind: 'route' },
      { href: '#/radicals', char: '部', label: 'Bộ thủ', kind: 'route' },
    ],
  },
]

const NOTIFICATIONS = [
  { emoji: '🎉', text: 'Bài “Xin chào!” vừa được thêm vào HSK 1', time: 'Vừa xong' },
  { emoji: '✏️', text: 'Tạo vở tập viết: thêm mẫu giấy 米字格', time: '2 giờ trước' },
  { emoji: '🔊', text: 'Chế độ “Nghe ghép câu” đang được thử nghiệm', time: 'Hôm qua' },
]

const SIDEBAR_KEY = 'nkhn.sidebar'

/* Theo dõi section lộ trình đang xem trên trang chủ */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState('top')

  useEffect(() => {
    if (!enabled) return
    const ids = ['hsk', 'yct', 'boya', 'hanyu']

    const compute = () => {
      if (window.scrollY < 180) {
        setActive('top')
        return
      }
      const line = window.innerHeight * 0.35
      let current = 'top'
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }

    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [enabled])

  return active
}

function isActiveItem(item: NavItem, route: string, activeSection: string): boolean {
  if (item.kind === 'route') {
    const path = item.href.slice(1)
    return path === '/' ? route === '/' || route === '' : route.startsWith(path)
  }
  const id = item.href.slice(1)
  if (route === '/' || route === '') return activeSection === id
  // đang ở trang chi tiết lộ trình/bài học → tô sáng nhóm tương ứng
  if (route.startsWith('/roadmap/') || route.startsWith('/lesson/')) {
    const slug = route.split('/')[2]
    const level = findRoadmapLevel(slug)
    return level?.group === id
  }
  return false
}

/* ================= Dropdown dùng chung ================= */
/* Lưu ý: tạo ref trực tiếp trong component (không trả ref qua custom hook)
   để tương thích với quy tắc react-compiler (không truy cập ref khi render). */

/* ================= Header ================= */

function AppHeader({
  onToggleSidebar,
}: {
  route: string
  onToggleSidebar: () => void
}) {
  const { toast } = useToast()
  const [openMenu, setOpenMenu] = useState<'notif' | 'account' | null>(null)
  const notifRef = useRef<HTMLDivElement | null>(null)
  const accountRef = useRef<HTMLDivElement | null>(null)

  /* đóng dropdown khi bấm ra ngoài / nhấn Escape */
  useEffect(() => {
    if (!openMenu) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (notifRef.current?.contains(t) || accountRef.current?.contains(t)) return
      setOpenMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  const notifOpen = openMenu === 'notif'
  const accountOpen = openMenu === 'account'

  return (
    <header className="fixed inset-x-0 top-0 z-50 print:hidden">
      <div className="relative border-b border-dashed border-[#e7c9d4] bg-[#fffdf6]/90 shadow-[0_2px_10px_rgba(93,74,87,0.06)] backdrop-blur">
        <WashiTape color="var(--pastel-mint)" pattern="dots" rotate={-4} className="-bottom-2 left-10 z-10 hidden h-4 w-16 sm:block" />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-5">
          <div className="flex items-center gap-2">
            {/* mở / thu gọn sidebar (desktop) */}
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Mở hoặc thu gọn menu"
              className="hidden h-9 w-9 place-items-center rounded-xl text-[#8d7484] transition-colors hover:bg-[var(--pastel-butter)]/60 hover:text-[#4f3d4a] lg:grid"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>

            {/* Logo */}
            <a href="#/" className="group flex items-center gap-2.5" aria-label="Nhật ký Hán ngữ – về trang chủ">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-[var(--pastel-pink)] font-cn text-xl text-[#8a4a63] shadow-inner transition-transform duration-300 group-hover:-rotate-6">
                汉
                <PushPin color="#e8737f" className="absolute -right-1 -top-1.5 scale-[0.55]" />
              </span>
              <span className="font-display text-lg font-bold leading-none text-[#4f3d4a]">
                Nhật ký
                <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#b58fa0]">Hán ngữ</span>
              </span>
            </a>
          </div>

          {/* phải: thông báo + tài khoản */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* --- thông báo --- */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setOpenMenu(notifOpen ? null : 'notif')}
                aria-label="Thông báo"
                aria-expanded={notifOpen}
                className={`relative grid h-10 w-10 place-items-center rounded-full text-[#8d7484] transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-butter)]/60 hover:text-[#4f3d4a] ${
                  notifOpen ? 'bg-[var(--pastel-butter)]/80 text-[#4f3d4a]' : ''
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e8737f] ring-2 ring-[#fffdf6]" />
              </button>

              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="paper-scrap absolute right-0 top-12 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl p-3"
                  role="dialog"
                  aria-label="Danh sách thông báo"
                >
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="font-display text-sm font-bold text-[#4f3d4a]">Thông báo</p>
                    <span className="rounded-full bg-[var(--pastel-pink)] px-2 py-0.5 text-[10px] font-bold text-[#8a4a63]">3 mới</span>
                  </div>
                  <ul className="space-y-1">
                    {NOTIFICATIONS.map((n) => (
                      <li key={n.text}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu(null)
                            toast({ title: 'Đã đánh dấu đã đọc 💌' })
                          }}
                          className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--cream)]"
                        >
                          <span className="text-lg leading-none" aria-hidden="true">{n.emoji}</span>
                          <span className="flex-1">
                            <span className="block text-xs font-semibold leading-snug text-[#5d4a57]">{n.text}</span>
                            <span className="mt-0.5 block text-[10px] font-bold text-[#b58fa0]">{n.time}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* --- tài khoản --- */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setOpenMenu(accountOpen ? null : 'account')}
                aria-label="Tài khoản"
                aria-expanded={accountOpen}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-all hover:-translate-y-0.5 hover:bg-[var(--pastel-butter)]/60 ${
                  accountOpen ? 'bg-[var(--pastel-butter)]/80' : ''
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--pastel-lilac)] text-lg shadow-inner" aria-hidden="true">
                  🐼
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold leading-none text-[#4f3d4a]">Học viên</span>
                  <span className="block text-[10px] font-semibold leading-none text-[#b58fa0]">HSK 1 · 加油</span>
                </span>
                <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-[#b58fa0] transition-transform ${accountOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="paper-scrap absolute right-0 top-12 w-60 rounded-2xl p-2"
                  role="dialog"
                  aria-label="Menu tài khoản"
                >
                  <div className="flex items-center gap-2.5 rounded-xl bg-[var(--cream)] px-3 py-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--pastel-lilac)] text-lg" aria-hidden="true">🐼</span>
                    <span>
                      <span className="block text-xs font-bold text-[#4f3d4a]">Học viên Nhật ký</span>
                      <span className="block text-[10px] font-semibold text-[#b58fa0]">hocvien@nhatkyhanngu.vn</span>
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {[
                      { icon: '🔐', label: 'Đăng nhập / Đăng ký', href: '#/login' },
                      { icon: '👩‍🎓', label: 'Hồ sơ của tôi', href: '#/profile' },
                      { icon: '🃏', label: 'Bộ thẻ của tôi', href: '#/my-decks' },
                      { icon: '🏅', label: 'Thành tựu', href: '#/achievements' },
                      { icon: '⚙️', label: 'Cài đặt học tập', href: '#/profile' },
                      { icon: '🛡️', label: 'Trang quản trị', href: '#/admin' },
                    ].map((m) => (
                      <li key={m.label}>
                        <a
                          href={m.href}
                          onClick={() => setOpenMenu(null)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#6f5a68] transition-colors hover:bg-[var(--pastel-butter)]/50 hover:text-[#4f3d4a]"
                        >
                          <span aria-hidden="true">{m.icon}</span>
                          {m.label}
                        </a>
                      </li>
                    ))}
                    <li className="border-t border-dashed border-[#ead9cd] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(null)
                          toast({ title: '👋 Hẹn gặp lại!', description: 'Đăng xuất thành công (demo).' })
                          window.location.hash = '#/login'
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#c2547e] transition-colors hover:bg-[var(--pastel-pink-soft)]"
                      >
                        <span aria-hidden="true">🚪</span>
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ================= Sidebar ================= */

function SidebarBody({
  route,
  onNavigate,
}: {
  route: string
  onNavigate?: () => void
}) {
  const activeSection = useActiveSection(route === '/' || route === '')

  return (
    <nav aria-label="Menu chính" className="custom-scroll flex h-full flex-col gap-4 overflow-y-auto px-3 pb-4 pt-4">
      {NAV_SECTIONS.map((sec) => (
        <div key={sec.title}>
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a2b3]">{sec.title}</p>
          <ul className="space-y-0.5">
            {sec.items.map((item) => {
              const active = isActiveItem(item, route, activeSection)
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    title={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-200 ${
                      active
                        ? 'bg-[var(--pastel-pink)] text-[#8a4a63] shadow-sm ring-1 ring-[#f3c4d3]'
                        : 'text-[#6f5a68] hover:translate-x-0.5 hover:bg-[var(--pastel-butter)]/50 hover:text-[#4f3d4a]'
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-cn text-sm shadow-sm ${
                        active ? 'bg-white/80 text-[#8a4a63]' : 'bg-[var(--cream)] text-[#8d7484] ring-1 ring-[#ead9cd]'
                      }`}
                      aria-hidden="true"
                    >
                      {item.char}
                    </span>
                    <span className="truncate text-[13px] font-bold">{item.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {/* ghi chú động viên */}
      <div className="mt-auto">
        <div className="relative rounded-2xl bg-[var(--pastel-butter)]/50 p-3 text-center ring-1 ring-[#f2e2b8]">
          <PushPin color="#f0b429" className="absolute -top-2 left-1/2 -translate-x-1/2" />
          <p className="font-cn text-2xl leading-none text-[#c2547e]">加油</p>
          <p className="mt-1 text-[10px] font-bold leading-snug text-[#8a6a1f]">Học mỗi ngày một chút nhé!</p>
        </div>
      </div>
    </nav>
  )
}

/* ================= Shell ================= */

export default function AppShell({
  route,
  children,
}: {
  route: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Đọc localStorage sau mount để tránh lệch render phía máy chủ (SSR)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(() => {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved === 'open' || saved === 'closed') return saved === 'open'
      return window.innerWidth >= 1024
    })
    setReady(true)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const toggle = () => {
    setOpen((v) => {
      localStorage.setItem(SIDEBAR_KEY, v ? 'closed' : 'open')
      return !v
    })
  }

  const closeMobile = () => {
    if (window.innerWidth < 1024) setOpen(false)
  }

  const showFloatIcon = ready && !open

  return (
    <div className="min-h-screen bg-[#fff6e9]">
      <AppHeader route={route} onToggleSidebar={toggle} />

      {/* backdrop cho mobile */}
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-[#5d4a57]/25 backdrop-blur-[2px] print:hidden lg:hidden"
        />
      )}

      {/* sidebar dọc */}
      <aside
        aria-label="Sidebar điều hướng"
        className={`fixed bottom-0 left-0 top-16 z-40 w-64 border-r-2 border-dashed border-[#e7c9d4] bg-[#fffdf6] transition-transform duration-300 ease-out print:hidden ${
          open ? 'translate-x-0 shadow-[6px_0_24px_rgba(93,74,87,0.08)]' : '-translate-x-full'
        }`}
      >
        <SidebarBody route={route} onNavigate={closeMobile} />

        {/* nút thu gọn */}
        <button
          type="button"
          onClick={toggle}
          className="absolute -right-4 top-6 grid h-8 w-8 place-items-center rounded-full border-2 border-dashed border-[#e7c9d4] bg-[#fffdf6] text-[#8d7484] shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#e8737f]"
          aria-label="Thu gọn menu"
          title="Thu gọn menu"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </aside>

      {/* icon nhỏ mở lại khi đã đóng */}
      {showFloatIcon && (
        <motion.button
          type="button"
          onClick={toggle}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="paper-scrap fixed left-3 top-20 z-40 grid h-11 w-11 place-items-center rounded-2xl print:hidden"
          aria-label="Mở menu"
          title="Mở menu"
        >
          <WashiTape color="var(--pastel-sky)" pattern="dots" rotate={-10} className="-top-2 left-1/2 h-3.5 w-8 -translate-x-1/2" />
          <span className="font-cn text-lg leading-none text-[#8a4a63]" aria-hidden="true">目</span>
        </motion.button>
      )}

      {/* nội dung */}
      <div className={`transition-[padding] duration-300 ease-out ${open ? 'lg:pl-64' : ''}`}>
        {children}
      </div>
    </div>
  )
}
