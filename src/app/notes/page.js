"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Search,
  FileText,
  Calendar,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import toast from "react-hot-toast";
import styles from "./page.module.css";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      // 尝试从 API 获取
      const res = await fetch("/api/notes");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
      } else {
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
        setNotes(local);
      }
    } catch {
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      setNotes(local);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("确定要删除这条笔记吗？")) return;

    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      // Also remove from localStorage
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      localStorage.setItem(
        "biji-notes",
        JSON.stringify(local.filter((n) => n.id !== id))
      );
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("笔记已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredNotes = notes.filter(
    (n) =>
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.subject?.toLowerCase().includes(search.toLowerCase())
  );

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
              onClick={() => router.push("/")}
            />
            <div className={styles.brand}>
              <Sparkles size={20} className={styles.brandIcon} />
              <span className={styles.brandName}>我的笔记</span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => router.push("/")}
          >
            新建笔记
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索笔记标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`${styles.skeleton} skeleton`} />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={48} strokeWidth={1} />
            <h3>暂无笔记</h3>
            <p>上传 PDF 文件开始创建你的第一份笔记</p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push("/")}
            >
              创建笔记
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredNotes.map((note, i) => (
              <Card
                key={note.id}
                padding="none"
                hover
                animate
                className={styles.noteCard}
                onClick={() => router.push(`/notes/${note.id}`)}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <FileText size={18} className={styles.cardIcon} />
                    <h3 className={styles.cardTitle}>
                      {note.title || "无标题笔记"}
                    </h3>
                  </div>
                  {note.subject && (
                    <span className={styles.tag}>{note.subject}</span>
                  )}
                  <div className={styles.cardFooter}>
                    <span className={styles.date}>
                      <Calendar size={13} />
                      {formatDate(note.created_at)}
                    </span>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(note.id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
