/**
 * 智谱 AI API 封装
 * GLM-4V: 多模态识别（图片 OCR）
 * GLM-5: 文本整理优化
 */

const ZHIPU_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

async function callZhipuAPI(model, messages, options = {}) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error("ZHIPU_API_KEY 未配置，请在 .env.local 中设置");
  }

  const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 4096,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`智谱 API 调用失败 (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * 使用 GLM-4V 识别图片中的手写文字和公式
 * @param {string} base64Image - Base64 编码的图片
 * @returns {Promise<string>} 识别结果
 */
export async function recognizeImage(base64Image) {
  const prompt = `你是一个专业的手写笔记 OCR 识别专家。请仔细识别图片中的所有手写文字内容。

要求：
1. 准确识别所有中文文字
2. 数学公式转换为 LaTeX：行内公式用 $...$，独立公式用 $$...$$
3. 保持原始的段落和层次结构
4. 如果有标题或重点标记，注明"【标题】"或"【重点】"
5. 图表用文字说明
6. 按照从上到下、从左到右的阅读顺序输出

直接输出识别内容，不要添加任何解释。`;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: base64Image.startsWith("data:")
              ? base64Image
              : `data:image/jpeg;base64,${base64Image}`,
          },
        },
        { type: "text", text: prompt },
      ],
    },
  ];

  return callZhipuAPI("glm-4.6v", messages, {
    max_tokens: 4096,
    temperature: 0.1,
  });
}

/**
 * 使用 AI 整理识别后的原始文字
 * @param {string} rawText - OCR 识别的原始文字
 * @param {string} subject - 科目名称（可选）
 * @returns {Promise<string>} 整理后的 Markdown 文本
 */
export async function organizeContent(rawText, subject = "") {
  const subjectHint = subject ? `\n学科：${subject}` : "";

  const prompt = `你是一个专业的课堂笔记整理助手。请将以下 OCR 识别的手写笔记原始文字整理为排版精美的 Markdown 笔记。${subjectHint}

## 整理要求

### 结构排版
- 识别出笔记中的大标题，用 ## 标记
- 识别出小节，用 ### 标记
- 正文内容分段清晰，每个知识点独立成段
- 使用有序或无序列表归纳要点

### 数学公式
- 行内公式用 $...$ 包裹
- 独立的重要公式用 $$...$$ 包裹并单独成行
- 确保 LaTeX 语法正确

### 内容优化
- 纠正明显的 OCR 识别错误和错别字
- **加粗**标注关键概念、定义和重要结论
- 如果有推导过程，保持完整的推导步骤
- 补全明显缺失的上下文（如省略号处）

### 格式规范
- 不要添加"以下是整理后的内容"之类的说明
- 直接从笔记正文内容开始
- 段落之间用空行分隔

## 原始识别文字

${rawText}`;

  const messages = [{ role: "user", content: prompt }];

  return callZhipuAPI("glm-5", messages, {
    max_tokens: 8192,
    temperature: 0.2,
  });
}

/**
 * 使用 AI 提取笔记摘要
 * @param {string} content - 笔记内容
 * @returns {Promise<string>} 摘要
 */
export async function extractSummary(content) {
  const prompt = `请为以下课堂笔记生成一个简洁的摘要（不超过 200 字），提取核心知识点：

${content}`;

  const messages = [{ role: "user", content: prompt }];

  return callZhipuAPI("glm-5", messages, {
    max_tokens: 1024,
    temperature: 0.3,
  });
}

/**
 * 自动生成笔记标题
 * @param {string} content - 笔记内容
 * @returns {Promise<string>} 标题
 */
export async function generateTitle(content) {
  const prompt = `请根据以下课堂笔记内容，生成一个简洁的标题（10字以内），直接输出标题文字即可：

${content.slice(0, 500)}`;

  const messages = [{ role: "user", content: prompt }];

  const title = await callZhipuAPI("glm-4-plus", messages, {
    max_tokens: 64,
    temperature: 0.3,
  });

  return title.replace(/["""'''\n]/g, "").trim();
}
