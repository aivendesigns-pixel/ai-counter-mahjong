import { useState } from 'react'
import type { Folder } from '../lib/storage'

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}

function IconChevron({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={`${className ?? ''} transition-transform ${open ? 'rotate-180' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

type Props = {
  folders: Folder[]
  activeFolderId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

export function FolderSidebar({
  folders,
  activeFolderId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false)
  const activeFolder = folders.find((f) => f.id === activeFolderId)

  return (
    <aside className="w-full shrink-0 border-b border-zinc-800/60 bg-zinc-950 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="mx-auto max-w-lg">
        {/* Collapsed bar: current project name + toggle */}
        <div className="flex items-center gap-2 py-2.5">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left active:bg-zinc-800/50"
          >
            <span className="truncate text-sm font-medium text-zinc-400">
              {activeFolder?.name ?? '未选择项目'}
            </span>
            <IconChevron className="shrink-0 text-zinc-500" open={open} />
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="touch-manipulation flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 active:bg-zinc-800/50 active:text-emerald-400"
          >
            <IconPlus className="shrink-0" />
            新建
          </button>
        </div>

        {/* Expanded folder list */}
        {open && (
          <nav
            className="space-y-1.5 pb-3 overflow-y-auto overscroll-contain max-h-[min(40vh,16rem)] [-webkit-overflow-scrolling:touch]"
            aria-label="项目列表"
          >
            {folders.map((f) => {
              const active = f.id === activeFolderId
              return (
                <div
                  key={f.id}
                  className={[
                    'flex min-h-[44px] items-stretch gap-0.5 overflow-hidden rounded-xl border transition-colors',
                    active
                      ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
                      : 'border-zinc-800/60 bg-zinc-900/40 active:border-zinc-700',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(f.id)
                      setOpen(false)
                    }}
                    className={`min-w-0 flex-1 px-3 py-2 text-left text-sm leading-snug ${
                      active
                        ? 'font-semibold text-emerald-200'
                        : 'font-medium text-zinc-300'
                    }`}
                    title={f.name}
                  >
                    <span className="line-clamp-2 break-words">{f.name}</span>
                  </button>
                  <div className="flex shrink-0 items-stretch border-l border-zinc-800/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRename(f.id)
                      }}
                      className="touch-manipulation flex w-[38px] items-center justify-center text-zinc-600 active:bg-zinc-800/90 active:text-emerald-300"
                      aria-label={`重命名「${f.name}」`}
                      title="重命名"
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete(f.id)
                      }}
                      className="touch-manipulation flex w-[38px] items-center justify-center text-zinc-600 active:bg-zinc-800/90 active:text-rose-400"
                      aria-label={`删除「${f.name}」`}
                      title="删除"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              )
            })}
          </nav>
        )}
      </div>
    </aside>
  )
}
