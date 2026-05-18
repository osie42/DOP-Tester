const state = {
  schemas: [],
  events: [],
  results: [],
  selectedResultIndex: 0,
  selectedAction: null,
  controller: {
    connection: '未连接',
    controllerId: '-',
    controllerName: '-',
    cell: '-',
    channel: '-',
    toolId: '-',
    toolName: '-',
    psetNumber: '-',
    psetName: '-',
    jobNumber: '-',
    jobName: '-',
    lastResult: '-',
    lastResultId: '-',
    battery: '-',
    reception: '-',
    systemError: '-',
    graphAvailable: false,
    graphData: [],
  },
};

const statusBadge = document.querySelector('#statusBadge');
const topConnectionTarget = document.querySelector('#topConnectionTarget');
const connectionPanel = document.querySelector('.connection');
const connectionText = document.querySelector('#connectionText');
const connectionTarget = document.querySelector('#connectionTarget');
const connectionDot = document.querySelector('#connectionDot');
const eventRows = document.querySelector('#eventRows');
const schemaList = document.querySelector('#schemaList');
const quickActions = document.querySelector('#quickActions');
const controllerState = document.querySelector('#controllerState');
const resultTabs = document.querySelector('#resultTabs');
const resultDetail = document.querySelector('#resultDetail');
const paramModal = document.querySelector('#paramModal');
const paramForm = document.querySelector('#paramForm');
const paramFields = document.querySelector('#paramFields');
const paramTitle = document.querySelector('#paramTitle');
const paramSubtitle = document.querySelector('#paramSubtitle');
const curveModal = document.querySelector('#curveModal');
const curveCanvas = document.querySelector('#curveCanvas');
const curveSubtitle = document.querySelector('#curveSubtitle');
const curveMainMode = document.querySelector('#curveMainMode');
const curveSecondaryMode = document.querySelector('#curveSecondaryMode');
const curveTooltip = document.querySelector('#curveTooltip');
const curveHover = { point: null, plot: null, series: [] };

