import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles/magi.css', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/Magi.tsx', import.meta.url), 'utf8')

describe('node insight overflow', () => {
  it('keeps long desktop insight content inside a scrollable panel', () => {
    const nodeInsightRule = css.match(/\.node-insight\s*\{(?<body>[^}]*)\}/)?.groups?.body ?? ''

    expect(nodeInsightRule).toContain('max-height:')
    expect(nodeInsightRule).toContain('overflow-y: auto')
    expect(nodeInsightRule).toContain('overscroll-behavior: contain')
    expect(nodeInsightRule).toContain('pointer-events: auto')
  })

  it('keeps the panel open long enough to move from a node into the scrollable panel', () => {
    expect(page).toContain('const scheduleNodeInsightClose')
    expect(page).toContain('onMouseLeave={scheduleNodeInsightClose}')
    expect(page).toContain('onMouseEnter={clearInsightCloseTimer}')
  })
})
