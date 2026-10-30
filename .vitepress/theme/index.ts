import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    // /webhid/index.html 是 public/ 下的独立控制页（非 VitePress 页面）。
    // SPA 路由无法加载它，改为整页跳转，避免落入 404。
    // 注意路由器会先把 /webhid/index.html 归一化为 /webhid/，两种形态都要匹配。
    router.onBeforeRouteChange = (href) => {
      if (/\/webhid(\/(index\.html)?)?$/.test(href)) {
        location.href = '/webhid/index.html'
        return false
      }
    }
  },
}
