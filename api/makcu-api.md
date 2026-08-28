# MAKCU 使用说明

> 📥 **下载此API文档**：<a href="/api/makcu-api.md" download>makcu-api.md</a>

MAKCU（KM 主机协议 v3.9）是一套兼容 MAKCU 生态的上位机键鼠控制协议。上位机通过 **UART 串口**与 Pico 通信，可远程控制鼠标移动、点击、滚轮、连发、键盘按键、字符串输入、按键屏蔽/重映射，以及按键/轴锁定与捕获。支持文本与 V2 二进制两种协议形态。

---

## 连接方式

Pico 的 UART0 固定为 **921600 波特率**，通过 USB-TTL 适配器与上位机相连（交叉接线）：

| 适配器 | Pico 引脚 |
|--------|-----------|
| RX | **GPIO2**（固件 TX） |
| TX | **GPIO3**（固件 RX） |
| GND | GND |

> ⚠️ 适配器的 **RX** 接 Pico 的 **GPIO2**（TX），适配器的 **TX** 接 Pico 的 **GPIO3**（RX），两者 GND 共地。

也可使用浏览器端 [WebHID 工具](/webhid) 的「串口」模式连接（波特率选择 921600）。

---

## 文本协议（ASCII）

命令格式：`km.xxx(...)` 或 `.xxx(...)`（`km.` 前缀可选），以换行结尾。

应答以 `>>> ` 提示符收尾：

- **Setter**（设置类）回显命令行作为 ACK，可用 `echo(0)` 关闭回显；
- **Getter**（查询类）返回取值行，形如 `>>> <值>`；
- 上位机库（如 makcu-py-lib）会给需要配对的命令追加 `#<序号>` 标签（如 `km.version()#12`），设备在应答中原样保留该标签，供上位机做请求-应答配对。

### 鼠标命令

| 命令 | 说明 |
|------|------|
| `left([state])` / `right` / `middle` / `side1` / `side2` | 单键按下/释放。`state`: 0=释放 1=按下 2=静默释放；查询返回 0=无 1=原始 2=注入 3=两者 |
| `click(button[,count[,delay_ms]])` | 连点。`count` 缺省 1；`delay_ms` 缺省每拍随机 35-75ms |
| `turbo([button[,delay_ms]])` | 连发。按住按键时自动快速通断；`turbo(0)` 关闭全部 |
| `move(dx,dy[,segments[,cx1,cy1[,cx2,cy2]]])` | 相对移动。可选 `segments` 分段与三次贝塞尔控制点实现平滑路径 |
| `moveto(x,y[,segments[,cx1,cy1[,cx2,cy2]]])` | 移动到绝对坐标 |
| `wheel(delta)` | 滚轮 |
| `getpos()` | 查询当前坐标 |
| `silent(x,y)` | 移动到 (x,y) 并静默左键点击 |
| `mo(buttons,x,y,wheel,pan,tilt)` | 发送完整原始鼠标帧 |
| `lock_<target>([state])` | 锁定按键/轴。target: `ml`/`mm`/`mr`/`ms1`/`ms2`、`mx`/`my`/`mw`（全锁）、`mx+`/`mx-`/`my+`/`my-`/`mw+`/`mw-`（方向锁） |
| `catch_<target>([mode])` | 在已锁定的按钮上启用捕获（仅按钮，需先 `lock_`） |
| `remap_button([src,dst])` | 物理按钮重映射（只影响物理输入） |
| `remap_axis([inv_x,inv_y,swap])` | 物理轴重映射（只影响物理输入） |
| `invert_x([state])` / `invert_y([state])` / `swap_xy([state])` | 轴翻转 / 交换 |

### 键盘命令

| 命令 | 说明 |
|------|------|
| `down(key)` / `up(key)` | 按下/释放按键。`key` 为 HID 码或名称（如 `'a'`、`"shift"`） |
| `press(key[,hold_ms[,rand_ms]])` | 按压指定时长（缺省随机 35-75ms，可加随机范围） |
| `string(text)` | 输入 ASCII 字符串，自动处理 Shift，最大 256 字符 |
| `init()` | 清除键盘状态、释放全部按键 |
| `isdown(key)` | 查询按键当前是否按下 |
| `disable([key,mode] \| [key1,key2,...])` | 禁用指定按键 |
| `mask(key[,mode])` | 键盘屏蔽 |
| `remap(source,target)` | 键盘键重映射 |

### 流式命令

| 命令 | 说明 |
|------|------|
| `keyboard([mode[,period_ms]])` | 键名状态流 |
| `buttons([mode[,period_ms]])` | 按钮状态流 |
| `axis([mode[,period_ms]])` | 轴位移累计流 |
| `mouse([mode[,period_ms]])` | 鼠标原始帧流 |

### 系统命令

