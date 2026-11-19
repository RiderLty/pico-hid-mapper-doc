# 快速开始

按顺序完成：**连接设备 → 进入配置面板 → 配置映射 → 开始使用**。

## 你需要准备

**RP2350 定制开发板** — 键鼠 ，具有数据传输功能的数据线

## 第一步：连接设备

1. **USB-A 两个口**分别连接键盘、鼠标或手柄。
2. **手机 Type-C 口**（标有手机插口）连接手机；

> 部分主机可能把设备显示为 **DualSense 手柄**，属正常现象；**USB 网卡（ECM）** 会自动识别。

## 第二步：进入配置面板

设备通过手机 Type-C 口提供 USB 网卡（ECM），固定 IP 为 `192.168.73.1`。

- **苹果（iPhone / iPad）** — Safari 直接打开 `http://192.168.73.1/`，不影响 Wi-Fi 上网；
- **安卓** — 断开手机的移动数据 / Wi-Fi 再访问 `http://192.168.73.1/`。或者是用下文的端口转发APP；

## 第三步：平台设置

### 苹果（iPhone / iPad）

1. **设置 → 辅助功能 → 缩放**：打开；出现放大镜时三指点击恢复。
2. **iOS：设置 → 辅助功能 → 触控 → 辅助触控**：打开；连接 Pico 后，在「辅助触控 → 指针设备 → 设备」中选择它。
3. **iPadOS：设置 → 多任务与手势**：选择「全屏幕 App」，关闭「四指与五指 App 切换」和「高效手势」。
4. **方向**：苹果不能自动检测。触控方向不对时，在「PICO 配置 → 屏幕旋转方向」或「参数配置 → 旋转 → 屏幕旋转方向」选择 0° / 90° / 180° / 270°；鼠标方向不对时调整「鼠标旋转方向」。

**iPadOS**

<div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center; margin:16px 0;">
  <figure style="flex:0 1 560px; margin:0; text-align:center;">
    <img loading="lazy" src="/ios/ipados-zoom.jpg" alt="iPadOS：设置 → 辅助功能 → 缩放，打开缩放" style="width:100%; border-radius:8px; border:1px solid var(--vp-c-divider);">
    <figcaption style="margin-top:6px; font-size:12px; color:var(--vp-c-text-3);">设置 → 辅助功能 → 缩放：打开</figcaption>
  </figure>
  <figure style="flex:0 1 560px; margin:0; text-align:center;">
    <img loading="lazy" src="/ios/ipados-gestures.jpg" alt="iPadOS：设置 → 多任务与手势，选择全屏幕 App，关闭四指与五指 App 切换和高效手势" style="width:100%; border-radius:8px; border:1px solid var(--vp-c-divider);">
    <figcaption style="margin-top:6px; font-size:12px; color:var(--vp-c-text-3);">设置 → 多任务与手势：选择「全屏幕 App」，关闭「四指与五指 App 切换」和「高效手势」</figcaption>
  </figure>
</div>

**iOS**

<div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center; margin:16px 0;">
  <figure style="flex:0 1 240px; margin:0; text-align:center;">
    <img loading="lazy" src="/ios/ios-zoom.png" alt="iOS：设置 → 辅助功能 → 缩放，打开缩放" style="width:100%; border-radius:8px; border:1px solid var(--vp-c-divider);">
    <figcaption style="margin-top:6px; font-size:12px; color:var(--vp-c-text-3);">设置 → 辅助功能 → 缩放：打开</figcaption>
  </figure>
  <figure style="flex:0 1 240px; margin:0; text-align:center;">
    <img loading="lazy" src="/ios/ios-assistive-touch.png" alt="iOS：设置 → 辅助功能 → 触控 → 辅助触控，打开辅助触控" style="width:100%; border-radius:8px; border:1px solid var(--vp-c-divider);">
    <figcaption style="margin-top:6px; font-size:12px; color:var(--vp-c-text-3);">设置 → 辅助功能 → 触控 → 辅助触控：打开</figcaption>
  </figure>
</div>

### 安卓：虚拟光标（vPointer）

