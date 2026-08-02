# Lua 脚本 API

> 📥 **下载此API文档**：<a href="/api/lua-api.md" download>lua-api.md</a>

pico-hid-mapper 内置 **Lua 5.4.6** 解释器，让你用脚本自定义按键/鼠标行为。典型用途：压枪宏、连招宏、一键丢弃、自动化脚本等。

---

## 数据流

```
USB HID 设备 / WebSocket / WebHID (键盘/鼠标/自定义事件)
      │
      ▼
映射引擎 (去抖 / 边沿检测)
      │  按键/按钮事件（仅"边沿"：按下、松开）
      │  鼠标移动/滚轮事件
      │  自定义字符串事件
      ▼
Lua 引擎 (bitmap 过滤: 只有你声明监听的键/事件才进入 Lua VM)
      │
      ▼
你的 Lua 脚本
  on_key / on_mouse_btn / on_mouse_move / on_mouse_wheel
  on_custom_event / tick
      │  返回 true = 拦截, false = 放行
      ▼
触摸事件队列 → USB HID 触屏 → 上位机 (手机/电脑)
```

外部文本输入路径（均可触发 `on_custom_event(str)`）：

```
Web 前端 / LuaEditorDialog → WebSocket CMD 0x01 → ws_ipc → lua_binder_on_custom_event
webctrl WebHID 工具         → HID OUT CMD 0xFA    → pio_device → lua_binder_on_custom_event
```

> 关键：脚本运行在输入热路径上，返回 `true` 会"吃掉"事件让 core 不再做默认处理，返回 `false` 则原样放行。
> 对 `on_mouse_move`/`on_mouse_wheel` 而言，"拦截" = 把位移量(dx/dy 或 wheel) **清零**后再交给 core。

---

## 脚本模板

脚本是普通 Lua 源码。你**按需定义**入口函数（都是可选项），并在顶层用 `enable_listen_*` **声明你关心哪些事件**：

```lua
-- 顶层: 声明要监听的键/鼠标按钮/移动/滚轮 (不声明 → 对应回调永远不触发)
enable_listen_keys(0x13, 0x1E)              -- 监听 KEY_P、KEY_1 (HID 键码)
enable_listen_mouse_btn(0, 1)               -- 监听鼠标左键(0)、右键(1)
-- enable_listen_mouse_move()               -- 监听鼠标相对移动
-- enable_listen_mouse_wheel()              -- 监听鼠标滚轮

-- 脚本加载/重载时 & 配置/槽位变更时被调用: 在此缓存慢速值
function init()
    scale_x, scale_y = get_scale()
    view_speed_x, view_speed_y = get_view_speed()
end

-- 按键事件 (仅按下/松开边沿, 无重复)。return true = 拦截, false = 放行
function on_key(keycode, down)
    if keycode == 0x13 and down then
        local id = touch_down(0x3FFFFFFF, 0x3FFFFFFF)  -- 点屏幕中心
        touch_up(id)
    end
    return true
end

-- 鼠标按钮事件
function on_mouse_btn(button, down)
    return false
end

-- 鼠标相对移动 (dx,dy 为本次位移像素)。return true = 拦截 (dx,dy 归零)
function on_mouse_move(dx, dy)
    return false
end

-- 鼠标滚轮 (wheel 为本次滚动量)。return true = 拦截 (wheel 归零)
function on_mouse_wheel(wheel)
    return false
end

-- 周期回调 (主循环限频调用, 1000Hz)。dt_us = 距上次 tick 的微秒差
function tick(dt_us)
end

-- 自定义字符串事件 (来自 WebSocket / WebHID)
function on_custom_event(str)
    return false
end
```

---

## 执行过程与生命周期

| 时刻 | 发生什么 |
|------|----------|
| **脚本加载 / 上传新脚本 / 热重载** | VM 全新重建 → 顶层代码执行一次 (`listen_*` 在此生效) → 缓存入口函数 → **自动调用一次 `init()`** |
| **收到键盘/鼠标事件 (边沿)** | core 去抖后，若该键在监听 bitmap 内 → 同步调用 `on_key`/`on_mouse_btn` |
| **收到鼠标移动/滚轮** | 若已 `enable_listen_mouse_move`/`enable_listen_mouse_wheel` → 每次移动/滚动同步调用 (**非边沿, 连续触发**) |
| **主循环 (限频 0.1ms, core1)** | 调用 `tick(dt_us)` (约 **10kHz**) |
| **切换配置槽位 / 下发新配置** | 慢速值 (scale/view_speed) 重算 → **再次调用 `init()`** (VM 不重建, 全局保留) |
| **写入存储** | 将保存在RAM里的内存数据，持久化到Flash。<br>耗时操作，会导致host协议栈中断，故完成后会重启设备 |

要点：

- `init()` 是 "(重新)缓存慢速值" 的统一钩子。**把 `get_scale`/`get_view_speed` 的结果存进全局变量**，后续在 `on_key`/`tick` 里直接读全局 (最快)。
- 热重载 (上传新脚本) = VM 重建，所有全局/状态清空后重新跑。
- `on_key`/`on_mouse_btn` **只在边沿触发** (按一次、松一次)，不会按住反复触发。想 "按住期间持续动作"，用 `tick` + 一个 `down` 标志。
- `on_mouse_move`/`on_mouse_wheel` **不是边沿**：只要有移动/滚动就会触发 (可能每毫秒多次)。别在里面做重活。
- **⚠️ 调试完成后，一定记得点击 "写入存储" 按钮，否则配置会在重启后丢失。**
---

