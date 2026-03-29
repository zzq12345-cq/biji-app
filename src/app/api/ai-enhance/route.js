import { callZhipuAPI, callZhipuAPIStream, chunkAndSummarize } from "@/lib/zhipu";

export async function POST(request) {
  try {
    const { content, action, stream } = await request.json();
    if (!content) return Response.json({ error: "内容不能为空" }, { status: 400 });

    // 长内容分块处理
    const effectiveContent = content.length > 3000
      ? await chunkAndSummarize(content)
      : content;

    let prompt;
    switch (action) {
      case "expand":
        prompt = `请对以下课堂笔记内容进行详细扩展解释，补充相关知识点、公式推导过程和典型例题。用 Markdown 格式输出，公式用 LaTeX（$..$ 行内，$$...$$ 独立）。

笔记内容：
${effectiveContent}`;
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
${effectiveContent}`;
        break;

      case "check":
        prompt = `请仔细检查以下课堂笔记中可能存在的知识点错误、公式错误或不严谨的表述。

要求：
1. 逐条列出发现的问题
2. 给出正确的表述或公式
3. 如果没有明显错误，给出内容质量评价和改进建议
4. 用 Markdown 格式输出

笔记内容：
${effectiveContent}`;
        break;

      default:
        return Response.json({ error: "未知操作" }, { status: 400 });
    }

    // 流式输出
    if (stream) {
      const response = await callZhipuAPIStream("glm-5.1", [{ role: "user", content: prompt }], {
        max_tokens: 4096,
        temperature: 0.3,
      });

      if (!response.ok) {
        return Response.json({ error: "AI 调用失败" }, { status: 500 });
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const data = line.slice(5).trim();
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // 跳过非 JSON 行
                }
              }
            }
          } catch (e) {
            console.error("Stream error:", e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // 非流式 fallback
    const result = await callZhipuAPI("glm-5.1", [{ role: "user", content: prompt }], {
      max_tokens: 4096,
      temperature: 0.3,
    });

    return Response.json({ result });
  } catch (error) {
    console.error("AI 增强失败:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
