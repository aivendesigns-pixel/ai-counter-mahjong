export type ParsedEntry = {
  name: string
  delta: number
  raw: string
}

const SEGMENT_SPLIT = /[\n，、；;,]+/g

function normalizeName(s: string): string {
  return s.replace(/^[:：]\s*/, '').trim()
}

/** 张三赢了10分 / 李四输20 / 老王負15 */
function tryWinLose(s: string): ParsedEntry | null {
  const m = s.match(
    /^(.+?)\s*(赢|输|勝|負)了?\s*(\d+(?:\.\d+)?)\s*(?:分|块|元|点)?$/u,
  )
  if (!m) return null
  const name = normalizeName(m[1])
  if (!name) return null
  const n = Number(m[3])
  if (!Number.isFinite(n)) return null
  const lose = m[2] === '输' || m[2] === '負'
  return { name, delta: lose ? -n : n, raw: s }
}

/** 小张得10 / 小李扣5 */
function tryGainDeduct(s: string): ParsedEntry | null {
  const m = s.match(
    /^(.+?)\s*(得|扣)了?\s*(\d+(?:\.\d+)?)\s*(?:分|块|元|点)?$/u,
  )
  if (!m) return null
  const name = normalizeName(m[1])
  if (!name) return null
  const n = Number(m[3])
  if (!Number.isFinite(n)) return null
  const deduct = m[2] === '扣'
  return { name, delta: deduct ? -n : n, raw: s }
}

/** 张三 +10 / 李四 −20（支持半角/全角加减号） */
function trySignNumber(s: string): ParsedEntry | null {
  const m = s.match(
    /^(.+?)\s*([+\-±＋－−])\s*(\d+(?:\.\d+)?)\s*(?:分|块|元|点)?$/u,
  )
  if (!m) return null
  const name = normalizeName(m[1])
  if (!name) return null
  const op = m[2]
  const n = Number(m[3])
  if (!Number.isFinite(n)) return null
  const neg = op === '-' || op === '−' || op === '－'
  return { name, delta: neg ? -n : n, raw: s }
}

/** 仅数字结尾：张三 10 → +10；张三 -10 已被上一条匹配 */
function tryTrailingNumber(s: string): ParsedEntry | null {
  const m = s.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:分|块|元|点)?$/u)
  if (!m) return null
  const name = normalizeName(m[1])
  if (!name) return null
  const n = Number(m[2])
  if (!Number.isFinite(n)) return null
  return { name, delta: n, raw: s }
}

function parseOneSegment(seg: string): ParsedEntry | null {
  const s = seg.trim()
  if (!s) return null
  return (
    tryWinLose(s) ??
    tryGainDeduct(s) ??
    trySignNumber(s) ??
    tryTrailingNumber(s)
  )
}

export type ParseResult = {
  entries: ParsedEntry[]
  failed: string[]
}

export function parseScoreInput(text: string): ParseResult {
  const raw = text.trim()
  if (!raw) return { entries: [], failed: [] }

  const parts = raw.split(SEGMENT_SPLIT).map((p) => p.trim()).filter(Boolean)
  const entries: ParsedEntry[] = []
  const failed: string[] = []

  for (const part of parts) {
    const one = parseOneSegment(part)
    if (one) entries.push(one)
    else failed.push(part)
  }

  return { entries, failed }
}

/**
 * 在已选定玩家名下解析一行（用于卡片编辑）：可只写 +10、赢20 等，会自动拼上姓名。
 */
export function parseScoreForPlayer(
  playerName: string,
  raw: string,
): ParseResult {
  const t = raw.trim()
  if (!t) return { entries: [], failed: [] }

  const candidates: string[] = []
  if (t.includes(playerName)) candidates.push(t)
  candidates.push(`${playerName}${t}`, `${playerName} ${t}`)

  const seen = new Set<string>()
  for (const line of candidates) {
    if (seen.has(line)) continue
    seen.add(line)
    const r = parseScoreInput(line)
    if (r.entries.length === 1 && r.entries[0].name === playerName) {
      return { entries: r.entries, failed: [] }
    }
    const hit = r.entries.find((e) => e.name === playerName)
    if (hit) return { entries: [hit], failed: [] }
  }

  return { entries: [], failed: [t] }
}
