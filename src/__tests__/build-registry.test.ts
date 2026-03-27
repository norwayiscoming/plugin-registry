import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildRegistry } from '../../scripts/build-registry.js'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('buildRegistry', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-test-'))
    fs.mkdirSync(path.join(tmpDir, 'plugins'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writePlugin(filename: string, content: any) {
    fs.writeFileSync(path.join(tmpDir, 'plugins', filename), JSON.stringify(content, null, 2))
  }

  it('builds registry from plugin files', () => {
    writePlugin('test-a.json', { name: 'a', description: 'A', npm: 'a', version: '1.0.0', category: 'utility', author: 'x', repository: 'https://x', license: 'MIT', minCliVersion: '1.0.0' })
    writePlugin('test-b.json', { name: 'b', description: 'B', npm: 'b', version: '2.0.0', category: 'adapter', author: 'y', repository: 'https://y', license: 'MIT', minCliVersion: '1.0.0' })

    const registry = buildRegistry(path.join(tmpDir, 'plugins'))
    expect(registry.pluginCount).toBe(2)
    expect(registry.plugins).toHaveLength(2)
    expect(registry.categories).toHaveLength(6)
  })

  it('returns empty registry for empty directory', () => {
    const registry = buildRegistry(path.join(tmpDir, 'plugins'))
    expect(registry.pluginCount).toBe(0)
    expect(registry.plugins).toEqual([])
  })

  it('returns empty registry for nonexistent directory', () => {
    const registry = buildRegistry('/nonexistent')
    expect(registry.pluginCount).toBe(0)
  })

  it('sorts featured first then alphabetical', () => {
    writePlugin('z.json', { name: 'z-plugin', description: 'Z', npm: 'z', version: '1.0.0', category: 'utility', featured: false, author: 'x', repository: 'https://x', license: 'MIT', minCliVersion: '1.0.0' })
    writePlugin('a.json', { name: 'a-plugin', description: 'A', npm: 'a', version: '1.0.0', category: 'utility', featured: false, author: 'x', repository: 'https://x', license: 'MIT', minCliVersion: '1.0.0' })
    writePlugin('f.json', { name: 'f-featured', description: 'F', npm: 'f', version: '1.0.0', category: 'utility', featured: true, author: 'x', repository: 'https://x', license: 'MIT', minCliVersion: '1.0.0' })

    const registry = buildRegistry(path.join(tmpDir, 'plugins'))
    expect(registry.plugins[0].name).toBe('f-featured')
    expect(registry.plugins[1].name).toBe('a-plugin')
    expect(registry.plugins[2].name).toBe('z-plugin')
  })

  it('skips invalid JSON files', () => {
    writePlugin('good.json', { name: 'good', description: 'G', npm: 'g', version: '1.0.0', category: 'utility', author: 'x', repository: 'https://x', license: 'MIT', minCliVersion: '1.0.0' })
    fs.writeFileSync(path.join(tmpDir, 'plugins', 'bad.json'), 'not json')

    const registry = buildRegistry(path.join(tmpDir, 'plugins'))
    expect(registry.pluginCount).toBe(1)
  })
})
