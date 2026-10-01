# 串口协议（MAKCU）

> 📥 **下载此API文档**：<a href="/api/serial-api.md" download>serial-api.md</a>

设备的 UART 串口（GPIO2/3，8N1）使用 **MAKCU 协议族**。设备开机默认 115200；主机先发送 `DE AD 05 00 A5 <baud LE32>` 握手帧，再切换到目标工作波特率（常用 4M）。运行期也可通过 `km.baud(n)` 或 V2 `0xB1` 切速，重启后恢复 115200。协议提供鼠标/键盘注入、连点、定时按压、字符串输入、平滑移动、按键锁定与物理输入屏蔽、状态遥测等能力。

## 与 HID 控制的区别

| | HID（Device 模式） | 串口（MAKCU 协议） |
|---|---|---|
| 物理链路 | PIO-USB-C 口的 HID OUT/IN 端点 | GPIO2/3 UART（经 USB-TTL 或板载转串口） |
| 帧格式 | `55 AA` 命令帧（见 [HIDAPI](/api/hid-api)） | `km.*` 文本、`DE AD`、`0x50` V2、`55 AA` 私有扩展帧 |
| 命令集 | 触屏 / 鼠标 / 键盘 / core_input 调度 / vmouse / Lua 自定义事件 | 上述全部能力 + 连点 / 打字 / 平滑移动 / 锁定屏蔽 / 遥测 |
| 生态 | 自定义上位机 | MAKCU 文本/V2 客户端；可使用仓库 `pytester/test_makcu.py` 回归 |

两个通道最终进入同一套设备控制路径，功能语义一致；区别只在传输与命令集广度。

## 握手与帧格式概要

握手时以 115200 打开串口，发送：

```
DE AD 05 00 A5 <baud:uint32 little-endian>
```

设备不回复握手帧；主机等待短暂的 TX 排空时间后盲切到相同波特率。文本命令以 `\r` 或 `\n` 结束，例如 `km.version()`、`km.move(10,20)`、`km.baud()`。V2 帧格式为 `[50][CMD][LEN:u16 LE][payload]`；MAKCU 私有扩展帧格式为 `[55][AA][LEN:u8][CMD][payload]`。

## 55 AA 私有扩展帧

串口保留 **MAKCU 私有扩展帧 `55 AA`**，格式与 HID 控制帧相同，用于把 [HIDAPI](/api/hid-api) 的控制指令复用到串口：

- 帧格式：`[55 AA][LEN][CMD][payload...]`，LEN 为 CMD 与 payload 的总长度
- 例：`55 AA 0E FC FF <dx:i32><dy:i32><wheel:i32>` 注入一次相对移动
- 固件收到后在设备侧重放同一控制路径，语义与 HID 通道一致

## 噪声处理说明

串口只解析上述 MAKCU 帧型。无法组成完整帧的字节会按噪声消费；二进制半帧超过 50ms 未继续接收时复位解析状态。文本行必须以换行结束，非 `km.*` 文本静默消费。

## 示例

```text
115200: DE AD 05 00 A5 00 09 3D 00   # 请求切到 4000000
4000000: km.version()\r\n
4000000: km.baud(921600)\r\n          # 收到 ACK 后主机切到 921600
921600:  km.baud()\r\n
```
