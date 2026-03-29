"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Search,
  FileText,
  Calendar,
  Trash2,
  ArrowLeft,
  Tag,
  Filter,
  Bell,
  Clock,
  BarChart3,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LearningCalendar from "@/components/calendar/LearningCalendar";
import toast from "react-hot-toast";
import styles from "./page.module.css";

// 预设科目列表
const SUBJECTS = [
  "全部",
  "高等数学",
  "线性代数",
  "概率统计",
  "大学物理",
  "计算机网络",
  "数据结构",
  "操作系统",
  "其他",
];

// 艾宾浩斯遗忘曲线：推荐复习间隔（天）
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

function getReviewStatus(note) {
  if (!note.created_at) return null;
  const created = new Date(note.created_at);
  const lastReview = note.last_review ? new Date(note.last_review) : created;
  const reviewCount = note.review_count || 0;
  const now = new Date();

  if (reviewCount >= REVIEW_INTERVALS.length) return { status: "done", label: "已掌握" };

  const nextInterval = REVIEW_INTERVALS[reviewCount];
  const nextReviewDate = new Date(lastReview.getTime() + nextInterval * 86400000);
  const daysUntil = Math.ceil((nextReviewDate - now) / 86400000);

  if (daysUntil <= 0) return { status: "due", label: "需要复习", days: 0 };
  if (daysUntil <= 1) return { status: "soon", label: `明天复习`, days: daysUntil };
  return { status: "ok", label: `${daysUntil}天后复习`, days: daysUntil };
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("全部");
  const [showReviewOnly, setShowReviewOnly] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const sentinelRef = useRef(null);

  useEffect(() => {
    loadNotes();
  }, []);

  // 懒加载：滚动到底部自动加载更多
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => prev + 20);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [notes]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
      } else {
        const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
        setNotes(local);
      }
    } catch {
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
      const local = JSON.parse(localStorage.getItem("biji-notes") || "[]");
      localStorage.setItem("biji-notes", JSON.stringify(local.filter((n) => n.id !== id)));
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("笔记已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 收集所有科目（包含自定义的）
  const allSubjects = useMemo(() => {
    const customSubjects = notes
      .map((n) => n.subject)
      .filter((s) => s && !SUBJECTS.includes(s));
    return [...SUBJECTS, ...new Set(customSubjects)];
  }, [notes]);

  // 过滤笔记
  const filteredNotes = useMemo(() => {
    let result = notes;

    // 科目筛选
    if (selectedSubject !== "全部") {
      result = result.filter((n) => n.subject === selectedSubject);
    }

    // 搜索（标题 + 内容全文搜索）
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.subject?.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 复习提醒筛选
    if (showReviewOnly) {
      result = result.filter((n) => {
        const review = getReviewStatus(n);
        return review && (review.status === "due" || review.status === "soon");
      });
    }

    return result;
  }, [notes, search, selectedSubject, showReviewOnly]);

  // 需要复习的笔记数量
  const reviewCount = useMemo(() => {
    return notes.filter((n) => {
      const review = getReviewStatus(n);
      return review && review.status === "due";
    }).length;
  }, [notes]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => router.push("/")} />
            <div className={styles.brand}>
              <Sparkles size={20} className={styles.brandIcon} />
              <span className={styles.brandName}>我的笔记</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            {reviewCount > 0 && (
              <button
                className={`${styles.reviewBadge} ${showReviewOnly ? styles.reviewBadgeActive : ""}`}
                onClick={() => setShowReviewOnly(!showReviewOnly)}
              >
                <Bell size={14} />
                <span>{reviewCount} 条待复习</span>
              </button>
            )}
            <ThemeToggle />
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => router.push("/")}>
              新建笔记
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Learning Calendar */}
        <LearningCalendar notes={notes} />

        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索笔记标题、内容或标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Subject Filter Tabs */}
        <div className={styles.subjectTabs}>
          {allSubjects.map((subject) => (
            <button
              key={subject}
              className={`${styles.subjectTab} ${selectedSubject === subject ? styles.subjectTabActive : ""}`}
              onClick={() => setSelectedSubject(subject)}
            >
              {subject === "全部" && <Filter size={13} />}
              {subject}
            </button>
          ))}
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
            <h3>{showReviewOnly ? "暂无待复习笔记" : "暂无笔记"}</h3>
            <p>{showReviewOnly ? "所有笔记都已复习完毕 🎉" : "上传 PDF 文件开始创建你的第一份笔记"}</p>
            {!showReviewOnly && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push("/")}>
                创建笔记
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredNotes.slice(0, displayCount).map((note, i) => {
              const review = getReviewStatus(note);
              return (
                <Card
                  key={note.id}
                  padding="none"
                  hover
                  animate
                  className={`${styles.noteCard} ${review?.status === "due" ? styles.noteCardDue : ""}`}
                  onClick={() => router.push(`/notes/${note.id}`)}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      <FileText size={18} className={styles.cardIcon} />
                      <h3 className={styles.cardTitle}>{note.title || "无标题笔记"}</h3>
                    </div>

                    {/* Tags Row */}
                    <div className={styles.tagRow}>
                      {note.subject && <span className={styles.subjectTag}>{note.subject}</span>}
                      {note.tags?.slice(0, 3).map((tag, j) => (
                        <span key={j} className={styles.tag}>
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Preview */}
                    {note.content && (
                      <p className={styles.preview}>
                        {note.content.replace(/[#*$\\]/g, "").slice(0, 80)}...
                      </p>
                    )}

                    <div className={styles.cardFooter}>
                      <span className={styles.date}>
                        <Calendar size={13} />
                        {formatDate(note.created_at)}
                      </span>
                      <div className={styles.cardActions}>
                        {review && review.status !== "done" && (
                          <span className={`${styles.reviewLabel} ${styles[`review_${review.status}`]}`}>
                            <Clock size={12} />
                            {review.label}
                          </span>
                        )}
                        <button className={styles.deleteBtn} onClick={(e) => handleDelete(note.id, e)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {displayCount < filteredNotes.length && (
              <div ref={sentinelRef} style={{ height: 1 }} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
