import { extractSummary } from "@/lib/zhipu";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    const summary = await extractSummary(content);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("摘要生成失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
