# HID 键码参考

> 📥 <a href="/api/defines.h" download>点击下载 defines.h</a>

USB HID 键盘键码表。按键名使用 `defines.h` 中的宏名称。

---

## 鼠标按钮

| 按钮 | 宏 | 值 |
|------|-----|-----|
| 左键 | `MOUSE_BUTTON_LEFT` | `0` |
| 右键 | `MOUSE_BUTTON_RIGHT` | `1` |
| 中键 | `MOUSE_BUTTON_MIDDLE` | `2` |
| 后退 | `MOUSE_BUTTON_BACK` | `3` |
| 前进 | `MOUSE_BUTTON_FORWARD` | `4` |

---

## 字母键

| 键 | 宏 | 键码 |
|----|-----|------|
| A | `KEY_A` | `0x04` |
| B | `KEY_B` | `0x05` |
| C | `KEY_C` | `0x06` |
| D | `KEY_D` | `0x07` |
| E | `KEY_E` | `0x08` |
| F | `KEY_F` | `0x09` |
| G | `KEY_G` | `0x0A` |
| H | `KEY_H` | `0x0B` |
| I | `KEY_I` | `0x0C` |
| J | `KEY_J` | `0x0D` |
| K | `KEY_K` | `0x0E` |
| L | `KEY_L` | `0x0F` |
| M | `KEY_M` | `0x10` |
| N | `KEY_N` | `0x11` |
| O | `KEY_O` | `0x12` |
| P | `KEY_P` | `0x13` |
| Q | `KEY_Q` | `0x14` |
| R | `KEY_R` | `0x15` |
| S | `KEY_S` | `0x16` |
| T | `KEY_T` | `0x17` |
| U | `KEY_U` | `0x18` |
| V | `KEY_V` | `0x19` |
| W | `KEY_W` | `0x1A` |
| X | `KEY_X` | `0x1B` |
| Y | `KEY_Y` | `0x1C` |
| Z | `KEY_Z` | `0x1D` |

---

## 数字键

| 键 | 宏 | 键码 |
|----|-----|------|
| 1 | `KEY_1` | `0x1E` |
| 2 | `KEY_2` | `0x1F` |
| 3 | `KEY_3` | `0x20` |
| 4 | `KEY_4` | `0x21` |
| 5 | `KEY_5` | `0x22` |
| 6 | `KEY_6` | `0x23` |
| 7 | `KEY_7` | `0x24` |
| 8 | `KEY_8` | `0x25` |
| 9 | `KEY_9` | `0x26` |
| 0 | `KEY_0` | `0x27` |

---

## 功能键

| 键 | 宏 | 键码 |
|----|-----|------|
| Enter | `KEY_ENTER` | `0x28` |
| Escape | `KEY_ESC` | `0x29` |
| Backspace | `KEY_BACKSPACE` | `0x2A` |
| Tab | `KEY_TAB` | `0x2B` |
| Space | `KEY_SPACE` | `0x2C` |
| Caps Lock | `KEY_CAPSLOCK` | `0x39` |
| Print Screen | `KEY_SYSRQ` | `0x46` |
| Scroll Lock | `KEY_SCROLLLOCK` | `0x47` |
| Pause | `KEY_PAUSE` | `0x48` |

---

## 符号键

