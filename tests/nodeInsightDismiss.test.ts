import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const page = readFileSync(new URL('../src/pages/Magi.tsx', import.meta.url), 'utf8')

describe('node insight dismissal', () => {
  it('closes the node insight on outside pointer down without closing node or panel taps', () => {
    expect(page).toContain('const handleShellPointerDown')
    expect(page).toContain("closest('.magi-node, .node-insight')")
    expect(page).toContain('setSelectedNode(null)')
    expect(page).toContain('onPointerDown={handleShellPointerDown}')
  })
})
