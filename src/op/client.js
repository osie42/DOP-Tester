import net from 'node:net';
import { EventEmitter } from 'node:events';
import { MessageCodec } from './codec.js';
import { defaultRegistry } from './registry.js';

const ACK_BY_UPLOAD_MID = new Map([
  ['0015', '0016'],
  ['0035', '0036'],
  ['0052', '0053'],
  ['0061', '0062'],
  ['0071', '0072'],
  ['0074', '0075'],
  ['0076', '0077'],
  ['0211', '0212'],
  ['0262', '0263'],
  ['0401', '0402'],
  ['0501', '0502'],
]);

export class OpenProtocolClient extends EventEmitter {
  constructor({ registry = defaultRegistry } = {}) {
    super();
    this.registry = registry;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.keepAliveTimer = null;
    this.config = null;
    this.connected = false;
  }

  connect(config = {}) {
    const host = config.host ?? '127.0.0.1';
    const port = Number(config.port ?? 4545);
    const keepAliveMs = Number(config.keepAliveMs ?? 10000);
    this.config = { host, port, keepAliveMs };
    if (this.socket) this.disconnect();

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      this.socket = socket;

      socket.once('connect', () => {
        this.connected = true;
        this.emitState('connected');
        if (keepAliveMs > 0) {
          this.keepAliveTimer = setInterval(() => {
            this.send({ mid: '9999' }).catch((error) => this.emit('protocol.error', error));
          }, keepAliveMs);
          this.keepAliveTimer.unref?.();
        }
        resolve();
      });

      socket.on('data', (chunk) => this.handleData(chunk));
      socket.on('error', (error) => {
        this.emit('protocol.error', error);
        reject(error);
      });
      socket.on('close', () => {
        this.connected = false;
        this.clearKeepAlive();
        this.emitState('disconnected');
      });
    });
  }

  disconnect() {
    this.clearKeepAlive();
    if (this.socket) {
      this.socket.end();
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
    this.emitState('disconnected');
  }

  async send(message) {
    if (!this.socket || !this.connected) throw new Error('Open Protocol socket is not connected');
    const frame = MessageCodec.encode(message);
    const decoded = MessageCodec.decode(frame);
    this.socket.write(frame);
    this.emit('frame.sent', this.enrich(decoded));
    return decoded;
  }

  async sendCommand(mid, values = {}, options = {}) {
    return this.send(this.registry.build(mid, values, options));
  }

  subscribe(mid, values = {}, options = {}) {
    return this.sendCommand(mid, values, options);
  }

  handleData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let extracted;
    try {
      extracted = MessageCodec.extractFrames(this.buffer);
    } catch (error) {
      this.emit('protocol.error', error);
      this.buffer = Buffer.alloc(0);
      return;
    }
    this.buffer = extracted.remaining;
    for (const frame of extracted.frames) {
      const enriched = this.enrich(frame);
      this.emit('frame.received', enriched);
      this.emit('message.parsed', enriched);
      if (ACK_BY_UPLOAD_MID.has(frame.mid) && !frame.noAck) {
        this.send({ mid: ACK_BY_UPLOAD_MID.get(frame.mid) }).catch((error) => this.emit('protocol.error', error));
      }
      if (isSubscriptionUpload(frame.mid)) {
        this.emit('subscription.upload', enriched);
      }
    }
  }

  enrich(frame) {
    const parsed = this.registry.parse(frame);
    return {
      ...frame,
      description: parsed.schema?.description ?? 'Unknown MID',
      values: parsed.values,
    };
  }

  emitState(state) {
    this.emit('connection.state', { state, config: this.config, at: new Date().toISOString() });
  }

  clearKeepAlive() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
  }
}

function isSubscriptionUpload(mid) {
  return ['0015', '0035', '0052', '0061', '0071', '0211', '0262', '0401', '0501', '0803', '0808', '0900'].includes(mid);
}
