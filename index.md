---
layout: home

hero:
  name: pico-hid-mapper
  text: USB HID 映射器
  tagline: 基于微雪 RP2350-USB-C 将键鼠输入映射为触屏操作
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

features:
  - icon: 🔌
    title: 即插即用，免焊接
    details: 微雪 RP2350-USB-C 自带双 USB-C 口。原生口连主机，PIO-USB 口接键鼠或上位机，无需杜邦线。
  - icon: 🔄
    title: PIO USB-C 双角色
    details: Device（PC上位机控制） 或 Host（键鼠直连开发板，无需上位机） 。WebUI 一键切换。
  - icon: 📜
    title: Lua 脚本引擎
    details: 内置 Lua 5.4.6 解释器，支持按键宏、连点、时序序列、自定义事件，比静态配置更灵活。
  - icon: 🌐
    title: Web 配置面板
    details: 内建 HTTP 服务器 + WebSocket 调试通道。浏览器上传配置、编辑 Lua 脚本、实时查看日志。
  - icon: 📱
    title: Android 适配
    details: 无需配置网络，USB网卡免驱，手机直连自动分配 IP。搭配 vPointer 端口转发，浏览器访问 Web UI。
  - icon: 🛠️
    title: WebHID 控制
    details: 基于WebHID API的上位机控制工具，在浏览器中直接使用。
  - icon: 🎮
    title: MAKCU 键鼠控制
    details: 通过 UART 串口远程控制键鼠，支持文本与 V2 二进制协议，兼容 makcu-py-lib 生态。
---

## 它能做什么？

**pico-hid-mapper** 是一个运行在 **微雪 RP2350-USB-C** 上的固件，它可以通过自定义配置，将 USB 键盘/鼠标的操作实时转成触摸屏事件。

典型场景：
- 🎮 **手游键鼠操控** — 用键盘 WASD 走位 + 鼠标控制视角
- 🔫 **射击游戏辅助** — Lua 脚本编写压枪宏、连招，支持时序序列、自定义事件
- 🤖 **自动化脚本** — 通过 WebSocket / WebHID 发送自定义事件到Lua脚本引擎

## 硬件需求

<div align="center">
  <img src="/board.webp" alt="RP2350-USB-C" width="320" style="border-radius: 12px; margin: 16px 0;">
  <p><strong>微雪 RP2350-USB-C</strong></p>
  <img src="https://statistics.rd5isto.org/i/1db6d4ff-a871-493e-bcd0-59c4689adfc9" style="display:none;" >
</div>

无需焊接、无需杜邦线。板子自带双 USB-C 口：
- **原生 USB-C**（靠近 RST 和 BOOT 按钮的一侧）→ 连接安卓设备（USB网卡 (CDC) + HID 触屏）
- **PIO-USB-C**（靠近 CC1、CC2 电阻的一侧）→ 默认 **Device 模式**（连接上位机接收 HID 指令），可切换为 Host 模式（直连键盘鼠标）

### 可选硬件

**群友定制 RP2350A 键鼠映射板** — 有群友把本项目会用到的接口集成到了一块自制板子上：键鼠主机口、GPIO8 扩展 USB 主机口（可外接第二个键鼠设备），以及 MAKCU 串口的板载 USB 转串口（连接上位机时免自行焊接，也无需 USB-TTL 适配器）。固件刷写方式与微雪板一致。

👉 购买：[【闲鱼】自制RP2350A键鼠映射硬件板](https://m.tb.cn/h.8LxDIrl?tk=uGqUT5wZoPk)

