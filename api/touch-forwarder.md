# touch_forwarder 触屏转发

`touch_forwarder` 运行在安卓手机上，让手搓触控与开发板映射同时工作、互不冲突。

> 使用前提：安卓手机已开启 USB 调试，并通过 adb 连接到电脑。

## 安装

adb 连接 PC 后，在 PC 的终端执行：

```sh
curl.exe -fL --retry 3 -o touch_forwarder_arm64 "https://1833788059.cdn.123clouddisk.com/1833788059/direct/projects/touch_forwarder/touch_forwarder_arm64"
adb push touch_forwarder_arm64 /data/local/tmp/touch_forwarder_arm64
adb shell chmod 755 /data/local/tmp/touch_forwarder_arm64
```

## 测试运行

```sh
adb shell /data/local/tmp/touch_forwarder_arm64
```

看到「监听 :6532，等待客户端…」即工作正常，此时插入开发板即可手搓不冲突。

## 后台运行

测试正常后，按 `Ctrl+C` 退出，使用如下命令进入后台运行，之后 PC 可断开，保持 USB 调试开启即可：

```sh
adb shell /data/local/tmp/touch_forwarder_arm64 start
```

- 程序脱离终端持续运行：关掉 cmd 窗口、拔掉 USB 线都不影响
- 只有 `stop`、手机重启或系统强杀会让它停下；手机重启后重新执行一次 `start` 即可

## 管理命令

```sh
adb shell /data/local/tmp/touch_forwarder_arm64 status    # 运行状态：pid、已运行时长、日志大小
adb shell /data/local/tmp/touch_forwarder_arm64 logf      # 实时查看日志（Ctrl+C 只退出查看）
adb shell /data/local/tmp/touch_forwarder_arm64 log 200   # 最近 200 行（默认 50 行）
adb shell /data/local/tmp/touch_forwarder_arm64 restart   # 重启
adb shell /data/local/tmp/touch_forwarder_arm64 stop      # 停止
```
