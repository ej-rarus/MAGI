import {
  NODE_PROFILES,
  NODE_SEQUENCE,
  buildFallbackNodeJudgement,
  buildFinalVerdict,
  hashQuestion,
  type MagiNode,
  type NodeJudgement,
  type ProviderId,
  type Verdict,
} from '../src/lib/magiJudgement'

declare const process: {
  env: Record<string, string | undefined>
}

type ApiRequest = {
  method?: string
  body?: unknown
}

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader?: (name: string, value: string) => void
  end?: () => void
}

type ProviderResult = {
  node: MagiNode
  judge: NodeJudgement
  error?: string
}

const API_TIMEOUT_MS = 16_000

const providerEnv: Record<
  ProviderId,
  { key: string; model: string; baseUrl?: string }
> = {
  gemini: {
    key: 'GEMINI_API_KEY',
    model: 'GEMINI_MODEL',
    baseUrl: 'GEMINI_BASE_URL',
  },
  claude: {
    key: 'ANTHROPIC_API_KEY',
    model: 'ANTHROPIC_MODEL',
    baseUrl: 'ANTHROPIC_BASE_URL',
  },
  chatgpt: {
    key: 'OPENAI_API_KEY',
    model: 'OPENAI_MODEL',
    baseUrl: 'OPENAI_BASE_URL',
  },
}

const nodeSystemPrompt = (node: MagiNode) => {
  const profile = NODE_PROFILES[node]

  return [
    `You are ${profile.label}, the ${profile.displayProvider} vote inside a MAGI-style three-node council.`,
    `Your role is ${profile.role}.`,
    'Return only compact JSON. Do not include markdown, code fences, or hidden reasoning.',
    'Use one verdict: "可決" for approve, "否決" for reject, or "保留" for hold.',
    'Keep summary, reason, and concern brief enough for a small terminal panel.',
  ].join('\n')
}

const nodeUserPrompt = (question: string) => {
  return [
    'Judge this user question as one MAGI node.',
    `Question: ${question}`,
    'JSON shape: {"verdict":"可決|否決|保留","confidence":0-100,"summary":"...","reason":"...","concern":"..."}',
  ].join('\n')
}

const readEnv = (name: string) => process.env[name]?.trim() ?? ''

const parseBody = (body: unknown) => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as unknown
    } catch {
      return null
    }
  }

  return body
}

