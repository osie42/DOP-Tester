import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { OpenProtocolClient, defaultRegistry } from './op/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, 'web');
const port = Number(process.env.PORT ?? 4173);
const client = new OpenProtocolClient({ registry: defaultRegistry });
const sockets = new Set();
const eventLog = [];

for (const eventName of ['frame.sent', 'frame.received', 'message.parsed', 'subscription.upload', 'connection.state', 'protocol.error']) {
  client.on(eventName, (payload) => broadcast(eventName, normalizePayload(payload)));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return json(res, { connected: client.connected, config: client.config, logSize: eventLog.length });
    }
    if (url.pathname === '/api/schemas' && req.method === 'GET') {
      return json(res, { messages: defaultRegistry.list() });
    }
    if (url.pathname === '/api/connect' && req.method === 'POST') {
      const body = await readJson(req);
      await client.connect({
        host: body.host,
        port: body.port,
        keepAliveMs: Number(body.keepAliveSeconds ?? 10) * 1000,
      });
      if (body.handshake !== false) await client.sendCommand('0001', {}, { revision: body.revision ?? '001' });
      return json(res, { ok: true, connected: client.connected });
    }
    if (url.pathname === '/api/disconnect' && req.method === 'POST') {
      client.disconnect();
      return json(res, { ok: true });
    }
    if (url.pathname === '/api/send' && req.method === 'POST') {
      const body = await readJson(req);
      const message = body.rawData !== undefined
        ? {
            mid: body.mid,
            revision: body.revision ?? '001',
            noAck: Boolean(body.noAck),
            data: body.rawData ?? '',
          }
        : defaultRegistry.build(body.mid, body.values ?? {}, {
            revision: body.revision ?? '001',
            noAck: Boolean(body.noAck),
          });
      const sent = await client.send(message);
      return json(res, { ok: true, sent });
    }
    if (url.pathname === '/api/log' && req.method === 'GET') {
      return json(res, { events: eventLog.slice(-500) });
    }
    return serveStatic(req, res, url.pathname);
  } catch (error) {
    broadcast('protocol.error', normalizePayload(error));
    return json(res, { ok: false, error: error.message, details: error.details ?? null }, 500);
  }
});

server.on('upgrade', (req, socket) => {
  if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }
  const accept = crypto
    .createHash('sha1')
    .update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'));
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => sockets.delete(socket));
  sendWs(socket, { type: 'snapshot', at: new Date().toISOString(), payload: { events: eventLog.slice(-200) } });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Open Protocol Tester listening on http://127.0.0.1:${port}`);
});

function broadcast(type, payload) {
  const event = { type, at: new Date().toISOString(), payload };
  eventLog.push(event);
  if (eventLog.length > 1000) eventLog.shift();
  for (const socket of sockets) sendWs(socket, event);
}

function normalizePayload(payload) {
  if (payload instanceof Error) return { name: payload.name, message: payload.message, details: payload.details ?? null };
  return payload;
}

function sendWs(socket, event) {
  if (socket.destroyed) return;
  const data = Buffer.from(JSON.stringify(event));
  const header = data.length < 126
    ? Buffer.from([0x81, data.length])
    : data.length < 65536
      ? Buffer.from([0x81, 126, data.length >> 8, data.length & 0xff])
      : null;
  if (!header) return;
  socket.write(Buffer.concat([header, data]));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function json(res, body, status = 200) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
  });
  res.end(data);
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(webRoot, safePath));
  if (!filePath.startsWith(webRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const type = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
    }[path.extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}