const quick = [
  { group: '连接', title: 'Communication start', mid: '0001', fields: [] },
  { group: '连接', title: 'Communication stop', mid: '0003', fields: [] },
  { group: '程序', title: 'Program numbers upload request', mid: '0010', fields: [] },
  { group: '程序', title: 'Program data upload request', mid: '0012', fields: [{ name: 'programNumber', label: '程序号', value: '001' }] },
  { group: '程序', title: 'Program selected subscription', mid: '0014', fields: [] },
  { group: '程序', title: 'Cancel program selected subscription', mid: '0017', fields: [] },
  { group: '程序', title: 'Select tightening program', mid: '0018', fields: [{ name: 'programNumber', label: '程序号', value: '001' }] },
  { group: '程序', title: 'Apply OK/NOK counter', mid: '0019', fields: [
    { name: 'programNumber', label: '程序号', value: '001' },
    { name: 'okCounter', label: 'OK', value: '00' },
    { name: 'nokCounter', label: 'NOK', value: '00' },
  ] },
  { group: '程序', title: 'Deactivate selected OK/NOK counter', mid: '0020', fields: [{ name: 'programNumber', label: '程序号', value: '001' }] },
  { group: '程序', title: 'Deactivate all OK/NOK counters', mid: '0021', fields: [] },
  { group: '工具', title: 'Deactivate tool', mid: '0042', fields: [] },
  { group: '工具', title: 'Activate tool', mid: '0043', fields: [] },
  { group: '工具', title: 'Tool data upload request', mid: '0040', fields: [] },
  { group: '工具', title: 'Define calibration value request', mid: '0045', fields: [{ name: 'calibrationValue', label: 'Calibration value', value: '00000000000' }] },
  { group: 'ID', title: 'ID code download', mid: '0150', fields: [{ name: 'idCode', label: 'ID Code', value: 'TEST-001' }] },
  { group: 'ID', title: 'ID code upload subscription', mid: '0051', fields: [] },
  { group: 'ID', title: 'Cancel ID code upload subscription', mid: '0054', fields: [] },
  { group: '结果', title: 'OK counter / job number upload request', mid: '0030', fields: [] },
  { group: '结果', title: 'Job data upload request', mid: '0032', fields: [{ name: 'jobNumber', label: 'Job No.', value: '01' }] },
  { group: '结果', title: 'Job info subscription', mid: '0034', fields: [] },
  { group: '结果', title: 'Cancel job info subscription', mid: '0037', fields: [] },
  { group: '结果', title: 'Select job number', mid: '0038', fields: [{ name: 'jobNumber', label: 'Job No.', value: '01' }] },
  { group: '结果', title: 'Result subscription', mid: '0060', fields: [] },
  { group: '结果', title: 'Cancel result subscription', mid: '0063', fields: [] },
  { group: '结果', title: 'Archived result', mid: '0064', fields: [{ name: 'tighteningId', label: 'Result ID', value: '0' }] },
  { group: '错误', title: 'System errors subscription', mid: '0070', fields: [] },
  { group: '错误', title: 'Cancel system errors subscription', mid: '0073', fields: [] },
  { group: '错误', title: 'Acknowledge system error', mid: '0078', fields: [] },
  { group: '状态', title: 'Battery level', mid: '0800', fields: [] },
  { group: '状态', title: 'Battery level changes subscription', mid: '0802', fields: [{ name: 'threshold', label: 'Threshold', value: '05' }] },
  { group: '状态', title: 'Cancel battery changes subscription', mid: '0804', fields: [] },
  { group: '状态', title: 'Reception quality', mid: '0805', fields: [] },
  { group: '状态', title: 'Reception quality change subscription', mid: '0807', fields: [{ name: 'threshold', label: 'Threshold', value: '05' }] },
  { group: '状态', title: 'Cancel reception changes subscription', mid: '0809', fields: [] },
  { group: 'PLC', title: 'PLC output subscription', mid: '0500', fields: [] },
  { group: 'PLC', title: 'Cancel PLC output subscription', mid: '0503', fields: [] },
  { group: 'PLC', title: 'Change input signals', mid: '0504', fields: [{ name: 'rawInputSignals', label: '16 bytes raw', value: '0100000000000000' }] },
  { group: '信号', title: 'Output signal subscription', mid: '0210', fields: [] },
  { group: '信号', title: 'Cancel output signal subscription', mid: '0213', fields: [] },
  { group: 'Tag', title: 'Tag ID request', mid: '0260', fields: [] },
  { group: 'Tag', title: 'Tag ID subscription', mid: '0261', fields: [] },
  { group: 'Tag', title: 'Cancel Tag ID subscription', mid: '0264', fields: [] },
  { group: '模式', title: 'Automatic/manual mode subscription', mid: '0400', fields: [] },
  { group: '模式', title: 'Automatic/manual mode logout', mid: '0403', fields: [] },
  { group: '模式', title: 'Automatic/manual mode selection', mid: '0404', fields: [{ name: 'operatingMode', label: 'Mode', value: '1' }] },
  { group: '模式', title: 'AutoDisable setting request', mid: '0410', fields: [] },
  { group: '作业', title: 'Select job number', mid: '0573', fields: [{ name: 'jobNumber', label: 'Job No.', value: '001' }] },
  { group: '作业', title: 'Activate job', mid: '0570', fields: [{ name: 'jobNumber', label: 'Job No.', value: '001' }] },
  { group: '作业', title: 'Start job sequence', mid: '0571', fields: [{ name: 'jobNumber', label: 'Job No.', value: '001' }] },
  { group: '时间', title: 'Controller time request', mid: '0080', fields: [] },
  { group: '时间', title: 'Set controller time', mid: '0082', fields: [{ name: 'dateTime', label: 'YYYY-MM-DD:HH:MM:SS', value: '2026-05-18:12:00:00' }] },
  { group: '显示', title: 'Message on screwdriver display', mid: '0111', fields: [{ name: 'displayMessage', label: 'Display message', value: 'Open Protocol Tester' }] },
  { group: '显示', title: 'Job abort', mid: '0127', fields: [] },
  { group: '高级', title: 'Change and select tightening programs', mid: '2505', fields: [{ name: 'rawProgramChange', label: 'Raw program change', value: '' }] },
];

await loadSchemas();
renderQuickActions();
renderControllerState();
renderResultPanel();
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

document.querySelector('#editConnectionBtn').addEventListener('click', () => {
  connectionPanel.classList.toggle('is-expanded');
});
document.querySelector('#topEditConnectionBtn').addEventListener('click', () => {
  connectionPanel.classList.toggle('is-expanded');
  connectionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

paramForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(paramForm));
  await sendAction(state.selectedAction, values);
  closeParamModal();
});

document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeParamModal));
document.querySelectorAll('[data-close-curve]').forEach((button) => button.addEventListener('click', closeCurveModal));
paramModal.addEventListener('click', (event) => {
  if (event.target === paramModal) closeParamModal();
});
curveModal.addEventListener('click', (event) => {
  if (event.target === curveModal) closeCurveModal();
});
controllerState.addEventListener('click', (event) => {
  if (event.target.closest('#curveBtn')) openCurveModal();
});
resultDetail.addEventListener('click', (event) => {
  if (event.target.closest('#curveBtn')) openCurveModal();
});
curveMainMode.addEventListener('change', () => drawCurve());
curveSecondaryMode.addEventListener('change', () => drawCurve());
curveCanvas.addEventListener('mousemove', handleCurveMove);
curveCanvas.addEventListener('mouseleave', () => {
  curveHover.point = null;
  curveTooltip.hidden = true;
  drawCurve();
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
    const item = document.createElement('button');
    item.className = 'schema-item';
    item.type = 'button';
    item.innerHTML = `<span class="mid">${schema.mid}</span><span>${escapeHtml(schema.description)}</span><span class="sent-by">${schema.sentBy}</span>`;
    item.addEventListener('click', () => {
      document.querySelector('#rawForm [name="mid"]').value = schema.mid;
      document.querySelector('#rawForm [name="revision"]').value = '001';
    });
    schemaList.append(item);
  }
}

