export type MagiNode = 'melchior' | 'balthasar' | 'casper'
export type Verdict = '可決' | '否決' | '保留'
export type JudgeSource = 'api' | 'fallback'
export type JudgementSource = 'api' | 'mixed' | 'fallback'
export type ProviderId = 'gemini' | 'claude' | 'chatgpt'
export type FallbackRoll = () => number

export type NodeProfile = {
  node: MagiNode
  label: string
  provider: ProviderId
  displayProvider: string
  role: string
  defaultModel: string
}

export type NodeJudgement = {
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

export type MagiJudgementResponse = {
  question: string
  code: number
  finalVerdict: Verdict
  judges: Record<MagiNode, NodeJudgement>
  source: JudgementSource
  generatedAt: string
  errors: string[]
}

type MagicEightBallOutcome = {
  answer: string
  votes: Record<MagiNode, Verdict>
}

type FallbackJudgementOptions = {
  error?: string
  roll?: FallbackRoll
}

export const NODE_SEQUENCE: MagiNode[] = ['melchior', 'balthasar', 'casper']

export const NODE_PROFILES: Record<MagiNode, NodeProfile> = {
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

export const verdictClass: Record<Verdict, string> = {
  可決: 'approved',
  否決: 'rejected',
  保留: 'conditional',
}

const verdicts: Verdict[] = ['可決', '保留', '否決']

const fallbackCopy: Record<
  MagiNode,
  Record<Verdict, { summary: string; reason: string; concern: string }>
> = {
  melchior: {
    可決: {
      summary: '실행 경로가 비교적 명확하며 시스템 부담이 관리 가능한 수준입니다.',
      reason: 'Gemini 성향의 분석 노드로서 입력의 구조, 비용, 실패 지점을 우선 계산했습니다. 현재 질문은 실행 조건을 나누면 순차적으로 처리할 수 있다고 판단했습니다.',
      concern: '전제 조건이 바뀌면 결론도 바뀔 수 있으므로, 적용 전 검증 단계가 필요합니다.',
    },
    否決: {
      summary: '현재 조건에서는 실행 리스크가 이득보다 큽니다.',
      reason: 'Gemini 성향의 분석 노드로서 의존성, 작업 순서, 되돌리기 가능성을 확인했습니다. 실패 시 복구 비용이 높거나 입력 조건이 충분히 닫혀 있지 않습니다.',
      concern: '범위를 줄이거나 검증 가능한 하위 단계로 다시 제출하는 편이 안전합니다.',
    },
    保留: {
      summary: '판단에 필요한 조건이 일부 부족해 보류가 적절합니다.',
      reason: 'Gemini 성향의 분석 노드로서 필요한 정보와 실행 가능성을 분리했습니다. 핵심 조건 몇 가지가 더 명확해지면 가결 또는 부결로 좁힐 수 있습니다.',
      concern: '질문을 더 구체화하지 않으면 결과가 운에 기대게 됩니다.',
    },
  },
  balthasar: {
    可決: {
      summary: '보호 장치를 전제로 진행해도 무리가 작습니다.',
      reason: 'Claude 성향의 방어 노드로서 사용자 피해, 되돌릴 수 없는 변경, 윤리적 부담을 먼저 봤습니다. 현 상태에서는 제한된 범위와 확인 절차를 두면 진행 가능합니다.',
      concern: '가결이더라도 변경 전 백업 또는 중단 조건을 명시해야 합니다.',
    },
    否決: {
      summary: '안전성과 책임 측면에서 중단이 낫습니다.',
      reason: 'Claude 성향의 방어 노드로서 위험 신호를 우선했습니다. 질문 안에 삭제, 손상, 권한, 회복 불가능성 같은 요소가 있거나 결과 피해를 예측하기 어렵습니다.',
      concern: '목표를 유지하되 더 작은 실험이나 읽기 전용 분석으로 바꾸는 편이 좋습니다.',
    },
    保留: {
      summary: '보호 조건을 확정하기 전까지는 결정을 미루는 편이 좋습니다.',
      reason: 'Claude 성향의 방어 노드로서 승인 조건보다 중단 조건을 먼저 찾았습니다. 지금은 명백한 금지는 아니지만 안전장치가 충분히 설명되지 않았습니다.',
      concern: '사용자 확인, 롤백 계획, 영향 범위를 먼저 정해야 합니다.',
    },
  },
  casper: {
    可決: {
      summary: '사용자 의도와 결과 효용이 잘 맞습니다.',
      reason: 'ChatGPT 성향의 조율 노드로서 질문의 목적, 실제 사용감, 설명 가능성을 봤습니다. 지금 판단은 사용자가 기대한 방향으로 바로 이어질 가능성이 높습니다.',
      concern: '결과를 너무 단정적으로 보여주지 말고 선택 이유를 함께 남겨야 합니다.',
    },
    否決: {
      summary: '사용자가 기대한 결과와 실제 결과가 어긋날 가능성이 큽니다.',
      reason: 'ChatGPT 성향의 조율 노드로서 의도와 체감 품질을 비교했습니다. 현재 입력만으로는 만족스러운 결과보다 오해나 재작업이 생길 가능성이 높습니다.',
      concern: '질문을 다시 묻거나 대안을 제시하는 흐름이 필요합니다.',
    },
    保留: {
      summary: '방향은 보이지만 결론으로 닫기에는 맥락이 부족합니다.',
      reason: 'ChatGPT 성향의 조율 노드로서 사용자 의도는 읽히지만, 최종 결론을 낼 만큼의 맥락은 아직 부족하다고 판단했습니다.',
      concern: '한 번 더 확인 질문을 하거나 시안을 먼저 보여주는 편이 자연스럽습니다.',
    },
  },
}

export const hashQuestion = (question: string) => {
  return Array.from(question).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 997
  }, 263)
}

