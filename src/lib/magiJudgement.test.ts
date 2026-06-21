import { describe, expect, it } from 'vitest'
import {
  buildFallbackJudgement,
  buildFinalVerdict,
  normalizeJudgementPayload,
  type MagiNode,
  type NodeJudgement,
} from './magiJudgement'

const makeJudge = (
  node: MagiNode,
  verdict: NodeJudgement['verdict'],
  source: NodeJudgement['source'] = 'api',
): NodeJudgement => ({
  node,
  verdict,
  confidence: 72,
  provider: node === 'melchior' ? 'gemini' : node === 'balthasar' ? 'claude' : 'chatgpt',
  model: 'test-model',
  source,
  summary: `${node} summary`,
  reason: `${node} reason`,
  concern: `${node} concern`,
})

const makeRoll = (...rolls: number[]) => {
  let index = 0
  return () => rolls[index++] ?? rolls[rolls.length - 1] ?? 0
}

describe('magi judgement', () => {
  it('builds final verdict by majority vote', () => {
    expect(
      buildFinalVerdict({
        melchior: '可決',
        balthasar: '可決',
        casper: '否決',
      }),
    ).toBe('可決')

    expect(
      buildFinalVerdict({
        melchior: '否決',
        balthasar: '保留',
        casper: '否決',
      }),
    ).toBe('否決')

    expect(
      buildFinalVerdict({
        melchior: '可決',
        balthasar: '保留',
        casper: '否決',
      }),
    ).toBe('保留')
  })

  it('normalizes partial api payloads with local fallback judges', () => {
    const judgement = normalizeJudgementPayload(
      {
        judges: {
          melchior: makeJudge('melchior', '可決'),
        },
        errors: ['claude key missing'],
      },
      '위험한 변경을 적용해도 될까?',
    )

    expect(judgement.source).toBe('mixed')
    expect(judgement.judges.melchior.source).toBe('api')
    expect(judgement.judges.balthasar.source).toBe('fallback')
    expect(judgement.judges.casper.source).toBe('fallback')
    expect(judgement.errors).toContain('claude key missing')
    expect(judgement.finalVerdict).toBe(buildFinalVerdict({
      melchior: judgement.judges.melchior.verdict,
      balthasar: judgement.judges.balthasar.verdict,
      casper: judgement.judges.casper.verdict,
    }))
  })

  it('falls back to a complete local judgement when api is unavailable', () => {
    const judgement = buildFallbackJudgement('가결 테스트')

    expect(judgement.source).toBe('fallback')
    expect(judgement.finalVerdict).toBe('可決')
    expect(Object.values(judgement.judges).every((judge) => judge.verdict === '可決')).toBe(true)
    expect(Object.values(judgement.judges).every((judge) => judge.source === 'fallback')).toBe(true)
    expect(judgement.judges.balthasar.reason.length).toBeGreaterThan(10)
  })

  it('uses varied local fallback results without exposing the randomizer in node copy', () => {
    const approved = buildFallbackJudgement('모바일 UI를 개선해줘', { roll: () => 0.04 })
    const held = buildFallbackJudgement('모바일 UI를 개선해줘', { roll: () => 0.62 })
    const rejected = buildFallbackJudgement('모바일 UI를 개선해줘', { roll: () => 0.9 })

    expect(approved.source).toBe('fallback')
    expect(approved.finalVerdict).toBe('可決')
    expect(Object.values(approved.judges).filter((judge) => judge.verdict === '可決').length).toBeGreaterThanOrEqual(2)

    expect(held.finalVerdict).toBe('保留')
    expect(rejected.finalVerdict).toBe('否決')
    expect(approved.judges.balthasar.model).toBe('Claude judgement')
    expect(approved.judges.balthasar.reason).toContain('내부 판단 루틴')
    expect(approved.judges.balthasar.reason).not.toContain('매직8볼')
    expect(approved.judges.balthasar.concern).not.toContain('무작위')
  })

  it('varies local fallback copy across repeated matching verdicts', () => {
    const first = buildFallbackJudgement('모바일 UI를 개선해줘', { roll: makeRoll(0.04, 0.05, 0.1, 0.15) })
    const second = buildFallbackJudgement('모바일 UI를 개선해줘', { roll: makeRoll(0.04, 0.82, 0.86, 0.9) })

    expect(first.finalVerdict).toBe(second.finalVerdict)
    expect(first.judges.balthasar.verdict).toBe(second.judges.balthasar.verdict)
    expect(first.judges.balthasar.reason).not.toBe(second.judges.balthasar.reason)
    expect(first.judges.balthasar.concern).not.toBe(second.judges.balthasar.concern)
  })
})
