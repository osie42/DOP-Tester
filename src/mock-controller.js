import net from 'node:net';
import http from 'node:http';
import { MessageCodec } from './op/codec.js';

const host = process.env.MOCK_HOST ?? '127.0.0.1';
const port = Number(process.env.MOCK_PORT ?? 4545);
const uiPort = Number(process.env.MOCK_UI_PORT ?? port + 1);

const mockState = {
  resultStatus: 'OK',
  includeCurve: false,
  resultId: 400,
  clients: new Set(),
  log: [],
};

const tcpServer = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);
  let resultTimer = null;
  mockState.clients.add(socket);
  pushLog('tcp.connected', '-', `client ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const extracted = MessageCodec.extractFrames(buffer);
    buffer = extracted.remaining;
    for (const message of extracted.frames) handleMessage(socket, message);
  });

  socket.on('close', () => {
    mockState.clients.delete(socket);
    if (resultTimer) clearInterval(resultTimer);
    pushLog('tcp.closed', '-', 'client disconnected');
  });
  socket.on('error', (error) => pushLog('tcp.error', '-', error.message));

  function handleMessage(target, message) {
    pushLog('rx', message.mid, message.data.trimEnd());
    if (message.mid === '0001') return send(target, '0002', `010001020103${'Mock Controller'.padEnd(25, ' ')}`);
    if (message.mid === '0003') return target.end();
    if (message.mid === '0060') {
      sendAccepted(target, message.mid);
      if (!resultTimer) {
        resultTimer = setInterval(() => sendResultTo(target, ++mockState.resultId, 'SUB'), 5000);
        resultTimer.unref?.();
      }
      return sendResultTo(target, ++mockState.resultId, 'SUB');
    }
    if (message.mid === '0063') {
      if (resultTimer) clearInterval(resultTimer);
      resultTimer = null;
      return sendAccepted(target, message.mid);
    }
    if (message.mid === '0064') return sendResultTo(target, Number(message.data || 0) || ++mockState.resultId, 'ARC', '0065');
    if (message.mid === '0080') return send(target, '0081', new Date().toISOString().replace('T', ':').slice(0, 19));
    if (message.mid === '0800') return send(target, '0801', '01100095');
    if (message.mid === '0805') return send(target, '0806', '010085');
    if (message.mid === '0040') return send(target, '0041', 'MockTool-Serial-0001'.padEnd(61, ' '));
    if (message.mid === '0070') return sendAccepted(target, message.mid);
    if (message.mid === '9999') return;
    return sendAccepted(target, message.mid);
  }
});

tcpServer.listen(port, host, () => {
  console.log(`Mock tightening controller listening on ${host}:${port}`);
  console.log(`Mock UI listening on http://${host}:${uiPort}`);
});

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/' && req.method === 'GET') return html(res, mockPage());
  if (url.pathname === '/api/state' && req.method === 'GET') return json(res, snapshot());
  if (url.pathname === '/api/config' && req.method === 'POST') {
    const body = await readJson(req);
    if (body.resultStatus) mockState.resultStatus = body.resultStatus === 'NOK' ? 'NOK' : 'OK';
    if (typeof body.includeCurve === 'boolean') mockState.includeCurve = body.includeCurve;
    pushLog('mock.config', '-', `result=${mockState.resultStatus}, curve=${mockState.includeCurve}`);
    return json(res, snapshot());
  }
  if (url.pathname === '/api/trigger-result' && req.method === 'POST') {
    broadcastResult('MAN');
    return json(res, snapshot());
  }
  res.writeHead(404);
  res.end('Not found');
});

httpServer.listen(uiPort, host);

function sendAccepted(target, mid) {
  send(target, '0005', mid);
}

function broadcastResult(kind = 'MAN') {
  mockState.resultId += 1;
  for (const client of mockState.clients) {
    if (!client.destroyed) sendResultTo(client, mockState.resultId, kind);
  }
}

function sendResultTo(target, id, kind, mid = '0061') {
  send(target, mid, buildResultPayload(id, kind), '002');
  if (mockState.includeCurve) send(target, '0900', buildGraphPayload(), '001');
}

function buildResultPayload(id, kind) {
  const ok = mockState.resultStatus === 'OK';
  const now = new Date().toISOString().replace('T', ':').slice(0, 19);
  return [
    field('01', '0001'),
    field('02', '01'),
    field('03', 'Mock Controller'.padEnd(25, ' ')),
    field('04', `${kind}-ID-${String(id).padStart(4, '0')}`.padEnd(25, ' ')),
    field('05', '0001'),
    field('06', '002'),
    field('07', '99'),
    field('08', '00000'),
    field('09', '0010'),
    field('10', '0003'),
    field('11', ok ? '1' : '0'),
    field('12', '2'),
    field('13', ok ? '1' : '0'),
    field('14', ok ? '1' : '2'),
    field('15', '1'),
    field('16', '1'),
    field('17', '0'),
    field('18', '0'),
    field('19', '0'),
    field('20', ok ? '0000000000' : '0000000001'),
    field('21', '001000'),
    field('22', '001500'),
    field('23', '001250'),
    field('24', ok ? '001234' : '001680'),
    field('25', '00010'),
    field('26', '00120'),
    field('27', '00090'),
    field('28', ok ? '00088' : '00135'),
    field('29', '00000'),
    field('30', '00000'),
    field('31', '00000'),
    field('32', '000'),
    field('33', '000'),
    field('34', '000'),
    field('35', '000000'),
    field('36', '000000'),
    field('37', '000000'),
    field('38', '000000'),
    field('39', '000000'),
    field('40', '000000'),
    field('41', String(id).padStart(10, '0')),
    field('42', '00000'),
    field('43', String(id % 100000).padStart(5, '0')),
    field('44', 'MOCKSERIAL0001'),
    field('45', now),
    field('46', now),
    field('47', 'Mock Pset 002'.padEnd(25, ' ')),
    field('48', '1'),
    field('49', '01'),
  ].join('');
}

