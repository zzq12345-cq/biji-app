"use client";

import { useMemo } from "react";
import katex from "katex";
import DOMPurify from "dompurify";
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
  // Step 1: 保护 LaTeX 块，避免被 Markdown 解析破坏
  const latexBlocks = [];

  // 块级公式 $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
    const id = `%%LATEX_BLOCK_${latexBlocks.length}%%`;
    try {
      latexBlocks.push(
        `<div class="${styles.katexBlock}">${katex.renderToString(
          latex.trim(),
          { displayMode: true, throwOnError: false }
        )}</div>`
      );
    } catch {
      latexBlocks.push(`<div class="${styles.katexError}">$$${latex}$$</div>`);
    }
    return id;
  });

  // 行内公式 $...$
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, latex) => {
    const id = `%%LATEX_INLINE_${latexBlocks.length}%%`;
    try {
      latexBlocks.push(
        katex.renderToString(latex.trim(), {
          displayMode: false,
          throwOnError: false,
        })
      );
    } catch {
      latexBlocks.push(`<span class="${styles.katexError}">$${latex}$</span>`);
    }
    return id;
  });

  // Step 2: 处理 Markdown 逐行解析
  const lines = text.split("\n");
  const htmlLines = [];
  let listStack = []; // 用栈来追踪列表嵌套

  function closeAllLists() {
    while (listStack.length > 0) {
      const tag = listStack.pop();
      htmlLines.push(`</${tag}>`);
    }
  }

  function closeList() {
    if (listStack.length > 0) {
      const tag = listStack.pop();
      htmlLines.push(`</${tag}>`);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // 空行：关闭列表
    if (!trimmed) {
      closeAllLists();
      continue;
    }

    // 已替换的 LaTeX 块级公式占位符
    if (trimmed.startsWith("%%LATEX_BLOCK_")) {
      closeAllLists();
      const idx = parseInt(trimmed.match(/\d+/)[0]);
      htmlLines.push(latexBlocks[idx] || trimmed);
      continue;
    }

    // Headings: 从 h6 到 h1 依次匹配（长前缀优先）
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      closeAllLists();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      htmlLines.push(`<h${level}>${inlineFormat(content)}</h${level}>`);
      continue;
    }

    // 水平线
    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeAllLists();
      htmlLines.push("<hr />");
      continue;
    }

    // 无序列表
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listStack.length === 0 || listStack[listStack.length - 1] !== "ul") {
        htmlLines.push("<ul>");
        listStack.push("ul");
      }
      htmlLines.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }

    // 有序列表
    const olMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (olMatch) {
      if (listStack.length === 0 || listStack[listStack.length - 1] !== "ol") {
        htmlLines.push("<ol>");
        listStack.push("ol");
      }
      htmlLines.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // 引用块
    if (trimmed.startsWith("> ")) {
      closeAllLists();
      htmlLines.push(`<blockquote><p>${inlineFormat(trimmed.slice(2))}</p></blockquote>`);
      continue;
    }

    // 表格：检测 | 开头的行
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeAllLists();
      // 收集连续的表格行
      const tableLines = [trimmed];
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith("|") && nextLine.endsWith("|")) {
          tableLines.push(nextLine);
          i++;
        } else {
          break;
        }
      }
      // 解析表格
      if (tableLines.length >= 2) {
        const parseRow = (row) =>
          row.split("|").slice(1, -1).map((c) => c.trim());
        
        const headerCells = parseRow(tableLines[0]);
        // 检查第二行是否是分隔线 |---|---|
        const isSeparator = /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|$/.test(tableLines[1]);
        const dataStart = isSeparator ? 2 : 1;

        let tableHtml = `<table><thead><tr>`;
        for (const cell of headerCells) {
          tableHtml += `<th>${inlineFormat(cell)}</th>`;
        }
        tableHtml += "</tr></thead><tbody>";

        for (let r = dataStart; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          tableHtml += "<tr>";
          for (const cell of cells) {
            tableHtml += `<td>${inlineFormat(cell)}</td>`;
          }
          tableHtml += "</tr>";
        }
        tableHtml += "</tbody></table>";
        htmlLines.push(tableHtml);
      } else {
        // 单行 | 不是表格，当段落处理
        htmlLines.push(`<p>${inlineFormat(trimmed)}</p>`);
      }
      continue;
    }

    // 普通段落
    closeAllLists();
    htmlLines.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeAllLists();

  // Step 3: 还原 LaTeX 占位符
  let output = htmlLines.join("\n");
  for (let i = 0; i < latexBlocks.length; i++) {
    output = output.replace(`%%LATEX_BLOCK_${i}%%`, latexBlocks[i]);
    output = output.replace(`%%LATEX_INLINE_${i}%%`, latexBlocks[i]);
  }

  // Step 4: Sanitize HTML to prevent XSS (preserve KaTeX classes/styles)
  output = DOMPurify.sanitize(output, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
      "strong", "em", "del", "mark", "code", "pre",
      "ul", "ol", "li", "blockquote",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "a",
    ],
    ALLOWED_ATTR: ["class", "style", "href", "target"],
    ADD_TAGS: ["math", "mi", "mo", "mn", "mrow", "mfrac", "msup", "msub", "munder", "mover", "mtable", "mtr", "mtd", "mtext", "mspace", "mpadded", "mphantom", "mfenced", "msqrt", "mroot", "menclose", "mstyle", "semantics", "annotation"],
    ADD_ATTR: ["aria-hidden", "aria-label"],
  });

  return output;
}

function inlineFormat(text) {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text* (非贪婪，不匹配 **)
  text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");
  // Code: `text`
  text = text.replace(/`([^`]+?)`/g, "<code>$1</code>");
  // Highlight: ==text==
  text = text.replace(/==(.+?)==/g, "<mark>$1</mark>");
  // 删除线: ~~text~~
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // 还原可能残留的 LaTeX 占位符
  text = text.replace(/%%LATEX_INLINE_(\d+)%%/g, (match) => match);

  return text;
}