## 声明 / 解除监听

| 函数 | 说明 |
|------|------|
| `enable_listen_keys(code1, code2, ...)` | 声明 `on_key` 要接收的 HID 键码 (0x00–0xFF, 可多个)。**不声明则 `on_key` 不触发。** 可多次调用 (累加)。每次脚本重载时清空。 |
| `disable_listen_keys(code1, ...)` | 解除对指定键码的监听 (可多个)；**无参数则清空全部键监听**。 |
| `enable_listen_mouse_btn(btn1, btn2, ...)` | 声明 `on_mouse_btn` 要接收的鼠标按钮 (0–7)。语义同上。 |
| `disable_listen_mouse_btn(btn1, ...)` | 解除对指定按钮的监听 (variadic)；**无参数则清空全部按钮监听**。 |
| `enable_listen_mouse_move()` | 开启 `on_mouse_move` 监听。 |
| `disable_listen_mouse_move()` | 关闭 `on_mouse_move` 监听。 |
| `enable_listen_mouse_wheel()` | 开启 `on_mouse_wheel` 监听。 |
| `disable_listen_mouse_wheel()` | 关闭 `on_mouse_wheel` 监听。 |

> 通常在顶层调用一次。`disable_*` 便于运行时 (如在某个 `on_key` 里) 临时切换是否接管鼠标。每次脚本重载时所有监听清空，需重新声明。

---

## 入口函数

| 函数 | 参数 | 返回 | 触发时机 |
|------|------|------|----------|
| `init()` | 无 | 忽略 | 脚本重载时 + 每次配置/槽位变更时。用于缓存慢速值。 |
| `on_key(keycode, down)` | `keycode`: HID 键码 (int); `down`: bool | `true`=拦截, `false`=放行 | 仅对 `enable_listen_keys` 声明过的键、且状态变化 (边沿) 时。 |
| `on_mouse_btn(button, down)` | `button`: 0–7; `down`: bool | 同上 | 仅对 `enable_listen_mouse_btn` 声明过的按钮、边沿。 |
| `on_mouse_move(dx, dy)` | `dx,dy`: 本次相对移动像素 (int, 可正可负) | `true`=拦截 (dx/dy 归零) | 已 `enable_listen_mouse_move` 且有移动时。 |
| `on_mouse_wheel(wheel)` | `wheel`: 本次滚轮量 (int, 可正可负) | `true`=拦截 (wheel 归零) | 已 `enable_listen_mouse_wheel` 且有滚动时。 |
| `on_custom_event(str)` | `str`: 字符串, 最大 **128 字节** (WS) / **60 字节** (HID) | `true`=拦截 | 外部通过 WebSocket (CMD 0x01) 或 HID CMD 0xFA 发送文本时触发。**无需 enable_listen**。 |
| `tick(dt_us)` | `dt_us`: 距上次 tick 的微秒差 | 忽略 | 主循环限频调用, 约 10kHz (0.1ms 一次)。 |

**拦截语义 (重要)**：

- `on_key`/`on_mouse_btn` 返回 `true` → core 跳过对该键的**全部默认处理** (包括 Alt+F1~F9 切槽热键、鼠标切换键、WASD 轮盘、配置映射)。返回 `false` → Lua处理完毕后，交给映射继续处理原始逻辑。
- `on_mouse_move`/`on_mouse_wheel` 返回 `true` → 对应位移量清零。**移动和滚轮分开判定**: 只拦截 `on_mouse_move` 不影响同帧滚轮，反之亦然。

---

## 触摸输出

| 函数 | 说明 |
|------|------|
| `id = touch_down(x, y)` | 在触摸坐标 `(x,y)` 按下一个新触点，返回触点 id (整数)。**无空闲触点时返回 `0xFF`**。 |
| `id = touch_move(id, x, y)` | 把触点 `id` 移到 `(x,y)`，返回 id。 |
| `touch_up(id)` | 抬起触点 `id`。 |

> 触点最多 **10** 个。用完务必 `touch_up` 释放，否则 `touch_down` 返回 `0xFF`。建议为每个按键维护独立触点 id。

---

## 状态 Getter

| 函数 | 返回 | 冷/热 | 用法 |
|------|------|--------|------|
| `get_scale()` | `scale_x, scale_y` | **慢** (配置/槽位变才变) | 在 `init()` 里缓存进全局。像素→触摸缩放因子。 |
| `get_view_speed()` | `view_speed_x, view_speed_y` | **慢** | 鼠标控制视角的灵敏度=触摸缩放因子x用户自定义的视角灵敏度。 |
| `get_vmouse()` | `x, y, show, down` | **热** (每次鼠标移动都变) | 随用随取，别缓存。`x,y` = 虚拟光标当前**屏幕像素**坐标。 |
| `get_screen_size()` | `w, h` | **慢** | 当前配置的屏幕尺寸 (像素)。 |

---

## 映射开关 / 输入状态

| 函数 | 返回 / 参数 | 说明 |
|------|-------------|------|
| `is_map_on()` | `bool` | 映射是否开启。 |
| `set_map_on(on)` | `on`: bool | 设置映射开关。切换时自动清理触摸、复位视角/轮盘/vmouse。 |
| `is_key_down(keycode)` | `bool` | 某键当前是否按下；支持修饰键 (0xE0–0xE7) 与普通键。持续检测建议用 `on_key` 事件而非轮询。 |
| `is_mouse_btn_down(btn)` | `bool` | 某鼠标按键 (0–7) 当前是否按下。 |
| `get_now_ms()` | `int32` | 开机至今毫秒 (约 24.8 天回绕)。 |
| `get_rand_num(mini, max)` | `int32` | `[mini, max]` 闭区间随机整数。 |

