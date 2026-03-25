"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import styles from "./NoteEditor.module.css";
import MarkdownRenderer from "./MarkdownRenderer";
import { Eye, Edit3, Save, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

const LINES_PER_PAGE = 40; // 预览模式每页行数

export default function NoteEditor({
  content,
  onChange,
  onSave,
  readOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || "");
  const [currentPage, setCurrentPage] = useState(0);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    setEditContent(content || "");
    setCurrentPage(0);
  }, [content]);

  // 按行分页
  const pages = useMemo(() => {
    const text = editContent || content || "";
    const lines = text.split("\n");
    const pageList = [];
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
      pageList.push(lines.slice(i, i + LINES_PER_PAGE).join("\n"));
    }
    return pageList.length > 0 ? pageList : [""];
  }, [editContent, content]);

  const totalPages = pages.length;

  // 自动保存 (3秒防抖)
  const autoSave = useCallback(
    (newContent) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (onSave) onSave(newContent);
      }, 3000);
    },
    [onSave]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setEditContent(val);
    if (onChange) onChange(val);
    autoSave(val);
  };

  const handleToggleEdit = () => {
    if (isEditing && onSave) {
      onSave(editContent);
    }
    setIsEditing(!isEditing);
  };

  const handleManualSave = () => {
    if (onSave) onSave(editContent);
  };

  // Tab key support
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newVal =
        editContent.substring(0, start) + "  " + editContent.substring(end);
      setEditContent(newVal);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const goPage = (page) => {
    setCurrentPage(page);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  return (
    <div className={styles.editor}>
      {!readOnly && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Button
              variant={isEditing ? "primary" : "secondary"}
              size="sm"
              icon={isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
              onClick={handleToggleEdit}
            >
              {isEditing ? "预览" : "编辑"}
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Save size={14} />}
                onClick={handleManualSave}
              >
                保存
              </Button>
            )}
          </div>
          {/* 翻页控制 */}
          {!isEditing && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={currentPage === 0}
                onClick={() => goPage(currentPage - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.pageInfo}>
                {currentPage + 1} / {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={currentPage >= totalPages - 1}
                onClick={() => goPage(currentPage + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          <span className={styles.hint}>
            {isEditing ? "支持 Markdown 和 LaTeX 公式" : "点击「编辑」修改内容"}
          </span>
        </div>
      )}

      <div className={styles.content} ref={contentRef}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={editContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={"在此输入笔记内容...\n\n支持 Markdown 格式：\n# 标题\n**加粗**\n$行内公式$\n$$独立公式$$"}
            spellCheck={false}
          />
        ) : (
          <>
            <MarkdownRenderer content={pages[currentPage]} />
            {/* 底部翻页 */}
            {totalPages > 1 && (
              <div className={styles.bottomPagination}>
                <button
                  disabled={currentPage === 0}
                  onClick={() => goPage(currentPage - 1)}
                >
                  ← 上一页
                </button>
                <span>第 {currentPage + 1} / {totalPages} 页</span>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => goPage(currentPage + 1)}
                >
                  下一页 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
