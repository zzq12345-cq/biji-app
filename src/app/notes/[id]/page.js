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
  Brain,
  BookOpen,
  Tag,
  CheckCircle,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import NoteEditor from "@/components/editor/NoteEditor";
import MindmapView from "@/components/mindmap/MindmapView";
import { exportToWord, exportToPdf, downloadBlob } from "@/lib/export-utils";
import toast from "react-hot-toast";
import styles from "./page.module.css";

const SUBJECTS = [
  "高等数学", "线性代数", "概率统计", "大学物理",
  "计算机网络", "数据结构", "操作系统", "其他",
];

export default function NoteDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activePanel, setActivePanel] = useState("editor"); // editor | summary | mindmap
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [mindmap, setMindmap] = useState(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => { loadNote(); }, [id]);

  const loadNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        setNote(await res.json());
      } else {
        const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
        const found = local.find((n) => n.id === id);
        found ? setNote(found) : (toast.error("笔记未找到"), router.push("/notes"));
      }
    } catch {
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      const found = local.find((n) => n.id === id);
      found ? setNote(found) : (toast.error("加载失败"), router.push("/notes"));
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (updates) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      const idx = local.findIndex((n) => n.id === id);
      if (idx >= 0) {
        local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem("biji-notes", JSON.stringify(local));
      }
      setNote((prev) => ({ ...prev, ...updates }));
    } catch {
      toast.error("更新失败");
    }
  };

  const handleSave = (newContent) => updateNote({ content: newContent });

  const handleDelete = async () => {
    if (!confirm("确定要删除这条笔记吗？")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      localStorage.setItem("biji-notes", JSON.stringify(local.filter((n) => n.id !== id)));
      toast.success("笔记已删除");
      router.push("/notes");
    } catch { toast.error("删除失败"); }
  };

  const handleExportWord = async () => {
    if (!note) return;
    setExporting(true);
    try {
      const blob = await exportToWord(note.title, note.content);
      downloadBlob(blob, `${note.title || "笔记"}.docx`);
      toast.success("Word 文档已导出");
    } catch (err) { toast.error("导出失败: " + err.message); }
    finally { setExporting(false); }
  };

  const handleExportPdf = () => {
    if (!note) return;
    const htmlContent = note.content
      .replace(/### (.*)/g, "<h3>$1</h3>")
      .replace(/## (.*)/g, "<h2>$1</h2>")
      .replace(/# (.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
    exportToPdf(note.title, htmlContent);
  };

  // AI 摘要
  const handleSummary = async () => {
    if (!note?.content) return;
    setSummaryLoading(true);
    setActivePanel("summary");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note.content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      toast.success("摘要生成成功");
    } catch (err) {
      toast.error("摘要生成失败: " + err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  // AI 思维导图
  const handleMindmap = async () => {
    if (!note?.content) return;
    setMindmapLoading(true);
    setActivePanel("mindmap");
    try {
      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note.content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMindmap(data.mindmap);
      toast.success("思维导图生成成功");
    } catch (err) {
      toast.error("生成失败: " + err.message);
    } finally {
      setMindmapLoading(false);
    }
  };

  // 标记为已复习
  const handleMarkReviewed = async () => {
    const reviewCount = (note.review_count || 0) + 1;
    await updateNote({
      review_count: reviewCount,
      last_review: new Date().toISOString(),
    });
    toast.success(`已完成第 ${reviewCount} 次复习 ✓`);
  };

  // 添加标签
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const tags = [...(note.tags || [])];
    if (!tags.includes(tag)) {
      tags.push(tag);
      updateNote({ tags });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag) => {
    const tags = (note.tags || []).filter((t) => t !== tag);
    updateNote({ tags });
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
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => router.push("/notes")} />
            <h1 className={styles.title}>{note.title || "无标题笔记"}</h1>
          </div>
          <div className={styles.headerRight}>
            {/* Subject Picker */}
            <div className={styles.subjectPicker}>
              <button
                className={styles.subjectBtn}
                onClick={() => setShowSubjectPicker(!showSubjectPicker)}
              >
                <Tag size={13} />
                {note.subject || "选择科目"}
              </button>
              {showSubjectPicker && (
                <div className={styles.subjectDropdown}>
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      className={styles.subjectOption}
                      onClick={() => { updateNote({ subject: s }); setShowSubjectPicker(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" icon={<CheckCircle size={14} />} onClick={handleMarkReviewed}>
              复习打卡
            </Button>
            <Button variant="ghost" size="sm" icon={<BookOpen size={14} />} onClick={handleSummary} loading={summaryLoading}>
              摘要
            </Button>
            <Button variant="ghost" size="sm" icon={<Brain size={14} />} onClick={handleMindmap} loading={mindmapLoading}>
              导图
            </Button>
            <Button variant="secondary" size="sm" icon={<FileDown size={14} />} onClick={handleExportWord} loading={exporting}>
              Word
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportPdf}>
              PDF
            </Button>
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete} className={styles.deleteBtn} />
          </div>
        </div>
      </header>

      {/* Tags Bar */}
      <div className={styles.tagsBar}>
        {(note.tags || []).map((tag) => (
          <span key={tag} className={styles.tagChip}>
            {tag}
            <button onClick={() => handleRemoveTag(tag)} className={styles.tagRemove}>×</button>
          </span>
        ))}
        <input
          className={styles.tagInput}
          placeholder="添加标签..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
        />
      </div>

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
                <button className={styles.navBtn} disabled={previewPage === 0} onClick={() => setPreviewPage((p) => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <button className={styles.navBtn} disabled={previewPage >= pageImages.length - 1} onClick={() => setPreviewPage((p) => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className={styles.previewImage}>
              <img src={pageImages[previewPage]} alt={`第 ${previewPage + 1} 页`} />
            </div>
          </div>
        )}

        {/* Right: Editor / Summary / Mindmap */}
        <div className={styles.editorPanel}>
          {/* Panel Tabs */}
          <div className={styles.panelTabs}>
            <button
              className={`${styles.panelTab} ${activePanel === "editor" ? styles.panelTabActive : ""}`}
              onClick={() => setActivePanel("editor")}
            >
              编辑器
            </button>
            <button
              className={`${styles.panelTab} ${activePanel === "summary" ? styles.panelTabActive : ""}`}
              onClick={() => { setActivePanel("summary"); if (!summary) handleSummary(); }}
            >
              <Sparkles size={13} /> AI 摘要
            </button>
            <button
              className={`${styles.panelTab} ${activePanel === "mindmap" ? styles.panelTabActive : ""}`}
              onClick={() => { setActivePanel("mindmap"); if (!mindmap) handleMindmap(); }}
            >
              <Brain size={13} /> 思维导图
            </button>
          </div>

          {/* Panel Content */}
          {activePanel === "editor" && (
            <NoteEditor content={note.content} onSave={handleSave} />
          )}
          {activePanel === "summary" && (
            <div className={styles.summaryPanel}>
              {summaryLoading ? (
                <div className={styles.panelLoading}>
                  <div className={styles.loadingSpinner} />
                  <p>AI 正在生成摘要...</p>
                </div>
              ) : summary ? (
                <div className={styles.summaryContent}>
                  <h3>📝 笔记摘要</h3>
                  <p>{summary}</p>
                </div>
              ) : (
                <div className={styles.panelEmpty}>
                  <BookOpen size={32} strokeWidth={1} />
                  <p>点击"摘要"按钮生成 AI 摘要</p>
                </div>
              )}
            </div>
          )}
          {activePanel === "mindmap" && (
            <div className={styles.mindmapPanel}>
              {mindmapLoading ? (
                <div className={styles.panelLoading}>
                  <div className={styles.loadingSpinner} />
                  <p>AI 正在生成思维导图...</p>
                </div>
              ) : mindmap ? (
                <MindmapView data={mindmap} />
              ) : (
                <div className={styles.panelEmpty}>
                  <Brain size={32} strokeWidth={1} />
                  <p>点击"导图"按钮生成 AI 思维导图</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