---

## 按键映射查询

查询当前配置中某个键的映射信息。坐标返回 **触控坐标** (`0..TOUCH_MAX`)，与 `get_view_now_pos()` / `get_wheel_start_pos()` 一致。

| 函数 | 返回 / 参数 | 说明 |
|------|-------------|------|
| `get_key_map(code)` | `code`: unified keycode (0-254=HID 键盘键, 0x100+鼠标按键) | `idx, type, flags, coord_count, interval_count` / 无映射返回 **nil**。`type`: 0=PRESS, 1=MULT_PRESS, 2=SMART_TOGGLE, 3=WHEEL, 4=CLICK, 5=AUTO_FIRE, 6=DRAG。`flags`: bit0=RELEASE_MOUSE, bit1=SEPARAT, bit2=TOUCH。 |
| `get_key_map_by_index(idx)` | `idx`: 直接 key_maps 索引 (0-31) | `code, type, flags, coord_count, interval_count, coord_start, interval_start` / 越界返回 **nil**。用于遍历全部映射。 |
| `get_key_coord(key_map_idx, step)` | 映射索引 + 步号 (0-based) | `x, y, r_px` (触控坐标 + 像素级随机半径) / 越界返回三个 **nil**。 |
| `get_key_interval(key_map_idx, step)` | 映射索引 + 步号 (0-based) | `interval_ms` (毫秒) / 越界返回 **nil**。AUTO_FIRE 时 `step=0`=on_ms, `step=1`=off_ms。 |

典型用法: 由 `get_key_map(code)` 拿到 `coord_count/interval_count`, 再用 `get_key_coord(idx,i)` / `get_key_interval(idx,i)` 逐条读出。

```lua
-- 查看 KEY_P (0x13) 的映射详情
local idx, typ, flags, ccnt, icnt = get_key_map(0x13)
if idx then
    print(string.format("P: idx=%d type=%d flags=%d", idx, typ, flags))
    for i = 0, ccnt - 1 do
        local x, y, r = get_key_coord(idx, i)
        print(string.format("  coord[%d]: x=%d y=%d r_px=%d", i, x, y, r))
    end
end

-- 遍历全部映射
for i = 0, 31 do
    local code, typ = get_key_map_by_index(i)
    if code and code ~= 0 then
        print(string.format("idx=%d code=0x%x type=%d", i, code, typ))
    end
end
```

---

## 输入注入

从 Lua **主动向映射引擎注入**键盘/鼠标事件，走完整的 core 映射管线 (键状态去重、按键映射、触屏输出等)，效果等同于真实 USB 外设产生的输入。注入期间**跳过 Lua 拦截** (`on_key`/`on_mouse_btn` 等不会触发)，防止递归死循环。

| 函数 | 参数 | 说明 |
|------|------|------|
| `input_keyboard(keycode, down)` | `keycode`: HID 键码 (0-254); `down`: bool | 注入键盘按下/释放。keycode 为 0 或 >254 则静默忽略。 |
| `input_mouse_button(button, down)` | `button`: 0-7; `down`: bool | 注入鼠标按键。button 越界静默忽略。 |
| `input_mouse_move(dx, dy[, wheel])` | `dx,dy`: 相对位移 (像素); `wheel`: 滚轮 (默认 0) | 注入鼠标移动/滚轮。效果取决于 `map_on`: 映射开→移动视角; 映射关→移动 vmouse。 |

> **注意**: 注入的键事件会**真实修改键状态 bitmap** (`key_state[]`)。若注入 `input_keyboard(0x15, true)` 后未注入对应的 `false`，映射引擎将认为该键一直处于按下状态，导致动作卡在 HOLD 阶段。

```lua
-- 注入一次 R 键按下并释放
input_keyboard(0x15, true)   -- KEY_R down
input_keyboard(0x15, false)  -- KEY_R up

-- 注入鼠标左键点击
input_mouse_button(0, true)
input_mouse_button(0, false)

-- 注入鼠标向右移动 100 像素
input_mouse_move(100, 0)
```

---

## 槽位查询

| 函数 | 返回 | 说明 |
|------|------|------|
| `get_current_slot()` | `int` (0-8) | 当前激活的配置槽位索引。恒返回 0-8 有效值。 |

---

## 视角 (View)

坐标均为**触控坐标** (`0..TOUCH_MAX`)。

| 函数 | 说明 |
|------|------|
| `get_view_id()` / `set_view_id(id)` | 当前视角触点 id (`0xFF` = 未触摸)。 |
| `get_view_now_pos()` → `x, y` | 当前视角坐标。 |
| `move_view_offset(x, y)` | 以偏移量移动视角。仅当 `map_on` 且已有视角触点时生效。建议使用方式为 鼠标移动 x (scaleX, yscaleY)。 |
| `get_view_start_pos()` / `set_view_start_pos(x, y)` | 视角起始点。 |
| `get_view_speed()` / `set_view_speed(x, y)` | 视角控制速度 (灵敏度)。 |
| `set_view_auto_center(on)` | 视角越界时是否回到 `start_pos`。默认 `true`。 |
| `set_view_auto_release_timeout(ms)` | 视角触点无移动多久 (毫秒) 后自动释放；`0` = 永不自动释放。默认 `400`。 |
---

