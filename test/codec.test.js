import test from 'node:test';
import assert from 'node:assert/strict';
import { MessageCodec, defaultRegistry } from '../src/op/index.js';

test('encodes 20 byte header and excludes NUL from length', () => {
  const frame = MessageCodec.encode({ mid: '0001', revision: '001', data: '' });
  assert.equal(frame.length, 21);
  assert.equal(frame.toString('ascii', 0, 4), '0020');
  assert.equal(frame[20], 0);
});

test('encodes and decodes ASCII data', () => {
  const frame = MessageCodec.encode({ mid: '0018', revision: '001', data: '005' });
  const message = MessageCodec.decode(frame);
  assert.equal(message.length, 23);
  assert.equal(message.mid, '0018');
  assert.equal(message.revision, '001');
  assert.equal(message.data, '005');
});

test('numeric fields left pad and ASCII fields right pad', () => {
  const data = MessageCodec.encodeFields([
    { name: 'programNumber', type: 'number', length: 3 },
    { name: 'idCode', type: 'ascii', length: 8 },
  ], { programNumber: 7, idCode: 'A1' });
  assert.equal(data, '007A1      ');
  assert.deepEqual(MessageCodec.decodeFields([
    { name: 'programNumber', type: 'number', length: 3 },
    { name: 'idCode', type: 'ascii', length: 8 },
  ], data), { programNumber: 7, idCode: 'A1' });
});

test('extracts multiple TCP frames from a single buffer', () => {
  const one = MessageCodec.encode({ mid: '0005', data: '0001' });
  const two = MessageCodec.encode({ mid: '9999' });
  const { frames, remaining } = MessageCodec.extractFrames(Buffer.concat([one, two]));
  assert.equal(frames.length, 2);
  assert.equal(frames[0].mid, '0005');
  assert.equal(frames[1].mid, '9999');
  assert.equal(remaining.length, 0);
});

test('registry covers key MIDs with structured builders', () => {
  const start = defaultRegistry.build('0001');
  const accepted = defaultRegistry.build('0005', { acceptedMid: 1 });
  const program = defaultRegistry.build('0018', { programNumber: 5 });
  const keepAlive = defaultRegistry.build('9999');
  assert.equal(MessageCodec.decode(MessageCodec.encode(start)).mid, '0001');
  assert.equal(accepted.data, '0001');
  assert.equal(program.data, '005');
  assert.equal(keepAlive.data, '');
});

test('all registered MIDs can encode an empty or default payload', () => {
  for (const schema of defaultRegistry.list()) {
    const message = defaultRegistry.build(schema.mid);
    const decoded = MessageCodec.decode(MessageCodec.encode(message));
    assert.equal(decoded.mid, schema.mid);
  }
});