function buildGraphPayload() {
  const values = Array.from({ length: 80 }, (_, index) => String(Math.round(45 + Math.sin(index / 7) * 18 + index * 0.7)).padStart(4, '0'));
  return values.join('');
}

function field(id, value) {
  return `${id}${value}`;
}

function send(target, mid, data = '', revision = '001') {
  const frame = MessageCodec.encode({ mid, revision, data });
  target.write(frame);
  pushLog('tx', mid, data.trimEnd());
}

function pushLog(type, mid, data) {
  mockState.log.unshift({ at: new Date().toISOString(), type, mid, data });
  mockState.log = mockState.log.slice(0, 200);
  console.log(`${type} MID ${mid} ${data}`);
}

function snapshot() {
  return {
    host,
    port,
    uiPort,
    resultStatus: mockState.resultStatus,
    includeCurve: mockState.includeCurve,
    clients: mockState.clients.size,
    log: mockState.log,
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function json(res, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': data.length });
  res.end(data);
}

function html(res, body) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function mockPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mock Tightening Controller</title>
  <style>
    body{margin:0;background:#f6f7f9;color:#1f2933;font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:#101828;color:white;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
    h1{font-size:20px;margin:0} main{display:grid;grid-template-columns:320px 1fr;gap:12px;padding:12px}
    section{background:white;border:1px solid #d6dbe1;border-radius:8px;padding:12px} h2{font-size:16px;margin:0 0 10px}
    label{display:flex;align-items:center;gap:8px;margin:8px 0}.seg{display:flex;gap:8px}.seg button{flex:1}
    button{border:1px solid #d6dbe1;border-radius:6px;background:#eef2f6;color:#344054;padding:8px 10px;font-weight:700;cursor:pointer}
    button.active{background:#0f766e;color:white;border-color:#0f766e}.danger.active{background:#b42318;border-color:#b42318}
    .primary{background:#0f766e;color:white;border-color:#0f766e;width:100%;margin-top:10px}
    table{width:100%;border-collapse:collapse}th,td{border-top:1px solid #d6dbe1;padding:7px;text-align:left;vertical-align:top}
    td:nth-child(4){font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;overflow-wrap:anywhere}
  </style>
</head>
<body>
  <header><h1>Mock Tightening Controller</h1><div id="status"></div></header>
  <main>
    <section>
      <h2>模拟结果</h2>
      <div class="seg">
        <button id="okBtn">合格 OK</button>
        <button id="nokBtn" class="danger">不合格 NOK</button>
      </div>
      <label><input id="curveInput" type="checkbox"> 包含曲线 MID 0900</label>
      <button class="primary" id="triggerBtn">手动发送一次拧紧结果</button>
    </section>
    <section>
      <h2>收到 / 回复的指令</h2>
      <table>
        <thead><tr><th>时间</th><th>方向</th><th>MID</th><th>Data</th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </section>
  </main>
  <script>
    const okBtn=document.querySelector('#okBtn'), nokBtn=document.querySelector('#nokBtn'), curveInput=document.querySelector('#curveInput');
    okBtn.onclick=()=>save({resultStatus:'OK'});
    nokBtn.onclick=()=>save({resultStatus:'NOK'});
    curveInput.onchange=()=>save({includeCurve:curveInput.checked});
    triggerBtn.onclick=()=>fetch('/api/trigger-result',{method:'POST'}).then(load);
    async function save(patch){await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});load()}
    async function load(){const s=await fetch('/api/state').then(r=>r.json());render(s)}
    function render(s){document.querySelector('#status').textContent='TCP '+s.host+':'+s.port+' | clients '+s.clients;okBtn.classList.toggle('active',s.resultStatus==='OK');nokBtn.classList.toggle('active',s.resultStatus==='NOK');curveInput.checked=s.includeCurve;rows.innerHTML=s.log.map(e=>'<tr><td>'+new Date(e.at).toLocaleTimeString()+'</td><td>'+e.type+'</td><td>'+e.mid+'</td><td>'+escape(e.data||'')+'</td></tr>').join('')}
    function escape(v){return String(v).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
    load();setInterval(load,1000);
  </script>
</body>
</html>`;
}