[vPointer](https://github.com/RiderLty/vpointer) 提供虚拟光标与端口转发：

1. 安装并打开 vPointer，授予悬浮窗权限，关闭后台优化与电池优化，保持后台运行。
2. 在「端口转发」Tab 启动转发，用手机浏览器打开 `http://127.0.0.1:8000` 进入配置面板。
3. 虚拟光标随鼠标移动显示。安卓限制直接访问 USB 网卡，经转发后正常联网也能访问面板。

## 第四步：配置设备与映射

### 校准屏幕与旋转方向

1. **上传游戏截图** — 作为映射参考背景，用来校准屏幕坐标，否则虚拟光标的位置会错乱。
2. **检查方向** — 安卓保持「自动」即可（需 vPointer 运行并上报方向）；苹果不能自动检测，按第三步「平台设置」手动设置屏幕与鼠标方向。方向不正确时，可在「PICO 配置 → 屏幕旋转方向」或「参数配置 → 旋转 → 屏幕旋转方向」手动调整。

### 编辑并保存映射

1. 点击屏幕对应位置放置触摸点，再按一下要绑定的键即可完成映射（也支持点选鼠标 / 手柄按键）。
2. 触摸点可拖动调整位置；选中触点后滚动滚轮可调整作用半径。
3. 确认无误后，点击底部的「**保存**」写入当前槽位并应用配置。

> 💡 **快捷切换槽位**：Pico 最多支持 9 个配置槽位，按「修饰键 + 数字行 1~9」可在槽位间快速切换（修饰键默认左 Alt，可在「参数配置」里改成其它按键）。

详细说明见：[映射配置说明](/api/mapper-config)

## 第五步：开始使用

1. 移动鼠标 → 安卓屏幕上出现 **虚拟光标**（vPointer，需保持运行）；苹果由系统显示 **鼠标 / 触控板**
2. **按下 `` ` `` 键（ESC 下方）或鼠标中键，开启映射模式**（再按一次关闭）
3. 需要核对触点落点时，点击顶栏的「**触控预览**」，在实机上查看触摸位置

> ⚠️ **映射模式没开，所有映射都不会生效。**
>
> **开启后：**
> - **WASD** → 控制轮盘（游戏虚拟摇杆）
> - **鼠标移动** → 控制视角
> - **第四步配置的按键** → 在对应位置产生触屏操作
>
> **关闭后：** 鼠标只移动虚拟光标，按键不触发映射。默认开关为 `` ` `` 与鼠标中键，可在「映射 → 映射切换按键」中修改。

## 进阶

- 了解 [55 AA 控制帧](/api/hid-api)，可通过串口发送控制指令，实现自定义上位机
- 学习 [Lua 脚本](/api/lua-api) 编写自定义宏，实现压枪、连招、一键丢弃等高级功能
- 通过 [WebSocket API](/api/ws-api) 或串口 [55 AA 帧](/api/hid-api#cmd-0xfa-自定义事件) 向 Lua 发送自定义指令，实现外部程序联动
- 使用 [MAKCU 串口控制](/api/serial-api)，通过板载 USB 转串口远程控制键鼠（115200 握手后可切换到工作波特率）

映射配置说明、各接口完整文档（55 AA 控制帧 / WebSocket / Lua 脚本 / 串口协议 MAKCU）与键码参考，见 **[文档中心](/api/)**。

## 常见问题

| 问题 | 解决 |
|------|------|
| 设备未识别 | 换一根 USB 2.0 数据线 |
| 无法访问配置面板 | 安卓：确认已识别 USB 网卡，且 vPointer 端口转发已启动，用 `http://127.0.0.1:8000` 访问；苹果：直连后访问 `http://192.168.73.1/` |
| 键鼠按下无反应 | 确认键鼠已插在 USB-A 主机口，且映射已开启（默认 `` ` `` 或鼠标中键），见第四步 |
| 配置保存失败 | 检查 JSON 格式是否正确；查看 WebSocket 日志 |
| 配置损坏导致设备异常/无法启动 | 上电时短接 GPIO29 与 3V3（开机自动清除全部配置），或连接配置面板后执行恢复出厂设置 |
| 设备每约 60 秒自动重启一次 | 设备仅在 USB 被主机成功识别（枚举+配置）时持续运行；插在**只供电不通信**的口（充电器、劣质线、未识别的 Hub）上会周期性重启，属正常保护行为，换可通信的 USB 口即可 |

## 更新固件（可选）

开发板出厂时已预刷基础固件，开箱即可使用。需要升级或重新刷入时：

1. **按住板子上的 BOOTSEL 按钮**
2. 保持按住，用 USB 线将 **手机 Type-C 口** 连接到电脑
3. 松开 BOOTSEL → 电脑出现名为 **`RP2350`** 的 U 盘
4. 用 **Chrome / Edge** 打开 [固件烧录网站](https://flash.rd5isto.top/)，选择「稳定版」固件

> 稳定版固件会自动适配安卓 / 苹果，无需单独选择 iOS 固件。后续升级重复此步骤即可覆盖。
