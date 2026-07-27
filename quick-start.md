# 快速开始

本指南面向**只有 UF2 固件文件、不接触源码**的用户。从刷机到可用，只需几分钟。

## 你需要准备

| 物品 | 用途 |
|------|------|
| **微雪 RP2350-USB-C** 开发板 | 目标板，自带双 USB-C 口 |
| **USB 数据线** ×1–2 | 原生口连主机；PIO-USB 口接键鼠 |
| **UF2 固件文件** | 从 [Releases](https://github.com/RiderLty/pico-hid-mapper/releases) 下载 |
| **Android 手机** | 目标平台（本项目仅适配 Android） |

可选：

| 物品 | 用途 |
|------|------|
| USB 键盘 / 鼠标 | PIO Host 模式下接 PIO-USB-C 口 |
| USB Hub | 同时连接多个 HID 设备 |

## 第一步：刷入固件

1. **按住板子上的 BOOTSEL 按钮**（白色小按钮）
2. 保持按住，用 USB 线将 **原生 Type-C 口** 连接到电脑
3. 松开 BOOTSEL → 电脑出现名为 **`RPI-RP2`** 的 U 盘
4. 把 `pico-hid-mapper.uf2` **拖拽/复制** 到 U 盘
5. 板子自动重启，固件生效 ✅

> 此操作只需一次。后续固件升级同样重复此步骤即可覆盖。

## 第二步：连接设备

板子有两个 USB-C 口，各司其职：

```
        ┌──────────────────────┐
        │  RP2350-USB-C        │
        │                      │
  手机 ─│ 原生 USB-C    PIO-USB │─ 键盘/鼠标
        │                      │  (Host 模式)
        └──────────────────────┘
```

1. **原生 Type-C 口** 用 USB 线连接 **手机**
2. 手机通知栏出现「USB 以太网」→ RNDIS 网卡已识别
3. **PIO-USB Type-C 口** 接你的键盘/鼠标（可能需要 USB-C 转 A 母座）

> 此时固件同时提供三个 USB 功能：**RNDIS 网卡**（配置）、**HID 触屏**（映射输出）、**PIO-USB Host**（读键鼠）。

## 第三步：打开 Web 配置面板

1. 手机连接 Pico 后，系统自动识别 RNDIS 网卡
2. Pico 的 IP 固定为 **`192.168.73.1`**

### Android 手机访问

Android 限制应用直接访问 RNDIS 网段。需要通过端口转发：

**方法一：ADB + socat（推荐）**

```bash
# 首次：下载 socat 到手机
adb push socat /data/local/tmp/socat
adb shell chmod +x /data/local/tmp/socat

# 转发 Pico 80 → 手机 127.0.0.1:8000
adb shell /data/local/tmp/socat tcp-listen:8000,bind=127.0.0.1,reuseaddr,fork tcp:192.168.73.1:80
```

然后手机浏览器打开 **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**。

**方法二：一键脚本**

```bash
curl https://1833788059.cdn.123clouddisk.com/1833788059/direct/socat.sh | sh
```

### 电脑直接访问

电脑连接 Pico 后，直接在浏览器打开 **[http://192.168.73.1/](http://192.168.73.1/)**。

## 第四步：上传配置文件

Web UI 打开后：

1. 点击页面上的上传区域，选择一个 **JSON 配置文件**
2. 页面本地转换为二进制格式
3. 点击「上传到 Pico」→ 配置写入 Flash，掉电不丢

> JSON 配置格式说明见 [API 文档](/api/#配置格式)。固件自带默认配置，可直接使用。

## 第五步：开始使用

- ✅ 固件已刷入
- ✅ 设备已连接
- ✅ 配置已上传

现在按下键盘，手机屏幕上就会有对应的触摸操作。

## 下一步

- 了解 [HTTP API](/api/http-api) 进行自动化控制
- 学习 [Lua 脚本](/api/lua-api) 编写自定义宏
- 使用 [WebHID 工具](/webhid) 调试设备

## 常见问题

| 问题 | 解决 |
|------|------|
| RNDIS 网卡未识别 | 换一根数据线（确保支持数据传输），或换一个 USB 口 |
| 无法访问 192.168.73.1 | 检查手机是否识别到 RNDIS 网卡；Android 需端口转发 |
| 键鼠按下无反应 | 检查 PIO 口是否为 Host 模式（Web UI → PICO 配置） |
| 配置上传失败 | 检查 JSON 格式是否正确；查看 WebSocket 日志 |
