import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'pico-hid-mapper',

  vite: {
    server: {
      host: '0.0.0.0',
      port: 5174,
    },
  },
  description: 'USB HID 映射器固件 — 将键鼠输入映射为触屏操作',

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
  ],

  themeConfig: {
    logo: '/favicon.svg',

    nav: [
      { text: '快速开始', link: '/quick-start' },
      { text: 'API 文档', link: '/api/' },
      { text: 'WebHID 工具', link: '/webhid' },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: '总览', link: '/api/' },
            { text: 'HTTP API 参考', link: '/api/http-api' },
            { text: 'Lua 脚本 API', link: '/api/lua-api' },
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
