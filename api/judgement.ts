type MagiNode = 'melchior' | 'balthasar' | 'casper'
type Verdict = '可決' | '否決' | '保留'
type JudgeSource = 'api' | 'fallback'
type ProviderId = 'gemini' | 'claude' | 'chatgpt'

type NodeProfile = {
  node: MagiNode
  label: string
  provider: ProviderId
  displayProvider: string
  role: string
  defaultModel: string
}

type NodeJudgement = {
  node: MagiNode
  verdict: Verdict
  confidence: number
  provider: ProviderId
  model: string
  source: JudgeSource
  summary: string
  reason: string
  concern: string
}

const NODE_SEQUENCE: MagiNode[] = ['melchior', 'balthasar', 'casper']

const NODE_PROFILES: Record<MagiNode, NodeProfile> = {
  melchior: {
    node: 'melchior',
    label: 'MELCHIOR•1',
    provider: 'gemini',
    displayProvider: 'Gemini',
    role: '시스템 분석과 실행 가능성',
    defaultModel: 'gemini-3.5-flash',
  },
  balthasar: {
    node: 'balthasar',
    label: 'BALTHASAR•2',
    provider: 'claude',
    displayProvider: 'Claude',
    role: '위험, 보호, 윤리적 제동',
    defaultModel: 'claude-sonnet-4-6',
  },
  casper: {
    node: 'casper',
    label: 'CASPER•3',
    provider: 'chatgpt',
    displayProvider: 'ChatGPT',
    role: '사용자 의도와 대화적 균형',
    defaultModel: 'gpt-5.4-mini',
  },
}

const fallbackCopy: Record<
  MagiNode,
  Record<Verdict, { summary: string; reason: string; concern: string }>
> = {
  melchior: {
    可決: {
      summary: '실행 경로가 비교적 명확하며 시스템 부담이 관리 가능한 수준입니다.',
      reason: '입력의 구조, 비용, 실패 지점을 우선 계산했습니다.',
      concern: '전제 조건이 바뀌면 결론도 바뀔 수 있습니다.',
    },
    否決: {
      summary: '현재 조건에서는 실행 리스크가 이득보다 큽니다.',
      reason: '의존성, 작업 순서, 되돌리기 가능성을 확인했습니다.',
      concern: '범위를 줄이거나 검증 가능한 하위 단계로 다시 제출하는 편이 안전합니다.',
    },
    保留: {
      summary: '판단에 필요한 조건이 일부 부족해 보류가 적절합니다.',
      reason: '필요한 정보와 실행 가능성을 분리했습니다.',
      concern: '질문을 더 구체화하지 않으면 결과가 흔들릴 수 있습니다.',
    },
  },
  balthasar: {
    可決: {
      summary: '보호 장치를 전제로 진행해도 무리가 작습니다.',
      reason: '사용자 피해, 되돌릴 수 없는 변경, 윤리적 부담을 먼저 봤습니다.',
      concern: '가결이더라도 변경 전 백업 또는 중단 조건을 명시해야 합니다.',
    },
    否決: {
      summary: '안전성과 책임 측면에서 중단이 낫습니다.',
      reason: '위험 신호와 복구 비용을 우선했습니다.',
      concern: '목표를 유지하되 더 작은 실험이나 읽기 전용 분석으로 바꾸는 편이 좋습니다.',
    },
    保留: {
      summary: '보호 조건을 확정하기 전까지는 결정을 미루는 편이 좋습니다.',
      reason: '승인 조건보다 중단 조건을 먼저 찾았습니다.',
      concern: '사용자 확인, 롤백 계획, 영향 범위를 먼저 정해야 합니다.',
    },
  },
  casper: {
    可決: {
      summary: '사용자 의도와 결과 효용이 잘 맞습니다.',
      reason: '질문의 목적, 실제 사용감, 설명 가능성을 봤습니다.',
      concern: '결과를 너무 단정적으로 보여주지 말고 선택 이유를 함께 남겨야 합니다.',
    },
    否決: {
      summary: '사용자가 기대한 결과와 실제 결과가 어긋날 가능성이 큽니다.',
      reason: '의도와 체감 품질을 비교했습니다.',
      concern: '질문을 다시 묻거나 대안을 제시하는 흐름이 필요합니다.',
    },
    保留: {
      summary: '방향은 보이지만 결론으로 닫기에는 맥락이 부족합니다.',
      reason: '사용자 의도는 읽히지만, 최종 결론을 낼 만큼의 맥락은 아직 부족합니다.',
      concern: '한 번 더 확인 질문을 하거나 시안을 먼저 보여주는 편이 자연스럽습니다.',
    },
  },
}

const hashQuestion = (question: string) => {
  return Array.from(question).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 997
  }, 263)
}

const buildDemoVerdicts = (question: string): Record<MagiNode, Verdict> => {
  const normalizedQuestion = question.toLowerCase()

  if (/가결|可決|approve|approved/.test(normalizedQuestion)) {
    return { melchior: '可決', balthasar: '可決', casper: '可決' }
  }

  if (/부결|否決|reject|rejected/.test(normalizedQuestion)) {
    return { melchior: '否決', balthasar: '保留', casper: '否決' }
  }

  if (/보류|保留|hold|pending/.test(normalizedQuestion)) {
    return { melchior: '可決', balthasar: '保留', casper: '否決' }
  }

  const seed = hashQuestion(`${question}:${Date.now()}:${Math.random()}`)
  const outcomes: Array<Record<MagiNode, Verdict>> = [
    { melchior: '可決', balthasar: '可決', casper: '可決' },
    { melchior: '可決', balthasar: '保留', casper: '可決' },
    { melchior: '保留', balthasar: '保留', casper: '可決' },
    { melchior: '保留', balthasar: '保留', casper: '保留' },
    { melchior: '否決', balthasar: '否決', casper: '保留' },
    { melchior: '否決', balthasar: '否決', casper: '否決' },
  ]

  return outcomes[seed % outcomes.length]
}

const buildFinalVerdict = (nodeVerdicts: Record<MagiNode, Verdict>): Verdict => {
  const counts = Object.values(nodeVerdicts).reduce<Record<Verdict, number>>(
    (result, verdict) => ({
      ...result,
      [verdict]: result[verdict] + 1,
    }),
    { 可決: 0, 否決: 0, 保留: 0 },
  )

  if (counts.可決 >= 2) return '可決'
  if (counts.否決 >= 2) return '否決'
  return '保留'
}

const buildFallbackNodeJudgement = (
  node: MagiNode,
  question: string,
  verdict = buildDemoVerdicts(question)[node],
): NodeJudgement => {
  const profile = NODE_PROFILES[node]
  const copy = fallbackCopy[node][verdict]
  const signalCode = `${hashQuestion(`${question}:${node}:${verdict}`).toString().padStart(3, '0')}`

  return {
    node,
    verdict,
    confidence: 64 + (hashQuestion(`${node}:${question}`) % 27),
    provider: profile.provider,
    model: `${profile.displayProvider} judgement`,
    source: 'fallback',
    summary: copy.summary,
    reason: `${profile.displayProvider} 내부 판단 루틴은 "${signalCode}" 신호를 기준으로 ${copy.reason}`,
    concern: `${copy.concern} 최종 적용 전에는 조건 변화와 영향 범위를 한 번 더 확인하는 편이 좋습니다.`,
  }
}

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
