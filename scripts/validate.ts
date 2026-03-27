import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const REQUIRED_FIELDS = ['name', 'description', 'npm', 'repository', 'author', 'version', 'minCliVersion', 'category', 'license']
const VALID_CATEGORIES = ['adapter', 'utility', 'integration', 'ai', 'security', 'media']

export function validatePluginFile(filePath: string): string[] {
  const errors: string[] = []

  let content: any
  try {
    content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    return [`${filePath}: invalid JSON — ${e}`]
  }

  for (const field of REQUIRED_FIELDS) {
    if (!content[field]) {
      errors.push(`${filePath}: missing required field '${field}'`)
    }
  }

  if (content.category && !VALID_CATEGORIES.includes(content.category)) {
    errors.push(`${filePath}: invalid category '${content.category}'. Must be one of: ${VALID_CATEGORIES.join(', ')}`)
  }

  if (content.version && !/^\d+\.\d+\.\d+/.test(content.version)) {
    errors.push(`${filePath}: invalid version format '${content.version}'`)
  }

  if (content.repository && !content.repository.startsWith('https://')) {
    errors.push(`${filePath}: repository must be an HTTPS URL`)
  }

  if (content.author && typeof content.author === 'object' && !content.author.name) {
    errors.push(`${filePath}: author must have a 'name' field`)
  }

  // Check for duplicate names across all plugins
  const pluginsDir = path.resolve('plugins')
  if (fs.existsSync(pluginsDir)) {
    const allFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.json'))
    for (const other of allFiles) {
      if (path.resolve(pluginsDir, other) === path.resolve(filePath)) continue
      try {
        const otherContent = JSON.parse(fs.readFileSync(path.join(pluginsDir, other), 'utf-8'))
        if (otherContent.name === content.name) {
          errors.push(`${filePath}: duplicate name '${content.name}' — already used by ${other}`)
        }
      } catch { /* skip invalid files */ }
    }
  }

  return errors
}

// CLI entry point
if (process.argv[1]?.endsWith('validate.ts') || process.argv[1]?.endsWith('validate.js')) {
  const pluginsDir = path.resolve('plugins')

  // Try git diff for changed files, fallback to all files
  let files: string[] = []
  try {
    const diff = execSync('git diff --name-only HEAD~1 HEAD -- plugins/', { encoding: 'utf-8' }).trim()
    files = diff.split('\n').filter(f => f.endsWith('.json'))
  } catch {
    // No git history — validate all
    if (fs.existsSync(pluginsDir)) {
      files = fs.readdirSync(pluginsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join('plugins', f))
    }
  }

  if (files.length === 0) {
    console.log('No plugin files to validate')
    process.exit(0)
  }

  const allErrors: string[] = []
  for (const file of files) {
    console.log(`Validating ${file}...`)
    const errors = validatePluginFile(file)
    if (errors.length === 0) {
      console.log(`  ✓ valid`)
    } else {
      allErrors.push(...errors)
    }
  }

  if (allErrors.length > 0) {
    console.error('\n❌ Validation failed:')
    for (const err of allErrors) console.error(`  - ${err}`)
    process.exit(1)
  }
  console.log('\n✅ All plugins valid')
}
