"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  FileDown,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import NoteEditor from "@/components/editor/NoteEditor";
import { exportToWord, exportToPdf, downloadBlob } from "@/lib/export-utils";
import toast from "react-hot-toast";
import styles from "./page.module.css";

export default function NoteDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data);
      } else {
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
        const found = local.find((n) => n.id === id);
        if (found) {
          setNote(found);
        } else {
          toast.error("笔记未找到");
          router.push("/notes");
        }
      }
    } catch {
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      const found = local.find((n) => n.id === id);
      if (found) setNote(found);
      else {
        toast.error("加载笔记失败");
        router.push("/notes");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newContent) => {
    if (!note) return;
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      // Also update localStorage
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      const idx = local.findIndex((n) => n.id === id);
      if (idx >= 0) {
        local[idx] = { ...local[idx], content: newContent, updated_at: new Date().toISOString() };
        localStorage.setItem("biji-notes", JSON.stringify(local));
      }

      setNote((prev) => ({ ...prev, content: newContent }));
      toast.success("已保存", { duration: 1500, icon: "✓" });
    } catch {
      toast.error("保存失败");
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条笔记吗？")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      localStorage.setItem("biji-notes", JSON.stringify(local.filter((n) => n.id !== id)));
      toast.success("笔记已删除");
      router.push("/notes");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleExportWord = async () => {
    if (!note) return;
    setExporting(true);
    try {
      const blob = await exportToWord(note.title, note.content);
      downloadBlob(blob, `${note.title || "笔记"}.docx`);
      toast.success("Word 文档已导出");
    } catch (err) {
      toast.error("导出失败: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (!note) return;
    try {
      // 使用 MarkdownRenderer 的逻辑将内容转为简单 HTML
      const htmlContent = note.content
        .replace(/### (.*)/g, "<h3>$1</h3>")
        .replace(/## (.*)/g, "<h2>$1</h2>")
        .replace(/# (.*)/g, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      exportToPdf(note.title, htmlContent);
    } catch (err) {
      toast.error("导出失败: " + err.message);
    }
  };

  const pageImages = note?.page_images || [];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push("/notes")}
            />
            <h1 className={styles.title}>{note.title || "无标题笔记"}</h1>
          </div>
          <div className={styles.headerRight}>
            {pageImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={showPreview ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "隐藏原图" : "显示原图"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<FileDown size={14} />}
              onClick={handleExportWord}
              loading={exporting}
            >
              Word
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExportPdf}
            >
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
              className={styles.deleteBtn}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={`${styles.content} ${!showPreview || pageImages.length === 0 ? styles.singleColumn : ""}`}>
        {/* Left: Original PDF Pages */}
        {showPreview && pageImages.length > 0 && (
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <span className={styles.previewLabel}>
                <FileText size={14} />
                原始笔记 ({previewPage + 1}/{pageImages.length})
              </span>
              <div className={styles.pageNav}>
                <button
                  className={styles.navBtn}
                  disabled={previewPage === 0}
                  onClick={() => setPreviewPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className={styles.navBtn}
                  disabled={previewPage >= pageImages.length - 1}
                  onClick={() => setPreviewPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className={styles.previewImage}>
              <img
                src={pageImages[previewPage]}
                alt={`第 ${previewPage + 1} 页`}
              />
            </div>
          </div>
        )}

        {/* Right: Editor */}
        <div className={styles.editorPanel}>
          <NoteEditor
            content={note.content}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
