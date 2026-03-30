import { useCallback, useRef, useState } from 'react'
import { analyzeHuPaiImage, fileToCompressedDataUrl } from '../lib/analyzeHuPai'
import { stripMarkdownDisplay } from '../lib/stripMarkdownDisplay'
import { loadAiSettings, saveAiSettings, type AiSettings } from '../lib/aiSettings'
import { AiSettingsModal } from './AiSettingsModal'

type Props = {
  showToast: (msg: string) => void
}

export function HuPaiAnalyzer({ showToast }: Props) {
  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pickPhoto = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) {
        showToast('请选择图片')
        return
      }
      setResult(null)
      setFileName(file.name)
      try {
        const url = await fileToCompressedDataUrl(file)
        setPreview(url)
      } catch {
        showToast('读取图片失败')
      }
    },
    [showToast],
  )

  const runAnalyze = useCallback(async () => {
    if (!preview) {
      showToast('请先拍照或选图')
      return
    }
    if (!settings.apiKey.trim()) {
      showToast('请先配置 API Key')
      setSettingsOpen(true)
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const text = await analyzeHuPaiImage(preview, settings)
      setResult(text)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(msg.slice(0, 120))
      setResult(`请求失败：\n\n${msg}`)
    } finally {
      setLoading(false)
    }
  }, [preview, settings, showToast])

  const saveSettings = useCallback((s: AiSettings) => {
    const next = {
      ...s,
      openaiBaseUrl: s.openaiBaseUrl.replace(/\/$/, ''),
      geminiBaseUrl: s.geminiBaseUrl.replace(/\/$/, ''),
    }
    saveAiSettings(next)
    setSettings(next)
    setSettingsOpen(false)
    showToast('已保存 API 设置')
  }, [showToast])

  return (
    <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            胡牌拍照算番
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            拍照后由模型识别牌面，只回答<strong className="text-zinc-400">胡的什么牌</strong>、
            <strong className="text-zinc-400">约多少番</strong>，不写入本应用记分。识别受光线、角度影响，结果仅供参考。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="shrink-0 rounded-lg border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-300 active:bg-zinc-800"
        >
          API 设置
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={pickPhoto}
          className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-[15px] font-semibold text-emerald-950 active:bg-emerald-500"
        >
          拍照 / 选图
        </button>
        <button
          type="button"
          disabled={!preview || loading}
          onClick={runAnalyze}
          className="min-h-11 flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 text-[15px] font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? '分析中…' : 'AI 分析'}
        </button>
      </div>

      {preview && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-700">
          <img
            src={preview}
            alt="待分析"
            className="max-h-56 w-full object-contain bg-black/40"
          />
          {fileName && (
            <p className="border-t border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-500">
              {fileName}
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-zinc-700/80 bg-zinc-950/80">
          <p className="border-b border-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-500">
            分析结果
          </p>
          <div
            className="max-h-[min(75dvh,36rem)] min-h-0 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-left text-[13px] leading-relaxed text-zinc-200">
              {stripMarkdownDisplay(result)}
            </div>
          </div>
        </div>
      )}

      <AiSettingsModal
        open={settingsOpen}
        initial={settings}
        onSave={saveSettings}
        onCancel={() => setSettingsOpen(false)}
      />
    </section>
  )
}
