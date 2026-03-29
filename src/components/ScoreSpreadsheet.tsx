type Props = {
  playerOrder: string[]
  scores: Record<string, number>
  /** 有玩家后点击卡片编辑分数 */
  onPlayerClick?: (name: string) => void
}

export function ScoreSpreadsheet({
  playerOrder,
  scores,
  onPlayerClick,
}: Props) {
  const cols = playerOrder.filter((n) => n in scores)

  if (cols.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700/70 bg-zinc-900/25 px-5 py-12 text-center">
        <p className="text-[15px] text-zinc-500">还没有人</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          请先在下方「初始输入」里记下名字和分数
        </p>
      </div>
    )
  }

  const single = cols.length === 1
  const interactive = Boolean(onPlayerClick)

  return (
    <div
      className={
        single
          ? 'grid grid-cols-1 gap-3'
          : 'grid grid-cols-2 gap-2.5'
      }
      role="list"
      aria-label="各玩家当前分数"
    >
      {cols.map((name) => {
        const total = scores[name] ?? 0
        const positive = total > 0
        const negative = total < 0
        const scoreClass = positive
          ? 'text-emerald-400'
          : negative
            ? 'text-rose-400'
            : 'text-zinc-400'
        const tint = positive
          ? 'from-emerald-500/[0.08] to-zinc-950/95 ring-emerald-500/15'
          : negative
            ? 'from-rose-500/[0.07] to-zinc-950/95 ring-rose-500/12'
            : 'from-zinc-800/40 to-zinc-950/95 ring-zinc-700/30'

        const cardClass = [
          'relative flex min-h-[108px] w-full flex-col rounded-2xl border border-zinc-700/70 bg-gradient-to-b p-3.5 text-left shadow-sm ring-1 transition-transform',
          tint,
          single ? 'px-4 py-4' : '',
          interactive
            ? 'cursor-pointer active:scale-[0.98] active:opacity-95'
            : '',
        ].join(' ')

        const body = (
          <>
            <p className="min-w-0 break-words text-[15px] font-semibold leading-snug text-zinc-50">
              {name}
            </p>
            <p
              className={`mt-auto pt-3 text-[28px] font-bold tabular-nums leading-none tracking-tight ${scoreClass}`}
            >
              {positive ? '+' : ''}
              {total}
            </p>
          </>
        )

        if (interactive) {
          return (
            <button
              key={name}
              type="button"
              role="listitem"
              className={cardClass}
              onClick={() => onPlayerClick?.(name)}
              aria-label={`编辑 ${name} 的分数，当前 ${total}`}
            >
              {body}
            </button>
          )
        }

        return (
          <article key={name} role="listitem" className={cardClass}>
            {body}
          </article>
        )
      })}
    </div>
  )
}
