#!/bin/bash
# 将构建产物中的字体和图片上传到 WebDAV/CDN
# JS/CSS 不走 CDN（123 CDN 会随机拦截），HTML 由 CF Pages 部署
#
# 认证信息从项目根目录 .env 文件读取（已 gitignore）
# 也支持环境变量覆盖

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 加载 .env 文件（如果存在）
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# 必需变量检查
if [ -z "$WEBDAV_USER" ] || [ -z "$WEBDAV_PASS" ]; then
  echo "错误: WEBDAV_USER 或 WEBDAV_PASS 未设置"
  echo "请在项目根目录创建 .env 文件（参考 .env.example），或设置环境变量"
  exit 1
fi

# 从 .vitepress/config.mts 读取 outDir，与 Vitepress 保持一致
if [ -n "$1" ]; then
  DIST_DIR="$1"
elif [ -f "$PROJECT_DIR/.vitepress/config.mts" ]; then
  # macOS 自带 BSD grep 不支持 -oP，改用 node 解析（与 cdn-postbuild.mjs 同一正则）
  OUTDIR=$(node -e "const c=require('fs').readFileSync(process.argv[1],'utf8');const m=c.match(/outDir\s*:\s*['\"]([^'\"]+)['\"]/);console.log(m?m[1]:'.vitepress/dist')" "$PROJECT_DIR/.vitepress/config.mts" 2>/dev/null || echo ".vitepress/dist")
  DIST_DIR="$PROJECT_DIR/$OUTDIR"
else
  DIST_DIR="$PROJECT_DIR/.vitepress/dist"
fi

echo "=== 部署静态资源到 CDN ==="
echo ""

# 该 CDN 偶发 TLS 握手被重置（curl 非零退出、code=000），单请求最多重试 8 次
webdav_code() {
  local attempt code
  for attempt in 1 2 3 4 5 6 7 8; do
    code=$(curl -s -u "${WEBDAV_USER}:${WEBDAV_PASS}" "$@" \
      --connect-timeout 5 --max-time 15 -o /dev/null -w "%{http_code}" || true)
    case "$code" in
      000|5*) [ "$attempt" -lt 8 ] && sleep 1 ;;
      *) break ;;
    esac
  done
  echo "$code"
}

# 创建目录
echo "--- 创建目录 ---"
find "$DIST_DIR" -type d ! -name '.' | while read dir; do
  dirpath="${dir#$DIST_DIR/}"
  code=$(webdav_code -X MKCOL "${WEBDAV_URL}/${dirpath}")
  echo "  [$code] $dirpath"
done

echo ""
echo "--- 上传字体和图片（跳过 JS/CSS/HTML） ---"

find "$DIST_DIR" -type f \
  \( -name '*.woff2' -o -name '*.woff' \
     -o -name '*.svg' -o -name '*.webp' -o -name '*.png' \
     -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' -o -name '*.ico' \) \
  | sort | while read file; do
  webpath="${file#$DIST_DIR/}"
  code=$(webdav_code -T "$file" "${WEBDAV_URL}/${webpath}")
  if [ "$code" = "201" ] || [ "$code" = "204" ]; then
    echo "  [OK] $webpath"
  else
    echo "  [FAIL:$code] $webpath"
  fi
done

echo ""
echo "=== 完成 ==="
echo "CDN 资源已更新，HTML 由 CF Pages 部署。"
