# HIDAPI

> 📥 **下载此API文档**：<a href="/api/hid-api.md" download>hid-api.md</a>

PIO 口切换为 **Device 模式**后，PIO-USB-C 口变为 generic HID 设备。上位机通过 HID OUT 端点发送 64B 命令帧控制设备，通过 HID IN 端点接收设备上报的事件。

---

## 命令帧格式

```
[0x55][0xAA][LEN][CMD][PAYLOAD ...]
```

| 字段 | 字节 | 含义 |
|------|------|------|
| Header | 2 | 固定 `0x55 0xAA`，不符则丢弃整帧 |
| LEN | 1 | 其后字节数 = `1`(CMD) + payload 长度，故 **payload 长度 = LEN − 1** |
| CMD | 1 | 命令码（见下表） |
| PAYLOAD | LEN−1 | 命令数据 |

- 整帧长度 = `3 + LEN`，单包 64B 内可容纳（LEN ≤ 61，payload ≤ 60）。
- 多字节字段统一**小端 (LE)**，与 HID 报告 / RP2350 原生字节序一致，可直接 `memcpy`。
- 校验：header 错 / LEN 越界 / payload 被截断 → 丢弃，不上报。

---

## 命令一览

| CMD | 名称 | 说明 |
|-----|------|------|
| `0xFF` | 直接触屏输出 | 绕过映射引擎，直接发送触摸事件 |
| `0xFE` | 鼠标报文 | 标准 8B HID 鼠标报告 |
| `0xFD` | 键盘报文 | 标准 8B HID 键盘报告 |
| `0xFC` | core_input 调度 | 直接调用映射引擎接口 |
| `0xFB` | vmouse 状态输出 | 虚拟鼠标状态转发到网络 |
| `0xFA` | 自定义事件 | 发送文本字符串到 Lua `on_custom_event(str)` |

---

## CMD 0xFF — 直接触屏输出

payload 10 字节。直接调 `touch_queue_push`，绕过映射引擎。

```
55 AA 0B FF [action:u8] [id:u8] [x:i32 LE] [y:i32 LE]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0 | action | u8 | 1=DOWN / 2=MOVE / 3=UP |
| 1 | id | u8 | 触点 ID |
| 2–5 | x | i32 LE | X 坐标 (0..0x7FFFFFFE) |
| 6–9 | y | i32 LE | Y 坐标 (0..0x7FFFFFFE) |

tip 由 action 推导（DOWN/MOVE → 按下，UP → 抬起），contact_count=1。

---

## CMD 0xFE — 鼠标报文

payload 8 字节，标准 `mouse_report_x8`。复用 HID 鼠标解析：按键边沿 → `core_input_mouse_button`；x/y/wheel → `core_input_mouse_move`。

```
55 AA 09 FE [report_id:u8] [buttons:u8] [x:i16 LE] [y:i16 LE] [wheel:i8] [reserved:u8]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0 | report_id | u8 | device 模式忽略，填 0 |
| 1 | buttons | u8 | bit0 左 / bit1 右 / bit2 中 / bit3 前进 / bit4 后退 |
| 2–3 | x | i16 LE | X 位移 |
| 4–5 | y | i16 LE | Y 位移 |
| 6 | wheel | i8 | 滚轮 |
| 7 | reserved | u8 | 0 |

---

## CMD 0xFD — 键盘报文

payload 8 字节，标准 `keyboard_report_x8`。复用 HID 键盘解析：修饰键边沿与普通键按下/释放统一走 `core_input_keyboard`（修饰键为 0xE0-0xE7 标准 HID 键码）。

