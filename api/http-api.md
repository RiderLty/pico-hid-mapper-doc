# HTTP API 参考

固件内建 HTTP 服务器（端口 80），提供 REST 接口用于查询/设置设备状态。

## 基础信息

- **Base URL**: `http://192.168.73.1`
- **Content-Type**: `text/plain`（大多接口）
- **方法**: `GET` 查询、`POST` 修改

---

## PIO 角色

### 查询角色

```http
GET /pio_role
```

**响应**: `"0"`（Host 模式）或 `"1"`（Device 模式）

```bash
curl -X GET http://192.168.73.1/pio_role
# → "0"
```

### 设置角色

```http
POST /pio_role
Content-Type: text/plain

0  # 或 1
```

**Body**: `"0"` = Host 模式，`"1"` = Device 模式

设置后**自动写入 Flash 并重启**，下次开机仍保持。

```bash
# 切换为 Device 模式
curl -X POST http://192.168.73.1/pio_role -d "1"
```

---

## 屏幕方向

### 查询方向

```http
GET /orientation
```

**响应**: `"0"` | `"1"` | `"2"` | `"3"` | `"auto"`

| 值 | 含义 |
|----|------|
| `0` | 0°（不旋转） |
| `1` | 90° |
| `2` | 180° |
| `3` | 270° |
| `auto` | 自动跟随 vmouse 上报 |

### 设置方向

```http
POST /orientation
Content-Type: text/plain

2  # 或 0/1/3/auto
```

方向修改**立即生效**，写入 Flash 持久化。

```bash
curl -X POST http://192.168.73.1/orientation -d "2"
```

---

## KV 存储

键值存储接口，用于直接读写 Flash 中的持久化数据。

### 写入

```http
POST /storage/set/<key>
Content-Type: text/plain

<value>
```

### 读取

```http
POST /storage/get/<key>
```

### 删除

```http
POST /storage/del/<key>
```

### 列出所有 key

```http
POST /storage/list
```

---

## 配置槽位

固件支持 **9 个配置槽位**（索引 0–8），可存储不同游戏方案的配置。

### 查询槽位状态

```http
POST /slot/status
```

返回各槽位是否为空、哪个是当前激活/默认槽位。

### 上传配置

```http
POST /slot/upload/<idx>
Content-Type: application/octet-stream

<binary config data>
```

### 激活配置

```http
POST /slot/activate/<idx>
```

立即切换为该槽位的配置。

### 设为默认

```http
POST /slot/default/<idx>
```

开机自动加载此槽位。

### 读取配置

```http
POST /slot/read/<idx>
```

返回该槽位的二进制配置数据。

### 删除配置

```http
POST /slot/delete/<idx>
```

清空该槽位。

---

## PIO Device 控制协议

> PIO 口切换为 **Device 模式**后，PIO-USB-C 口变成一个 generic HID 设备。上位机通过 HID OUT 端点发送 64B 命令帧控制设备。

### 命令帧格式

```
[0x55][0xAA][LEN][CMD][PAYLOAD ...]
```

| 字段 | 字节 | 含义 |
|------|------|------|
| Header | 2 | 固定 `0x55 0xAA`，不符则丢弃 |
| LEN | 1 | 其后字节数 = 1(CMD) + payload 长度 |
| CMD | 1 | 命令码 |
| PAYLOAD | LEN−1 | 命令数据 |

> 多字节字段统一**小端 (LE)**。整帧 ≤ 64B。

### 命令一览

| CMD | 名称 | 说明 |
|-----|------|------|
| `0xFF` | 直接触屏输出 | 绕过映射引擎，直接发送触摸事件 |
| `0xFE` | 鼠标报文 | 标准 8B HID 鼠标报告 |
| `0xFD` | 键盘报文 | 标准 8B HID 键盘报告 |
| `0xFC` | core_input 调度 | 直接调用映射引擎接口 |
| `0xFB` | vmouse 状态输出 | 虚拟鼠标状态转发到网络 |

### CMD 0xFF — 直接触屏输出

```
55 AA 0B FF [action:u8] [id:u8] [x:i32 LE] [y:i32 LE]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| action | u8 | 1=DOWN / 2=MOVE / 3=UP |
| id | u8 | 触点 ID |
| x | i32 LE | X 坐标 (0..0x7FFFFFFE) |
| y | i32 LE | Y 坐标 (0..0x7FFFFFFE) |

### CMD 0xFE — 鼠标报文

```
55 AA 09 FE [report_id:u8] [buttons:u8] [x:i16 LE] [y:i16 LE] [wheel:i8] [reserved:u8]
```

### CMD 0xFD — 键盘报文

```
55 AA 09 FD [modifiers:u8] [reserved:u8] [keys[6]:u8×6]
```

### CMD 0xFC — core_input 调度

| subcmd | 调用函数 | payload |
|--------|----------|---------|
| `0xFF` | `core_input_mouse_move` | dx:i32 + dy:i32 + wheel:i32 (12B) |
| `0xFE` | `core_input_mouse_button` | button:u8 + down:u8 (2B) |
| `0xFD` | `core_input_mod_keyboard` | button:u8 + down:u8 (2B) |
| `0xFC` | `core_input_keyboard` | keycode:u8 + down:u8 (2B) |
| `0xFB` | `core_input_orientation` | orientation:u8 (1B) |

### IN 端点事件

设备也会通过 IN 端点主动上报事件：

```
[0x55][0xAA][LEN][EVT][DATA ...]
```

| EVT | 名称 | 触发条件 |
|-----|------|----------|
| `0x01` | 方向变化 | 屏幕方向改变时 |