## 虚拟光标 (vmouse)

坐标均为**真实屏幕像素**；触点 id 由内部管理，故封装为函数。

| 函数 | 说明 |
|------|------|
| `get_vmouse_state()` → `show, down, x, y` | vmouse 状态。 |
| `set_vmouse_show(on)` / `set_vmouse_down(on)` | 设置显示 / 按下。 |
| `move_vmouse_pos_offset(x, y)` | 以偏移量移动 vmouse (`x,y` 为屏幕像素偏移，直接累加)。 |
| `move_vmouse_pos_target(x, y)` | 移动 vmouse 到目标触控坐标 (内部 `/scale` 转为屏幕像素)。 |

---

## 轮盘 (Wheel)

中心为**触控坐标**，半径为归一化 float (相对屏幕宽)。

| 函数 | 返回 | 说明 |
|------|------|------|
| `get_wheel_start_pos()` | `x, y` | 轮盘中心坐标。 |
| `get_wheel_range()` | `range, shift_range` | 普通半径 / shift 疾跑半径。 |
| `get_wheel_shift_range_type()` | `enable, hold_or_click` | `enable` = 是否开启 shift 疾跑; `hold_or_click` = `true` 切换 (toggle) / `false` 按住 (hold)。 |

---

## 调试输出

| 函数 | 说明 |
|------|------|
| `print(...)` | 输出到 WebSocket 调试通道，带 `[lua]` 前缀。未连接 WS 客户端时丢弃。 |
| `warn(...)` | 同 `print`，带 `[lua warn]` 前缀。 |

---

## 板载 RGB LED

控制设备面板上的 WS2812B RGB 指示灯。

| 函数 | 说明 |
|------|------|
| `set_led(r, g, b)` | 设置 LED 颜色 (每通道 0-255)。**负数**跳过该通道 (保持原值)；正数 >255 自动钳位到 255。`set_led(0,0,0)` 等效熄灭。 |
| `led_off()` | 熄灭 LED。 |

**按通道部分更新**：`set_led` 的三个参数分别对应红、绿、蓝。想只改一个通道，把另外两个传负数即可。

```lua
-- 全通道设置
set_led(255, 0, 0)    -- 红
set_led(0, 255, 0)    -- 绿
set_led(0, 0, 255)    -- 蓝

-- 只改红色，绿蓝不变
set_led(255, -1, -1)

-- 只改绿色 (值 >255 自动钳位)
set_led(-1, 300, -1)

-- 改红和蓝，绿不变
set_led(128, -1, 64)

-- 熄灭两种方式
set_led(0, 0, 0)
led_off()
```

> 典型用途：用 LED 颜色指示脚本状态 (如 `init()` 亮绿、出错亮红、`on_key` 闪烁等)。

---

## 坐标系与换算

固件内部使用两套坐标体系：

### 屏幕像素

`get_screen_size()` 返回手机实际分辨率 (如 1080×2400)。`get_vmouse()` 返回的光标坐标也是这个坐标系 → 范围 `0..screen_w` / `0..screen_h`。

### 触控坐标

`touch_down/move/up`、`get_view_now_pos()` 等使用**触控坐标**: 范围 `0..0x7FFFFFFE` 。无论手机分辨率多少，触控坐标范围永远不变。**屏幕正中心永远是 `0x3FFFFFFF`** (= 0x7FFFFFFE / 2)。

### 换算

```lua
-- 像素 → 触控 (乘 scale, 最常用)
touch_x = pixel_x * scale_x
touch_y = pixel_y * scale_y

-- 触控 → 像素 (除 scale, 少数 API 用到)
pixel_x = touch_x / scale_x
```

`scale_x/scale_y` 用 `get_scale()` 取，建议在 `init()` 缓存进全局。

### 各 API 坐标系速查

| API | 坐标系 | 说明 |
|-----|--------|------|
| `get_vmouse()` / `get_vmouse_state()` | 屏幕像素 | 虚拟光标位置 |
| `move_vmouse_pos_offset` | 屏幕像素 | 偏移量直接累加 |
| `move_vmouse_pos_target` | 屏幕像素 | 传入坐标，直接移动光标到目标位置 |
| `touch_down/move/up` | 触控坐标 | 最终输出，必须用触控坐标 |
| `get_view_now_pos` / `move_view_offset` | 触控坐标 | 视角系统 |
| `get_view_start_pos` / `set_view_start_pos` | 触控坐标 | 视角起始点 |
| `get_wheel_start_pos` | 触控坐标 | 轮盘中心 |
| `get_key_coord` | 触控坐标 | 按键映射的坐标 (`x,y,r_px`) |
| `get_screen_size()` | 屏幕像素 | 手机实际分辨率 |

### 示例：在手机屏幕中心点一下

```lua
function init()
    scale_x, scale_y = get_scale()
    sw, sh = get_screen_size()
end

-- 手机屏幕中心(像素) → 触控坐标
local cx_px = sw / 2    -- 如 540 (1080 宽屏)
local cy_px = sh / 2    -- 如 1200
local id = touch_down(cx_px * scale_x, cy_px * scale_y)
-- 等价于: touch_down(0x3FFFFFFF, 0x3FFFFFFF)
touch_up(id)
```

---

## 键码与按钮编号