const buildForcedDemoVerdicts = (question: string): Record<MagiNode, Verdict> | null => {
  const normalizedQuestion = question.toLowerCase()

  if (/가결|可決|approve|approved/.test(normalizedQuestion)) {
    return {
      melchior: '可決',
      balthasar: '可決',
      casper: '可決',
    }
  }

  if (/부결|否決|reject|rejected/.test(normalizedQuestion)) {
    return {
      melchior: '否決',
      balthasar: '保留',
      casper: '否決',
    }
  }

  if (/보류|保留|hold|pending/.test(normalizedQuestion)) {
    return {
      melchior: '可決',
      balthasar: '保留',
      casper: '否決',
    }
  }

  return null
}

const magicEightBallOutcomes: MagicEightBallOutcome[] = [
  {
    answer: 'ALL GREEN',
    votes: { melchior: '可決', balthasar: '可決', casper: '可決' },
  },
  {
    answer: 'PROCEED',
    votes: { melchior: '可決', balthasar: '可決', casper: '可決' },
  },
  {
    answer: 'GREEN SIGNAL',
    votes: { melchior: '可決', balthasar: '保留', casper: '可決' },
  },
  {
    answer: 'LIKELY YES',
    votes: { melchior: '可決', balthasar: '可決', casper: '保留' },
  },
  {
    answer: 'PATH CLEARS',
    votes: { melchior: '可決', balthasar: '保留', casper: '可決' },
  },
  {
    answer: 'FAVORABLE',
    votes: { melchior: '保留', balthasar: '可決', casper: '可決' },
  },
  {
    answer: 'YES, WITH WATCH',
    votes: { melchior: '可決', balthasar: '保留', casper: '可決' },
  },
  {
    answer: 'APPROVE TRACE',
    votes: { melchior: '可決', balthasar: '可決', casper: '保留' },
  },
  {
    answer: 'SIGNAL ACCEPTED',
    votes: { melchior: '可決', balthasar: '可決', casper: '可決' },
  },
  {
    answer: 'CONSENSUS GREEN',
    votes: { melchior: '可決', balthasar: '可決', casper: '可決' },
  },
  {
    answer: 'ASK AGAIN',
    votes: { melchior: '保留', balthasar: '保留', casper: '可決' },
  },
  {
    answer: 'SIGNAL UNCLEAR',
    votes: { melchior: '保留', balthasar: '可決', casper: '保留' },
  },
  {
    answer: 'HOLD PATTERN',
    votes: { melchior: '保留', balthasar: '保留', casper: '保留' },
  },
  {
    answer: 'NO CLEAR VECTOR',
    votes: { melchior: '可決', balthasar: '保留', casper: '保留' },
  },
  {
    answer: 'RETRY LATER',
    votes: { melchior: '保留', balthasar: '保留', casper: '否決' },
  },
  {
    answer: 'RED SIGNAL',
    votes: { melchior: '否決', balthasar: '否決', casper: '保留' },
  },
  {
    answer: 'DO NOT PROCEED',
    votes: { melchior: '否決', balthasar: '否決', casper: '否決' },
  },
  {
    answer: 'UNFAVORABLE',
    votes: { melchior: '保留', balthasar: '否決', casper: '否決' },
  },
  {
    answer: 'SYSTEM REFUSES',
    votes: { melchior: '否決', balthasar: '否決', casper: '保留' },
  },
  {
    answer: 'CONSENSUS RED',
    votes: { melchior: '否決', balthasar: '否決', casper: '否決' },
  },
]