| 命令 | 说明 |
|------|------|
| `version()` | 固件版本 |
| `info()` / `help()` | 设备信息 / 命令帮助 |
| `device()` | 已连接的 HID 设备类型 |
| `fault()` | 设备故障状态 |
| `reboot()` | 重启设备 |
| `serial([text])` | 序列号（存/取） |
| `echo([enable])` | 回显开关（0=关） |
| `baud([rate])` | 波特率（本固件固定 921600，仅存储与查询） |
| `screen([W,H])` | 虚拟屏幕尺寸 |
| `release([timer_ms])` | 按键自动释放周期（0=关） |
| `hs([enable])` | HS 参数（存储） |
| `log([level])` | 日志级别 |
| `led([target,...])` | 板载 LED（设备侧仅存储状态） |

---

## V2 二进制协议

V2 帧统一格式（多字节值一律小端）：

```
[0x50] [CMD] [LEN_LO] [LEN_HI] [PAYLOAD ...]
```

- `0x50` — 帧起始字节（固定）
- `CMD` — 命令码（0x01–0xFF）
- `LEN_LO / LEN_HI` — payload 长度（16 位小端）
- `PAYLOAD` — 命令数据

应答：

- **SET**：`[0x50] [CMD] [1] [status]`，`0x00`=OK，`0x01`=ERR
- **GET**：`[0x50] [CMD] [LEN] [DATA ...]`
- **流式**：不带帧头的原始 HID 帧字节

### 鼠标命令码

| CMD | 命令 | CMD | 命令 |
|-----|------|-----|------|
| 0x01 | axis 流 | 0x10 | remap_button |
| 0x02 | buttons 流 | 0x11 | right |
| 0x03 | catch | 0x12 | side1 |
| 0x04 | click | 0x13 | side2 |
| 0x05 | getpos | 0x14 | silent |
| 0x06 | invert_x | 0x15 | swap_xy |
| 0x07 | invert_y | 0x16 | tilt |
| 0x08 | left | 0x17 | turbo |
| 0x09 | lock | 0x18 | wheel |
| 0x0A | middle | 0x19 | remap_axis |
| 0x0B | mo | 0x0C | mouse 流 |
| 0x0D | move | 0x0E | moveto |
| 0x0F | pan | | |

### 键盘命令码

| CMD | 命令 | CMD | 命令 |
|-----|------|-----|------|
| 0xA1 | disable | 0xA6 | mask |
| 0xA2 | down | 0xA7 | press |
| 0xA3 | init | 0xA8 | remap |
| 0xA4 | isdown | 0xA9 | string |
| 0xA5 | keyboard 流 | 0xAA | up |

### 系统命令码

| CMD | 命令 | CMD | 命令 |
|-----|------|-----|------|
| 0xB1 | baud | 0xB9 | led |
| 0xB2 | bypass（不支持） | 0xBA | log |
| 0xB3 | device | 0xBB | reboot |
| 0xB4 | echo | 0xBC | release |
| 0xB5 | fault | 0xBD | screen |
| 0xB7 | hs | 0xBE | serial |
| 0xB8 | info | 0xBF | version |

---

## makcu-py-lib 集成

[makcu-py-lib](https://github.com/SleepyTotem/makcu-py-lib) 是 MAKCU 生态的 Python 上位机库，封装了串口连接、请求-应答配对与高层命令：

```python
from makcu.controller import MakcuController
from makcu.enums import MouseButton

# 连接（波特率固定 921600，库会跳过改速帧）
ctl = MakcuController(fallback_com_port="/dev/ttyUSB0", send_init=False)
ctl.connect()

# 高层 API
ctl.mouse.lock_left(True)                  # 锁定左键
ctl.mouse.is_locked(MouseButton.LEFT)      # True
ctl.move(100, 50)                          # 相对移动
ctl.click(MouseButton.LEFT)                # 单击左键

# 任意文本命令
ctl.transport.send_command("km.press('d',60)")   # 按 d 键 60ms
ctl.transport.send_command("km.string('hello')") # 输入字符串

ver = ctl.get_firmware_version()
ctl.disconnect()
```

---

## 常见示例

**连点** — 左键连点 5 次、间隔 30ms：

```
km.click(1,5,30)
```

**平滑移动** — 带贝塞尔控制点的相对移动（三次曲线）：

```
km.move(80,-30,20,40,25,80,10)
```

**打字** — 输入一串文本（自动处理 Shift 与大写）：

```
km.string("hello MAKCU 123")
```

**锁定与捕获** — 锁定左键后，物理左键事件被吞掉；`catch_ml(1)` 把被锁按钮的物理压放上报给上位机：

```
km.lock_ml(1)
km.catch_ml(1)
```

**V2 查询版本** — 发送 `[0x50] [0xBF] [0x00] [0x00]`，设备应答 `[0x50] [0xBF] [LEN] [版本字符串]`。