| 键 | 码 | 键 | 码 | 键 | 码 |
|----|-----|----|-----|----|-----|
| A–Z | `0x04`–`0x1D` | 1–9 | `0x1E`–`0x26` | 0 | `0x27` |
| Enter | `0x28` | Esc | `0x29` | Backspace | `0x2A` |
| Tab | `0x2B` | Space | `0x2C` | F1–F12 | `0x3A`–`0x45` |
| → | `0x4F` | ← | `0x50` | ↓ | `0x51` |
| ↑ | `0x52` | `` ` `` | `0x35` | | |

**修饰键**：(想监听左 Ctrl 就 `enable_listen_keys(0xE0)`)

| 键 | 码 | 键 | 码 |
|----|-----|----|-----|
| 左 Ctrl | `0xE0` | 右 Ctrl | `0xE4` |
| 左 Shift | `0xE1` | 右 Shift | `0xE5` |
| 左 Alt | `0xE2` | 右 Alt | `0xE6` |
| 左 Meta/Win | `0xE3` | 右 Meta/Win | `0xE7` |

**鼠标按钮** (`on_mouse_btn` 的 `button`):

| 值 | 按钮 |
|----|------|
| 0 | 左键 |
| 1 | 右键 |
| 2 | 中键 |
| 3 | 后退 |
| 4 | 前进 |

> 完整键码表见 [HID 键码参考](/api/hid-code)。

---

## 性能模型与规则

- **`on_key`/`on_mouse_btn` 跑在输入热路径上** — 每次有按键/鼠标事件时调用，必须保持极快，不要在里面做重循环/大分配。
- **只有声明过的键/按钮才进 VM** (bitmap 预过滤)，没声明零开销跳过。
- **慢/热分离**: 慢速值 (scale、view_speed) 在 `init()` 缓存进全局，以减少每次调用的开销；热值 (vmouse) 随用随取。
- **数字是 32 位** (固件设了 `LUA_32BITS`): 整数 int32、浮点 float32。别用超过 2^31 的整数。
- **单核单线程** (引擎在 core1，同核串行): 脚本内无需考虑并发。
- **没有阻塞 sleep**: 回调必须立刻返回。如果需要使用sleep，用**协程** (见下文)。
- **单次调用有 20 万条指令上限**: 超限即抛错，回调被中断，日志报 `script exceeded 200000 instruction step limit`。正常回调只有几十~几百条指令。
- **脚本大小 ≤ 64KB**。

---

## 完整示例

### 跑马灯 (LED 渐变循环)

利用 `tick(dt_us)` 驱动，在颜色之间平滑过渡（线性插值），每 1s 完成一次颜色切换。调节 `MAX_BRIGHT` 控制最大亮度。

```lua
-- 跑马灯：红→绿→蓝 平滑渐变，每 1s 过渡完成
local COLORS = {
    {255, 0, 0},     -- 红
    {0, 255, 0},     -- 绿
    {0, 0, 255},     -- 蓝
}
local MAX_BRIGHT = 20     -- 最大亮度 (0-255)，越小越暗

local idx = 1
local acc = 0
local TRANSITION = 1000000  -- 1s (微秒)
local cr, cg, cb = 0, 0, 0

function init()
    set_led(MAX_BRIGHT, 0, 0)
    cr, cg, cb = MAX_BRIGHT, 0, 0
end

function tick(dt_us)
    acc = acc + dt_us
    if acc >= TRANSITION then
        acc = acc - TRANSITION
        idx = idx + 1
        if idx > #COLORS then idx = 1 end
    end

    local t = acc / TRANSITION
    local prev = idx - 1
    if prev < 1 then prev = #COLORS end

    local r1 = math.floor(COLORS[prev][1] * MAX_BRIGHT / 255 + 0.5)
    local g1 = math.floor(COLORS[prev][2] * MAX_BRIGHT / 255 + 0.5)
    local b1 = math.floor(COLORS[prev][3] * MAX_BRIGHT / 255 + 0.5)
    local r2 = math.floor(COLORS[idx][1]  * MAX_BRIGHT / 255 + 0.5)
    local g2 = math.floor(COLORS[idx][2]  * MAX_BRIGHT / 255 + 0.5)
    local b2 = math.floor(COLORS[idx][3]  * MAX_BRIGHT / 255 + 0.5)

    local nr = math.floor(r1 + (r2 - r1) * t + 0.5)
    local ng = math.floor(g1 + (g2 - g1) * t + 0.5)
    local nb = math.floor(b1 + (b2 - b1) * t + 0.5)

    if nr ~= cr or ng ~= cg or nb ~= cb then
        cr, cg, cb = nr, ng, nb
        set_led(cr, cg, cb)
    end
end
```

> 提示：改 `MAX_BRIGHT` 调亮度，改 `COLORS` 表自定义颜色序列，改 `TRANSITION` 调过渡速度。相邻颜色之间线性插值，无跳变。

### 按键点击 (每键独立触点)

```lua
enable_listen_keys(0x13, 0x1E, 0x1F)     -- KEY_P, KEY_1, KEY_2
local CENTER = 0x3FFFFFFF                  -- 屏幕中心 (触摸坐标)
local touches = {}                         -- [keycode] = touch_id

function on_key(keycode, down)
    if down then
        touches[keycode] = touch_down(CENTER, CENTER)
    else
        local id = touches[keycode]
        if id and id ~= 0xFF then
            touch_up(id)
            touches[keycode] = nil
        end
    end
    return true
