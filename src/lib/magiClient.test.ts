import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestMagiJudgement } from './magiClient'

describe('requestMagiJudgement', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns normalized api judgement when the endpoint responds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          judges: {
            melchior: {
              node: 'melchior',
              verdict: '可決',
              confidence: 80,
              provider: 'gemini',
              model: 'gemini-test',
              source: 'api',
              summary: 'ok',
              reason: 'api reason',
              concern: 'api concern',
            },
          },
        }),
      })),
    )

    const judgement = await requestMagiJudgement('테스트 질문', {
      apiMode: 'api',
      timeoutMs: 1000,
    })

    expect(judgement.source).toBe('mixed')
    expect(judgement.judges.melchior.source).toBe('api')
    expect(judgement.judges.balthasar.source).toBe('fallback')
  })

  it('falls back locally when the endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
        json: async () => ({}),
      })),
    )

    const judgement = await requestMagiJudgement('부결 테스트', {
      apiMode: 'api',
      timeoutMs: 1000,
    })

    expect(judgement.source).toBe('fallback')
    expect(judgement.finalVerdict).toBe('否決')
    expect(judgement.errors[0]).toContain('MAGI API 연결 실패')
  })

  it('uses local fallback immediately when api mode is local', async () => {
    const fetcher = vi.fn()

    const judgement = await requestMagiJudgement('가결 테스트', {
      apiMode: 'local',
      fetcher,
    })

    expect(fetcher).not.toHaveBeenCalled()
    expect(judgement.source).toBe('fallback')
    expect(judgement.finalVerdict).toBe('可決')
    expect(judgement.errors[0]).toContain('비활성화')
  })
})
