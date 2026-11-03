# WebSocket API

> 📥 **下载此API文档**：<a href="/api/ws-api.md" download>ws-api.md</a>

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

> 帧格式为**二进制帧**：首字节是命令字。`0x01` = 日志文本（正文 UTF-8，可能含嵌入换行）；
> `0x02` = 陀螺仪遥测（见下一节）；`0x03` = 光标位置帧（见下下节）。**客户端应先看首字节再决定怎么解析**——
> 只当文本处理的旧客户端遇到 `0x02`/`0x03` 应直接忽略。

### 示例

**浏览器**

```js
const ws = new WebSocket("ws://192.168.73.1/ws");
ws.onmessage = async (e) => {
    const bytes = new Uint8Array(e.data instanceof Blob ? await e.data.arrayBuffer() : e.data);
    if (bytes[0] !== 0x01) return;              // 0x02 = 陀螺仪遥测，此处忽略
    console.log("[Pico]", new TextDecoder().decode(bytes.slice(1)));
};
```

---

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

---

## 陀螺仪遥测帧 (0x02) ← 设备

在「手柄参数 → 陀螺仪校准」分组**展开、且窗口在前台**（即开启监视流）或**手动校准进行中**时，
设备以 **20 Hz** 推送三轴角速度与校准状态。帧为二进制，首字节 `0x02`，其后 32 字节固定布局（小端）：

| 偏移 | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| 0 | CMD | u8 | 固定 `0x02` |
| 1 | flags | u8 | bit0 自动校准开｜bit1 监视流开｜bit2 当前静止｜bit3 校准进行中｜bit4 六轴在线 |
| 2 | cal_state | u8 | 0 未校准｜1 等待静止｜2 校准中｜3 完成｜4 失败（移动）｜5 失败（无六轴） |
| 3 | cal_progress | u8 | 0~100（仅状态 2 有意义） |
| 4 | 保留 | u8 | |
| 5–10 | raw[3] | i16 ×3 | 最近一帧角速度（±32767 = ±2000 dps） |
| 11–16 | pp[3] | u16 ×3 | 最近 1 秒窗口内三轴**抖动幅度**（raw；= 最大值 − 最小值，恒定零偏在此值里被抵消） |
| 17–22 | bias[3] | i16 ×3 | 当前生效三轴零偏（raw） |
| 23–28 | dead[3] | u16 ×3 | 当前生效三轴死区（raw） |
| 29–30 | still_threshold | u16 | 当前静止阈值（raw） |
| 31–32 | 保留 | u16 | |

三轴顺序恒为 **X（俯仰）/ Y（偏航）/ Z（横滚）**。

> 监视流的开关**完全由面板决定**（展开且有焦点才开），设备不会自己开或关它——包括
> 手动校准跑完的时候：那时 `cal_state` 会停在 3 / 4 / 5，只要监视流还在推，客户端下一帧
> 就读得到；面板收起/失焦/关弹窗时流才停。因此客户端应把"收到状态 3/4/5"当作本次校准结束。
> 若在没有监视流时也要查状态，可用 `GET /gyro/cal/state`（同布局，不含首字节 CMD）。

---

## 光标位置帧 (0x03) ← 设备

「参数配置 → 光标显示方式」选**融合器光标（6）**时，设备把虚拟光标位置经 WebSocket 推送
（面板 `#cursor` 绿幕页即为此设计：在 OBS 添加浏览器源填 `http://<设备IP>/#cursor`，
加「色键」滤镜抠掉绿色，即可把指针叠加到直播画面）。

- **触发**：脏驱动——位置或状态（显示/按下）每次变化推一帧，无固定频率（与 vPointer app
  的 TCP 推流同一条链路，最快约 1 kHz）。其它光标方式下不推送。
- **坐标系**：`0 .. 0x7FFFFFFE` 归一化，**已含 contain 缩放（外接显示器黑边）、不含旋转**
  ——左上角为原点，与 vPointer app 的光标同一口径。前端换算：
  `px = x / 0x7FFFFFFE * 窗口宽`、`py = y / 0x7FFFFFFE * 窗口高`，页面任意尺寸自适应。
- 帧为二进制，共 **10 字节**（小端）：

| 偏移 | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| 0 | CMD | u8 | 固定 `0x03` |
| 1–4 | x | i32 | 0..0x7FFFFFFE（已含 contain 缩放，未旋转） |
| 5–8 | y | i32 | 同上 |
| 9 | state | u8 | bit0 = 光标显示中｜bit1 = 按下中（**点击本身仍由触屏接口产生真实触摸**，与 vPointer app 模式相同；此位只供前端做按下变色等视觉反馈） |

### 示例

**浏览器**

```js
const ws = new WebSocket("ws://192.168.73.1/ws");
ws.binaryType = "arraybuffer";
ws.onmessage = (e) => {
    const b = new Uint8Array(e.data);
    if (b[0] !== 0x03) return;                  // 0x01 日志 / 0x02 陀螺，忽略
    const v = new DataView(b.buffer);
    const x = v.getInt32(1, true), y = v.getInt32(5, true);
    const show = !!(b[9] & 1), down = !!(b[9] & 2);
    cursor.style.transform =
        `translate(${x / 0x7FFFFFFE * innerWidth}px, ${y / 0x7FFFFFFE * innerHeight}px)`;
    cursor.style.display = show ? "block" : "none";
};
```

**命令行观察原始帧**

```
websocat -b ws://192.168.73.1/ws | xxd
```