end
```

### 连点 Autofire (按住 R → 每 50ms 在光标处点一下)

```lua
enable_listen_keys(0x15)                  -- KEY_R
local firing = false
local acc = 0                              -- 距上次开火累计的微秒
local INTERVAL = 50000                     -- 50ms (微秒)

function init()
    scale_x, scale_y = get_scale()
end

function on_key(keycode, down)
    firing = down
    if down then acc = INTERVAL end        -- 按下即刻先点一次
    return true
end

function tick(dt_us)
    if not firing then return end
    acc = acc + dt_us
    if acc >= INTERVAL then
        acc = acc - INTERVAL
        local mx, my = get_vmouse()
        local id = touch_down(mx * scale_x, my * scale_y)
        if id ~= 0xFF then touch_up(id) end
    end
end
```

### 右键长按拖动 (触点跟随光标)

```lua
enable_listen_mouse_btn(1)                    -- 鼠标右键
local drag = nil

function init()
    scale_x, scale_y = get_scale()
end

function on_mouse_btn(button, down)
    local mx, my = get_vmouse()
    if down then
        drag = touch_down(mx * scale_x, my * scale_y)
    elseif drag then
        touch_up(drag); drag = nil
    end
    return true
end

function tick(dt_us)
    if drag then
        local mx, my = get_vmouse()
        touch_move(drag, mx * scale_x, my * scale_y)
    end
end
```

### 接管鼠标移动 (中键拖动)

`on_mouse_move` 返回 `true` 会把本次 `dx/dy` 清零，core 的默认视角处理被跳过。下例：按住中键期间把移动转成 "在光标处拖动一个触点"。

```lua
enable_listen_mouse_btn(2)         -- 中键
enable_listen_mouse_move()         -- 接管移动
local dragging = false
local drag_id  = 0xFF
local drag_x = 0
local drag_y = 0

function init()
    scale_x, scale_y = get_scale()
end

function on_mouse_btn(button, down)
    if button == 2 then
        dragging = down
        if not down and drag_id ~= 0xFF then
            touch_up(drag_id); drag_id = 0xFF
        end
    end
    return false
end

function on_mouse_move(dx, dy)
    if not dragging then return false end
    local mx, my = get_vmouse()
    if drag_id == 0xFF then
        drag_id = touch_down(mx * scale_x, my * scale_y)
        drag_x = mx * scale_x
        drag_y = my * scale_y
    else
        drag_x = drag_x + dx * scale_x
        drag_y = drag_y + dy * scale_y
        touch_move(drag_id,drag_x  , drag_y)
    end
    return true                    -- 吃掉本次移动
end 
```

> 注意: 一旦 `on_mouse_move` 返回 `true`，core 的 vmouse 光标就不会随这次移动更新。若逻辑依赖光标位置，要么放行 (`return false`) 让 core 推进 vmouse，要么自行累加 `dx/dy` 维护坐标。

### 测量鼠标移动距离（按住左键拖动）

按住鼠标左键并拖动，松开后打印鼠标累计位移。可用于测量视角灵敏度。

```lua
-- 测量鼠标移动距离脚本（监听鼠标左键）
enable_listen_mouse_btn(0)   -- 鼠标左键
enable_listen_mouse_move()

local recording = false
local total_dx = 0
local total_dy = 0

function init()
    recording = false
    total_dx = 0
    total_dy = 0
end

function on_mouse_btn(button, down)
    if button == 0 then
        if down and is_map_on() then
            recording = true
            total_dx = 0
            total_dy = 0
            print("测量开始（左键按住），移动鼠标...")
        elseif not down and recording then
            recording = false
            print(string.format(
                "测量结束 | 总位移: dx=%d, dy=%d",
                total_dx, total_dy
            ))
            total_dx = 0
            total_dy = 0
        end
    end
    return false   -- 放行左键，不影响正常操作（例如开火）
end

function on_mouse_move(dx, dy)
    if recording then
        total_dx = total_dx + dx
        total_dy = total_dy + dy
    end
    return false   -- 放行移动，不影响视角控制
end
```

### 采集压枪数据和压枪数据重放
监听鼠标移动事件，并以100hz将鼠标移动打印在控制台
```lua

enable_listen_mouse_btn(0)
enable_listen_mouse_move()

-- 全局状态变量
local is_recording = false   -- 记录开关状态
local total_dx = 0           -- 累计 X 轴位移
local total_dy = 0           -- 累计 Y 轴位移
local acc_us = 0             -- 时间累加器 (微秒)

local INTERVAL_US = 10000    -- 100Hz 对应的时间间隔：10,000 微秒 (10 毫秒)

-- 脚本初始化/热重载回调
function init()
    is_recording = false
    total_dx = 0
    total_dy = 0
    acc_us = 0
end

-- 鼠标按键事件 (边沿触发)
function on_mouse_btn(button, down)
    -- 仅响应鼠标左键 (button 0) 且需映射开启 (is_map_on)
    if button == 0 and is_map_on() then
        if down then
            -- 按下左键：开始记录并重置数据
            is_recording = true
            total_dx = 0
            total_dy = 0
            acc_us = 0
            print(">>> [压枪记录] 开始记录数据 (100Hz) <<<")
        else
            -- 松开左键：停止记录并打印最终汇总
            if is_recording then
                is_recording = false
                print(string.format(">>> [压枪记录] 停止记录 | 最终总位移 -> X: %d, Y: %d <<<", total_dx, total_dy))
            end
        end
    end
    
    -- 返回 false 放行按键，确保游戏内正常开火；若设为 true 会吃掉左键点击
    return false
