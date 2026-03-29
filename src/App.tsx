import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FolderModal } from './components/FolderModal'
import { FolderSidebar } from './components/FolderSidebar'
import { HuPaiAnalyzer } from './components/HuPaiAnalyzer'
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
} from './lib/storage'

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
    [activeFolderId, patchActiveBoard, showToast],
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
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-950 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] pb-3">
        <h1 className="text-left text-xs font-medium uppercase tracking-widest text-emerald-400/90">
          AI 计数小工具
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

      <div className="flex min-w-0 flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-6">
        <div className="mx-auto w-full max-w-full">
          {activeFolder && (
            <header className="mb-6 text-left">
              <p className="text-sm text-emerald-400/90">
                当前项目：{activeFolder.name}
              </p>
            </header>
          )}

          <section className="mb-8">
            <div className="mb-3 text-left">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                分数表
              </h2>
              {hasPlayers && (
                <p className="mt-1 text-xs text-zinc-500">
                  点击人名卡片，可继续为该玩家记分
                </p>
              )}
            </div>
            <ScoreSpreadsheet
              playerOrder={playerOrder}
              scores={scores}
              onPlayerClick={hasPlayers ? openPlayerEdit : undefined}
            />
          </section>

          <HuPaiAnalyzer showToast={showToast} />

          {(!hasPlayers || showBatchInput) && (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-left text-sm font-medium text-zinc-300">
                  {!hasPlayers ? '初始输入' : '批量添加'}
                </label>
                {hasPlayers && showBatchInput && (
                  <button
                    type="button"
                    className="text-xs text-zinc-500 underline active:text-zinc-400"
                    onClick={() => setShowBatchInput(false)}
                  >
                    收起
                  </button>
                )}
              </div>
              {!hasPlayers && (
                <p className="text-left text-xs leading-relaxed text-zinc-600">
                  写下名字和输赢，例如「小陈赢了20，阿美 -15」。有玩家后将改为点击卡片记分。
                </p>
              )}
              {hasPlayers && showBatchInput && (
                <p className="text-left text-xs leading-relaxed text-zinc-600">
                  可同时写多人、多行，与「初始输入」相同。
                </p>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={4}
                placeholder="小陈赢了20&#10;阿美 -15、老王输8"
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none ring-emerald-500/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30"
              />
              <div className="flex flex-wrap items-stretch gap-2 gap-y-3">
                <button
                  type="submit"
                  className="min-h-12 flex-1 rounded-xl bg-emerald-500 px-4 text-[15px] font-semibold text-emerald-950 active:bg-emerald-400"
                >
                  记一笔
                </button>
                <button
                  type="button"
                  onClick={undoLastBatch}
                  disabled={log.length === 0}
                  className="min-h-12 flex-1 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-[15px] font-medium text-zinc-200 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  撤销上一批
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-12 w-full rounded-xl border border-transparent px-3 text-[15px] text-zinc-500 active:text-rose-400"
                >
                  清空本项目
                </button>
              </div>
            </form>
          )}

          {hasPlayers && !showBatchInput && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBatchInput(true)
                  window.setTimeout(() => textareaRef.current?.focus(), 100)
                }}
                className="min-h-12 w-full rounded-xl border border-dashed border-zinc-600 bg-zinc-900/40 px-4 text-[15px] font-medium text-zinc-300 active:bg-zinc-800"
              >
                添加多人（或新玩家）
              </button>
              <div className="flex flex-wrap items-stretch gap-2">
                <button
                  type="button"
                  onClick={undoLastBatch}
                  disabled={log.length === 0}
                  className="min-h-12 flex-1 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-[15px] font-medium text-zinc-200 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  撤销上一批
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-12 flex-1 rounded-xl border border-transparent px-3 text-[15px] text-zinc-500 active:text-rose-400"
                >
                  清空本项目
                </button>
              </div>
            </div>
          )}

          {toast && (
            <p
              className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-left text-sm text-emerald-200"
              role="status"
            >
              {toast}
            </p>
          )}

          <section className="mt-10">
            <h2 className="text-left text-lg font-semibold text-white">
              记分记录
            </h2>
            {log.length === 0 ? (
              <p className="mt-4 text-left text-sm text-zinc-500">
                暂无记分记录。
              </p>
            ) : (
              <ol className="mt-4 space-y-2 text-left">
                {log.slice(0, 40).map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-500">
                      {new Date(row.ts).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-zinc-300">
                      <span className="font-medium text-white">{row.name}</span>
                      <span
                        className={
                          row.delta >= 0
                            ? ' ml-2 text-emerald-400'
                            : ' ml-2 text-rose-400'
                        }
                      >
                        {row.delta > 0 ? '+' : ''}
                        {row.delta}
                      </span>
                      <span className="ml-2 text-zinc-500">「{row.raw}」</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <footer className="mt-14 border-t border-zinc-800 pt-6 text-left text-xs leading-relaxed text-zinc-600">
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
