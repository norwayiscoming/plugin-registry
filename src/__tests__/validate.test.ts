import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validatePluginFile } from '../../scripts/validate.js'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('validatePluginFile', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writePlugin(filename: string, content: any): string {
    const filePath = path.join(tmpDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2))
    return filePath
  }

  const validPlugin = {
    name: 'test-plugin',
    description: 'A test plugin',
    npm: 'openacp-test-plugin',
    repository: 'https://github.com/test/repo',
    author: { name: 'test', github: 'test' },
    version: '1.0.0',
    minCliVersion: '2026.0326.0',
    category: 'utility',
    license: 'MIT',
  }

  it('valid plugin passes with no errors', () => {
    const file = writePlugin('test.json', validPlugin)
    expect(validatePluginFile(file)).toEqual([])
  })

  it('missing required field fails', () => {
    const { name, ...incomplete } = validPlugin
    const file = writePlugin('test.json', incomplete)
    const errors = validatePluginFile(file)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain("'name'")
  })

  it('invalid category fails', () => {
    const file = writePlugin('test.json', { ...validPlugin, category: 'invalid' })
    const errors = validatePluginFile(file)
    expect(errors.some(e => e.includes('invalid category'))).toBe(true)
  })

  it('invalid JSON fails', () => {
    const file = path.join(tmpDir, 'bad.json')
    fs.writeFileSync(file, 'not json{{{')
    const errors = validatePluginFile(file)
    expect(errors[0]).toContain('invalid JSON')
  })

  it('invalid version format fails', () => {
    const file = writePlugin('test.json', { ...validPlugin, version: 'abc' })
    const errors = validatePluginFile(file)
    expect(errors.some(e => e.includes('version format'))).toBe(true)
  })

  it('non-HTTPS repository fails', () => {
    const file = writePlugin('test.json', { ...validPlugin, repository: 'http://insecure.com' })
    const errors = validatePluginFile(file)
    expect(errors.some(e => e.includes('HTTPS'))).toBe(true)
  })

  it('author without name fails', () => {
    const file = writePlugin('test.json', { ...validPlugin, author: { github: 'test' } })
    const errors = validatePluginFile(file)
    expect(errors.some(e => e.includes("author must have a 'name'"))).toBe(true)
  })
})
