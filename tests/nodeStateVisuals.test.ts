import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles/magi.css', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/Magi.tsx', import.meta.url), 'utf8')

const readRule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rule = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  if (!rule?.[1]) {
    throw new Error(`Missing ${selector} rule`)
  }

  return rule[1]
}

describe('node verdict visuals', () => {
  it('uses node fill colors instead of per-node verdict stamps', () => {
    expect(page).not.toContain('node-verdict')
    expect(readRule('.magi-node[data-state="approved"]')).toContain('--node-fill: #55ff90')
    expect(readRule('.magi-node[data-state="rejected"]')).toContain('--node-fill: #ff3a2f')
    expect(readRule('.magi-node[data-state="conditional"]')).toContain('--node-fill: #ffd05a')
  })
})
