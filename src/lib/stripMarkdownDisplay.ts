/**
 * 将模型返回的 Markdown 风格文本转为易读的纯文本（去掉 **、*、--- 等）。
 */
export function stripMarkdownDisplay(raw: string): string {
  let t = raw.replace(/\r\n/g, '\n')

  // [链接](url) → 仅保留锚文
  t = t.replace(/\[([^\]]+)]\([^)]*\)/g, '$1')

  // **粗体**
  let prev = ''
  while (prev !== t) {
    prev = t
    t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  }

  // __粗体__
  prev = ''
  while (prev !== t) {
    prev = t
    t = t.replace(/__([^_]+)__/g, '$1')
  }

  t = t.replace(/^---+$/gm, '')
  t = t.replace(/^#{1,6}\s+/gm, '')
  // 行首列表符改为圆点（半角/全角减号、星号）
  t = t.replace(/^(\s*)[-*•·]\s+/gm, '$1• ')
  t = t.replace(/^(\s*)[－﹣−]\s+/gm, '$1• ')
  // 残余星号、全角星号（强调或未闭合）
  t = t.replace(/\*\*/g, '')
  t = t.replace(/\*/g, '')
  t = t.replace(/＊/g, '')

  return t.replace(/\n{3,}/g, '\n\n').trim()
}
