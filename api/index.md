# 文档

pico-hid-mapper 提供三层可编程接口：

| 接口 | 传输方式 | 用途 |
|------|----------|------|
| **HIDAPI** | HID OUT/IN 端点 | 发送命令帧控制设备、接收设备事件 |
| **WebSocket API** | ws://&lt;设备IP&gt;/ws | 自定义事件 + 实时日志双向通信 |
| **Lua 脚本 API** | 固件内 Lua 5.4.6 | 自定义按键行为、编写宏、拦截映射事件 |

## 快速导航

- **[HIDAPI](/api/hid-api)** — 设备控制接口完整文档
- **[WebSocket API](/api/ws-api)** — 双向通信，自定义事件 + 实时日志
- **[Lua 脚本 API](/api/lua-api)** — 板载 Lua 开发手册
- **[HID 键码参考](/api/hid-code)** — 完整 HID 键盘/鼠标键码速查表

## 网络参数

设备通过 USB 网卡 (CDC) 与手机直连，Pico 固定 IP 为 `192.168.73.1`（端口 80）。也可通过 vPointer 端口转发，使用手机局域网 IP + 端口 8000 访问。

| 方式 | 地址 |
|------|------|
| USB 直连 | `http://192.168.73.1:80` |
| vPointer 转发 | `http://<手机IP>:8000` |
| WebSocket 直连 | `ws://192.168.73.1:80/ws` |
| WebSocket 转发 | `ws://<手机IP>:8000/ws` |
