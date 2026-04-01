import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { FolderModal } from './components/FolderModal'
import { FolderSidebar } from './components/FolderSidebar'
import { PlayerScoreModal } from './components/PlayerScoreModal'
import { ScoreSpreadsheet } from './components/ScoreSpreadsheet'
import { parseScoreForPlayer, parseScoreInput } from './lib/parseScoreInput'
import {
  createFolder,
  loadAppStored,
  saveAppStored,
  uid,
  type AppStored,
  type Folder,
  type LogRow,
} from './lib/storage'

/* ---------- helpers ---------- */

function dateKey(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isToday(key: string) {
  return key === dateKey(Date.now())
}

function dateLabel(key: string, today: boolean) {
  if (today) return '今天'
  const [y, m, d] = key.split('-')
  const now = new Date()
  const prefix = Number(y) === now.getFullYear() ? '' : `${y}年`
  return `${prefix}${Number(m)}月${Number(d)}日`
}

/* ---------- LogGrouped ---------- */

function LogGrouped({ log }: { log: LogRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const groups = useMemo(() => {
    const map = new Map<string, LogRow[]>()
    for (const row of log) {
      const key = dateKey(row.ts)
      const arr = map.get(key)
      if (arr) arr.push(row)
      else map.set(key, [row])
    }
    return Array.from(map.entries())
  }, [log])

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="mt-3 space-y-2 text-left">
      {groups.map(([key, rows]) => {
        const today = isToday(key)
        const open = today || expanded.has(key)
        return (
          <Fragment key={key}>
            {!today && (
              <button
                type="button"
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 active:bg-zinc-800/40"
              >
                <span>{dateLabel(key, false)}</span>
                <span className="text-zinc-600">({rows.length}条)</span>
                <svg
                  className={`ml-auto h-3.5 w-3.5 text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
            {today && (
              <p className="px-2 pt-1 text-xs font-medium text-zinc-500">
                今天
              </p>
            )}
            {open && (
              <ol className="space-y-0.5">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-[13px] odd:bg-zinc-800/20"
                  >
                    <span className="shrink-0 tabular-nums text-[11px] text-zinc-600">
                      {new Date(row.ts).toLocaleString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-100">{row.name}</span>
                      <span
                        className={
                          row.delta >= 0
                            ? ' ml-1.5 font-bold tabular-nums text-emerald-400'
                            : ' ml-1.5 font-bold tabular-nums text-rose-400'
                        }
                      >
                        {row.delta > 0 ? '+' : ''}
                        {row.delta}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeFolderId, setActiveFolderId] = useState('')
  const [input, setInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [folderModal, setFolderModal] = useState<
    null | { kind: 'create' } | { kind: 'rename'; id: string }
  >(null)
  const [folderNameDraft, setFolderNameDraft] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [playerEditDraft, setPlayerEditDraft] = useState('')
  const [showBatchInput, setShowBatchInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    const s = loadAppStored()
    setFolders(s.folders)
    setActiveFolderId(s.activeFolderId)
    loadedRef.current = true
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    const payload: AppStored = {
      version: 2,
      folders,
      activeFolderId,
    }
    saveAppStored(payload)
  }, [folders, activeFolderId])

  useEffect(() => {
    if (folders.length === 0) return
    if (!folders.some((f) => f.id === activeFolderId)) {
      setActiveFolderId(folders[0].id)
    }
  }, [folders, activeFolderId])

  useEffect(() => {
    setEditingPlayer(null)
    setPlayerEditDraft('')
    setShowBatchInput(false)
  }, [activeFolderId])

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId),
    [folders, activeFolderId],
  )

  const scores = activeFolder?.board.scores ?? {}
  const log = activeFolder?.board.log ?? []
  const playerOrder = activeFolder?.board.playerOrder ?? []

  const hasPlayers = useMemo(
    () => Object.keys(scores).length > 0,
    [scores],
  )

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const patchActiveBoard = useCallback(
    (fn: (board: Folder['board']) => Folder['board']) => {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === activeFolderId ? { ...f, board: fn(f.board) } : f,
        ),
      )
    },
    [activeFolderId],
  )

  const zeroSum = activeFolder?.zeroSum ?? false

  const toggleZeroSum = useCallback(() => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === activeFolderId ? { ...f, zeroSum: !f.zeroSum } : f,
      ),
    )
  }, [activeFolderId])

  const applyEntries = useCallback(
    (rawLine: string) => {
      if (!activeFolderId) return
      const { entries, failed } = parseScoreInput(rawLine)
      if (entries.length === 0) {
        showToast(
          failed.length
            ? `没能理解：${failed[0]}`
            : '请输入内容，例如：小陈赢了20，阿美 -15',
        )
        return
      }
      if (zeroSum) {
        const sum = entries.reduce((s, e) => s + e.delta, 0)
        if (sum !== 0) {
          showToast(`零和校验失败：本次总和为 ${sum > 0 ? '+' : ''}${sum}，应为 0`)
          return
        }
      }
      const now = Date.now()
      patchActiveBoard((board) => {
        const nextScores = { ...board.scores }
        for (const e of entries) {
          nextScores[e.name] = (nextScores[e.name] ?? 0) + e.delta
          if (nextScores[e.name] === 0) delete nextScores[e.name]
        }
        let order = [...board.playerOrder]
        for (const e of entries) {
          if (e.name in nextScores && !order.includes(e.name)) order.push(e.name)
        }
        order = order.filter((n) => n in nextScores)
        const newRows = entries.map((e) => ({
          id: uid(),
          name: e.name,
          delta: e.delta,
          raw: e.raw,
          ts: now,
        }))
        return {
          scores: nextScores,
          log: [...newRows, ...board.log],
          playerOrder: order,
        }
      })
      if (failed.length) {
        showToast(`已记录 ${entries.length} 条，未识别：${failed.join('；')}`)
      } else {
        showToast(`已记录 ${entries.length} 条`)
      }
      setInput('')
      textareaRef.current?.focus()
    },
    [activeFolderId, patchActiveBoard, showToast, zeroSum],
  )

  const applyPlayerEdit = useCallback(() => {
    if (!activeFolderId || !editingPlayer) return
    const { entries, failed } = parseScoreForPlayer(editingPlayer, playerEditDraft)
    if (entries.length === 0) {
      showToast(
        failed.length
          ? `没能理解：${failed[0]}`
          : '请输入本笔分数，例如 +10 或 赢20',
      )
      return
    }
    if (entries.length > 1) {
      showToast('一次请只记一笔')
      return
    }
    const e = entries[0]
    const now = Date.now()
    patchActiveBoard((board) => {
      const nextScores = { ...board.scores }
      nextScores[e.name] = (nextScores[e.name] ?? 0) + e.delta
      if (nextScores[e.name] === 0) delete nextScores[e.name]
      let order = [...board.playerOrder]
      if (e.name in nextScores && !order.includes(e.name)) order.push(e.name)
      order = order.filter((n) => n in nextScores)
      const newRow = {
        id: uid(),
        name: e.name,
        delta: e.delta,
        raw: e.raw,
        ts: now,
      }
      return {
        scores: nextScores,
        log: [newRow, ...board.log],
        playerOrder: order,
      }
    })
    showToast('已记录')
    setEditingPlayer(null)
    setPlayerEditDraft('')
  }, [
    activeFolderId,
    editingPlayer,
    playerEditDraft,
    patchActiveBoard,
    showToast,
  ])

  const openPlayerEdit = useCallback((name: string) => {
    setEditingPlayer(name)
    setPlayerEditDraft('')
  }, [])

  const closePlayerEdit = useCallback(() => {
    setEditingPlayer(null)
    setPlayerEditDraft('')
  }, [])

  const undoLastBatch = useCallback(() => {
    if (!activeFolderId || log.length === 0) return
    const firstTs = log[0]?.ts
    const batch = log.filter((r) => r.ts === firstTs)
    const rest = log.filter((r) => r.ts !== firstTs)
    patchActiveBoard((board) => {
      const nextScores = { ...board.scores }
      for (const r of batch) {
        nextScores[r.name] = (nextScores[r.name] ?? 0) - r.delta
        if (nextScores[r.name] === 0) delete nextScores[r.name]
      }
      let order = board.playerOrder.filter((n) => n in nextScores)
      for (const k of Object.keys(nextScores)) {
        if (!order.includes(k)) order.push(k)
      }
      return {
        scores: nextScores,
        log: rest,
        playerOrder: order,
      }
    })
    showToast('已撤销上一批记录')
  }, [activeFolderId, log, patchActiveBoard, showToast])

  const clearAll = useCallback(() => {
      if (!window.confirm('确定清空当前项目下的分数与记分记录？')) return
    patchActiveBoard(() => ({
      scores: {},
      log: [],
      playerOrder: [],
    }))
    setShowBatchInput(false)
    showToast('已清空')
  }, [patchActiveBoard, showToast])

  const openCreateFolder = useCallback(() => {
    setFolderModal({ kind: 'create' })
    setFolderNameDraft('新项目')
  }, [])

  const openRenameFolder = useCallback((id: string) => {
    const f = folders.find((x) => x.id === id)
    if (!f) return
    setFolderModal({ kind: 'rename', id })
    setFolderNameDraft(f.name)
  }, [folders])

  const closeFolderModal = useCallback(() => {
    setFolderModal(null)
  }, [])

  const confirmFolderModal = useCallback(() => {
    const trimmed = folderNameDraft.trim()
    if (!trimmed) {
      showToast('请输入名称')
      return
    }
    if (!folderModal) return
    if (folderModal.kind === 'create') {
      const f = createFolder(trimmed)
      setFolders((prev) => [...prev, f])
      setActiveFolderId(f.id)
      showToast(`已创建「${f.name}」`)
    } else {
      const id = folderModal.id
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)),
      )
      showToast('已重命名')
    }
    setFolderModal(null)
  }, [folderModal, folderNameDraft, showToast])

  const handleDeleteFolder = useCallback(
    (id: string) => {
      if (folders.length <= 1) {
        showToast('至少保留一个文件夹')
        return
      }
      const f = folders.find((x) => x.id === id)
      if (!window.confirm(`确定删除文件夹「${f?.name ?? ''}」？内部记录会一并删除。`))
        return
      setFolders((prev) => prev.filter((x) => x.id !== id))
      showToast('已删除')
    },
    [folders, showToast],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyEntries(input)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      applyEntries(input)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="shrink-0 bg-zinc-950 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] pb-1">
        <h1 className="text-left text-[10px] font-medium uppercase tracking-widest text-zinc-600">
          AI Counter <span className="text-zinc-700">v1.2.0</span>
        </h1>
      </header>

      <FolderSidebar
        folders={folders}
        activeFolderId={activeFolderId}
        onSelect={setActiveFolderId}
        onCreate={openCreateFolder}
        onRename={openRenameFolder}
        onDelete={handleDeleteFolder}
      />

      <div className="flex min-w-0 flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-4">
        <div className="mx-auto w-full max-w-full">

          <section className="mb-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-3 sm:p-4">
            <div className="mb-3 flex items-baseline justify-between text-left">
              <h2 className="text-xl font-bold tracking-tight text-white">
                分数表
              </h2>
              {hasPlayers && (
                <p className="text-xs text-zinc-500">
                  点击卡片记分
                </p>
              )}
            </div>
            <ScoreSpreadsheet
              playerOrder={playerOrder}
              scores={scores}
              onPlayerClick={hasPlayers ? openPlayerEdit : undefined}
            />
            {/* 零和模式 toggle + 总和校验 */}
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800/40 pt-3">
              <button
                type="button"
                onClick={toggleZeroSum}
                className="flex items-center gap-2 text-xs active:opacity-70"
              >
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${zeroSum ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${zeroSum ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
                  />
                </span>
                <span className={zeroSum ? 'text-emerald-300' : 'text-zinc-500'}>
                  零和模式
                </span>
              </button>
              {zeroSum && hasPlayers && (() => {
                const total = Object.values(scores).reduce((a, b) => a + b, 0)
                return (
                  <span className={`text-xs font-medium tabular-nums ${total === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    总和：{total > 0 ? '+' : ''}{total}{total === 0 ? ' ✓' : ' ✗'}
                  </span>
                )
              })()}
            </div>
          </section>


          <section className="mb-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-3 sm:p-4">
            <h2 className="text-left text-xl font-bold tracking-tight text-white">
              记分记录
            </h2>
            {log.length === 0 ? (
              <p className="mt-3 text-left text-sm text-zinc-500">
                暂无记分记录。
              </p>
            ) : (
              <LogGrouped log={log} />
            )}
          </section>

          {toast && (
            <p
              className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-left text-sm text-emerald-200"
              role="status"
            >
              {toast}
            </p>
          )}

          <div className="mt-5 border-t border-zinc-800/40 pt-4">
          {(!hasPlayers || showBatchInput) && (
            <form onSubmit={onSubmit} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-left text-xs font-medium text-zinc-500">
                  {!hasPlayers ? '初始输入' : '批量添加'}
                </label>
                {hasPlayers && showBatchInput && (
                  <button
                    type="button"
                    className="text-xs text-zinc-600 underline active:text-zinc-400"
                    onClick={() => setShowBatchInput(false)}
                  >
                    收起
                  </button>
                )}
              </div>
              {!hasPlayers && (
                <p className="text-left text-xs leading-relaxed text-zinc-600">
                  写下名字和输赢，例如「小陈赢了20，阿美 -15」
                </p>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={3}
                placeholder="小陈赢了20&#10;阿美 -15、老王输8"
                className="w-full resize-y rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
              <div className="flex flex-wrap items-stretch gap-2">
                <button
                  type="submit"
                  className="min-h-10 flex-1 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-emerald-950 active:bg-emerald-400"
                >
                  记一笔
                </button>
                <button
                  type="button"
                  onClick={undoLastBatch}
                  disabled={log.length === 0}
                  className="min-h-10 flex-1 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 text-sm font-medium text-zinc-300 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  撤销
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-10 rounded-lg px-3 text-sm text-zinc-600 active:text-rose-400"
                >
                  清空
                </button>
              </div>
            </form>
          )}

          {hasPlayers && !showBatchInput && (
            <div className="flex flex-wrap items-stretch gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBatchInput(true)
                  window.setTimeout(() => textareaRef.current?.focus(), 100)
                }}
                className="min-h-10 flex-1 rounded-lg border border-dashed border-zinc-700/60 bg-zinc-900/30 px-3 text-sm font-medium text-zinc-400 active:bg-zinc-800"
              >
                + 批量添加
              </button>
              <button
                type="button"
                onClick={undoLastBatch}
                disabled={log.length === 0}
                className="min-h-10 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 text-sm font-medium text-zinc-300 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                撤销
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="min-h-10 rounded-lg px-3 text-sm text-zinc-600 active:text-rose-400"
              >
                清空
              </button>
            </div>
          )}
          </div>

          <footer className="mt-8 border-t border-zinc-800/40 pt-4 text-left text-xs leading-relaxed text-zinc-600">
            <p>
              卡片顺序按第一次记分时出现先后排列。换浏览器或清除站点数据会丢失，重要数据请自行备份。
            </p>
          </footer>
        </div>
      </div>

      <FolderModal
        open={folderModal !== null}
        title={
          folderModal?.kind === 'create' ? '新建项目' : '重命名项目'
        }
        nameDraft={folderNameDraft}
        onChangeDraft={setFolderNameDraft}
        onConfirm={confirmFolderModal}
        onCancel={closeFolderModal}
        confirmLabel={folderModal?.kind === 'create' ? '创建' : '保存'}
      />

      <PlayerScoreModal
        open={editingPlayer !== null}
        playerName={editingPlayer ?? ''}
        draft={playerEditDraft}
        onChangeDraft={setPlayerEditDraft}
        onConfirm={applyPlayerEdit}
        onCancel={closePlayerEdit}
      />
    </div>
  )
}
