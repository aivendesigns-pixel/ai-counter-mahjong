import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  title: string
  nameDraft: string
  onChangeDraft: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}

export function FolderModal({
  open,
  title,
  nameDraft,
  onChangeDraft,
  onConfirm,
  onCancel,
  confirmLabel = '保存',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, title])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-600 bg-zinc-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="folder-modal-title"
          className="text-base font-semibold text-white"
        >
          {title}
        </h2>
        <label className="mt-4 block text-sm text-zinc-400" htmlFor="folder-name-input">
          名称
        </label>
        <input
          ref={inputRef}
          id="folder-name-input"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          enterKeyHint="done"
          value={nameDraft}
          onChange={(e) => onChangeDraft(e.target.value)}
          className="mt-2 w-full min-h-12 rounded-xl border border-zinc-600 bg-zinc-950 px-4 py-3 text-base text-zinc-100 outline-none ring-emerald-500/0 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30"
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
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
