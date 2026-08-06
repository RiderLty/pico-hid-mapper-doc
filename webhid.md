# WebHID 工具

浏览器端 HID 调试工具，通过 WebHID API 直接与 Pico 设备通信。

<iframe
  src="/webhid/index.html"
  class="webhid-frame"
  title="WebHID 调试工具"
  loading="lazy"
></iframe>



<div style="margin: 16px 0;">
  <a href="/webhid/index.html" target="_blank"
     style="display: inline-block; padding: 10px 24px; background: var(--vp-c-brand-1); color: white;
            border-radius: 8px; text-decoration: none; font-weight: 500;">
    🛠️ 在新窗口打开 WebHID 工具
  </a>
</div>


## 使用前提

1. Pico 的 PIO 口已切换为 **Device 模式**（Web UI → PICO 配置 → 切换 PIO 角色）
2. 使用 **Chrome / Edge** 浏览器（支持 WebHID API）
3. Pico 的 PIO-USB-C 口连接到电脑


## 功能说明

WebHID 工具支持以下操作：

- **连接设备** — 选择 Pico HID 设备并打开连接
- **发送命令帧** — 按 [HIDAPI](/api/hid-api) 协议构造并发送命令
- **触屏测试** — 直接发送触摸 DOWN / MOVE / UP 事件
- **键盘/鼠标模拟** — 发送标准 HID 键盘/鼠标报文
- **手柄转发** — 采集电脑手柄（Gamepad API），通过 CMD 0xF9 实时转发到 Pico 映射引擎
- **手柄可视化** — 摇杆位置（SVG 圆点）、扳机力度（柱状图）、按钮状态（20 个指示灯）
- **多手柄支持** — 热插拔、点击名称切换当前手柄
- **事件查看** — 接收并解析设备 IN 端点上报的事件


> 工具为纯前端页面，所有数据在浏览器本地处理，不会上传到任何服务器。

