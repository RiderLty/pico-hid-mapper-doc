---
layout: home

hero:
  name: pico-hid-mapper
  text: USB HID 映射器固件
  tagline: 基于微雪 RP2350-USB-C 将键鼠输入映射为触屏操作
  image:
    src: /hero.svg
    alt: pico-hid-mapper
  actions:
    - theme: brand
      text: 快速开始
      link: /quick-start
    - theme: alt
      text: 文档
      link: /api/

features:
  - icon: 🎯
    title: 键鼠→触屏映射
    details: 平台无关的映射引擎，支持按键映射、视角拖拽、WASD 轮盘。9 方向 + 疾跑切换，32 位坐标精度。
  - icon: 🔌
    title: 即插即用，免焊接
    details: 微雪 RP2350-USB-C 自带双 USB-C 口。原生口连主机，PIO-USB 口接键鼠或上位机，无需杜邦线。
  - icon: 🌐
    title: Web 配置面板
    details: 内建 HTTP 服务器 + WebSocket 调试通道。浏览器上传配置、编辑 Lua 脚本、实时查看日志。
  - icon: 📜
    title: Lua 脚本引擎
    details: 内置 Lua 5.4.6 解释器，支持按键宏、连点、时序序列、自定义事件，比静态配置更灵活。
  - icon: 📱
    title: Android 适配
    details: RNDIS 虚拟网卡免驱，手机直连自动分配 IP。搭配 vPointer 端口转发，浏览器访问 Web UI。
  - icon: 💾
    title: 持久化存储
    details: 配置写入 Flash KV-store，掉电不丢失。支持 9 个配置槽位，一键切换不同游戏方案。
  - icon: 🔄
    title: PIO 双角色
    details: PIO-USB 口可切换 Host（直接读键鼠）或 Device（接收上位机 HID 报文）。WebUI / API 一键切换。
  - icon: 🛠️
    title: WebHID 控制
    details: 浏览器端 HID 调试工具，无需安装软件。直接发送命令帧、测试触摸事件、查看设备响应。
---

## 它能做什么？

**pico-hid-mapper** 是一个运行在 **微雪 RP2350-USB-C** 上的固件，它把 USB 键盘/鼠标的操作实时转成触摸屏事件。插上板子，手机以为你在触屏，实际是你在用键鼠。

典型场景：
- 🎮 **手游键鼠操控** — 用键盘 WASD 走位 + 鼠标控制视角
- 🔫 **射击游戏辅助** — Lua 脚本编写压枪宏、连点
- 🤖 **自动化脚本** — 通过 WebSocket / WebHID 发送自定义事件

## 硬件

<div align="center">
  <img src="https://github.com/waveshareteam/RP2350-USB-C/raw/main/assets/Product-1.webp" alt="RP2350-USB-C" width="320" style="border-radius: 12px; margin: 16px 0;">
  <p><strong>微雪 RP2350-USB-C</strong></p>
</div>

无需焊接、无需杜邦线。板子自带双 USB-C 口：
- **原生 USB-C** → 连接手机/电脑（RNDIS 网卡 + HID 触屏）
- **PIO-USB-C** → 连接键盘鼠标（Host 模式）或上位机（Device 模式）

## 工作流

```mermaid
graph LR
    A[USB 键鼠] -->|PIO-USB Host| B[映射引擎]
    C[上位机] -->|PIO-USB Device| B
    B -->|触屏 HID| D[手机 / 电脑]
    B -->|Lua 脚本| E[自定义逻辑]
    E -->|触摸事件| D
```

