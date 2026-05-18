# Open Protocol Tester

本项目是一个本地网页端 Open Protocol tester。浏览器页面负责操作界面，本地 Node 服务负责 TCP/Open Protocol 通信，协议核心层可以被其他数据采集或作业指导软件复用。

## 功能概览

Open Protocol Tester 的目标不是只做一个手动发包页面，而是把 OP 协议层、测试界面、模拟控制器拆开，方便后续复用到 DataCollector、作业指导、设备状态监控等软件中。

```text
Browser Tester UI
  |
  | HTTP / WebSocket
  v
Local Node Bridge
  |
  | TCP / Open Protocol
  v
Tightening Controller / Mock Controller
```

### Tester 主界面

Tester 页面分为几个工作区：

| 区域 | 功能 |
| --- | --- |
| 顶部连接状态 | 显示当前连接状态、控制器地址，并可重新展开连接设置。 |
| 功能命令 | 按 OP 业务逻辑分组的 MID 按钮，支持折叠/展开。无参数命令点击即发送，有参数命令会弹出参数窗口。 |
| 控制器状态 | 汇总 controller、cell、channel、tool、pset、job、电量、信号、系统错误等状态。 |
| 拧紧结果 | 缓存最近 10 条拧紧结果，解析 MID 0061/0065 中的状态、扭矩、角度、目标值、上下限、计数器和错误信息。 |
| 事件日志 | 实时显示 TX/RX/解析/订阅/错误事件，Data/Parsed 字段保留最大空间，便于调试报文。 |
| 手动 MID | 支持任意 MID/revision/no-ack/data 的原始报文发送，并带 MID schema 查询。 |

### 功能命令

功能命令按业务分组，当前覆盖常用和高级 OP MID：

- 连接：`0001`, `0003`
- 程序：`0010`, `0012`, `0014`, `0017`, `0018`, `0019`, `0020`, `0021`
- 工具：`0040`, `0042`, `0043`, `0045`
- ID：`0150`, `0051`, `0054`
- Job / 结果：`0030`, `0032`, `0034`, `0037`, `0038`, `0060`, `0063`, `0064`
- 错误：`0070`, `0073`, `0078`
- 状态：`0800`, `0802`, `0804`, `0805`, `0807`, `0809`
- PLC / 信号：`0500`, `0503`, `0504`, `0210`, `0213`
- Tag：`0260`, `0261`, `0264`
- 模式：`0400`, `0403`, `0404`, `0410`
- 作业：`0570`, `0571`, `0573`
- 时间 / 显示 / 高级：`0080`, `0082`, `0111`, `0127`, `2505`

### 拧紧结果与曲线

结果区会自动缓存最近 10 次拧紧结果。每条结果会尽量解析：

- 拧紧状态：OK / NOK
- 扭矩：实际值、目标值、最小值、最大值、状态
- 角度：实际值、目标值、最小值、最大值、状态
- Pset / Job / ID Code / Tightening ID / 时间戳
- OK/NOK counter 和错误状态
- 曲线标识：有曲线时可打开曲线窗口

曲线窗口支持：

- 主坐标：扭矩/角度、扭矩/时间
- 副坐标：无、速度、加速度
- 自动坐标范围
- 左轴/右轴/底轴刻度
- 鼠标悬停吸附最近点，显示十字线和坐标 tooltip

### Mock Controller

Mock Controller 用于没有真实设备时离线验证 tester。

Mock UI 可以：

- 查看 tester 发来的 MID
- 查看 mock 回复的 MID
- 切换拧紧结果 OK / NOK
- 选择是否发送曲线 MID 0900
- 手动触发一次拧紧结果

典型联调方式：

```bash
MOCK_PORT=14545 npm run mock
```

打开 mock 页面：

```text
http://127.0.0.1:14546
```

Tester 页面连接：

```text
Host: 127.0.0.1
Port: 14545
```

## 运行

启动 tester：

```bash
npm start
```

打开：

```text
http://127.0.0.1:4173
```

启动离线 mock tightening controller：

```bash
npm run mock
```

mock 默认监听 `127.0.0.1:4545`，可在页面连接面板直接连接。
mock 同时提供一个控制界面，默认端口为 TCP 端口 + 1。例如：

```bash
MOCK_PORT=14545 npm run mock
```

然后打开：

```text
http://127.0.0.1:14546
```

在 mock 界面可以查看收到/回复的 MID，切换拧紧结果 OK/NOK，选择是否发送曲线 MID 0900，并手动触发一次拧紧结果。

## 测试

```bash
npm test
```

## 结构

- `src/op`：可复用 Open Protocol 核心层，包含 codec、registry、TCP client。
- `src/server.js`：本地 HTTP/WebSocket 桥，负责网页和 TCP controller 之间的通信。
- `src/web`：tester 前端。
- `src/mock-controller.js`：离线模拟 tightening controller。
