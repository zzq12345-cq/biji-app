import "./globals.css";
import "katex/dist/katex.min.css";
import ToastProvider from "@/components/ui/ToastProvider";

export const metadata = {
  title: "笔迹 — 智能课堂笔记识别整理",
  description:
    "将 iPad 手写课堂笔记通过 AI 自动识别文字和数学公式，整理为结构化的数字笔记",
  keywords: "OCR, 笔记, 手写识别, LaTeX, AI, 智能整理",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
