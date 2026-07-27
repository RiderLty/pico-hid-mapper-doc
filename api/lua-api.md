# Lua 脚本 API

pico-hid-mapper 内置 **Lua 5.4.6** 解释器，让你用脚本自定义按键行为。

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

> 关键：脚本运行在输入的热路径上。返回 `true` 会"吃掉"事件（core 不做默认处理），返回 `false` 则原样放行。

---

## 脚本基础

### 一个最简单的脚本

让 **P 键** 点击屏幕中心：

```lua
enable_listen_keys(0x13)          -- 0x13 = P 键 HID 键码

function on_key(keycode, down)
    if keycode == 0x13 and down then
        local id = touch_down(0x3FFFFFFF, 0x3FFFFFFF)  -- 屏幕中心按下
        touch_up(id)                                    -- 抬起
    end
    return true   -- 拦截，不让 core 再做默认处理
end
```

---

## 事件回调

### on_key(keycode, down)

按键事件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `keycode` | number | HID 键码 |
| `down` | boolean | true=按下, false=松开 |

```lua
function on_key(keycode, down)
    if keycode == 0x04 and down then   -- A 键按下
        -- 做点什么
    end
    return false  -- 放行给 core
end
```

### on_mouse_btn(button, down)

鼠标按钮事件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `button` | number | 1=左键, 2=右键, 3=中键, 4=前进, 5=后退 |
| `down` | boolean | true=按下, false=松开 |

### on_mouse_move(dx, dy)

鼠标移动事件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `dx` | number | X 轴位移量 |
| `dy` | number | Y 轴位移量 |

> 返回 `true` → 位移量清零后再交给 core，效果为"吃掉"本次移动。

### on_mouse_wheel(delta)

鼠标滚轮事件。

| 参数 | 类型 | 说明 |
|------|------|------|
| `delta` | number | 滚轮增量 |

### on_custom_event(str)

自定义字符串事件。来自 WebSocket 输入框或 WebHID 工具。

```lua
function on_custom_event(str)
    if str == "reload" then
        -- 执行重载逻辑
    end
end
```

### tick(delta_ms)

定时回调，每帧调用一次。

| 参数 | 类型 | 说明 |
|------|------|------|
| `delta_ms` | number | 距上次调用的毫秒数 |

> 用于实现连点 (autofire)、时序宏 (协程 + 调度器)。

---

## 监听控制

### enable_listen_keys(...)

声明要监听的键码。**只有声明了的键才会进入 Lua**，未声明的键零开销跳过。

```lua
enable_listen_keys(0x04, 0x07, 0x13, 0x1E, 0x1F)
-- A 键、D 键、P 键、1 键、2 键
```

### enable_listen_mouse_buttons(...)

声明要监听的鼠标按钮。

```lua
enable_listen_mouse_buttons(1, 2)  -- 左键、右键
```

### enable_listen_mouse_move()

启用鼠标移动监听（默认关闭，因调用频率极高）。

### enable_listen_mouse_wheel()

启用滚轮监听。

---

## 触摸输出

### touch_down(x, y) → id

在屏幕坐标 (x, y) 处按下，返回触点 ID。

```lua
local id = touch_down(0x3FFFFFFF, 0x3FFFFFFF)  -- 屏幕中心
```

> 坐标范围 `0 ~ 0x7FFFFFFE`，32 位精度。`0x3FFFFFFF` ≈ 屏幕中心。

### touch_move(id, x, y)

移动已有触点。

```lua
touch_move(id, 0x40000000, 0x40000000)
```

### touch_up(id)

抬起触点。

```lua
touch_up(id)
```

---

## vmouse（虚拟鼠标）

控制网络侧的虚拟光标显示：

```lua
-- 在坐标 (x, y) 处显示光标
vmouse_show(x, y)

-- 按下光标
vmouse_down(x, y)

-- 移动光标
vmouse_move(x, y)

-- 抬起光标
vmouse_up(x, y)

-- 隐藏光标
vmouse_hide()
```

---

## 实用模式

### 按键连点 (Autofire)

```lua
local ticking = false
local tick_count = 0

function on_key(keycode, down)
    if keycode == 0x04 then    -- A 键
        ticking = down
        tick_count = 0
        return true
    end
    return false
end

function tick(delta_ms)
    if not ticking then return end
    tick_count = tick_count + delta_ms
    if tick_count >= 100 then   -- 每 100ms 触发一次
        tick_count = 0
        local id = touch_down(0x3FFFFFFF, 0x3FFFFFFF)
        touch_up(id)
    end
end
```

### 右键拖动跟随

```lua
local dragging = false
local drag_id = nil

function on_mouse_btn(button, down)
    if button == 2 then
        dragging = down
        if down then
            drag_id = touch_down(0x3FFFFFFF, 0x3FFFFFFF)
        else
            touch_up(drag_id)
        end
        return true
    end
    return false
end

function on_mouse_move(dx, dy)
    if dragging and drag_id then
        -- 根据 dx/dy 更新触点位置
        return true  -- 拦截，不让 core 处理视角
    end
    return false
end
```

### 时序宏（协程）

```lua
local macros = {}

function run_macro(name)
    local co = coroutine.create(function()
        touch_down(0x20000000, 0x3FFFFFFF)
        wait_ms(50)
        touch_up(1)
        wait_ms(100)
        touch_down(0x5FFFFFFF, 0x3FFFFFFF)
        wait_ms(50)
        touch_up(1)
    end)
    table.insert(macros, co)
end

function tick(delta_ms)
    -- 调度器：推进所有活跃协程
    for i = #macros, 1, -1 do
        local ok = coroutine.resume(macros[i])
        if not ok or coroutine.status(macros[i]) == "dead" then
            table.remove(macros, i)
        end
    end
end
```

---

## 常见键码参考

| 键 | HID 键码 |
|----|----------|
| A–Z | `0x04`–`0x1D` |
| 1–9 | `0x1E`–`0x26` |
| 0 | `0x27` |
| Enter | `0x28` |
| Escape | `0x29` |
| Space | `0x2C` |
| LShift | `0xE1` |
| LCtrl | `0xE0` |
| LAlt | `0xE2` |

> 完整键码表见 [HID 键码参考](/api/hid-code)。
