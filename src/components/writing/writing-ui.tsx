'use client'

import type { ReactNode } from 'react'

/* Nút dùng chung cho khu Luyện viết (#/writing) */

export function Btn({
  onClick,
  children,
  variant = 'soft',
  disabled,
  title,
  className,
}: {
  onClick?: () => void
  children: ReactNode
  variant?: 'primary' | 'soft' | 'mint'
  disabled?: boolean
  title?: string
  className?: string
}) {
  const cls = {
    primary:
      'bg-[#d2495f] text-white shadow-[0_3px_0_0_#b23a4f] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none',
    mint:
      'bg-[#3f6b50] text-white shadow-[0_3px_0_0_#33553f] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none',
    soft: 'bg-white/70 text-[#6f5a68] ring-1 ring-[#ead9cd] hover:-translate-y-0.5 hover:bg-white',
  }[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${cls} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function LoadingNote({ text = 'Đang tải dữ liệu nét chữ…' }: { text?: string }) {
  return (
    <div className="paper-scrap grid place-items-center rounded-3xl p-10 text-center">
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--pastel-pink)] opacity-40" aria-hidden="true" />
        <span className="font-cn relative text-xl text-[#c2547e]" aria-hidden="true">
          写
        </span>
      </span>
      <p className="mt-3 text-xs font-bold text-[#8d7484]">{text}</p>
    </div>
  )
}

export function NoDataNote({ ch }: { ch: string }) {
  return (
    <div className="paper-scrap grid place-items-center rounded-3xl p-10 text-center">
      <span className="font-cn text-4xl text-[#d2495f]" aria-hidden="true">
        {ch}
      </span>
      <p className="mt-3 max-w-xs text-xs font-semibold leading-relaxed text-[#8d7484]">
        Chưa tải được dữ liệu nét chữ của ký tự này. Hãy chọn một chữ khác trong danh sách bên cạnh nhé!
      </p>
    </div>
  )
}
