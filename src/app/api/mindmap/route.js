import { NextResponse } from "next/server";

const ZHIPU_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    const prompt = `请根据以下课堂笔记内容，生成一个结构化的思维导图数据。

要求：
1. 提取核心主题作为根节点
2. 提取 3-6 个主要分支
3. 每个分支下提取 2-4 个关键子节点
4. 返回 JSON 格式，结构如下：
{
  "title": "根节点标题",
  "children": [
    {
      "title": "分支1标题",
      "children": [
        { "title": "子节点1" },
        { "title": "子节点2" }
      ]
    }
  ]
}

只返回纯 JSON，不要其他文字。

笔记内容：
${content.slice(0, 3000)}`;

    const apiKey = process.env.ZHIPU_API_KEY;
    const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-5",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API 错误: ${err}`);
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "";

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("无法解析思维导图数据");
    }

    const mindmap = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ mindmap });
  } catch (error) {
    console.error("思维导图生成失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
