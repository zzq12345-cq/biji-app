"use client";

import { useRef, useCallback } from "react";
import { Download } from "lucide-react";
import styles from "./MindmapView.module.css";

export default function MindmapView({ data }) {
  const containerRef = useRef(null);

  const handleExport = useCallback(() => {
    if (!containerRef.current) return;
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(containerRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `思维导图-${data.title || "导出"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }).catch(() => {
      // html2canvas 未安装时使用简单文本导出
      const text = mindmapToText(data);
      const blob = new Blob([text], { type: "text/plain" });
      const link = document.createElement("a");
      link.download = `思维导图-${data.title || "导出"}.txt`;
      link.href = URL.createObjectURL(blob);
      link.click();
    });
  }, [data]);

  if (!data) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button className={styles.exportBtn} onClick={handleExport}>
          <Download size={14} />
          导出图片
        </button>
      </div>
      <div ref={containerRef} className={styles.container}>
        <h2 className={styles.rootTitle}>{data.title}</h2>
        {data.children && (
          <div className={styles.grid}>
            {data.children.map((branch, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={styles.cardTitle}>{branch.title}</h3>
                </div>
                {branch.children && (
                  <ul className={styles.list}>
                    {branch.children.map((item, j) => (
                      <li key={j} className={styles.item}>
                        <span className={styles.itemText}>{item.title}</span>
                        {item.children && item.children.length > 0 && (
                          <ul className={styles.subList}>
                            {item.children.map((sub, k) => (
                              <li key={k} className={styles.subItem}>{sub.title}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function mindmapToText(node, depth = 0) {
  const indent = "  ".repeat(depth);
  let text = `${indent}${depth === 0 ? "# " : "- "}${node.title}\n`;
  if (node.children) {
    for (const child of node.children) {
      text += mindmapToText(child, depth + 1);
    }
  }
  return text;
}
