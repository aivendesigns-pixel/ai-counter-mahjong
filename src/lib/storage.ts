export type LogRow = {
  id: string
  name: string
  delta: number
  raw: string
  ts: number
}

export type BoardState = {
  scores: Record<string, number>
  log: LogRow[]
  /** 表格列顺序（先出现的人靠左） */
  playerOrder: string[]
}

export type Folder = {
  id: string
  name: string
  board: BoardState
}

export type AppStored = {
  version: 2
  folders: Folder[]
  activeFolderId: string
}

const STORAGE_KEY_V2 = 'ai-counter-board-v2'
const STORAGE_KEY_V1 = 'ai-counter-board-v1'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyBoard(): BoardState {
  return { scores: {}, log: [], playerOrder: [] }
}

function migrateV1(): AppStored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1)
    if (!raw) return null
    const p = JSON.parse(raw) as {
      scores?: Record<string, number>
      log?: LogRow[]
    }
    if (!p || typeof p.scores !== 'object' || !Array.isArray(p.log)) return null
    const scores = p.scores
    const log = p.log
    const playerOrder = Object.keys(scores).sort((a, b) => scores[b] - scores[a])
    const id = uid()
    return {
      version: 2,
      folders: [
        {
          id,
          name: '默认项目',
          board: { scores, log, playerOrder },
        },
      ],
      activeFolderId: id,
    }
  } catch {
    return null
  }
}

export function loadAppStored(): AppStored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (raw) {
      const p = JSON.parse(raw) as AppStored
      if (
        p?.version === 2 &&
        Array.isArray(p.folders) &&
        p.folders.length > 0 &&
        typeof p.activeFolderId === 'string'
      ) {
        const folders = p.folders.map((f) => ({
          id: f.id,
          name: f.name || '未命名',
          board: normalizeBoard(f.board),
        }))
        const active = folders.some((x) => x.id === p.activeFolderId)
          ? p.activeFolderId
          : folders[0].id
        return { version: 2, folders, activeFolderId: active }
      }
    }
  } catch {
    /* fallthrough */
  }

  const migrated = migrateV1()
  if (migrated) {
    saveAppStored(migrated)
    localStorage.removeItem(STORAGE_KEY_V1)
    return migrated
  }

  const id = uid()
  return {
    version: 2,
    folders: [{ id, name: '我的项目', board: emptyBoard() }],
    activeFolderId: id,
  }
}

function normalizeBoard(b: BoardState | undefined): BoardState {
  if (!b || typeof b.scores !== 'object' || !Array.isArray(b.log))
    return emptyBoard()
  const scores = { ...b.scores }
  const log = Array.isArray(b.log) ? b.log : []
  let playerOrder = Array.isArray(b.playerOrder) ? [...b.playerOrder] : []
  const keys = Object.keys(scores)
  for (const k of keys) {
    if (!playerOrder.includes(k)) playerOrder.push(k)
  }
  playerOrder = playerOrder.filter((n) => n in scores)
  return { scores, log, playerOrder }
}

export function saveAppStored(data: AppStored) {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data))
}

export { uid }

export function createFolder(name: string): Folder {
  return {
    id: uid(),
    name: name.trim() || '新项目',
    board: emptyBoard(),
  }
}
