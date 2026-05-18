# Open Protocol Tester

本项目是一个本地网页端 Open Protocol tester。浏览器页面负责操作界面，本地 Node 服务负责 TCP/Open Protocol 通信，协议核心层可以被其他数据采集或作业指导软件复用。

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
