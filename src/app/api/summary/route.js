import { extractSummary, callZhipuAPIStream } from "@/lib/zhipu";

export async function POST(request) {
  try {
    const { content, stream } = await request.json();

    if (!content) {
      return Response.json({ error: "内容不能为空" }, { status: 400 });
    }

    // 流式输出
    if (stream) {
      const prompt = `请为以下课堂笔记生成一个简洁的摘要（不超过 200 字），提取核心知识点：

${content}`;

      const response = await callZhipuAPIStream("glm-5.1", [{ role: "user", content: prompt }], {
        max_tokens: 1024,
        temperature: 0.3,
      });

      if (!response.ok) {
        return Response.json({ error: "AI 调用失败" }, { status: 500 });
      }

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
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
                  // skip
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

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // 非流式 fallback
    const summary = await extractSummary(content);
    return Response.json({ summary });
  } catch (error) {
    console.error("摘要生成失败:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
