'use client'

import { HeartDoodle } from './decor'

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t-2 border-dashed border-[#e7c9d4] bg-[var(--pastel-pink-soft)]/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--pastel-pink)] font-cn text-base text-[#8a4a63]">
            汉
          </span>
          <p className="font-display text-sm font-bold text-[#4f3d4a]">
            Nhật ký Hán ngữ
            <span className="ml-2 hidden text-xs font-semibold text-[#b58fa0] sm:inline">
              — học từng chữ, ghi từng trang
            </span>
          </p>
        </div>

        <nav aria-label="Liên kết chân trang" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-[#8d7484]">
          <a href="#/" className="hover:text-[#e8737f]">Trang chủ</a>
          <a href="#/review" className="hover:text-[#e8737f]">Ôn tập</a>
          <a href="#/exam" className="hover:text-[#e8737f]">Đề thi &amp; Luyện tập</a>
          <a href="#/leaderboard" className="hover:text-[#e8737f]">Bảng xếp hạng</a>
          <a href="#/dictionary" className="hover:text-[#e8737f]">Từ điển</a>
          <a href="#/radicals" className="hover:text-[#e8737f]">Bộ thủ</a>
          <a href="#/shadowing" className="hover:text-[#e8737f]">Shadowing</a>
          <a href="#/video" className="hover:text-[#e8737f]">AI Video</a>
          <a href="#/speaking" className="hover:text-[#e8737f]">Luyện nói</a>
          <a href="#/mistakes" className="hover:text-[#e8737f]">Sổ lỗi sai</a>
          <a href="#/twin" className="hover:text-[#e8737f]">Bản sao năng lực</a>
          <a href="#/create-file" className="hover:text-[#e8737f]">Tạo vở tập viết</a>
          <a href="#/writing" className="hover:text-[#e8737f]">Luyện viết</a>
          <a href="#/login" className="hover:text-[#e8737f]">Đăng nhập</a>
          <a href="#/admin" className="hover:text-[#e8737f]">Quản trị</a>
        </nav>

        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#b58fa0]">
          © 2026 Nhật ký Hán ngữ <HeartDoodle className="h-3.5 w-3.5" />
        </p>
      </div>
    </footer>
  )
}
