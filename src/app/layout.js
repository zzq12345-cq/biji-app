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
    <html lang="zh-CN">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
