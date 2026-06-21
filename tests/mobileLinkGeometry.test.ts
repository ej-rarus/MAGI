import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles/magi.css', import.meta.url), 'utf8')
const mobileCss = css.slice(css.indexOf('@media (max-width: 599px)'))

const readRule = (selector: string) => {
  const rule = mobileCss.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))
  if (!rule?.[1]) {
    throw new Error(`Missing ${selector} mobile rule`)
  }

  return rule[1]
}

const readPercent = (rule: string, property: string) => {
  const match = rule.match(new RegExp(`${property}:\\s*([\\d.]+)%`))
  if (!match?.[1]) {
    throw new Error(`Missing ${property}`)
  }

  return Number(match[1])
}

const readRotate = (rule: string) => {
  const match = rule.match(/rotate\(([\d.]+)deg\)/)
  if (!match?.[1]) {
    throw new Error('Missing rotate()')
  }

  return Number(match[1])
}

describe('mobile MAGI connector geometry', () => {
  it('connects BALTHASAR slanted edges to the lower node slanted edges', () => {
    const left = readRule('.magi-link--left')
    const right = readRule('.magi-link--right')

    expect(readPercent(left, 'width')).toBeCloseTo(48, 1)
    expect(readPercent(left, 'left')).toBeCloseTo(35, 1)
    expect(readPercent(left, 'top')).toBeCloseTo(39, 1)
    expect(readRotate(left)).toBeCloseTo(120, 0)

    expect(readPercent(right, 'width')).toBeCloseTo(48, 1)
    expect(readPercent(right, 'left')).toBeCloseTo(65, 1)
    expect(readPercent(right, 'top')).toBeCloseTo(39, 1)
    expect(readRotate(right)).toBeCloseTo(60, 0)
  })

  it('connects MELCHIOR and CASPER with a lower horizontal bridge', () => {
    const bottom = readRule('.magi-link--bottom')
    const casper = readRule('.magi-node--casper')
    const melchior = readRule('.magi-node--melchior')

    expect(readPercent(casper, 'width')).toBeCloseTo(47, 1)
    expect(readPercent(melchior, 'width')).toBeCloseTo(47, 1)
    expect(readPercent(bottom, 'width')).toBeCloseTo(8, 1)
    expect(readPercent(bottom, 'left')).toBeCloseTo(46, 1)
    expect(readPercent(bottom, 'top')).toBeCloseTo(82.5, 1)
  })
})
