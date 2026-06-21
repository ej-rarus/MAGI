import {
  buildFallbackJudgement,
  normalizeJudgementPayload,
  type MagiJudgementResponse,
} from './magiJudgement'

type ApiMode = 'auto' | 'api' | 'local'
type MagiFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type RequestMagiJudgementOptions = {
  apiMode?: ApiMode
  endpoint?: string
  fetcher?: MagiFetch
  timeoutMs?: number
}

type ResolvedRequestOptions = {
  apiMode: ApiMode
  endpoint: string
  fetcher?: MagiFetch
  timeoutMs: number
}

const DEFAULT_ENDPOINT = '/api/judgement'
const DEFAULT_TIMEOUT_MS = 6_000

const readEnv = (name: string) => {
  const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>
  return env[name]?.trim() ?? ''
}

const normalizeApiMode = (value: string): ApiMode => {
  const normalized = value.toLowerCase()

  if (['local', 'fallback', 'off', 'false', '0'].includes(normalized)) {
    return 'local'
  }

  if (['api', 'remote', 'on', 'true', '1'].includes(normalized)) {
    return 'api'
  }

  return 'auto'
}

const resolveTimeoutMs = (timeoutMs?: number) => {
  const envTimeout = Number(readEnv('VITE_MAGI_API_TIMEOUT_MS'))
  const nextTimeout = timeoutMs ?? envTimeout

  return Number.isFinite(nextTimeout) && nextTimeout > 0 ? nextTimeout : DEFAULT_TIMEOUT_MS
}

const resolveOptions = (
  options?: number | RequestMagiJudgementOptions,
): ResolvedRequestOptions => {
  const optionBag = typeof options === 'number' ? { timeoutMs: options } : options ?? {}
  const fetcher = optionBag.fetcher ?? globalThis.fetch?.bind(globalThis)
  const endpoint = optionBag.endpoint ?? readEnv('VITE_MAGI_API_ENDPOINT') ?? ''

  return {
    apiMode: optionBag.apiMode ?? normalizeApiMode(readEnv('VITE_MAGI_API_MODE')),
    endpoint: endpoint || DEFAULT_ENDPOINT,
    fetcher,
    timeoutMs: resolveTimeoutMs(optionBag.timeoutMs),
  }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'MAGI API 연결 실패: 응답 시간이 초과되어 로컬 판단으로 전환했습니다.'
  }

  if (error instanceof Error && error.message) {
    return `MAGI API 연결 실패: ${error.message}`
  }

  return 'MAGI API 연결 실패: 로컬 판단으로 전환했습니다.'
}

export const requestMagiJudgement = async (
  question: string,
  options?: number | RequestMagiJudgementOptions,
): Promise<MagiJudgementResponse> => {
  const { apiMode, endpoint, fetcher, timeoutMs } = resolveOptions(options)

  if (apiMode === 'local') {
    return buildFallbackJudgement(question, 'MAGI API가 비활성화되어 로컬 판단으로 실행했습니다.')
  }

  if (!fetcher) {
    return buildFallbackJudgement(question, 'MAGI API 연결 기능을 사용할 수 없어 로컬 판단으로 전환했습니다.')
  }

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload: unknown = await response.json()
    return normalizeJudgementPayload(payload, question)
  } catch (error) {
    return buildFallbackJudgement(question, getErrorMessage(error))
  } finally {
    globalThis.clearTimeout(timeout)
  }
}
