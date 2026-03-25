import { NextResponse } from "next/server";

const ZHIPU_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

async function callAI(prompt, maxTokens = 4096) {
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
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) throw new Error(`API 错误: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// AI 续写/扩展
export async function POST(request) {
  try {
    const { content, action } = await request.json();
    if (!content) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });

    let prompt;
    switch (action) {
      case "expand":
        prompt = `请对以下课堂笔记内容进行详细扩展解释，补充相关知识点、公式推导过程和典型例题。用 Markdown 格式输出，公式用 LaTeX（$..$ 行内，$$...$$ 独立）。

笔记内容：
${content.slice(0, 3000)}`;
        break;

      case "quiz":
        prompt = `根据以下课堂笔记内容，生成 5 道自测题（包含 3 道选择题和 2 道填空题）。

要求：
1. 每道题标注题号和类型
2. 选择题给出 A/B/C/D 四个选项
3. 所有题目在最后给出答案和简要解析
4. 公式用 LaTeX 格式
5. 用 Markdown 格式输出

笔记内容：
${content.slice(0, 3000)}`;
        break;

      case "check":
        prompt = `请仔细检查以下课堂笔记中可能存在的知识点错误、公式错误或不严谨的表述。

要求：
1. 逐条列出发现的问题
2. 给出正确的表述或公式
3. 如果没有明显错误，给出内容质量评价和改进建议
4. 用 Markdown 格式输出

笔记内容：
${content.slice(0, 3000)}`;
        break;

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }

    const result = await callAI(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI 增强失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
