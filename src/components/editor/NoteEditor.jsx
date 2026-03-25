"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./NoteEditor.module.css";
import MarkdownRenderer from "./MarkdownRenderer";
import { Eye, Edit3, Save } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NoteEditor({
  content,
  onChange,
  onSave,
  readOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || "");
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setEditContent(content || "");
  }, [content]);

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
          <span className={styles.hint}>
            {isEditing ? "支持 Markdown 和 LaTeX 公式" : "点击「编辑」修改内容"}
          </span>
        </div>
      )}

      <div className={styles.content}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={editContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="在此输入笔记内容...&#10;&#10;支持 Markdown 格式：&#10;# 标题&#10;**加粗**&#10;$行内公式$&#10;$$独立公式$$"
            spellCheck={false}
          />
        ) : (
          <MarkdownRenderer content={editContent || content} />
        )}
      </div>
    </div>
  );
}
