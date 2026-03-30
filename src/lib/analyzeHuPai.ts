import type { AiSettings } from './aiSettings'

const SYSTEM_INSTRUCTION = `你是熟悉「中国麻将竞赛规则（试行）」及常见国标番种的助手。用户发来一张麻将照片，只想知道两件事：**胡的什么牌**、**胡了多少番**。

任务：
1. 识别图中与胡牌相关的牌面（手牌、副露等能看清的部分），用清晰文字说明：**胡牌型**（例如哪些搭子、雀头、听什么），若看不清须写明。
2. 按国标思路给出**总番数（估算）**；可附极简番种列表（番名即可），不必展开「符、底分、几家赔多少分」等结算细节。
3. 若无法可靠判断，说明原因与不确定性。

输出要求：
- 使用简体中文，结构清晰，篇幅精炼；直接输出纯文本，不要使用 Markdown（不要用 **、#、---、列表星号等符号）。
- 开头用两三句话概括胡什么牌、约多少番；再视需要补充牌面分解。
- 结尾一句免责声明：仅供参考，以当场裁判为准。`

const USER_TAIL =
  '\n\n请根据这张照片回答：胡的什么牌、胡了多少番。不要写各家输赢分数或自动记账类内容。'

function dataUrlToInlinePart(dataUrl: string): {
  mime_type: string
  data: string
} {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s)
  if (!m) throw new Error('图片需为 base64 格式')
  return { mime_type: m[1], data: m[2] }
}

function parseOpenAIError(text: string): string {
  try {
    const j = JSON.parse(text) as { error?: { message?: string } }
    return j.error?.message ?? text
  } catch {
    return text
  }
}

function parseGeminiError(text: string): string {
  try {
    const j = JSON.parse(text) as { error?: { message?: string; status?: string } }
    return j.error?.message ?? text
  } catch {
    return text
  }
}

async function analyzeOpenAI(
  dataUrl: string,
  settings: AiSettings,
): Promise<string> {
  const base = settings.openaiBaseUrl.replace(/\/$/, '')
  const url = `${base}/chat/completions`
  const userText = `${SYSTEM_INSTRUCTION}${USER_TAIL}`

  const body = {
    model: settings.openaiModel,
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: userText },
          { type: 'image_url' as const, image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(parseOpenAIError(text) || `请求失败 ${res.status}`)

  const data = JSON.parse(text) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('模型未返回内容')
  return content
}

async function analyzeGemini(
  dataUrl: string,
  settings: AiSettings,
): Promise<string> {
  const base = settings.geminiBaseUrl.replace(/\/$/, '')
  const model = encodeURIComponent(settings.geminiModel)
  const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(settings.apiKey)}`

  const inline = dataUrlToInlinePart(dataUrl)
  const userText = `${SYSTEM_INSTRUCTION}${USER_TAIL}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: userText },
          {
            inline_data: {
              mime_type: inline.mime_type,
              data: inline.data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(parseGeminiError(text) || `请求失败 ${res.status}`)

  const data = JSON.parse(text) as {
    candidates?: Array<{
      finishReason?: string
      content?: { parts?: Array<{ text?: string }> }
    }>
    error?: { message?: string }
  }
  if (data.error?.message) throw new Error(data.error.message)

  const cand = data.candidates?.[0]
  const parts = cand?.content?.parts?.filter(Boolean) ?? []
  let out = parts.map((p) => p.text ?? '').join('')
  if (!out.trim()) throw new Error('模型未返回内容')
  if (cand?.finishReason === 'MAX_TOKENS') {
    out +=
      '\n\n（以上内容因输出长度上限被截断。可再点一次「AI 分析」重试。）'
  }
  return out
}

/** 压缩为 JPEG base64，控制体积 */
export async function fileToCompressedDataUrl(
  file: File,
  maxSide = 1280,
  quality = 0.82,
): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file)
    const { width: w, height: h } = bitmap
    const scale = Math.min(1, maxSide / Math.max(w, h))
    const tw = Math.round(w * scale)
    const th = Math.round(h * scale)
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布')
    ctx.drawImage(bitmap, 0, 0, tw, th)
    bitmap.close()
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片压缩失败'))
            return
          }
          const r = new FileReader()
          r.onload = () => resolve(r.result as string)
          r.onerror = () => reject(new Error('读取失败'))
          r.readAsDataURL(blob)
        },
        'image/jpeg',
        quality,
      )
    })
  } catch {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => reject(new Error('读取图片失败'))
      r.readAsDataURL(file)
    })
  }
}

export async function analyzeHuPaiImage(
  dataUrl: string,
  settings: AiSettings,
): Promise<string> {
  if (settings.provider === 'gemini') {
    return analyzeGemini(dataUrl, settings)
  }
  return analyzeOpenAI(dataUrl, settings)
}
