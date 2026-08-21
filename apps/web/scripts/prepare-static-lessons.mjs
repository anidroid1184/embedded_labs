import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../../../content/lessons')
const destDir = path.resolve(__dirname, '../public/lessons')

function localizedLabel(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value.en || value.es || ''
  }
  return String(value ?? '')
}

mkdirSync(destDir, { recursive: true })

const files = readdirSync(srcDir).filter((name) => name.endsWith('.json'))
const manifest = []

for (const file of files) {
  const raw = readFileSync(path.join(srcDir, file), 'utf8')
  const lesson = JSON.parse(raw)
  copyFileSync(path.join(srcDir, file), path.join(destDir, `${lesson.slug}.json`))
  manifest.push({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    status: lesson.status,
    summary: lesson.summary,
  })
}

manifest.sort((a, b) =>
  localizedLabel(a.title).localeCompare(localizedLabel(b.title)),
)
writeFileSync(path.join(destDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Prepared ${manifest.length} static lessons → public/lessons/`)