const readQuestion = (body: unknown) => {
  const payload = parseBody(body)
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return ''
  }

  const question = (payload as Record<string, unknown>).question
  return typeof question === 'string' ? question.trim() : ''
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const fetchJson = async (url: string, init: RequestInit) => {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status}${text ? ` ${text.slice(0, 160)}` : ''}`)
    }

    return (await response.json()) as unknown
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

const stripCodeFence = (text: string) => {
  return text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
}

const parseModelJson = (text: string) => {
  const cleaned = stripCodeFence(text)

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
    }

    throw new Error('모델 응답에서 JSON을 찾지 못했습니다.')
  }
}

const normalizeVerdict = (value: unknown): Verdict => {
  if (value === '可決' || value === '否決' || value === '保留') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    if (/approve|approved|yes|accept|pass|go/.test(normalized)) return '可決'
    if (/reject|rejected|deny|denied|no|stop|block/.test(normalized)) return '否決'
    if (/hold|pending|defer|conditional|maybe/.test(normalized)) return '保留'
  }

  return '保留'
}

const normalizeConfidence = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(Math.round(value), 100))
}

const normalizeText = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const buildApiJudge = (
  node: MagiNode,
  question: string,
  model: string,
  parsed: Record<string, unknown>,
) => {
  const verdict = normalizeVerdict(parsed.verdict)
  const fallback = buildFallbackNodeJudgement(node, question, verdict)

  return {
    ...fallback,
    verdict,
    confidence: normalizeConfidence(parsed.confidence, fallback.confidence),
    model,
    source: 'api' as const,
    summary: normalizeText(parsed.summary, fallback.summary),
    reason: normalizeText(parsed.reason, fallback.reason),
    concern: normalizeText(parsed.concern, fallback.concern),
  }
}

const extractOpenAiText = (payload: unknown) => {
  if (!isRecord(payload)) return ''
  if (typeof payload.output_text === 'string') return payload.output_text

  const output = payload.output
  if (!Array.isArray(output)) return ''

  return output
    .flatMap((item) => {
      if (!isRecord(item) || !Array.isArray(item.content)) return []
      return item.content
        .map((content) => {
          if (!isRecord(content)) return ''
          return typeof content.text === 'string' ? content.text : ''
        })
        .filter(Boolean)
    })
    .join('\n')
}

const extractClaudeText = (payload: unknown) => {
  if (!isRecord(payload) || !Array.isArray(payload.content)) return ''

  return payload.content
    .map((content) => {
      if (!isRecord(content)) return ''
      return typeof content.text === 'string' ? content.text : ''
    })
    .filter(Boolean)
    .join('\n')
}

const extractGeminiText = (payload: unknown) => {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) return ''

  return payload.candidates
    .flatMap((candidate) => {
      if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
        return []
      }

      return candidate.content.parts
        .map((part) => {
          if (!isRecord(part)) return ''
          return typeof part.text === 'string' ? part.text : ''
        })
        .filter(Boolean)
    })
    .join('\n')
}

const callOpenAi = async (question: string) => {
  const key = readEnv(providerEnv.chatgpt.key)
  if (!key) throw new Error('OPENAI_API_KEY가 없습니다.')

  const model = readEnv(providerEnv.chatgpt.model) || NODE_PROFILES.casper.defaultModel
  const baseUrl = readEnv(providerEnv.chatgpt.baseUrl ?? '') || 'https://api.openai.com/v1'
  const payload = await fetchJson(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'developer',
          content: [{ type: 'input_text', text: nodeSystemPrompt('casper') }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: nodeUserPrompt(question) }],
        },
      ],
      max_output_tokens: 600,
    }),
  })

  const text = extractOpenAiText(payload)
  if (!text) throw new Error('OpenAI 응답 텍스트가 비어 있습니다.')

  return buildApiJudge('casper', question, model, parseModelJson(text))
}

const callClaude = async (question: string) => {
  const key = readEnv(providerEnv.claude.key)
  if (!key) throw new Error('ANTHROPIC_API_KEY가 없습니다.')

  const model = readEnv(providerEnv.claude.model) || NODE_PROFILES.balthasar.defaultModel
  const baseUrl = readEnv(providerEnv.claude.baseUrl ?? '') || 'https://api.anthropic.com/v1'
  const payload = await fetchJson(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      system: nodeSystemPrompt('balthasar'),
      messages: [
        {
          role: 'user',
          content: nodeUserPrompt(question),
        },
      ],
    }),
  })

  const text = extractClaudeText(payload)
  if (!text) throw new Error('Claude 응답 텍스트가 비어 있습니다.')

  return buildApiJudge('balthasar', question, model, parseModelJson(text))
}

const callGemini = async (question: string) => {
  const key = readEnv(providerEnv.gemini.key)
  if (!key) throw new Error('GEMINI_API_KEY가 없습니다.')

  const model = readEnv(providerEnv.gemini.model) || NODE_PROFILES.melchior.defaultModel
  const baseUrl = readEnv(providerEnv.gemini.baseUrl ?? '') || 'https://generativelanguage.googleapis.com/v1beta'
  const payload = await fetchJson(`${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: nodeSystemPrompt('melchior') }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: nodeUserPrompt(question) }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 600,
      },
    }),
  })

  const text = extractGeminiText(payload)
  if (!text) throw new Error('Gemini 응답 텍스트가 비어 있습니다.')

  return buildApiJudge('melchior', question, model, parseModelJson(text))
}

const callNodeProvider = async (node: MagiNode, question: string): Promise<ProviderResult> => {
  try {
    if (node === 'melchior') {
      return { node, judge: await callGemini(question) }
    }

    if (node === 'balthasar') {
      return { node, judge: await callClaude(question) }
    }

    return { node, judge: await callOpenAi(question) }
  } catch (error) {
    const message = error instanceof Error ? error.message : `${NODE_PROFILES[node].displayProvider} 호출 실패`
    return {
      node,
      judge: buildFallbackNodeJudgement(node, question),
      error: `${NODE_PROFILES[node].displayProvider}: ${message}`,
    }
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && request.method !== 'POST') {
    response.setHeader?.('Allow', 'POST')
    response.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const question = readQuestion(request.body)
  if (!question) {
    response.status(400).json({ error: 'question is required' })
    return
  }

  const results = await Promise.all(NODE_SEQUENCE.map((node) => callNodeProvider(node, question)))
  const judges = results.reduce<Record<MagiNode, NodeJudgement>>((result, item) => {
    result[item.node] = item.judge
    return result
  }, {} as Record<MagiNode, NodeJudgement>)
  const nodeVerdicts = NODE_SEQUENCE.reduce<Record<MagiNode, Verdict>>((result, node) => {
    result[node] = judges[node].verdict
    return result
  }, {} as Record<MagiNode, Verdict>)
  const apiCount = results.filter((item) => item.judge.source === 'api').length

  response.status(200).json({
    question,
    code: hashQuestion(question),
    finalVerdict: buildFinalVerdict(nodeVerdicts),
    judges,
    source: apiCount === 0 ? 'fallback' : apiCount === NODE_SEQUENCE.length ? 'api' : 'mixed',
    generatedAt: new Date().toISOString(),
    errors: results.flatMap((item) => (item.error ? [item.error] : [])),
  })
}
