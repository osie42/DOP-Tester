const HEADER_LENGTH = 20;
const TERMINATOR = 0x00;

export class ProtocolError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ProtocolError';
    this.details = details;
  }
}

export const MessageCodec = {
  HEADER_LENGTH,

  encode({ mid, revision = '001', noAck = false, data = '', reserve = '00000000' }) {
    const normalizedMid = padNumber(mid, 4, 'MID');
    const normalizedRevision = padNumber(revision, 3, 'revision');
    const normalizedReserve = String(reserve ?? '').padEnd(8, '0').slice(0, 8);
    const dataText = normalizeData(data);
    const length = HEADER_LENGTH + Buffer.byteLength(dataText, 'ascii');
    if (length > 9999) {
      throw new ProtocolError('Open Protocol message is longer than 9999 bytes', { length });
    }
    const header = [
      padNumber(length, 4, 'length'),
      normalizedMid,
      normalizedRevision,
      noAck ? '1' : '0',
      normalizedReserve,
    ].join('');
    return Buffer.concat([Buffer.from(header + dataText, 'ascii'), Buffer.from([TERMINATOR])]);
  },

  decode(frame) {
    const buffer = Buffer.isBuffer(frame) ? frame : Buffer.from(frame);
    if (buffer.length < HEADER_LENGTH + 1) {
      throw new ProtocolError('Frame is shorter than Open Protocol header', { length: buffer.length });
    }
    const terminator = buffer[buffer.length - 1];
    if (terminator !== TERMINATOR) {
      throw new ProtocolError('Frame is missing NUL terminator', { terminator });
    }
    const length = parseFixedInt(buffer.toString('ascii', 0, 4), 'message length');
    if (length !== buffer.length - 1) {
      throw new ProtocolError('Frame length does not match header length', {
        expected: length,
        actual: buffer.length - 1,
      });
    }
    const mid = buffer.toString('ascii', 4, 8);
    const revision = buffer.toString('ascii', 8, 11);
    const noAck = buffer.toString('ascii', 11, 12) === '1';
    const reserve = buffer.toString('ascii', 12, 20);
    const data = buffer.toString('ascii', HEADER_LENGTH, length);
    return {
      length,
      mid,
      revision,
      noAck,
      reserve,
      data,
      rawAscii: buffer.toString('ascii', 0, buffer.length - 1),
      rawHex: buffer.toString('hex'),
    };
  },

  extractFrames(buffer) {
    const source = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer ?? []);
    const frames = [];
    let offset = 0;
    while (source.length - offset >= HEADER_LENGTH) {
      const lengthText = source.toString('ascii', offset, offset + 4);
      if (!/^\d{4}$/.test(lengthText)) {
        const nul = source.indexOf(TERMINATOR, offset);
        if (nul === -1) break;
        offset = nul + 1;
        continue;
      }
      const length = Number(lengthText);
      const frameLength = length + 1;
      if (source.length - offset < frameLength) break;
      const frame = source.subarray(offset, offset + frameLength);
      frames.push(this.decode(frame));
      offset += frameLength;
    }
    return { frames, remaining: source.subarray(offset) };
  },

  encodeFields(fields = [], values = {}) {
    return fields.map((field) => encodeField(field, values[field.name])).join('');
  },

  decodeFields(fields = [], data = '') {
    const result = {};
    let offset = 0;
    for (const field of fields) {
      const width = field.length;
      const raw = data.slice(offset, offset + width);
      result[field.name] = decodeField(field, raw);
      offset += width;
    }
    if (offset < data.length) {
      result.rawRemainder = data.slice(offset);
    }
    return result;
  },

  validate(message) {
    const frame = this.encode(message);
    return this.decode(frame);
  },
};

export function encodeField(field, value) {
  const width = field.length;
  if (field.type === 'number') {
    const fallback = field.default ?? 0;
    const text = String(value ?? fallback);
    if (!/^-?\d+$/.test(text)) throw new ProtocolError(`Field ${field.name} must be numeric`);
    return text.padStart(width, '0').slice(-width);
  }
  if (field.type === 'ascii') {
    return String(value ?? field.default ?? '').slice(0, width).padEnd(width, ' ');
  }
  return String(value ?? field.default ?? '').slice(0, width).padEnd(width, ' ');
}

export function decodeField(field, raw) {
  if (field.type === 'number') return raw.trim() === '' ? null : Number(raw);
  if (field.trim === false) return raw;
  return raw.trimEnd();
}

export function padNumber(value, width, label) {
  const text = String(value ?? '');
  if (!/^\d+$/.test(text)) throw new ProtocolError(`${label} must contain only digits`, { value });
  if (text.length > width) throw new ProtocolError(`${label} is wider than ${width} digits`, { value });
  return text.padStart(width, '0');
}

function parseFixedInt(value, label) {
  if (!/^\d+$/.test(value)) throw new ProtocolError(`${label} must contain only digits`, { value });
  return Number(value);
}

function normalizeData(data) {
  if (Buffer.isBuffer(data)) return data.toString('ascii');
  return String(data ?? '');
}
