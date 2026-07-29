# WebSocket API

设备在 80 端口提供 WebSocket 服务，用于双向通信。

- **USB 直连**（需要断开其他网络）: `ws://192.168.73.1/ws`
- **vPointer 转发**: `ws://<手机IP>:8000/ws`

---

## 发送自定义事件 → 设备

客户端发送**二进制帧**，触发 Lua 的 `on_custom_event(str)`。

### 帧格式

```
[0x01][UTF-8 text]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0 | CMD | u8 | 固定 `0x01` |
| 1–128 | text | UTF-8 | 文本内容，最大 **128 字节**，超出截断 |

### 示例

**浏览器**

Web UI 内建输入框（PICO 配置 → 管理脚本 → 底部），直接输入文本发送。

**命令行（websocat）**

```bash
echo -ne '\x01tap(540,1200)\n' | websocat ws://192.168.73.1/ws
```

**Python**

```python
import websocket

ws = websocket.create_connection("ws://192.168.73.1/ws")
ws.send_binary(b"\x01click 500 800")
ws.close()
```

### Lua 接收

```lua
function on_custom_event(str)
    print("收到: " .. str)   -- 回显到日志
    -- 解析指令并执行...
    return true
end
```

> WebSocket 与 HID CMD 0xFA 都是触发 `on_custom_event`，区别：WS 最大 128 字节，HID 最大 60 字节。`print()` 输出经 WS 回传到所有连接的客户端。

---

## 接收日志 ← 设备

设备主动推送**文本帧**，包含两类日志：

| 来源 | 说明 |
|------|------|
| `print()` / `warn()` | Lua 脚本中调用，输出调试信息 |
| 系统日志 | 固件运行状态、错误提示等 |

客户端只需监听 WebSocket 的 `onmessage` 事件即可收到。

### 示例

**浏览器**

```js
const ws = new WebSocket("ws://192.168.73.1/ws");
ws.onmessage = (e) => {
    console.log("[Pico]", e.data);  // 文本帧
};
```

**Python**

```python
import websocket

def on_message(ws, message):
    print("[Pico]", message)

ws = websocket.WebSocketApp("ws://192.168.73.1/ws", on_message=on_message)
ws.run_forever()
```

**命令行**

```bash
websocat ws://192.168.73.1/ws
# 直接打印所有日志
```
