import { NextResponse } from "next/server";
import { recognizeImage, organizeContent, generateTitle, detectSubject } from "@/lib/zhipu";

export const maxDuration = 120;

export async function POST(request) {
  try {
    const { images, subject } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一张图片" },
        { status: 400 }
      );
    }

    // Step 1: 并行 OCR 识别（3 页并发）
    const CONCURRENCY = 3;
    const rawTexts = new Array(images.length).fill("");

    for (let i = 0; i < images.length; i += CONCURRENCY) {
      const batch = images.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((img, batchIdx) => {
          const pageIdx = i + batchIdx;
          return recognizeImage(img).catch((err) => {
            console.error(`第 ${pageIdx + 1} 页识别失败:`, err);
            return `[第 ${pageIdx + 1} 页识别失败]`;
          });
        })
      );
      results.forEach((result, batchIdx) => {
        const pageIdx = i + batchIdx;
        rawTexts[pageIdx] = result.status === "fulfilled"
          ? result.value
          : `[第 ${pageIdx + 1} 页识别失败]`;
      });
    }

    const combinedRawText = rawTexts
      .map((t, i) => `--- 第 ${i + 1} 页 ---\n${t}`)
      .join("\n\n");

    // Step 2: AI 整理优化
    let organizedContent;
    try {
      organizedContent = await organizeContent(combinedRawText, subject);
    } catch (err) {
      console.error("内容整理失败:", err);
      organizedContent = combinedRawText;
    }

    // Step 3: 自动生成标题
    let title;
    try {
      title = await generateTitle(organizedContent);
    } catch (err) {
      title = `笔记 ${new Date().toLocaleDateString("zh-CN")}`;
    }

    // Step 4: 自动推荐科目
    let subjectRecommend = null;
    try {
      subjectRecommend = await detectSubject(organizedContent);
    } catch (err) {
      // 科目识别失败不影响主流程
    }

    return NextResponse.json({
      title,
      rawText: combinedRawText,
      content: organizedContent,
      pageCount: images.length,
      subject_recommend: subjectRecommend,
    });
  } catch (error) {
    console.error("识别 API 错误:", error);
    return NextResponse.json(
      { error: error.message || "识别过程中发生错误" },
      { status: 500 }
    );
  }
}
