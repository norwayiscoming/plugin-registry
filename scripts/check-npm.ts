import fs from 'node:fs'
import { execSync } from 'node:child_process'

export async function checkNpmPackage(npmName: string): Promise<{ exists: boolean; version?: string; error?: string }> {
  try {
    const version = execSync(`npm view ${npmName} version`, { encoding: 'utf-8', timeout: 10000 }).trim()
    return { exists: true, version }
  } catch {
    return { exists: false, error: `Package '${npmName}' not found on npm` }
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('check-npm.ts') || process.argv[1]?.endsWith('check-npm.js')) {
  const pluginsDir = 'plugins'
  let files: string[] = []
  try {
    const diff = execSync('git diff --name-only HEAD~1 HEAD -- plugins/', { encoding: 'utf-8' }).trim()
    files = diff.split('\n').filter(f => f.endsWith('.json'))
  } catch {
    if (fs.existsSync(pluginsDir)) {
      files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.json')).map(f => `plugins/${f}`)
    }
  }

  let failed = false
  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'))
    console.log(`Checking npm: ${content.npm}...`)
    const result = await checkNpmPackage(content.npm)
    if (result.exists) {
      console.log(`  ✓ ${content.npm}@${result.version}`)
    } else {
      console.error(`  ❌ ${result.error}`)
      failed = true
    }
  }

  if (failed) process.exit(1)
  console.log('\n✅ All packages verified')
}