const pickMagicEightBallOutcome = (roll: FallbackRoll = Math.random) => {
  const rolled = roll()
  const normalizedRoll = Number.isFinite(rolled) ? Math.max(0, Math.min(rolled, 0.999_999)) : 0.5
  return magicEightBallOutcomes[Math.floor(normalizedRoll * magicEightBallOutcomes.length)]
}

export const buildDemoVerdicts = (
  question: string,
  roll?: FallbackRoll,
): Record<MagiNode, Verdict> => {
  const forcedVerdicts = buildForcedDemoVerdicts(question)
  if (forcedVerdicts) {
    return forcedVerdicts
  }

  return pickMagicEightBallOutcome(roll).votes
}

export const buildFinalVerdict = (nodeVerdicts: Record<MagiNode, Verdict> | null): Verdict => {
  if (!nodeVerdicts) {
    return '保留'
  }

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

export const buildFallbackNodeJudgement = (
  node: MagiNode,
  question: string,
  verdict = buildDemoVerdicts(question)[node],
  magicAnswer = 'LOCAL MAGIC 8',
): NodeJudgement => {
  const profile = NODE_PROFILES[node]
  const copy = fallbackCopy[node][verdict]
  const confidence = 58 + ((hashQuestion(`${question}:${node}`) % 28) + (verdict === '保留' ? 0 : 7))

  return {
    node,
    verdict,
    confidence: Math.min(confidence, 96),
    provider: profile.provider,
    model: `${profile.displayProvider} magic 8 fallback`,
    source: 'fallback',
    summary: `${magicAnswer}: ${copy.summary}`,
    reason: `${profile.displayProvider} API가 연결되지 않아 실제 모델 판단 대신 로컬 매직8볼 신호를 사용했습니다. 이 노드는 "${magicAnswer}" 결과를 ${profile.role} 패널에 표시합니다.`,
    concern: `${copy.concern} 이 판단은 데모용 무작위 신호이므로 실제 결정 근거가 필요하면 API 판단을 연결해야 합니다.`,
  }
}

const resolveFallbackOptions = (
  errorOrOptions?: string | FallbackJudgementOptions,
): FallbackJudgementOptions => {
  if (typeof errorOrOptions === 'string') {
    return { error: errorOrOptions }
  }

  return errorOrOptions ?? {}
}

export const buildFallbackJudgement = (
  question: string,
  errorOrOptions?: string | FallbackJudgementOptions,
): MagiJudgementResponse => {
  const options = resolveFallbackOptions(errorOrOptions)
  const forcedVerdicts = buildForcedDemoVerdicts(question)
  const magicOutcome = forcedVerdicts ? undefined : pickMagicEightBallOutcome(options.roll)
  const nodeVerdicts = forcedVerdicts ?? magicOutcome?.votes ?? buildDemoVerdicts(question, options.roll)
  const magicAnswer = magicOutcome?.answer ?? 'DEMO OVERRIDE'
  const judges = NODE_SEQUENCE.reduce<Record<MagiNode, NodeJudgement>>((result, node) => {
    result[node] = buildFallbackNodeJudgement(node, question, nodeVerdicts[node], magicAnswer)
    return result
  }, {} as Record<MagiNode, NodeJudgement>)

  return {
    question,
    code: hashQuestion(question),
    finalVerdict: buildFinalVerdict(nodeVerdicts),
    judges,
    source: 'fallback',
    generatedAt: new Date().toISOString(),
    errors: options.error ? [options.error] : [],
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeVerdict = (value: unknown): Verdict | null => {
  return verdicts.includes(value as Verdict) ? (value as Verdict) : null
}

const normalizeConfidence = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(Math.round(value), 100))
}

const normalizeProvider = (node: MagiNode, value: unknown): ProviderId => {
  const profile = NODE_PROFILES[node]
  return value === 'gemini' || value === 'claude' || value === 'chatgpt' ? value : profile.provider
}

const normalizeText = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

const normalizeJudge = (
  node: MagiNode,
  value: unknown,
  fallback: NodeJudgement,
): NodeJudgement => {
  if (!isRecord(value)) {
    return fallback
  }

  const verdict = normalizeVerdict(value.verdict)
  if (!verdict) {
    return fallback
  }

  const source: JudgeSource = value.source === 'fallback' ? 'fallback' : 'api'

  return {
    node,
    verdict,
    confidence: normalizeConfidence(value.confidence, fallback.confidence),
    provider: normalizeProvider(node, value.provider),
    model: normalizeText(value.model, fallback.model),
    source,
    summary: normalizeText(value.summary, fallback.summary),
    reason: normalizeText(value.reason, fallback.reason),
    concern: normalizeText(value.concern, fallback.concern),
  }
}

const normalizeErrors = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
}

