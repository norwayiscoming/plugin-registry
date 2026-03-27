import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { updateVersions } from '../../scripts/update-versions.js'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'

// Mock execSync for npm view calls
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process')
  return {
    ...actual,
    execSync: vi.fn(),
  }
})

describe('updateVersions', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'))
    fs.mkdirSync(path.join(tmpDir, 'plugins'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writePlugin(filename: string, content: any) {
    fs.writeFileSync(path.join(tmpDir, 'plugins', filename), JSON.stringify(content, null, 2))
  }

  it('updates version when npm has newer', () => {
    writePlugin('test.json', { name: 'test', npm: 'test-pkg', version: '1.0.0' })
    vi.mocked(execSync).mockReturnValue('2.0.0\n')

    const { updated } = updateVersions(path.join(tmpDir, 'plugins'))
    expect(updated).toHaveLength(1)

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, 'plugins', 'test.json'), 'utf-8'))
    expect(content.version).toBe('2.0.0')
  })

  it('skips when version unchanged', () => {
    writePlugin('test.json', { name: 'test', npm: 'test-pkg', version: '1.0.0' })
    vi.mocked(execSync).mockReturnValue('1.0.0\n')

    const { updated } = updateVersions(path.join(tmpDir, 'plugins'))
    expect(updated).toHaveLength(0)
  })

  it('handles npm view failure gracefully', () => {
    writePlugin('test.json', { name: 'test', npm: 'nonexistent', version: '1.0.0' })
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found') })

    const { updated, errors } = updateVersions(path.join(tmpDir, 'plugins'))
    expect(updated).toHaveLength(0)
    expect(errors).toHaveLength(1)
  })

  it('returns empty for nonexistent directory', () => {
    const { updated, errors } = updateVersions('/nonexistent')
    expect(updated).toEqual([])
    expect(errors).toEqual([])
  })
})
