const STORAGE_KEY = 'ai-counter-ai-settings-v2'

export type AiProvider = 'openai' | 'gemini'

export type AiSettings = {
  provider: AiProvider
  apiKey: string
  /** OpenAI 兼容：…/v1，接 /chat/completions */
  openaiBaseUrl: string
  openaiModel: string
  /** Gemini：…/v1beta，接 /models/{model}:generateContent */
  geminiBaseUrl: string
  geminiModel: string
}

export function defaultAiSettings(): AiSettings {
  const dev = import.meta.env.DEV
  return {
    provider: 'gemini',
    apiKey: '',
    openaiBaseUrl: dev ? '/api/openai/v1' : 'https://api.openai.com/v1',
    openaiModel: 'gpt-4o-mini',
    geminiBaseUrl: dev
      ? '/api/gemini/v1beta'
      : 'https://generativelanguage.googleapis.com/v1beta',
    geminiModel: 'gemini-2.5-flash',
  }
}

/** 兼容旧版 ai-counter-ai-settings-v1：仅 OpenAI 三字段 */
function migrateFromV1(raw: string): AiSettings | null {
  try {
    const p = JSON.parse(raw) as {
      apiKey?: string
      baseUrl?: string
      model?: string
    }
    if (typeof p.baseUrl !== 'string' || !p.baseUrl) return null
    const d = defaultAiSettings()
    return {
      provider: 'openai',
      apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
      openaiBaseUrl: p.baseUrl.trim().replace(/\/$/, ''),
      openaiModel:
        typeof p.model === 'string' && p.model.trim()
          ? p.model.trim()
          : d.openaiModel,
      geminiBaseUrl: d.geminiBaseUrl,
      geminiModel: d.geminiModel,
    }
  } catch {
    return null
  }
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem('ai-counter-ai-settings-v1')
      if (legacy) {
        const m = migrateFromV1(legacy)
        if (m) {
          saveAiSettings(m)
          return m
        }
      }
      return defaultAiSettings()
    }
    const p = JSON.parse(raw) as Partial<AiSettings>
    const d = defaultAiSettings()
    const provider: AiProvider =
      p.provider === 'openai' || p.provider === 'gemini' ? p.provider : d.provider
    return {
      provider,
      apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
      openaiBaseUrl:
        typeof p.openaiBaseUrl === 'string' && p.openaiBaseUrl.trim()
          ? p.openaiBaseUrl.trim().replace(/\/$/, '')
          : d.openaiBaseUrl,
      openaiModel:
        typeof p.openaiModel === 'string' && p.openaiModel.trim()
          ? p.openaiModel.trim()
          : d.openaiModel,
      geminiBaseUrl:
        typeof p.geminiBaseUrl === 'string' && p.geminiBaseUrl.trim()
          ? p.geminiBaseUrl.trim().replace(/\/$/, '')
          : d.geminiBaseUrl,
      geminiModel:
        typeof p.geminiModel === 'string' && p.geminiModel.trim()
          ? p.geminiModel.trim()
          : d.geminiModel,
    }
  } catch {
    return defaultAiSettings()
  }
}

export function saveAiSettings(s: AiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}
