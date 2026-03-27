import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

export function updateVersions(pluginsDir: string): { updated: string[]; errors: string[] } {
  const updated: string[] = []
  const errors: string[] = []

  if (!fs.existsSync(pluginsDir)) return { updated, errors }

  for (const file of fs.readdirSync(pluginsDir)) {
    if (!file.endsWith('.json')) continue
    const filePath = path.join(pluginsDir, file)

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const npmName = content.npm
      if (!npmName) continue

      let latestVersion: string
      try {
        latestVersion = execSync(`npm view ${npmName} version`, { encoding: 'utf-8', timeout: 10000 }).trim()
      } catch {
        errors.push(`${file}: failed to fetch version for ${npmName}`)
        continue
      }

      if (latestVersion && latestVersion !== content.version) {
        content.version = latestVersion
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n')
        updated.push(`${content.name}: ${content.version} → ${latestVersion}`)
      }
    } catch (err) {
      errors.push(`${file}: ${err}`)
    }
  }

  return { updated, errors }
}

// CLI entry point
if (process.argv[1]?.endsWith('update-versions.ts') || process.argv[1]?.endsWith('update-versions.js')) {
  const { updated, errors } = updateVersions('plugins')

  if (updated.length > 0) {
    console.log(`Updated ${updated.length} plugins:`)
    for (const u of updated) console.log(`  ↑ ${u}`)
  } else {
    console.log('All versions up to date')
  }

  if (errors.length > 0) {
    console.warn(`\n⚠️ ${errors.length} errors:`)
    for (const e of errors) console.warn(`  - ${e}`)
  }
}
