/**
 * PDF 处理工具
 * 将 PDF 页面转换为 Base64 图片
 */

/**
 * 将 PDF 文件转换为 Base64 图片数组（在浏览器端执行）
 * @param {File} file - PDF 文件
 * @param {Function} onProgress - 进度回调 (current, total)
 * @returns {Promise<string[]>} Base64 图片数组
 */
export async function pdfToImages(file, onProgress) {
  const pdfjsLib = await import("pdfjs-dist");

  // 设置 worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const images = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2; // 高分辨率
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;

    const base64 = canvas.toDataURL("image/jpeg", 0.8);
    images.push(base64);

    if (onProgress) {
      onProgress(i, numPages);
    }
  }

  return images;
}

/**
 * 获取 PDF 文件的页数
 * @param {File} file - PDF 文件
 * @returns {Promise<number>} 页数
 */
export async function getPdfPageCount(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
}
