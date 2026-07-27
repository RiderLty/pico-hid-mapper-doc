import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'pico-hid-mapper',
  outDir: 'docs/.vitepress/dist',

  vite: {
    server: {
      host: '0.0.0.0',
      port: 5174,
    },
  },
  description: 'USB HID 映射器固件 — 将键鼠输入映射为触屏操作',

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
            { text: 'HIDAPI', link: '/api/hid-api' },
            { text: 'WebSocket API', link: '/api/ws-api' },
            { text: 'Lua 脚本 API', link: '/api/lua-api' },
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