export const normalizeJudgementPayload = (
  payload: unknown,
  question: string,
): MagiJudgementResponse => {
  const fallback = buildFallbackJudgement(question)
  if (!isRecord(payload) || !isRecord(payload.judges)) {
    return buildFallbackJudgement(question, 'MAGI API 응답을 해석하지 못해 로컬 판단으로 전환했습니다.')
  }

  const payloadJudges = payload.judges
  const judges = NODE_SEQUENCE.reduce<Record<MagiNode, NodeJudgement>>((result, node) => {
    result[node] = normalizeJudge(node, payloadJudges[node], fallback.judges[node])
    return result
  }, {} as Record<MagiNode, NodeJudgement>)

  const apiCount = Object.values(judges).filter((judge) => judge.source === 'api').length
  const nodeVerdicts = NODE_SEQUENCE.reduce<Record<MagiNode, Verdict>>((result, node) => {
    result[node] = judges[node].verdict
    return result
  }, {} as Record<MagiNode, Verdict>)

  return {
    question,
    code: typeof payload.code === 'number' && Number.isFinite(payload.code) ? payload.code : fallback.code,
    finalVerdict: buildFinalVerdict(nodeVerdicts),
    judges,
    source: apiCount === 0 ? 'fallback' : apiCount === NODE_SEQUENCE.length ? 'api' : 'mixed',
    generatedAt: normalizeText(payload.generatedAt, new Date().toISOString()),
    errors: normalizeErrors(payload.errors),
  }
}