```
55 AA 09 FD [modifiers:u8] [reserved:u8] [keys[6]:u8×6]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0 | modifiers | u8 | bit0 LCtrl … bit7 RGUI |
| 1 | reserved | u8 | 0 |
| 2–7 | keys[6] | u8×6 | 当前按下的键码 |

---

## CMD 0xFC — core_input 调度

payload[0] = subcmd，之后为对应参数。

| subcmd | 调用函数 | payload（subcmd 之后） | LEN |
|--------|----------|------------------------|-----|
| `0xFF` | `core_input_mouse_move` | dx:i32 + dy:i32 + wheel:i32 (12B) | 14 (`0x0E`) |
| `0xFE` | `core_input_mouse_button` | button:u8 + down:u8 (2B) | 4 |
| `0xFC` | `core_input_keyboard` | keycode:u8 + down:u8 (2B) | 4 |
| `0xFB` | `core_input_orientation` | orientation:u8 (1B) | 3 |
| `0xF9` | `core_input_gamepad_abs` / `core_input_gamepad_btn` | ls_x:i16 + ls_y:i16 + rs_x:i16 + rs_y:i16 + lt:i16 + rt:i16 + buttons:u32 (16B) | 18 (`0x12`) |

> `down` 字段：0 = 释放，非 0 = 按下。

---

## CMD 0xFB — vmouse 状态输出

payload 9 字节，`vmouse_t` 内存二进制。由 Pico **直接转发到网络侧**（TCP vmouse 通道 + UDP cursor），不做触摸转换。

```
55 AA 0A FB [x:i32 LE] [y:i32 LE] [state:u8]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0–3 | x | i32 LE | 光标 X（屏幕像素坐标） |
| 4–7 | y | i32 LE | 光标 Y |
| 8 | state | u8 | bit0=show / bit1=down |

> 上位机 `struct.pack("<iiB", x, y, state)`。LEN = 1(CMD) + 9 = 10 (`0x0A`)。

---

## CMD 0xFC 子命令 0xF9 — 手柄报文

payload 16 字节。将上位机采集的标准手柄状态注入映射引擎，直接调用 `core_input_gamepad_abs` + `core_input_gamepad_btn`。

```
55 AA 12 FC F9 [ls_x:i16 LE] [ls_y:i16 LE] [rs_x:i16 LE] [rs_y:i16 LE] [lt:i16 LE] [rt:i16 LE] [buttons:u32 LE]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0–1 | ls_x | i16 LE | 左摇杆 X 轴（-32767..32767，左负右正）|
| 2–3 | ls_y | i16 LE | 左摇杆 Y 轴（-32767..32767，上负下正）|
| 4–5 | rs_x | i16 LE | 右摇杆 X 轴 |
| 6–7 | rs_y | i16 LE | 右摇杆 Y 轴 |
| 8–9 | lt | i16 LE | 左扳机（0..32767，模拟值）|
| 10–11 | rt | i16 LE | 右扳机（0..32767，模拟值）|
| 12–15 | buttons | u32 LE | 按键 bitmap（20 个按键，bit 位含义见下方映射表）|

摇杆值范围对应 int16 满量程，由 Web 端 Gamepad API 的 `axes[i]`（-1..+1）缩放得到。

**摇杆映射行为**：

- **左摇杆** → WASD 轮盘映射（与 WASD 按键不共存）。圆形死区判定（默认 6.25%），摇杆推力的幅度与角度决定屏幕上轮盘触点的位置。幅度控制半径（推到底=疾跑距离），方向精确跟随。
- **右摇杆** → 映射开启时控制视角移动（极坐标曲线+积分）；映射关闭时移动虚拟鼠标指针。支持可配置的死区、曲线和灵敏度。
- **LT/RT** → 当前版本暂存值，不做主动映射。RT 在 vmouse 模式下有特殊行为（自动转为鼠标左键）。

**按键 bitmap 位映射**（与固件 `pio_gamepad_btn_map` 一致，共 20 位）：

| bit | 按键码 | 按键名 |
|-----|--------|--------|
| 0 | `0x10` | 十字键 上 |
| 1 | `0x11` | 十字键 下 |
| 2 | `0x12` | 十字键 左 |
| 3 | `0x13` | 十字键 右 |
| 4 | `0x0A` | START |
| 5 | `0x09` | SELECT |
| 6 | `0x0B` | LS（左摇杆按下）|
| 7 | `0x0C` | RS（右摇杆按下）|
| 8 | `0x05` | LB / L1 |
| 9 | `0x06` | RB / R1 |
| 10 | `0x0D` | HOME / Guide |
| 11 | `0x0E` | MISC |
| 12 | `0x01` | A / Cross |
| 13 | `0x02` | B / Circle |
| 14 | `0x03` | X / Square |
| 15 | `0x04` | Y / Triangle |
| 16 | `0x07` | LT / L2（数字边沿）|
| 17 | `0x08` | RT / R2（数字边沿）|
| 18 | `0x14` | EXTRA_1 |
| 19 | `0x15` | EXTRA_2 |

> 按键采用边沿检测：上一帧到当前帧的差分触发 `core_input_gamepad_btn`，与键盘/鼠标边沿逻辑一致。由映射引擎处理按键→映射查询；若有 Lua 脚本声明了 `on_gamepad_btn`，则 Lua 先拦截。

**手柄参数配置**（持久化存储）：

手柄的摇杆死区、曲线、灵敏度等参数可通过 HTTP API 配置，写入 flash 持久保存：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/gamepad/params` | GET | 返回当前参数 blob（122 字节，`application/octet-stream`）|
| `/gamepad/params` | POST | 上传参数 blob 即时生效并持久化 |
| `/gamepad/reset` | POST | 恢复默认参数并删除持久化 key |

