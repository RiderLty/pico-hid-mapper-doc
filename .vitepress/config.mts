import { defineConfig } from 'vitepress'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 需要在 public/api/ 中提供下载的 API 参考 .md 文件 */
const API_MD_DOWNLOADS = ['hid-api.md', 'lua-api.md', 'ws-api.md', 'hid-code.md', 'makcu-api.md']

const ROOT = resolve(__dirname, '..')

function syncApiMdDownloads(outDir?: string) {
  const dest = outDir
    ? resolve(outDir, 'api')
    : resolve(ROOT, 'public', 'api')
  mkdirSync(dest, { recursive: true })
  for (const f of API_MD_DOWNLOADS) {
    copyFileSync(resolve(ROOT, 'api', f), resolve(dest, f))
  }
}

// WebHID 控制工具（/webhid 页）由主仓库 webctrl/index.html 同步。
// 本地构建时复制最新内容；CI 单独克隆 doc 仓库、无主仓库时静默跳过（用已提交副本）。
function syncWebhidTool(outDir?: string) {
  const src = resolve(ROOT, '..', 'pico-hid-mapper', 'webctrl', 'index.html')
  if (!existsSync(src)) return
  const dest = outDir
    ? resolve(outDir, 'webhid', 'index.html')
    : resolve(ROOT, 'public', 'webhid', 'index.html')
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'pico-hid-mapper',
  outDir: 'docs/.vitepress/dist',

  vite: {
    server: {
      host: '0.0.0.0',
      port: 5174,
    },
    plugins: [
      {
        name: 'sync-api-md',
        configResolved() {
          syncApiMdDownloads()
          syncWebhidTool()
        },
      },
    ],
  },

  async buildEnd(siteConfig) {
    syncApiMdDownloads(siteConfig.outDir)
    syncWebhidTool(siteConfig.outDir)
  },
  description: 'USB HID 映射器 — 将键鼠输入映射为触屏操作',

  head: [
    ['link', { rel: 'icon', href: '/icon.png' }],
  ],

  themeConfig: {

    nav: [
      { text: '快速开始', link: '/quick-start' },
      { text: '文档', link: '/api/' },
      { text: 'WebHID 工具', link: '/webhid' },
    ],

    sidebar: {
      '/api/': [
        {
          text: '文档',
          items: [
            { text: '总览', link: '/api/' },
            { text: '原理说明', link: '/api/principles' },
            { text: '映射配置说明', link: '/api/mapper-config' },
            { text: 'HIDAPI', link: '/api/hid-api' },
            { text: 'WebSocket API', link: '/api/ws-api' },
            { text: 'Lua 脚本 API', link: '/api/lua-api' },
            { text: 'MAKCU 使用说明', link: '/api/makcu-api' },
            { text: 'HID 键码参考', link: '/api/hid-code' },
          ],
        },
      ],
    },


    search: {
      provider: 'local',
    },

    footer: {
      copyright: `Copyright © 2024–${new Date().getFullYear()} pico-hid-mapper`,
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
  },
})