function renderQuickActions() {
  quickActions.innerHTML = '';
  const groups = [...new Set(quick.map((action) => action.group))];
  const openGroups = new Set(['连接', '程序', '工具', '结果']);
  for (const group of groups) {
    const section = document.createElement('details');
    section.className = 'command-group-section';
    section.open = openGroups.has(group);
    const count = quick.filter((item) => item.group === group).length;
    section.innerHTML = `
      <summary>
        <span class="fold-icon" aria-hidden="true"></span>
        <strong>${escapeHtml(group)}</strong>
        <em>${count}</em>
      </summary>
      <div class="command-group-grid"></div>
    `;
    const grid = section.querySelector('.command-group-grid');
    for (const action of quick.filter((item) => item.group === group)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `command-button ${action.fields.length ? 'has-fields' : ''}`;
      button.innerHTML = `
        <span class="command-mid">${action.mid}</span>
        <span class="command-title">${escapeHtml(action.title)}</span>
      `;
      button.addEventListener('click', () => {
        if (action.fields.length) openParamModal(action);
        else sendAction(action, {});
      });
      grid.append(button);
    }
    quickActions.append(section);
  }
}

function openParamModal(action) {
  state.selectedAction = action;
  paramTitle.textContent = `${action.mid} ${action.title}`;
  paramSubtitle.textContent = '输入参数后发送';
  paramFields.innerHTML = '';
  for (const field of action.fields) {
    const label = document.createElement('label');
    label.textContent = field.label;
    const input = document.createElement('input');
    input.name = field.name;
    input.value = field.value;
    input.autocomplete = 'off';
    label.append(input);
    paramFields.append(label);
  }
  paramModal.hidden = false;
  paramFields.querySelector('input')?.focus();
}

function closeParamModal() {
  paramModal.hidden = true;
  state.selectedAction = null;
}

async function sendAction(action, values) {
  await api('/api/send', {
    mid: action.mid,
    revision: '001',
    values,
  });
}

function connectWebSocket() {
  const ws = new WebSocket(`ws://${location.host}`);
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'snapshot') {
      state.events = message.payload.events ?? [];
      for (const oldEvent of state.events) updateControllerFromEvent(oldEvent);
    } else {
      state.events.push(message);
      if (state.events.length > 500) state.events.shift();
      updateControllerFromEvent(message);
    }
    if (message.type === 'connection.state') refreshStatus();
    renderEvents();
    renderControllerState();
    renderResultPanel();
  });
  ws.addEventListener('close', () => setTimeout(connectWebSocket, 1000));
}

