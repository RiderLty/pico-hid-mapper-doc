---
layout: home

hero:
  name: pico-hid-mapper
  text: USB HID 映射器
  tagline: 基于 RP2350 定制开发板，将键鼠输入映射为触屏操作
  image:
    src: /icon.png
    alt: pico-hid-mapper
  actions:
    - theme: brand
      text: 快速开始
      link: /quick-start
    - theme: alt
      text: 文档
      link: /api/
    - theme: alt
      text: QQ交流群
      link: https://qm.qq.com/cgi-bin/qm/qr?k=ADpjCCIKz79QSBBmKhr9fXjeGlEvnSUS&jump_from=webapi&authKey=l23Yp3dysdEgmHNrGUx52qHXUj36BKKZ86XfQ0AZy8D0nEXfETw1jHomeJR0ycjh
    - theme: alt
      text: 入手定制开发板
      link: https://m.tb.cn/h.jnPsXuQ?tk=EUff6URIL10
      target: _blank
      rel: noopener

features:
  - icon: 🔌
    title: 即插即用，免焊接
    details: RP2350 定制开发板集成手机 Type-C 口、串口与两个 USB-A 主机口。键鼠直插，串口接电脑，无需拓展坞。
  - icon: 🔄
    title: 双 USB-A 键鼠直连
    details: 键盘、鼠标、手柄直接插在板载 USB-A 主机口，映射在板内完成；上位机通过板载 USB 转串口（MAKCU 协议）控制。
  - icon: 📜
    title: Lua 脚本引擎
    details: 内置 Lua 5.4.6 解释器，支持按键宏、连点、时序序列、自定义事件，比静态配置更灵活。
  - icon: 🌐
    title: Web 配置面板
    details: 内建 HTTP 服务器 + WebSocket 调试通道。浏览器上传配置、编辑 Lua 脚本、实时查看日志。
  - icon: 📱
    title: Android 适配
    details: 无需配置网络，USB网卡免驱，手机直连自动分配 IP。搭配 vPointer 端口转发，浏览器访问 Web UI。
  - icon: 🍎
    title: iPadOS / iPhone 适配
    details: 目标平台一键切换（或选自动，设备识别主机系统自行切换），iPad / iPhone 直连后以触控板 + 鼠标形态出现（系统原生免驱），映射照常生效。
  - icon: 🛠️
    title: 上位机工具
    details: 浏览器中通过串口连接设备，发送键鼠控制指令并查看调试信息。
  - icon: 🎮
    title: MAKCU 串口控制
    details: 通过板载 USB 转串口远程控制键鼠，支持 MAKCU 文本、V2、私有扩展帧与握手切速。
---

## 它能做什么？

**pico-hid-mapper** 是一个运行在 **RP2350 定制开发板**上的固件，它可以通过自定义配置，将 USB 键盘/鼠标的操作实时转成触摸屏事件。

典型场景：
- 🎮 **手游键鼠操控** — 用键盘 WASD 走位 + 鼠标控制视角
- 🔫 **射击游戏辅助** — Lua 脚本编写压枪宏、连招，支持时序序列、自定义事件
- 🤖 **自动化脚本** — 通过 WebSocket / 串口发送自定义事件到Lua脚本引擎
