import type { Folder } from '../lib/storage'

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
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
      width="18"
      height="18"
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
      width="18"
      height="18"
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
  return (
    <aside className="w-full shrink-0 border-b border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/50 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="mx-auto max-w-lg px-0 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-[15px] font-semibold tracking-tight text-zinc-100">
            项目
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="touch-manipulation flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2 text-[13px] font-semibold text-emerald-300 active:bg-emerald-500/20"
          >
            <IconPlus className="shrink-0 text-emerald-400" />
            新建
          </button>
        </div>

        <nav
          className="mt-4 max-h-[min(52vh,20rem)] space-y-2 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]"
          aria-label="项目列表"
        >
          {folders.map((f) => {
            const active = f.id === activeFolderId
            return (
              <div
                key={f.id}
                className={[
                  'flex min-h-[52px] items-stretch gap-1 overflow-hidden rounded-2xl border transition-colors',
                  active
                    ? 'border-emerald-500/45 bg-emerald-500/[0.12] shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
                    : 'border-zinc-800 bg-zinc-900/55 active:border-zinc-700',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => onSelect(f.id)}
                  className={`min-w-0 flex-1 px-4 py-3 text-left text-[15px] leading-snug ${
                    active
                      ? 'font-semibold text-emerald-100'
                      : 'font-medium text-zinc-200'
                  }`}
                  title={f.name}
                >
                  <span className="line-clamp-2 break-words">{f.name}</span>
                </button>
                <div className="flex shrink-0 items-stretch border-l border-zinc-800/80 bg-zinc-950/30">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onRename(f.id)
                    }}
                    className="touch-manipulation flex w-[46px] items-center justify-center text-zinc-500 active:bg-zinc-800/90 active:text-emerald-300"
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
                    className="touch-manipulation flex w-[46px] items-center justify-center text-zinc-500 active:bg-zinc-800/90 active:text-rose-400"
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
      </div>
    </aside>
  )
}