默认参数：左/右摇杆死区 6.25%，回报率 500Hz，视角/鼠标灵敏度 1.0，曲线为空。详细参数格式见固件源码 `gamepad_args.h`。

---

## CMD 0xFA — 自定义事件

发送文本字符串到 Lua，触发 `on_custom_event(str)`。payload 为 UTF-8 文本，**最大 60 字节**（受 64B HID 报告限制，帧头占 4B）。

```
55 AA LEN FA [text: UTF-8 string]
```

| 偏移 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 0–(N−1) | text | u8×N | UTF-8 字符串，LEN = 1 + N，N ≤ 60 |

收到后直接调用 `lua_binder_on_custom_event(text)`，无需 `enable_listen`。

配合 `on_custom_event` + `string.match` 解码参数可实现任意复杂逻辑，配合 `print()` 可经 WebSocket 向主机回传结果。

```lua
function on_custom_event(str)
    -- 示例：接收 "click 500 800" 并点击对应坐标
    local x, y = string.match(str, "^click (%d+) (%d+)$")
    if x and y then
        local id = touch_down(tonumber(x), tonumber(y))
        touch_up(id)
        print("clicked at " .. x .. "," .. y)  -- 回传到 WebSocket 日志
        return true
    end
    return false
end
```

> 字符串超过 60 字节会被截断。长指令建议拆分为多条简短指令，或用协程 + `tick` 构成序列。

---

## IN 端点事件

设备通过 IN 端点主动上报事件，由事件队列驱动。

```
[0x55][0xAA][LEN][EVT][DATA ...]
```

| EVT | 名称 | DATA | 触发条件 |
|-----|------|------|----------|
| `0x01` | 方向变化 | orientation:u8 (0..3) | 屏幕方向改变时 |

---

## WebHID 控制工具

为了方便调试，提供了一个浏览器端的 **[WebHID 控制工具](/webhid)**（PIO Device Sender），无需安装任何软件即可：

- **连接设备** — 通过 WebHID API 直接选择并连接 Pico HID 设备
- **命令构造** — 可视化构造上述所有 CMD（触屏/鼠标/键盘/core_input/Lua 事件/手柄报文），一键发送
- **实时反馈** — 显示 sendReport 往返延迟（RTT），接收设备 IN 端点上报事件
- **独占模式** — 锁定设备，防止其他应用干扰
- **手柄可视化** — 采集电脑手柄（Gamepad API），实时显示摇杆位置、扳机力度、按钮状态，并通过 CMD 0xFC 子命令 0xF9 转发

使用前提：PIO 口切换为 Device 模式，Chrome / Edge 浏览器，PIO-USB-C 口连接电脑。

> 工具为纯前端页面，所有数据在浏览器本地处理，不会上传到任何服务器。