end

-- 鼠标相对移动事件 (连续触发)
function on_mouse_move(dx, dy)
    -- 仅在记录开启状态下累加鼠标移动值
    if is_recording then
        total_dx = total_dx + dx
        total_dy = total_dy + dy
    end
    
    -- 返回 false 放行移动，确保视角能正常移动；若设为 true 视角会被卡住
    return false
end

-- 周期回调 (约 1000Hz 频率调用, dt_us 为距上次调用的微秒差)
function tick(dt_us)
    if not is_recording then return end

    acc_us = acc_us + dt_us
    -- 当时间累积达到 10ms (10,000µs) 时打印一次，实现 100Hz 打印频率
    if acc_us >= INTERVAL_US then
        acc_us = acc_us - INTERVAL_US
        print(string.format("[压枪数据] 累计总位移 -> dX: %d | dY: %d", total_dx, total_dy))
        total_dx = 0
        total_dy = 0
    end
end
```

将录制的鼠标位移数据，在按下左键的时候重放

```lua

enable_listen_mouse_btn(0)
-- -----------------------------------------------------------------
-- 数据压缩区：一对一对填即可 [dx1, dy1,  dx2, dy2,  dx3, dy3, ...]
-- -----------------------------------------------------------------
local RECOIL_DATA = {
    0,1,1,8,1,11,1,7,3,20,2,19,1,24,3,30,2,34,3,42,3,46,3,57,1,52,2,60,2,63,2,66,3,67,3,68,3,70,2,71,3,72,3,70,3,69,4,71,4,68,4,67,4,66,4,66,3,66,3,65,2,65,2,66,0,66,1,65,1,64,2,64,1,25,3,101,1,62,1,62,0,61,-2,62,-1,61,-3,60,-2,61,-2,60,-1,61,-3,61,-3,62,-3,61,-3,62,-3,63,-2,62,-2,62,-2,62,-2,63,0,25,-1,100,-1,64,-1,64,-1,70,-2,61,0,58,-1,63,0,62,-1,63,0,63,1,65,1,66,0,65,0,66,1,66,1,66,0,66,2,67,2,59,3,71,2,63,3,63,2,63,3,64,2,61,2,60,1,60,1,60,2,60
}

local is_firing = false
local current_step = 1
local acc_us = 0
local INTERVAL_US = 10000 -- 10ms (100Hz)

local view_speed_x = 1
local view_speed_y = 1
function init()
    is_firing = false
    current_step = 1
    acc_us = 0
    view_speed_x , view_speed_y = get_view_speed()
end

function on_mouse_btn(button, down)
    if button == 0 and is_map_on() then
        if down then
            is_firing = true
            current_step = 1
            acc_us = 0
        else
            is_firing = false
        end
    end
    return false
end

