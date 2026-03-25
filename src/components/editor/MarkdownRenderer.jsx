"use client";

import { useMemo } from "react";
import katex from "katex";
import styles from "./MarkdownRenderer.module.css";

/**
 * 将 Markdown + LaTeX 混合内容渲染为 HTML
 */
export default function MarkdownRenderer({ content, className = "" }) {
  const html = useMemo(() => {
    if (!content) return "";
    return renderMarkdownWithLatex(content);
  }, [content]);

  return (
    <div
      className={`${styles.markdown} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdownWithLatex(text) {
  // Step 1: 先处理 LaTeX 块级公式 $$...$$
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
    try {
      return `<div class="katex-display-wrapper">${katex.renderToString(
        latex.trim(),
        { displayMode: true, throwOnError: false }
      )}</div>`;
    } catch {
      return `<div class="katex-error">$$${latex}$$</div>`;
    }
  });

  // Step 2: 处理行内公式 $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<span class="katex-error">$${latex}$</span>`;
    }
  });

  // Step 3: 处理 Markdown
  const lines = result.split("\n");
  const htmlLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 保留已渲染的 KaTeX（包含 HTML 标签的行）
    if (line.includes("katex-display-wrapper")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      htmlLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    // 空行
    if (!trimmed) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<h1>${inlineFormat(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push("<hr />");
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (olMatch) {
      if (!inList) {
        htmlLines.push("<ol>");
        inList = true;
      }
      htmlLines.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // Paragraph
    if (inList) { htmlLines.push("</ul>"); inList = false; }
    htmlLines.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  if (inList) htmlLines.push("</ul>");
  return htmlLines.join("\n");
}

function inlineFormat(text) {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");
  // Code: `text`
  text = text.replace(/`([^`]+?)`/g, "<code>$1</code>");
  // Highlight: ==text==
  text = text.replace(/==(.+?)==/g, "<mark>$1</mark>");
  return text;
}
