import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    // /webhid/index.html 是 public/ 下的独立控制页（非 VitePress 页面）。
    // SPA 路由无法加载它，改为整页跳转，避免落入 404。
    router.onBeforeRouteChange = (href) => {
      if (href.endsWith('/webhid/index.html')) {
        location.href = href
        return false
      }
    }
  },
}
