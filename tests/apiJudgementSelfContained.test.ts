import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const api = readFileSync(new URL('../api/judgement.ts', import.meta.url), 'utf8')

describe('api judgement function packaging', () => {
  it('does not import browser app modules from the serverless function', () => {
    expect(api).not.toContain("from '../src/")
  })
})
