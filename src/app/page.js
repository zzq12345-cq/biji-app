"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, ArrowRight, Zap, FileOutput, Cloud } from "lucide-react";
import DropZone from "@/components/upload/DropZone";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Loading";
import toast from "react-hot-toast";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ step: "", percent: 0 });

  const handleRecognize = async () => {
    if (files.length === 0) {
      toast.error("请先上传 PDF 文件");
      return;
    }

    setProcessing(true);

    try {
      // 动态导入 PDF 工具（避免 SSR 问题）
      const { pdfToImages } = await import("@/lib/pdf-utils");

      // Step 1: PDF 转图片
      setProgress({ step: "正在解析 PDF 文件...", percent: 10 });
      const allImages = [];

      for (let i = 0; i < files.length; i++) {
        const fileImages = await pdfToImages(files[i], (current, total) => {
          const fileProgress = (i / files.length) * 40 + (current / total) * (40 / files.length);
          setProgress({
            step: `正在解析第 ${i + 1} 个文件 (${current}/${total} 页)...`,
            percent: 10 + fileProgress,
          });
        });
        allImages.push(...fileImages);
      }

      // Step 2: 调用 AI 识别
      setProgress({ step: "AI 正在识别文字和公式...", percent: 55 });

      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: allImages }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "识别失败");
      }

      setProgress({ step: "正在整理内容...", percent: 80 });
      const result = await response.json();

      // Step 3: 保存笔记
      setProgress({ step: "正在保存笔记...", percent: 90 });

      const saveRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          content: result.content,
          raw_text: result.rawText,
          page_images: allImages.slice(0, 5), // 只保存前5页预览
        }),
      });

      const savedNote = await saveRes.json();

      setProgress({ step: "完成！", percent: 100 });
      toast.success("笔记识别完成！");

      // 如果是 localStorage 模式，直接跳转带着数据
      if (savedNote._storage === "local") {
        // 存到 localStorage
        const notes = JSON.parse(localStorage.getItem("biji-notes") || "[]");
        notes.unshift(savedNote);
        localStorage.setItem("biji-notes", JSON.stringify(notes));
      }

      setTimeout(() => {
        router.push(`/notes/${savedNote.id}`);
      }, 500);
    } catch (error) {
      console.error("识别失败:", error);
      toast.error(error.message || "识别过程中发生错误");
    } finally {
      setProcessing(false);
      setProgress({ step: "", percent: 0 });
    }
  };

  const features = [
    {
      icon: <Zap size={22} />,
      title: "AI 智能识别",
      desc: "GLM-4V 精准识别手写文字和数学公式",
    },
    {
      icon: <Sparkles size={22} />,
      title: "自动整理",
      desc: "AI 自动纠错、排版优化、重点标注",
    },
    {
      icon: <FileOutput size={22} />,
      title: "多格式导出",
      desc: "一键导出为 Word 或 PDF 文档",
    },
    {
      icon: <Cloud size={22} />,
      title: "云端同步",
      desc: "笔记自动保存到云端，随处访问",
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <Sparkles size={24} className={styles.brandIcon} />
            <span className={styles.brandName}>笔迹</span>
          </div>
          <nav className={styles.nav}>
            <Button
              variant="ghost"
              size="sm"
              icon={<BookOpen size={16} />}
              onClick={() => router.push("/notes")}
            >
              我的笔记
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroTag}>
            <Sparkles size={14} />
            <span>AI 驱动的智能笔记助手</span>
          </div>
          <h1 className={styles.heroTitle}>
            让手写笔记
            <br />
            <span className={styles.gradient}>焕然"一"新</span>
          </h1>
          <p className={styles.heroDesc}>
            上传 iPad 手写笔记 PDF，AI 自动识别文字和数学公式，
            整理为清晰的数字化笔记
          </p>
        </section>

        {/* Upload Section */}
        <section className={styles.uploadSection}>
          <Card padding="lg" className={styles.uploadCard}>
            <DropZone files={files} setFiles={setFiles} />

            {processing && (
              <div className={styles.progressArea}>
                <ProgressBar
                  progress={progress.percent}
                  text={progress.step}
                />
              </div>
            )}

            <div className={styles.uploadActions}>
              <Button
                variant="primary"
                size="lg"
                icon={<Sparkles size={18} />}
                onClick={handleRecognize}
                loading={processing}
                disabled={files.length === 0}
                fullWidth
              >
                {processing ? "识别中..." : "开始智能识别"}
              </Button>
            </div>
          </Card>
        </section>

        {/* Features */}
        <section className={styles.features}>
          {features.map((f, i) => (
            <Card key={i} padding="md" hover className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </Card>
          ))}
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <Button
            variant="secondary"
            size="lg"
            icon={<BookOpen size={18} />}
            onClick={() => router.push("/notes")}
          >
            查看我的笔记
            <ArrowRight size={16} style={{ marginLeft: 4 }} />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>笔迹 — 智能课堂笔记识别整理系统</p>
      </footer>
    </div>
  );
}