async function refreshStatus() {
  const response = await fetch('/api/status');
  const status = await response.json();
  statusBadge.textContent = status.connected ? '已连接' : '未连接';
  statusBadge.classList.toggle('connected', Boolean(status.connected));
  state.controller.connection = status.connected ? '已连接' : '未连接';
  connectionText.textContent = status.connected ? '已连接' : '未连接';
  connectionTarget.textContent = status.config ? `${status.config.host}:${status.config.port}` : '-';
  topConnectionTarget.textContent = status.config ? `${status.config.host}:${status.config.port}` : '-';
  connectionDot.classList.toggle('connected', Boolean(status.connected));
  connectionPanel.classList.toggle('is-connected', Boolean(status.connected));
  connectionPanel.classList.toggle('is-expanded', !status.connected);
  renderControllerState();
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

function updateControllerFromEvent(event) {
  const payload = event.payload ?? {};
  if (event.type === 'connection.state') {
    state.controller.connection = payload.state === 'connected' ? '已连接' : '未连接';
  }
  if (event.type === 'frame.sent') {
    if (payload.mid === '0018') state.controller.psetNumber = payload.values?.programNumber ?? payload.data ?? '-';
    if (['0038', '0570', '0571', '0573'].includes(payload.mid)) state.controller.jobNumber = payload.values?.jobNumber ?? payload.data ?? '-';
  }
  if (!['frame.received', 'message.parsed', 'subscription.upload'].includes(event.type)) return;

  if (payload.mid === '0002') {
    state.controller.controllerName = payload.values?.controllerName || '-';
    state.controller.controllerId = compactIdentifier(payload.values?.controllerName || payload.data) || '-';
    state.controller.cell = payload.values?.cellId ?? '-';
    state.controller.channel = payload.values?.channelId ?? '-';
  }
  if (payload.mid === '0013' || payload.mid === '0015') {
    const program = parseNumberAndName(payload.data);
    if (program.number) state.controller.psetNumber = program.number;
    if (program.name) state.controller.psetName = program.name;
  }
  if (payload.mid === '0033' || payload.mid === '0035') {
    const job = parseNumberAndName(payload.data);
    if (job.number) state.controller.jobNumber = job.number;
    if (job.name) state.controller.jobName = job.name;
  }
  if (payload.mid === '0041') {
    const tool = parseTool(payload.data);
    state.controller.toolId = tool.id || '-';
    state.controller.toolName = tool.name || '-';
  }
  if ((payload.mid === '0061' || payload.mid === '0065') && event.type === 'message.parsed') {
    addResult(payload);
  }
  if (payload.mid === '0071' || payload.mid === '0076') {
    state.controller.systemError = payload.data?.trim() || '无';
  }
  if (payload.mid === '0801' || payload.mid === '0803') {
    state.controller.battery = payload.values?.rawBatteryLevel || payload.data || '-';
  }
  if (payload.mid === '0806' || payload.mid === '0808') {
    state.controller.reception = payload.values?.rawReceptionQuality || payload.data || '-';
  }
  if (payload.mid === '0900') {
    state.controller.graphAvailable = true;
    state.controller.graphData = parseGraph(payload.data);
    if (state.results[0]) state.results[0].hasCurve = true;
  }
}

function renderControllerState() {
  const items = [
    { label: 'Controller ID', value: state.controller.controllerId, span: 'half' },
    { label: 'Controller Name', value: state.controller.controllerName, span: 'half' },
    { label: 'Cell', value: state.controller.cell, span: 'half compact' },
    { label: 'Channel', value: state.controller.channel, span: 'half compact' },
    { label: 'Tool ID', value: state.controller.toolId, span: 'half' },
    { label: 'Tool Name', value: state.controller.toolName, span: 'half' },
    { label: 'Pset', value: formatNumberName(state.controller.psetNumber, state.controller.psetName), span: 'half' },
    { label: 'Job', value: formatNumberName(state.controller.jobNumber, state.controller.jobName), span: 'half' },
    { label: 'Battery', value: state.controller.battery, span: 'half compact' },
    { label: 'Reception', value: state.controller.reception, span: 'half compact' },
    { label: 'System Error', value: state.controller.systemError, span: 'full compact' },
  ];
  controllerState.innerHTML = items.map((item) => `
    <div class="state-item ${item.span}">
      <span>${escapeHtml(item.label)}</span>
      <div class="state-value">
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    </div>
  `).join('');
}

function addResult(payload) {
  const parsed = parseTighteningResult(payload);
  state.controller.psetNumber = parsed.psetNumber || state.controller.psetNumber;
  state.controller.psetName = parsed.psetName || state.controller.psetName;
  state.controller.jobNumber = parsed.jobNumber || state.controller.jobNumber;
  const key = parsed.tighteningId || `${parsed.timestamp}-${payload.rawHex}`;
  state.results = state.results.filter((result) => result.key !== key);
  state.results.unshift({
    key,
    mid: payload.mid,
    revision: payload.revision,
    rawData: payload.data,
    rawHex: payload.rawHex,
    hasCurve: state.controller.graphAvailable,
    ...parsed,
  });
  state.results = state.results.slice(0, 10);
  state.selectedResultIndex = 0;
}

function renderResultPanel() {
  if (!state.results.length) {
    resultTabs.innerHTML = '<span class="empty-note">等待 MID 0061 / 0065 结果</span>';
    resultDetail.innerHTML = '<div class="empty-result">暂无拧紧结果</div>';
    return;
  }
  resultTabs.innerHTML = state.results.map((result, index) => `
    <button class="result-tab ${index === state.selectedResultIndex ? 'active' : ''}" type="button" data-result-index="${index}">
      ${escapeHtml(result.tighteningId ? `#${result.tighteningId}` : `结果 ${index + 1}`)}
    </button>
  `).join('');
  resultTabs.querySelectorAll('[data-result-index]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedResultIndex = Number(button.dataset.resultIndex);
      renderResultPanel();
    });
  });
  const result = state.results[state.selectedResultIndex] ?? state.results[0];
  const statusClass = result.tighteningStatusText === 'OK' ? 'ok' : result.tighteningStatusText === 'NOK' ? 'nok' : '';
  resultDetail.innerHTML = `
    <div class="result-head">
      <div>
        <span class="result-id">${escapeHtml(result.tighteningId ? `#${result.tighteningId}` : 'Result')}</span>
        <strong class="result-status ${statusClass}">${escapeHtml(result.tighteningStatusText)}</strong>
      </div>
      ${curveButtonHtml(result.hasCurve)}
    </div>
    <div class="result-meta">
      <span>Time: ${escapeHtml(result.timestamp || '-')}</span>
      <span>Pset: ${escapeHtml(formatNumberName(result.psetNumber, result.psetName))}</span>
      <span>Job: ${escapeHtml(result.jobNumber || '-')}</span>
      <span>ID Code: ${escapeHtml(result.idCode || '-')}</span>
    </div>
    <div class="measure-grid">
      ${measureHtml('Torque', result.torque, result.targetTorque, result.minTorque, result.maxTorque, result.torqueStatusText, result.torqueUnit)}
      ${measureHtml('Angle', result.angle, result.targetAngle, result.minAngle, result.maxAngle, result.angleStatusText, 'deg')}
    </div>
    <div class="result-meta">
      <span>OK Counter: ${escapeHtml(result.okCounterValue || '-')} / ${escapeHtml(result.okCounterLimit || '-')}</span>
      <span>Counter Status: ${escapeHtml(result.counterStatusText || '-')}</span>
      <span>Error: ${escapeHtml(result.errorStatus || '-')}</span>
    </div>
  `;
}

function measureHtml(label, actual, target, min, max, status, unit) {
  return `
    <div class="measure-card">
      <div class="measure-title">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(status || '-')}</strong>
      </div>
      <div class="measure-main">${escapeHtml(actual || '-')}${unit ? `<small>${escapeHtml(unit)}</small>` : ''}</div>
      <dl>
        <dt>Target</dt><dd>${escapeHtml(target || '-')}</dd>
        <dt>Min</dt><dd>${escapeHtml(min || '-')}</dd>
        <dt>Max</dt><dd>${escapeHtml(max || '-')}</dd>
      </dl>
    </div>
  `;
}

function openCurveModal() {
  curveModal.hidden = false;
  curveTooltip.hidden = true;
  drawCurve();
}

function closeCurveModal() {
  curveModal.hidden = true;
  curveHover.point = null;
  curveTooltip.hidden = true;
}

function drawCurve() {
  const ctx = curveCanvas.getContext('2d');
  const { width, height } = curveCanvas;
  ctx.clearRect(0, 0, width, height);
  const plot = { left: 72, right: width - 76, top: 34, bottom: height - 58 };
  if (!state.controller.graphAvailable) {
    curveSubtitle.textContent = '当前结果没有曲线数据';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#98a2b3';
    ctx.font = '16px system-ui';
    ctx.fillText('No graph values received from MID 0900', width / 2 - 140, height / 2);
    return;
  }

  curveSubtitle.textContent = '来自 MID 0900 Graph values message';
  const graph = buildCurveGraph();
  curveHover.plot = plot;
  curveHover.series = graph.points;
  drawAxes(ctx, plot, graph);
  drawSeries(ctx, plot, graph, 'torqueY', '#0f766e', 3);
  if (graph.secondaryKey) drawSeries(ctx, plot, graph, 'secondaryY', '#b42318', 2);
  drawLegend(ctx, plot, graph);
  if (curveHover.point) drawCrosshair(ctx, plot, graph, curveHover.point);
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function parseGraph(data = '') {
  const values = data.match(/\d{2,4}/g)?.map(Number).filter((value) => Number.isFinite(value)) ?? [];
  return values.slice(0, 160);
}

function demoCurve() {
  return Array.from({ length: 80 }, (_, index) => Math.round(40 + Math.sin(index / 8) * 25 + index * 0.8));
}

function buildCurveGraph() {
  const torque = state.controller.graphData.length ? state.controller.graphData : demoCurve();
  const mainMode = curveMainMode.value;
  const secondaryMode = curveSecondaryMode.value;
  const angle = torque.map((_, index) => index);
  const time = torque.map((_, index) => index * 0.02);
  const speed = derivative(torque, time);
  const acceleration = derivative(speed, time);
  const xValues = mainMode === 'torque-time' ? time : angle;
  const xLabel = mainMode === 'torque-time' ? 'Time (s)' : 'Angle (deg)';
  const secondaryValues = secondaryMode === 'speed' ? speed : secondaryMode === 'acceleration' ? acceleration : [];
  const secondaryLabel = secondaryMode === 'speed' ? 'Speed' : secondaryMode === 'acceleration' ? 'Acceleration' : '';
  const xRange = paddedRange(xValues, 0.02);
  const torqueRange = paddedRange(torque, 0.12);
  const secondaryRange = secondaryValues.length ? paddedRange(secondaryValues, 0.18) : null;
  const points = torque.map((value, index) => ({
    index,
    xValue: xValues[index],
    torque: value,
    secondary: secondaryValues[index],
  }));
  return {
    mainMode,
    secondaryMode,
    xLabel,
    torqueLabel: 'Torque',
    secondaryLabel,
    xRange,
    torqueRange,
    secondaryRange,
    secondaryKey: secondaryValues.length ? 'secondary' : '',
    points,
  };
}

function derivative(values, time) {
  return values.map((value, index) => {
    if (index === 0) return 0;
    const dt = Math.max(time[index] - time[index - 1], 0.001);
    return (value - values[index - 1]) / dt;
  });
}

function paddedRange(values, ratio) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * ratio;
  return { min: min - pad, max: max + pad };
}

function scale(value, range, start, end) {
  return start + ((value - range.min) / (range.max - range.min)) * (end - start);
}

function niceTicks(range, count = 5) {
  const ticks = [];
  for (let i = 0; i <= count; i += 1) ticks.push(range.min + ((range.max - range.min) / count) * i);
  return ticks;
}

function drawAxes(ctx, plot, graph) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, curveCanvas.width, curveCanvas.height);
  ctx.strokeStyle = '#d0d5dd';
  ctx.lineWidth = 1;
  ctx.font = '12px system-ui';
  ctx.fillStyle = '#667085';
  for (const tick of niceTicks(graph.xRange, 8)) {
    const x = scale(tick, graph.xRange, plot.left, plot.right);
    line(ctx, x, plot.top, x, plot.bottom);
    ctx.fillText(formatTick(tick), x - 12, plot.bottom + 20);
  }
  for (const tick of niceTicks(graph.torqueRange, 5)) {
    const y = scale(tick, graph.torqueRange, plot.bottom, plot.top);
    line(ctx, plot.left, y, plot.right, y);
    ctx.fillText(formatTick(tick), 12, y + 4);
  }
  ctx.strokeStyle = '#98a2b3';
  line(ctx, plot.left, plot.top, plot.left, plot.bottom);
  line(ctx, plot.left, plot.bottom, plot.right, plot.bottom);
  ctx.fillStyle = '#0f766e';
  ctx.fillText(graph.torqueLabel, plot.left, 18);
  ctx.fillStyle = '#667085';
  ctx.fillText(graph.xLabel, plot.left + (plot.right - plot.left) / 2 - 24, curveCanvas.height - 18);
  if (graph.secondaryRange) {
    ctx.fillStyle = '#b42318';
    for (const tick of niceTicks(graph.secondaryRange, 5)) {
      const y = scale(tick, graph.secondaryRange, plot.bottom, plot.top);
      ctx.fillText(formatTick(tick), plot.right + 12, y + 4);
    }
    ctx.fillText(graph.secondaryLabel, plot.right - 70, 18);
    ctx.strokeStyle = '#98a2b3';
    line(ctx, plot.right, plot.top, plot.right, plot.bottom);
  }
}

function drawSeries(ctx, plot, graph, key, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  graph.points.forEach((point, index) => {
    const x = scale(point.xValue, graph.xRange, plot.left, plot.right);
    const range = key === 'torqueY' ? graph.torqueRange : graph.secondaryRange;
    const value = key === 'torqueY' ? point.torque : point.secondary;
    const y = scale(value, range, plot.bottom, plot.top);
    point[key] = y;
    point.canvasX = x;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawLegend(ctx, plot, graph) {
  ctx.font = '12px system-ui';
  ctx.fillStyle = '#0f766e';
  ctx.fillText('Torque', plot.left + 8, plot.top + 18);
  if (graph.secondaryLabel) {
    ctx.fillStyle = '#b42318';
    ctx.fillText(graph.secondaryLabel, plot.left + 78, plot.top + 18);
  }
}

function drawCrosshair(ctx, plot, graph, point) {
  ctx.strokeStyle = '#344054';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  line(ctx, point.canvasX, plot.top, point.canvasX, plot.bottom);
  line(ctx, plot.left, point.torqueY, plot.right, point.torqueY);
  ctx.setLineDash([]);
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(point.canvasX, point.torqueY, 4, 0, Math.PI * 2);
  ctx.fill();
  const rect = curveCanvas.getBoundingClientRect();
  curveTooltip.hidden = false;
  curveTooltip.style.left = `${(point.canvasX / curveCanvas.width) * rect.width + 12}px`;
  curveTooltip.style.top = `${(point.torqueY / curveCanvas.height) * rect.height + 12}px`;
  curveTooltip.innerHTML = `
    <strong>${formatTick(point.xValue)} ${escapeHtml(graph.xLabel)}</strong>
    <span>Torque: ${formatTick(point.torque)}</span>
    ${graph.secondaryLabel ? `<span>${escapeHtml(graph.secondaryLabel)}: ${formatTick(point.secondary)}</span>` : ''}
  `;
}

function handleCurveMove(event) {
  if (!curveHover.series.length || !curveHover.plot) return;
  const rect = curveCanvas.getBoundingClientRect();
  const canvasX = ((event.clientX - rect.left) / rect.width) * curveCanvas.width;
  let nearest = curveHover.series[0];
  for (const point of curveHover.series) {
    if (Math.abs(point.canvasX - canvasX) < Math.abs(nearest.canvasX - canvasX)) nearest = point;
  }
  curveHover.point = nearest;
  drawCurve();
}

function formatTick(value) {
  if (!Number.isFinite(value)) return '-';
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function compactResult(data = '') {
  const trimmed = data.trim();
  if (!trimmed) return '-';
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed;
}

function extractResultId(data = '') {
  const match = data.match(/\d{6,10}/);
  return match ? String(Number(match[0])) : '-';
}

function compactIdentifier(value = '') {
  const text = String(value).trim();
  if (!text) return '';
  const token = text.match(/[A-Za-z0-9-]{4,}/)?.[0];
  return token || text.slice(0, 24);
}

function parseNumberAndName(data = '') {
  const text = String(data).trim();
  const number = text.match(/\d{1,4}/)?.[0] ?? '';
  const name = text
    .replace(/^[\d\s]+/, '')
    .replace(/[^\x20-\x7e]/g, '')
    .trim()
    .slice(0, 48);
  return { number: number ? String(Number(number)) : '', name };
}

function parseTool(data = '') {
  const text = String(data).trim();
  const id = text.match(/[A-Z0-9][A-Z0-9-]{3,}/i)?.[0] ?? '';
  return {
    id,
    name: text || id,
  };
}

function formatNumberName(number, name) {
  const safeNumber = number && number !== '-' ? `#${number}` : '-';
  if (!name || name === '-') return safeNumber;
  return `${safeNumber} ${name}`;
}

function curveButtonHtml(hasCurve = state.controller.graphAvailable) {
  const className = hasCurve ? 'has-curve' : 'is-empty';
  const label = hasCurve ? '有曲线' : '无曲线';
  return `
    <button id="curveBtn" class="curve-button ${className}" type="button" title="${label}">
      <span class="curve-icon" aria-hidden="true"></span>
      ${label}
    </button>
  `;
}

function parseTighteningResult(payload) {
  const data = payload.data ?? '';
  const revision = payload.revision ?? '001';
  const fields = revision === '001' ? parseTaggedFields(data, RESULT_FIELDS_REV_001) : parseTaggedFields(data, RESULT_FIELDS_REV_002_PLUS);
  const fallback = !Object.keys(fields).length ? parseLooseResult(data) : {};
  const value = (name) => fields[name] ?? fallback[name] ?? '';
  const torqueUnit = torqueUnitText(value('torqueUnit'));
  return {
    cell: value('cellId'),
    channel: value('channelId'),
    controllerName: value('controllerName'),
    idCode: value('idCode'),
    jobNumber: cleanNumber(value('jobNumber')),
    psetNumber: cleanNumber(value('psetNumber')),
    psetName: value('psetName'),
    okCounterLimit: cleanNumber(value('okCounterLimit')),
    okCounterValue: cleanNumber(value('okCounterValue')),
    tighteningStatusText: tighteningStatusText(value('tighteningStatus')),
    torqueStatusText: windowStatusText(value('torqueStatus')),
    angleStatusText: windowStatusText(value('angleStatus')),
    counterStatusText: counterStatusText(value('counterStatus')),
    errorStatus: value('errorStatus') || '-',
    minTorque: scaleNumber(value('minTorque'), 100),
    maxTorque: scaleNumber(value('maxTorque'), 100),
    targetTorque: scaleNumber(value('targetTorque'), 100),
    torque: scaleNumber(value('torque'), 100),
    minAngle: cleanNumber(value('minAngle')),
    maxAngle: cleanNumber(value('maxAngle')),
    targetAngle: cleanNumber(value('targetAngle')),
    angle: cleanNumber(value('angle')),
    tighteningId: cleanNumber(value('tighteningId')) || extractResultId(data),
    timestamp: value('timestamp'),
    torqueUnit,
    rawSummary: compactResult(data),
  };
}

function parseTaggedFields(data, schema) {
  const result = {};
  let offset = 0;
  let count = 0;
  while (offset + 2 <= data.length) {
    const id = data.slice(offset, offset + 2);
    const field = schema[id];
    if (!field) break;
    offset += 2;
    result[field.name] = data.slice(offset, offset + field.length).trim();
    offset += field.length;
    count += 1;
  }
  return count >= 5 ? result : {};
}

function parseLooseResult(data) {
  const torqueMatch = data.match(/(?:^|\D)(\d{1,4}\.\d{1,3})Nm/);
  return {
    tighteningId: extractResultId(data),
    timestamp: data.match(/\d{4}-\d{2}-\d{2}:\d{2}:\d{2}:\d{2}/)?.[0] ?? '',
    tighteningStatus: data.includes('NOK') ? '0' : data.includes('OK') ? '1' : '',
    torqueStatus: data.includes('NOK') ? '0' : data.includes('OK') ? '1' : '',
    torque: torqueMatch?.[1] ?? '',
  };
}

const RESULT_FIELDS_REV_001 = {
  '01': { name: 'cellId', length: 4 },
  '02': { name: 'channelId', length: 2 },
  '03': { name: 'controllerName', length: 25 },
  '04': { name: 'idCode', length: 25 },
  '05': { name: 'jobNumber', length: 2 },
  '06': { name: 'psetNumber', length: 3 },
  '07': { name: 'okCounterLimit', length: 4 },
  '08': { name: 'okCounterValue', length: 4 },
  '09': { name: 'tighteningStatus', length: 1 },
  '10': { name: 'torqueStatus', length: 1 },
  '11': { name: 'angleStatus', length: 1 },
  '12': { name: 'minTorque', length: 6 },
  '13': { name: 'maxTorque', length: 6 },
  '14': { name: 'targetTorque', length: 6 },
  '15': { name: 'torque', length: 6 },
  '16': { name: 'minAngle', length: 5 },
  '17': { name: 'maxAngle', length: 5 },
  '18': { name: 'targetAngle', length: 5 },
  '19': { name: 'angle', length: 5 },
  '20': { name: 'timestamp', length: 19 },
  '21': { name: 'lastChange', length: 19 },
  '22': { name: 'counterStatus', length: 1 },
  '23': { name: 'tighteningId', length: 10 },
};

const RESULT_FIELDS_REV_002_PLUS = {
  '01': { name: 'cellId', length: 4 },
  '02': { name: 'channelId', length: 2 },
  '03': { name: 'controllerName', length: 25 },
  '04': { name: 'idCode', length: 25 },
  '05': { name: 'jobNumber', length: 4 },
  '06': { name: 'psetNumber', length: 3 },
  '07': { name: 'placeholder07', length: 2 },
  '08': { name: 'placeholder08', length: 5 },
  '09': { name: 'okCounterLimit', length: 4 },
  '10': { name: 'okCounterValue', length: 4 },
  '11': { name: 'tighteningStatus', length: 1 },
  '12': { name: 'counterStatus', length: 1 },
  '13': { name: 'torqueStatus', length: 1 },
  '14': { name: 'angleStatus', length: 1 },
  '15': { name: 'totalAngleStatus', length: 1 },
  '16': { name: 'powerStatus', length: 1 },
  '17': { name: 'tappingStatus', length: 1 },
  '18': { name: 'placeholder18', length: 1 },
  '19': { name: 'placeholder19', length: 1 },
  '20': { name: 'errorStatus', length: 10 },
  '21': { name: 'minTorque', length: 6 },
  '22': { name: 'maxTorque', length: 6 },
  '23': { name: 'targetTorque', length: 6 },
  '24': { name: 'torque', length: 6 },
  '25': { name: 'minAngle', length: 5 },
  '26': { name: 'maxAngle', length: 5 },
  '27': { name: 'targetAngle', length: 5 },
  '28': { name: 'angle', length: 5 },
  '29': { name: 'totalAngleMin', length: 5 },
  '30': { name: 'totalAngleMax', length: 5 },
  '31': { name: 'totalAngle', length: 5 },
  '32': { name: 'powerMin', length: 3 },
  '33': { name: 'powerMax', length: 3 },
  '34': { name: 'powerValue', length: 3 },
  '35': { name: 'selfTapMin', length: 6 },
  '36': { name: 'selfTapMax', length: 6 },
  '37': { name: 'selfTapTorque', length: 6 },
  '38': { name: 'frictionMin', length: 6 },
  '39': { name: 'frictionMax', length: 6 },
  '40': { name: 'frictionTorque', length: 6 },
  '41': { name: 'tighteningId', length: 10 },
  '42': { name: 'jobSequenceNumber', length: 5 },
  '43': { name: 'syncTighteningId', length: 5 },
  '44': { name: 'serialNumber', length: 14 },
  '45': { name: 'timestamp', length: 19 },
  '46': { name: 'lastChange', length: 19 },
  '47': { name: 'psetName', length: 25 },
  '48': { name: 'torqueUnit', length: 1 },
  '49': { name: 'resultType', length: 2 },
};

function tighteningStatusText(value) {
  if (value === '1') return 'OK';
  if (value === '0') return 'NOK';
  return value ? `Status ${value}` : '-';
}

function windowStatusText(value) {
  return ({ '0': 'Low', '1': 'OK', '2': 'High' })[value] ?? (value ? `Status ${value}` : '-');
}

function counterStatusText(value) {
  return ({ '0': 'Other', '1': 'CntOK = 1', '2': 'Not used' })[value] ?? '';
}

function torqueUnitText(value) {
  return ({ '1': 'Nm', '2': 'Ftlb', '3': 'Inlb', '4': 'Kpm', '5': 'Kgfm', '6': 'Kgm' })[value] ?? 'Nm';
}

function cleanNumber(value) {
  const text = String(value ?? '').trim();
  if (!text || !/^\d+$/.test(text)) return text;
  return String(Number(text));
}

function scaleNumber(value, divisor) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) return text;
  return (Number(text) / divisor).toFixed(2);
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
      <td>${formatShortTime(event.at)}</td>
      <td>${escapeHtml(shortEventType(event.type))}</td>
      <td>${payload.mid ?? ''}</td>
      <td>${escapeHtml(payload.description ?? payload.message ?? '')}</td>
      <td class="payload">${escapeHtml(formatPayload(payload))}</td>
    `;
    eventRows.append(row);
  }
}

function formatShortTime(value) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
}

function shortEventType(type) {
  return ({
    'frame.sent': 'TX',
    'frame.received': 'RX',
    'message.parsed': 'PAR',
    'subscription.upload': 'UP',
    'connection.state': 'CONN',
    'protocol.error': 'ERR',
    snapshot: 'SNAP',
  })[type] ?? type;
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
