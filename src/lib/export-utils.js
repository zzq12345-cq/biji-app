/**
 * 导出工具
 * 支持导出为 Word (.docx) 和 PDF
 */

/**
 * 导出为 Word 文档
 * @param {string} title - 标题
 * @param {string} content - Markdown 内容
 * @returns {Promise<Blob>} Word 文件 Blob
 */
export async function exportToWord(title, content) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, MathRun } =
    await import("docx");

  const lines = content.split("\n");
  const children = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    // Heading detection
    if (trimmed.startsWith("### ")) {
      children.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      children.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        })
      );
    } else if (trimmed.startsWith("# ")) {
      children.push(
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else {
      // Parse inline formatting
      const runs = parseInlineFormatting(trimmed);
      children.push(
        new Paragraph({
          children: runs.map(
            (r) =>
              new TextRun({
                text: r.text,
                bold: r.bold,
                italics: r.italic,
                font: "Microsoft YaHei",
                size: 24,
              })
          ),
          spacing: { after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          ...children,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * 导出为 PDF（通过打印窗口）
 * @param {string} title - 标题
 * @param {string} htmlContent - HTML 内容
 */
export function exportToPdf(title, htmlContent) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("请允许弹窗以导出 PDF");
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
        body {
          font-family: 'Noto Sans SC', sans-serif;
          padding: 40px 60px;
          line-height: 1.8;
          color: #1a1a1a;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #2563EB; padding-bottom: 8px; }
        h2 { font-size: 20px; margin: 24px 0 12px; color: #2563EB; }
        h3 { font-size: 18px; margin: 20px 0 10px; }
        p { margin: 8px 0; }
        strong { color: #1D4ED8; }
        .katex-display { margin: 16px 0; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${htmlContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

/**
 * Parse inline markdown formatting (bold, italic)
 */
function parseInlineFormatting(text) {
  const runs = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index);
      if (before) runs.push({ text: before, bold: false, italic: false });
      runs.push({ text: boldMatch[1], bold: true, italic: false });
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch) {
      const before = remaining.slice(0, italicMatch.index);
      if (before) runs.push({ text: before, bold: false, italic: false });
      runs.push({ text: italicMatch[1], bold: false, italic: true });
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // LaTeX inline: replace $...$ with plain text in Word
    const latexMatch = remaining.match(/\$(.+?)\$/);
    if (latexMatch) {
      const before = remaining.slice(0, latexMatch.index);
      if (before) runs.push({ text: before, bold: false, italic: false });
      runs.push({ text: `[${latexMatch[1]}]`, bold: false, italic: true });
      remaining = remaining.slice(latexMatch.index + latexMatch[0].length);
      continue;
    }

    runs.push({ text: remaining, bold: false, italic: false });
    break;
  }

  return runs.length > 0 ? runs : [{ text, bold: false, italic: false }];
}

/**
 * 触发文件下载
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