function tick(dt_us)
    if not is_firing or #RECOIL_DATA == 0 then return end

    acc_us = acc_us + dt_us

    if acc_us >= INTERVAL_US then
        acc_us = acc_us - INTERVAL_US

        -- 自动按步骤计算出数组中 dx 和 dy 的位置
        local idx = (current_step - 1) * 2 + 1

        if idx <= #RECOIL_DATA then
            local dx = RECOIL_DATA[idx]
            local dy = RECOIL_DATA[idx + 1]
            move_view_offset(dx * view_speed_x , dy * view_speed_y )
            current_step = current_step + 1
        else
            -- 数据用尽后维持最后一帧的下压幅度
            local last_dx = RECOIL_DATA[#RECOIL_DATA - 1]
            local last_dy = RECOIL_DATA[#RECOIL_DATA]
            move_view_offset(last_dx * view_speed_x, last_dy * view_speed_y )
        end
    end
end
```

### 异步动作序列 (协程 coroutine)

引擎**没有阻塞式 sleep**。想写 "按下 → 等 50ms → 滑动 → 等 30ms → 抬起" 这种**带时序的顺序逻辑**，用协程：
例如vmouse模式下，右键将物品拖动到丢弃区域
```lua
enable_listen_mouse_btn(1)                     -- 右键
local scale_x, scale_y = 1, 1
local tasks = {}                                -- 协程调度队列

function init()
    scale_x, scale_y = get_scale()
end

-- 在协程内调用: 暂停当前序列 wait_us 微秒后继续
local function sleep(wait_us)
    coroutine.yield(wait_us)
end

-- 启动一个异步序列: 把函数包成协程入队
local function spawn(fn)
    tasks[#tasks + 1] = {
        co = coroutine.create(fn),
        remain = 0                              -- 0 → 下个 tick 立刻跑
    }
end

function on_mouse_btn(button, down)
    if button == 1 and down then
        local mx, my = get_vmouse()             -- 快照按下瞬间的光标位置
        spawn(function()
            local id = touch_down(mx * scale_x, my * scale_y)
            if id == 0xFF then return end       -- 没有空闲触点, 放弃
            sleep(50000)                        -- 停 50ms
            touch_move(id, 0x3FFFFFFF, 0x3FFFFFFF)  -- 滑到屏幕中心
            sleep(30000)                        -- 停 30ms
            touch_up(id)
        end)
    end
    return false
end

function tick(dt_us)
    -- 倒序遍历: 删除已完成任务不影响未遍历的索引
    for i = #tasks, 1, -1 do
        local t = tasks[i]
        t.remain = t.remain - dt_us
        if t.remain <= 0 then
            local ok, wait_us = coroutine.resume(t.co)
            if not ok or coroutine.status(t.co) == "dead" then
                table.remove(tasks, i)          -- 报错或正常结束 → 移除
            else
                t.remain = wait_us or 0         -- yield 让出 → 记下还要等多久
            end
        end
    end
end
```

**模式要点**:
- `spawn(fn)` 把任意 "动作序列函数" 变成异步任务；函数里用 `sleep(us)` 表达等待。
- 用 `dt_us` 倒计时 (`remain -= dt`，到 0 就 resume)。
- 协程里每一步仍要**轻量** — 在 `tick` 里被 resume，别在一步里做重循环。
- `coroutine` 标准库可用 (`create/resume/yield/status`)。

### 外部指令控制 (on_custom_event + 参数解码 + print 回传)

`on_custom_event` 是与外界双向通信的核心入口。外部可通过 WebSocket 或 HID 发送文本指令，脚本解码参数执行，再用 `print()` 回传结果。**无需 `enable_listen`** — 只要定义了 `on_custom_event` 就会触发。

```lua
-- 指令格式:
--   "tap(540,1200)"           → 在 (540,1200) 点一下
--   "swipe(100,800,900,800)"  → 从 (100,800) 滑到 (900,800)
--   "getpos"                  → 返回当前 vmouse 位置

function init()
    scale_x, scale_y = get_scale()
end

function on_custom_event(str)
    -- 解码 "tap(x,y)" 指令
    local sx, sy = str:match("tap%((%d+),(%d+)%)")
    if sx then
        local x, y = tonumber(sx), tonumber(sy)
        local id = touch_down(x * scale_x, y * scale_y)
        if id ~= 0xFF then
            touch_up(id)
            print("tap ok: (" .. x .. "," .. y .. ")")
        else
            warn("tap fail: no free touch point")
        end
        return true
    end

    -- 解码 "swipe(x1,y1,x2,y2)" 指令
    local x1, y1, x2, y2 = str:match("swipe%((%d+),(%d+),(%d+),(%d+)%)")
    if x1 then
        local id = touch_down(tonumber(x1) * scale_x, tonumber(y1) * scale_y)
        if id == 0xFF then
            warn("swipe fail: no free touch point")
            return true
        end
        touch_move(id, tonumber(x2) * scale_x, tonumber(y2) * scale_y)
        touch_up(id)
        print("swipe ok: (" .. x1 .. "," .. y1 .. ") -> (" .. x2 .. "," .. y2 .. ")")
        return true
    end

    -- 查询指令 "getpos"
    if str == "getpos" then
        local mx, my, show, down = get_vmouse()
        print("vmouse: x=" .. mx .. " y=" .. my .. " show=" .. tostring(show) .. " down=" .. tostring(down))
        return true
    end

    warn("unknown cmd: " .. str)
    return true
end
```

**发送端示例**:

```bash
# WebSocket CLI
echo -ne '\x01tap(540,1200)' | websocat ws://192.168.73.1:80/ws
```

```
# HID OUT 帧格式 (CMD 0xFA)
[55 AA][0D][FA]tap(540,1200)
```

> WS 路径最大 128 字节，HID 路径最大 60 字节。超出截断。

### 空模板

```lua
function init() end
function on_key(keycode, down) return false end
function on_mouse_btn(button, down) return false end
function on_custom_event(str) return false end
function tick(dt_us) end
```

---

## 上传与调试

### 上传脚本

编辑后点击**加载到内存**，脚本立即热重载生效。
调试完成后，点击**写入存储**，将脚本写入 flash 并重启，永久生效。

### 查看状态

`GET /lua/state` 返回运行状态:
- `loaded=1 source=stored` → 加载成功。
- `loaded=0 source=default error=...` → 语法/加载出错，设备回落默认模板。
- `entry=on_key tick ...` → 引擎识别到的入口函数 (确认函数名没写错)。

### 运行期日志

脚本里的 `print(...)` / `warn(...)` 统一经 WebSocket 调试通道下发。连接 WS 客户端即可实时查看。`print` 带 `[lua]` 前缀，`warn` 带 `[lua warn]` 前缀。

> **双向通信**: `print`/`warn` 是脚本主动向主机推送消息的唯一通道。配合 `on_custom_event` 接收指令，可构建 "主机发指令 → Lua 执行 → print 回报结果" 的完整交互。

---

## 常见坑

- **定义了 `on_key` 却没 `enable_listen_keys`** → 永远不触发。必须声明监听。
- **把缓存值写成 `init()` 内部的 `local`** → `on_key`/`tick` 看不到。要写**全局**或文件顶层 `local`。
- **忘了 `touch_up`** → 触点 (最多 10) 很快耗尽，`touch_down` 返回 `0xFF`。
- **在 `on_key`/`tick` 里做重活** → 输入卡顿。
- **当成 64 位整数用** → 实际 32 位，大数溢出。
- **想"按住持续触发"却只写 `on_key`** → 边沿只触发一次；用 `tick` + `down` 标志。
- **多个键共用一个触点变量** → 会串。用 `touches[keycode]` 表分开管理。
- **`on_custom_event` 里忘了 `return true`** → core 虽无默认处理，但返回 `false` 表示 "未处理"。
- **字符串超上限** → `on_custom_event` 的 `str` 会被截断 (WS:128B / HID:60B)。长指令用简短格式或拆分发送。
