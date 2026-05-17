const state = {
  schemas: [],
  events: [],
};

const statusBadge = document.querySelector('#statusBadge');
const eventRows = document.querySelector('#eventRows');
const schemaList = document.querySelector('#schemaList');
const quickActions = document.querySelector('#quickActions');

const quick = [
  { title: 'Communication start', mid: '0001', fields: [] },
  { title: 'Communication stop', mid: '0003', fields: [] },
  { title: 'Select tightening program', mid: '0018', fields: [{ name: 'programNumber', label: '程序号', value: '001' }] },
  { title: 'Apply OK/NOK counter', mid: '0019', fields: [
    { name: 'programNumber', label: '程序号', value: '001' },
    { name: 'okCounter', label: 'OK', value: '00' },
    { name: 'nokCounter', label: 'NOK', value: '00' },
  ] },
  { title: 'Deactivate tool', mid: '0042', fields: [] },
  { title: 'Activate tool', mid: '0043', fields: [] },
  { title: 'ID code download', mid: '0150', fields: [{ name: 'idCode', label: 'ID Code', value: 'TEST-001' }] },
  { title: 'Result subscription', mid: '0060', fields: [] },
  { title: 'Cancel result subscription', mid: '0063', fields: [] },
  { title: 'Archived result', mid: '0064', fields: [{ name: 'tighteningId', label: 'Result ID', value: '0' }] },
  { title: 'System errors subscription', mid: '0070', fields: [] },
  { title: 'Battery level', mid: '0800', fields: [] },
  { title: 'Reception quality', mid: '0805', fields: [] },
  { title: 'PLC output subscription', mid: '0500', fields: [] },
  { title: 'Change input signals', mid: '0504', fields: [{ name: 'rawInputSignals', label: '16 bytes raw', value: '0100000000000000' }] },
];

await loadSchemas();
renderQuickActions();
connectWebSocket();
refreshStatus();

document.querySelector('#connectForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  data.handshake = event.currentTarget.handshake.checked;
  await api('/api/connect', data);
  await refreshStatus();
});

document.querySelector('#disconnectBtn').addEventListener('click', async () => {
  await api('/api/disconnect', {});
  await refreshStatus();
});

document.querySelector('#rawForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  data.noAck = form.noAck.checked;
  await api('/api/send', data);
});

document.querySelector('#schemaFilter').addEventListener('input', renderSchemas);
document.querySelector('#eventFilter').addEventListener('input', renderEvents);
document.querySelector('#clearBtn').addEventListener('click', () => {
  state.events = [];
  renderEvents();
});
document.querySelector('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `op-events-${new Date().toISOString().replaceAll(':', '-')}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

async function loadSchemas() {
  const response = await fetch('/api/schemas');
  const body = await response.json();
  state.schemas = body.messages;
  renderSchemas();
}

function renderSchemas() {
  const filter = document.querySelector('#schemaFilter').value.toLowerCase();
  schemaList.innerHTML = '';
  for (const schema of state.schemas) {
    const text = `${schema.mid} ${schema.description}`.toLowerCase();
    if (filter && !text.includes(filter)) continue;
    const item = document.createElement('div');
    item.className = 'schema-item';
    item.innerHTML = `<span class="mid">${schema.mid}</span><span>${escapeHtml(schema.description)}</span><span class="sent-by">${schema.sentBy}</span>`;
    item.addEventListener('click', () => {
      document.querySelector('#rawForm [name="mid"]').value = schema.mid;
      document.querySelector('#rawForm [name="revision"]').value = '001';
    });
    schemaList.append(item);
  }
}

function renderQuickActions() {
  for (const action of quick) {
    const card = document.createElement('form');
    card.className = 'quick-card';
    card.innerHTML = `<h3>${action.mid} ${escapeHtml(action.title)}</h3>`;
    for (const field of action.fields) {
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = document.createElement('input');
      input.name = field.name;
      input.value = field.value;
      label.append(input);
      card.append(label);
    }
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = '发送';
    card.append(button);
    card.addEventListener('submit', async (event) => {
      event.preventDefault();
      await api('/api/send', {
        mid: action.mid,
        revision: '001',
        values: Object.fromEntries(new FormData(card)),
      });
    });
    quickActions.append(card);
  }
}

function connectWebSocket() {
  const ws = new WebSocket(`ws://${location.host}`);
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'snapshot') {
      state.events = message.payload.events ?? [];
    } else {
      state.events.push(message);
      if (state.events.length > 500) state.events.shift();
    }
    if (message.type === 'connection.state') refreshStatus();
    renderEvents();
  });
  ws.addEventListener('close', () => setTimeout(connectWebSocket, 1000));
}

async function refreshStatus() {
  const response = await fetch('/api/status');
  const status = await response.json();
  statusBadge.textContent = status.connected ? '已连接' : '未连接';
  statusBadge.classList.toggle('connected', Boolean(status.connected));
}

async function api(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? 'Request failed');
  return payload;
}

function renderEvents() {
  const filter = document.querySelector('#eventFilter').value.toLowerCase();
  eventRows.innerHTML = '';
  for (const event of state.events.slice().reverse()) {
    const payload = event.payload ?? {};
    const text = `${event.type} ${payload.mid ?? ''} ${payload.description ?? ''} ${payload.data ?? ''}`.toLowerCase();
    if (filter && !text.includes(filter)) continue;
    const row = document.createElement('tr');
    if (event.type === 'protocol.error') row.className = 'error';
    row.innerHTML = `
      <td>${new Date(event.at).toLocaleTimeString()}</td>
      <td>${escapeHtml(event.type)}</td>
      <td>${payload.mid ?? ''}</td>
      <td>${escapeHtml(payload.description ?? payload.message ?? '')}</td>
      <td class="payload">${escapeHtml(formatPayload(payload))}</td>
    `;
    eventRows.append(row);
  }
}

function formatPayload(payload) {
  if (payload.values && Object.keys(payload.values).length) return JSON.stringify(payload.values);
  if (payload.data) return payload.data;
  if (payload.rawHex) return payload.rawHex;
  if (payload.details) return JSON.stringify(payload.details);
  return '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}
