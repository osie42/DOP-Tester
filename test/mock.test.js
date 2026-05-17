import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { MessageCodec } from '../src/op/codec.js';

test('mock-style controller exchange supports handshake and archived result', async () => {
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const extracted = MessageCodec.extractFrames(buffer);
      buffer = extracted.remaining;
      for (const message of extracted.frames) {
        if (message.mid === '0001') socket.write(MessageCodec.encode({ mid: '0002', data: '010001020103Test                     ' }));
        if (message.mid === '0064') socket.write(MessageCodec.encode({ mid: '0065', data: '0000000401'.padEnd(98, ' ') }));
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const socket = net.createConnection({ host: '127.0.0.1', port });
  const received = [];
  let buffer = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const extracted = MessageCodec.extractFrames(buffer);
    buffer = extracted.remaining;
    received.push(...extracted.frames);
  });
  await new Promise((resolve) => socket.once('connect', resolve));
  socket.write(MessageCodec.encode({ mid: '0001' }));
  socket.write(MessageCodec.encode({ mid: '0064', data: '0000000401' }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepEqual(received.map((message) => message.mid), ['0002', '0065']);
  socket.destroy();
  await new Promise((resolve) => server.close(resolve));
});
