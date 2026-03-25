import { NextResponse } from "next/server";
import { recognizeImage, organizeContent, generateTitle } from "@/lib/zhipu";

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

    // Step 1: 逐页 OCR 识别
    const rawTexts = [];
    for (let i = 0; i < images.length; i++) {
      try {
        const text = await recognizeImage(images[i]);
        rawTexts.push(text);
      } catch (err) {
        console.error(`第 ${i + 1} 页识别失败:`, err);
        rawTexts.push(`[第 ${i + 1} 页识别失败]`);
      }
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

    return NextResponse.json({
      title,
      rawText: combinedRawText,
      content: organizedContent,
      pageCount: images.length,
    });
  } catch (error) {
    console.error("识别 API 错误:", error);
    return NextResponse.json(
      { error: error.message || "识别过程中发生错误" },
      { status: 500 }
    );
  }
}
