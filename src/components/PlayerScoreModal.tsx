import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  playerName: string
  draft: string
  onChangeDraft: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function PlayerScoreModal({
  open,
  playerName,
  draft,
  onChangeDraft,
  onConfirm,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, playerName])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-score-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-600 bg-zinc-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="player-score-title"
          className="text-base font-semibold text-white"
        >
          为「{playerName}」记分
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          可只写变化量，例如 +10、−5、赢20、输15、得8、扣3
        </p>
        <label className="mt-4 block text-sm text-zinc-400" htmlFor="player-score-input">
          本笔变化
        </label>
        <input
          ref={inputRef}
          id="player-score-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          enterKeyHint="done"
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onConfirm()
            }
          }}
          placeholder="+10 或 赢20"
          className="mt-2 w-full min-h-12 rounded-xl border border-zinc-600 bg-zinc-950 px-4 py-3 text-base text-zinc-100 outline-none ring-emerald-500/0 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30"
        />
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="min-h-12 flex-1 rounded-xl border border-zinc-600 bg-zinc-800 py-3 text-[15px] font-medium text-zinc-200 active:bg-zinc-700"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="min-h-12 flex-1 rounded-xl bg-emerald-500 py-3 text-[15px] font-semibold text-emerald-950 active:bg-emerald-400"
            onClick={onConfirm}
          >
            记上
          </button>
        </div>
      </div>
    </div>
  )
}