| 键 | 宏 | 键码 |
|----|-----|------|
| `-` / `_` | `KEY_MINUS` | `0x2D` |
| `=` / `+` | `KEY_EQUAL` | `0x2E` |
| `[` / `{` | `KEY_LEFTBRACE` | `0x2F` |
| `]` / `}` | `KEY_RIGHTBRACE` | `0x30` |
| `\` / `\|` | `KEY_BACKSLASH` | `0x31` |
| `;` / `:` | `KEY_SEMICOLON` | `0x33` |
| `'` / `"` | `KEY_APOSTROPHE` | `0x34` |
| `` ` `` / `~` | `KEY_GRAVE` | `0x35` |
| `,` / `<` | `KEY_COMMA` | `0x36` |
| `.` / `>` | `KEY_DOT` | `0x37` |
| `/` / `?` | `KEY_SLASH` | `0x38` |

---

## F1–F24

| 键 | 宏 | 键码 |
|----|-----|------|
| F1 | `KEY_F1` | `0x3A` |
| F2 | `KEY_F2` | `0x3B` |
| F3 | `KEY_F3` | `0x3C` |
| F4 | `KEY_F4` | `0x3D` |
| F5 | `KEY_F5` | `0x3E` |
| F6 | `KEY_F6` | `0x3F` |
| F7 | `KEY_F7` | `0x40` |
| F8 | `KEY_F8` | `0x41` |
| F9 | `KEY_F9` | `0x42` |
| F10 | `KEY_F10` | `0x43` |
| F11 | `KEY_F11` | `0x44` |
| F12 | `KEY_F12` | `0x45` |
| F13 | `KEY_F13` | `0x68` |
| F14 | `KEY_F14` | `0x69` |
| F15 | `KEY_F15` | `0x6A` |
| F16 | `KEY_F16` | `0x6B` |
| F17 | `KEY_F17` | `0x6C` |
| F18 | `KEY_F18` | `0x6D` |
| F19 | `KEY_F19` | `0x6E` |
| F20 | `KEY_F20` | `0x6F` |
| F21 | `KEY_F21` | `0x70` |
| F22 | `KEY_F22` | `0x71` |
| F23 | `KEY_F23` | `0x72` |
| F24 | `KEY_F24` | `0x73` |

---

## 导航键

| 键 | 宏 | 键码 |
|----|-----|------|
| Insert | `KEY_INSERT` | `0x49` |
| Home | `KEY_HOME` | `0x4A` |
| Page Up | `KEY_PAGEUP` | `0x4B` |
| Delete | `KEY_DELETE` | `0x4C` |
| End | `KEY_END` | `0x4D` |
| Page Down | `KEY_PAGEDOWN` | `0x4E` |
| Right Arrow | `KEY_RIGHT` | `0x4F` |
| Left Arrow | `KEY_LEFT` | `0x50` |
| Down Arrow | `KEY_DOWN` | `0x51` |
| Up Arrow | `KEY_UP` | `0x52` |

---

## 小键盘

| 键 | 宏 | 键码 |
|----|-----|------|
| Num Lock | `KEY_NUMLOCK` | `0x53` |
| KP `/` | `KEY_KPSLASH` | `0x54` |
| KP `*` | `KEY_KPASTERISK` | `0x55` |
| KP `-` | `KEY_KPMINUS` | `0x56` |
| KP `+` | `KEY_KPPLUS` | `0x57` |
| KP Enter | `KEY_KPENTER` | `0x58` |
| KP 1 | `KEY_KP1` | `0x59` |
| KP 2 | `KEY_KP2` | `0x5A` |
| KP 3 | `KEY_KP3` | `0x5B` |
| KP 4 | `KEY_KP4` | `0x5C` |
| KP 5 | `KEY_KP5` | `0x5D` |
| KP 6 | `KEY_KP6` | `0x5E` |
| KP 7 | `KEY_KP7` | `0x5F` |
| KP 8 | `KEY_KP8` | `0x60` |
| KP 9 | `KEY_KP9` | `0x61` |
| KP 0 | `KEY_KP0` | `0x62` |
| KP `.` | `KEY_KPDOT` | `0x63` |
| KP `=` | `KEY_KPEQUAL` | `0x67` |
| KP `,` | `KEY_KPCOMMA` | `0x85` |

---

## 修饰键

| 键 | 宏 | 键码 |
|----|-----|------|
| Left Ctrl | `KEY_LEFTCTRL` | `0xE0` |
| Left Shift | `KEY_LEFTSHIFT` | `0xE1` |
| Left Alt | `KEY_LEFTALT` | `0xE2` |
| Left GUI | `KEY_LEFTMETA` | `0xE3` |
| Right Ctrl | `KEY_RIGHTCTRL` | `0xE4` |
| Right Shift | `KEY_RIGHTSHIFT` | `0xE5` |
| Right Alt | `KEY_RIGHTALT` | `0xE6` |
| Right GUI | `KEY_RIGHTMETA` | `0xE7` |

---

## 媒体键

| 键 | 宏 | 键码 |
|----|-----|------|
| Play/Pause | `KEY_MEDIA_PLAYPAUSE` | `0xE8` |
| Stop | `KEY_MEDIA_STOPCD` | `0xE9` |
| Previous | `KEY_MEDIA_PREVIOUSSONG` | `0xEA` |
| Next | `KEY_MEDIA_NEXTSONG` | `0xEB` |
| Eject | `KEY_MEDIA_EJECTCD` | `0xEC` |
| Volume Up | `KEY_MEDIA_VOLUMEUP` | `0xED` |
| Volume Down | `KEY_MEDIA_VOLUMEDOWN` | `0xEE` |
| Mute | `KEY_MEDIA_MUTE` | `0xEF` |
| WWW | `KEY_MEDIA_WWW` | `0xF0` |
| Back | `KEY_MEDIA_BACK` | `0xF1` |
| Forward | `KEY_MEDIA_FORWARD` | `0xF2` |
| Stop | `KEY_MEDIA_STOP` | `0xF3` |
| Find | `KEY_MEDIA_FIND` | `0xF4` |
| Scroll Up | `KEY_MEDIA_SCROLLUP` | `0xF5` |
| Scroll Down | `KEY_MEDIA_SCROLLDOWN` | `0xF6` |
| Edit | `KEY_MEDIA_EDIT` | `0xF7` |
| Sleep | `KEY_MEDIA_SLEEP` | `0xF8` |
| Coffee | `KEY_MEDIA_COFFEE` | `0xF9` |
| Refresh | `KEY_MEDIA_REFRESH` | `0xFA` |
| Calc | `KEY_MEDIA_CALC` | `0xFB` |

---

## 系统控制

| 键 | 宏 | 键码 |
|----|-----|------|
| Execute | `KEY_OPEN` | `0x74` |
| Help | `KEY_HELP` | `0x75` |
| Menu | `KEY_PROPS` | `0x76` |
| Select | `KEY_FRONT` | `0x77` |
| Stop | `KEY_STOP` | `0x78` |
| Again | `KEY_AGAIN` | `0x79` |
| Undo | `KEY_UNDO` | `0x7A` |
| Cut | `KEY_CUT` | `0x7B` |
| Copy | `KEY_COPY` | `0x7C` |
| Paste | `KEY_PASTE` | `0x7D` |
| Find | `KEY_FIND` | `0x7E` |
| Mute | `KEY_MUTE` | `0x7F` |
| Volume Up | `KEY_VOLUMEUP` | `0x80` |
| Volume Down | `KEY_VOLUMEDOWN` | `0x81` |

---

## 国际键

| 键 | 宏 | 键码 |
|----|-----|------|
| Non-US `\` | `KEY_102ND` | `0x64` |
| Application | `KEY_COMPOSE` | `0x65` |
| Power | `KEY_POWER` | `0x66` |
| Non-US `#` | `KEY_HASHTILDE` | `0x32` |
| Ro | `KEY_RO` | `0x87` |
| かな | `KEY_KATAKANAHIRAGANA` | `0x88` |
| ¥ | `KEY_YEN` | `0x89` |
| 変換 | `KEY_HENKAN` | `0x8A` |
| 無変換 | `KEY_MUHENKAN` | `0x8B` |
| KP `,` (JP) | `KEY_KPJPCOMMA` | `0x8C` |
| 한글 | `KEY_HANGEUL` | `0x90` |
| 한자 | `KEY_HANJA` | `0x91` |
| カタカナ | `KEY_KATAKANA` | `0x92` |
| ひらがな | `KEY_HIRAGANA` | `0x93` |
| 全角半角 | `KEY_ZENKAKUHANKAKU` | `0x94` |
