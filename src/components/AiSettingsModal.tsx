import { useEffect, useRef, useState } from 'react'
import type { AiProvider, AiSettings } from '../lib/aiSettings'
import { defaultAiSettings } from '../lib/aiSettings'

type Props = {
  open: boolean
  initial: AiSettings
  onSave: (s: AiSettings) => void
  onCancel: () => void
}

export function AiSettingsModal({ open, initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<AiSettings>(initial)
  const keyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setDraft(initial)
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => keyRef.current?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const d = defaultAiSettings()

  const setProvider = (provider: AiProvider) =>
    setDraft((x) => ({ ...x, provider }))

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-settings-title"
      onClick={onCancel}
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-600 bg-zinc-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="ai-settings-title"
          className="text-base font-semibold text-white"
        >
          胡牌算番 · API
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Key 仅保存在本机浏览器。推荐优先使用{' '}
          <strong className="text-zinc-400">Google Gemini</strong>
          （Google AI Studio 申请 Key）；也可切换为 OpenAI 兼容接口。
        </p>

        <p className="mt-4 text-xs font-medium text-zinc-400">接口类型</p>
        <div className="mt-2 flex rounded-xl border border-zinc-700 p-1">
          <button
            type="button"
            onClick={() => setProvider('gemini')}
            className={`min-h-10 flex-1 rounded-lg text-sm font-medium transition ${
              draft.provider === 'gemini'
                ? 'bg-emerald-600/90 text-emerald-950'
                : 'text-zinc-400 active:bg-zinc-800'
            }`}
          >
            Gemini
          </button>
          <button
            type="button"
            onClick={() => setProvider('openai')}
            className={`min-h-10 flex-1 rounded-lg text-sm font-medium transition ${
              draft.provider === 'openai'
                ? 'bg-emerald-600/90 text-emerald-950'
                : 'text-zinc-400 active:bg-zinc-800'
            }`}
          >
            OpenAI 兼容
          </button>
        </div>

        <label className="mt-4 block text-sm text-zinc-400" htmlFor="ai-key">
          API Key
        </label>
        <input
          ref={keyRef}
          id="ai-key"
          type="password"
          autoComplete="off"
          value={draft.apiKey}
          onChange={(e) => setDraft((x) => ({ ...x, apiKey: e.target.value }))}
          placeholder={
            draft.provider === 'gemini' ? 'AIza…' : 'sk-…'
          }
          className="mt-1.5 w-full min-h-11 rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50"
        />

        {draft.provider === 'gemini' ? (
          <>
            <label
              className="mt-3 block text-sm text-zinc-400"
              htmlFor="gemini-base"
            >
              Gemini Base URL（到 v1beta 为止）
            </label>
            <input
              id="gemini-base"
              type="url"
              value={draft.geminiBaseUrl}
              onChange={(e) =>
                setDraft((x) => ({
                  ...x,
                  geminiBaseUrl: e.target.value.trim(),
                }))
              }
              placeholder={d.geminiBaseUrl}
              className="mt-1.5 w-full min-h-11 rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-500/50"
            />
            <p className="mt-1 text-[11px] text-zinc-600">
              开发时可用 <code className="text-zinc-500">{d.geminiBaseUrl}</code>{' '}
              走 Vite 代理；线上若遇 CORS，请改用可代理的地址。
            </p>
            <label
              className="mt-3 block text-sm text-zinc-400"
              htmlFor="gemini-model"
            >
              模型名
            </label>
            <input
              id="gemini-model"
              type="text"
              value={draft.geminiModel}
              onChange={(e) =>
                setDraft((x) => ({
                  ...x,
                  geminiModel: e.target.value.trim(),
                }))
              }
              placeholder="gemini-2.5-flash"
              className="mt-1.5 w-full min-h-11 rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-500/50"
            />
          </>
        ) : (
          <>
            <label
              className="mt-3 block text-sm text-zinc-400"
              htmlFor="openai-base"
            >
              OpenAI Base URL（须含 /v1）
            </label>
            <input
              id="openai-base"
              type="url"
              value={draft.openaiBaseUrl}
              onChange={(e) =>
                setDraft((x) => ({
                  ...x,
                  openaiBaseUrl: e.target.value.trim(),
                }))
              }
              placeholder={d.openaiBaseUrl}
              className="mt-1.5 w-full min-h-11 rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-500/50"
            />
            <p className="mt-1 text-[11px] text-zinc-600">
              开发时 <code className="text-zinc-500">{d.openaiBaseUrl}</code>{' '}
              走 Vite 代理。
            </p>
            <label
              className="mt-3 block text-sm text-zinc-400"
              htmlFor="openai-model"
            >
              模型名
            </label>
            <input
              id="openai-model"
              type="text"
              value={draft.openaiModel}
              onChange={(e) =>
                setDraft((x) => ({
                  ...x,
                  openaiModel: e.target.value.trim(),
                }))
              }
              placeholder="gpt-4o-mini"
              className="mt-1.5 w-full min-h-11 rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-500/50"
            />
          </>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl border border-zinc-600 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-200 active:bg-zinc-700"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-emerald-950 active:bg-emerald-400"
            onClick={() => onSave(draft)}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
