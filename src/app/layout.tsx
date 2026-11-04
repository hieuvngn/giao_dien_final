import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Fonts are self-hosted in public/fonts (see scripts/fetch_fonts.py).
// next/font/google was removed: Turbopack font cache broke the build
// ("next/font/google queries have exactly one entry").

export const metadata: Metadata = {
  title: "Nhật ký Hán ngữ – Lộ trình tiếng Trung: HSK 3.0 · YCT · Boya · Giáo trình Hán ngữ",
  description:
    "Lộ trình học tiếng Trung rõ ràng theo chuẩn HSK 3.0 (9 cấp độ), YCT cho thiếu nhi, giáo trình Boya Chinese và Giáo trình Hán ngữ 6 quyển.",
  keywords: [
    "học tiếng Trung",
    "HSK 3.0",
    "YCT",
    "Boya Chinese",
    "Giáo trình Hán ngữ",
    "lộ trình HSK",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <link
        rel="stylesheet"
        href="/fonts/fonts.css"
        precedence="default"
      />
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
