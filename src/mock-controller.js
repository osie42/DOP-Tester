import net from 'node:net';
import { MessageCodec } from './op/codec.js';

const host = process.env.MOCK_HOST ?? '127.0.0.1';
const port = Number(process.env.MOCK_PORT ?? 4545);

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);
  let resultTimer = null;
  let resultId = 400;

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const extracted = MessageCodec.extractFrames(buffer);
    buffer = extracted.remaining;
    for (const message of extracted.frames) handleMessage(message);
  });

  socket.on('close', () => {
    if (resultTimer) clearInterval(resultTimer);
  });

  function handleMessage(message) {
    console.log(`<- MID ${message.mid} data="${message.data}"`);
    if (message.mid === '0001') return send('0002', `010001020103${'Mock Controller'.padEnd(25, ' ')}`);
    if (message.mid === '0003') return socket.end();
    if (message.mid === '0060') {
      sendAccepted(message.mid);
      if (!resultTimer) {
        resultTimer = setInterval(() => sendResult(++resultId, 'SUB'), 5000);
        resultTimer.unref?.();
      }
      return sendResult(resultId, 'SUB');
    }
    if (message.mid === '0063') {
      if (resultTimer) clearInterval(resultTimer);
      resultTimer = null;
      return sendAccepted(message.mid);
    }
    if (message.mid === '0064') return sendResult(Number(message.data || 0) || resultId, 'ARC', '0065');
    if (message.mid === '0080') return send('0081', new Date().toISOString().replace('T', ':').slice(0, 19));
    if (message.mid === '0800') return send('0801', '01100095');
    if (message.mid === '0805') return send('0806', '010085');
    if (message.mid === '0040') return send('0041', 'MockTool-Serial-0001'.padEnd(61, ' '));
    if (message.mid === '0070') return sendAccepted(message.mid);
    if (message.mid === '9999') return;
    if (message.mid === '0050' || message.mid === '0150') return sendAccepted(message.mid);
    return sendAccepted(message.mid);
  }

  function sendAccepted(mid) {
    send('0005', mid);
  }

  function sendResult(id, kind, mid = '0061') {
    const payload = [
      '01',
      String(id).padStart(10, '0'),
      '02',
      kind.padEnd(3, ' '),
      '03',
      'OK',
      '04',
      '12.34Nm',
      '05',
      '2026-05-18:12:00:00',
    ].join('').padEnd(mid === '0061' ? 211 : 98, ' ');
    send(mid, payload);
  }

  function send(mid, data = '', revision = '001') {
    const frame = MessageCodec.encode({ mid, revision, data });
    socket.write(frame);
    console.log(`-> MID ${mid} data="${data.trimEnd()}"`);
  }
});

server.listen(port, host, () => {
  console.log(`Mock tightening controller listening on ${host}:${port}`);
});
