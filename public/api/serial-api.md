# 串口协议（Hurra）

> 📥 **下载此API文档**：<a href="/api/serial-api.md" download>serial-api.md</a>

设备的 UART 串口（GPIO2/3，固定 2M 8N1）使用 **Hurra 二进制协议**（基于 TinyFrame 成帧），替代原先的 MAKCU 协议。相比 HID 命令帧，串口通道提供更完整的控制能力：鼠标/键盘注入、连点、定时按压、字符串输入、平滑移动（automove / 贝塞尔轨迹）、按键锁定与物理输入屏蔽、状态遥测等。

## 与 HID 控制的区别

| | HID（Device 模式） | 串口（Hurra 协议） |
|---|---|---|
| 物理链路 | PIO-USB-C 口的 HID OUT/IN 端点 | GPIO2/3 UART（经 USB-TTL 或板载转串口） |
| 帧格式 | `55 AA` 命令帧（见 [HIDAPI](/api/hid-api)） | TinyFrame 二进制帧 |
| 命令集 | 触屏 / 鼠标 / 键盘 / core_input 调度 / vmouse / Lua 自定义事件 | 上述全部能力 + 连点 / 打字 / 平滑移动 / 锁定屏蔽 / 遥测 |
| 生态 | 自定义上位机 | 可直接对接 [hurra-bridge](https://github.com/VoltCyclone/Hurra-v2)（KMBox Net / Ferrum 端点） |

两个通道最终进入同一套设备控制路径，功能语义一致；区别只在传输与命令集广度。

## 帧格式概要

```
[ID:1][LEN:1][TYPE:1][头CRC16:2][载荷:LEN][载荷CRC16:2]
```

- CRC16 多项式 `0x8005`（反射），**CRC 字段大端**，载荷内多字节字段**小端**；LEN=0 的帧无载荷 CRC
- 无帧头字节，同步靠头 CRC 自校验；上位机按「同 ID + 同 TYPE」配对应答
- 完整命令集（TYPE 码与载荷布局）以参考实现为准：固件 `src/hurra.c`、[hurra-v2](https://github.com/VoltCyclone/Hurra-v2) / [hurra-app](https://github.com/VoltCyclone/Hurra-v2)（host 桥与 libhurra），Python 帧编码示例见仓库 `pytester/test_hurra.py`

> 💡 原生对接 hurra-bridge：`hurra-bridge --device <串口> --baud 2000000`（**必须显式指定 --baud**，默认 4M），endpoint 选 2 即可获得 KMBox Net UDP 端点，现有 KMBox Net 生态上位机可直接使用。

## 扩展子命令：HID 控制指令复用

协议预留了 **Pico 私有扩展块 `TYPE 0xC0`（VCTRL）**，用于把 [HIDAPI](/api/hid-api) 的 `55 AA` 控制指令在串口通道上使用：

- TF 载荷 = 原命令帧的 `[CMD][payload...]`（去掉 `55 AA` 帧头与 LEN 域，长度由 TF 帧头承担）
- 例：HID 帧触摸指令 `55 AA 0B FF <action><id><x:4><y:4>` → 串口 TF 帧 TYPE=`0xC0`、载荷=`FF <action><id><x:4><y:4>`
- 固件收到后在设备侧重放同一命令路径，语义与 HID 通道完全一致，并获得 TF 载荷 CRC 校验

## 从 MAKCU 迁移

原 MAKCU（文本 `km.*` / V2 二进制）协议已移除。上位机建议改走 hurra-bridge 的 KMBox Net 或 Ferrum 端点；自研上位机可直接实现上述帧格式，或经 `0xC0` 扩展子命令沿用原有命令帧封装。
