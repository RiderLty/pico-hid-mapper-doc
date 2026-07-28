/**
 * 构建后脚本：将 HTML 中的字体/图片路径改写为 CDN 绝对 URL
 * JS/CSS 不走 CDN（123 CDN 会随机拦截），保持本地路径由 CF Pages 提供
 *
 * outDir 自动从 .vitepress/config.mts 读取
 * CDN_BASE 读取优先级：环境变量 > 项目根目录 .env 文件
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = join(__dirname, '..')

// --- 读取 .env ---
function loadEnv() {
  try {
    const content = readFileSync(join(PROJECT_DIR, '.env'), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      if (!process.env[key]) process.env[key] = trimmed.slice(eqIdx + 1).trim()
    }
  } catch { /* .env 不存在 */ }
}

// --- 从 VitePress 配置读取 outDir ---
function resolveOutDir() {
  if (process.argv[2]) return process.argv[2]
  try {
    const configPath = join(PROJECT_DIR, '.vitepress', 'config.mts')
    const content = readFileSync(configPath, 'utf-8')
    const m = content.match(/outDir\s*:\s*['"]([^'"]+)['"]/)
    if (m) return join(PROJECT_DIR, m[1])
  } catch { /* 配置读取失败 */ }
  return join(PROJECT_DIR, '.vitepress', 'dist')
}

// --- 主逻辑 ---
loadEnv()
const CDN_BASE = process.env.CDN_BASE || ''
const DIST_DIR = resolveOutDir()

// 只改写字体和图片，不动 JS/CSS
const REWRITE_PATTERNS = [
  // assets 下的字体/图片
  {
    pattern: /(href|src)="(\/assets\/[^"]+\.(?:woff2?|svg|webp|png|jpe?g|gif))"/g,
    replacement: `$1="${CDN_BASE}$2"`,
  },
  // 根目录下的图片（icon.png, board.webp, favicon.svg, hero.svg 等）
  {
    pattern: /(href|src)="\/([^"]+\.(?:svg|webp|png|jpe?g|gif|ico))"/g,
    replacement: `$1="${CDN_BASE}/$2"`,
  },
]

async function walkHtmlFiles(dir) {
  const files = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkHtmlFiles(fullPath))
    } else if (extname(entry.name) === '.html') {
      files.push(fullPath)
    }
  }
  return files
}

async function main() {
  if (!CDN_BASE) {
    console.log('[cdn-postbuild] CDN_BASE 未设置，跳过')
    return
  }

  console.log(`[cdn-postbuild] CDN_BASE = ${CDN_BASE}`)
  console.log(`[cdn-postbuild] DIST_DIR = ${DIST_DIR}`)

  const htmlFiles = await walkHtmlFiles(DIST_DIR)
  if (htmlFiles.length === 0) {
    console.log(`[cdn-postbuild] ⚠ 在 ${DIST_DIR} 未找到 HTML 文件`)
    return
  }

  console.log(`[cdn-postbuild] 改写 ${htmlFiles.length} 个 HTML 文件（仅字体/图片）`)

  for (const filePath of htmlFiles) {
    let content = readFileSync(filePath, 'utf-8')
    for (const { pattern, replacement } of REWRITE_PATTERNS) {
      content = content.replace(pattern, replacement)
    }
    writeFileSync(filePath, content)
  }

  console.log('[cdn-postbuild] 完成')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
