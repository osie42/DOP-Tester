import { MessageCodec } from './codec.js';

const COMMON_MESSAGES = [
  ['0001', 'Communication start', 'client', []],
  ['0002', 'Acknowledgement of communication start', 'controller', [
    { name: 'cellIdLabel', type: 'ascii', length: 2, default: '01' },
    { name: 'cellId', type: 'number', length: 4 },
    { name: 'channelIdLabel', type: 'ascii', length: 2, default: '02' },
    { name: 'channelId', type: 'number', length: 2 },
    { name: 'controllerNameLabel', type: 'ascii', length: 2, default: '03' },
    { name: 'controllerName', type: 'ascii', length: 25 },
  ]],
  ['0003', 'Communication stop', 'client', []],
  ['0004', 'Command error', 'controller', [
    { name: 'failedMid', type: 'number', length: 4 },
    { name: 'errorNumber', type: 'number', length: 2 },
  ]],
  ['0005', 'Command accepted', 'controller', [{ name: 'acceptedMid', type: 'number', length: 4 }]],
  ['0008', 'Subscription to application data messages', 'client', [{ name: 'applicationData', type: 'ascii', length: 9 }]],
  ['0009', 'Cancel subscription to application data messages', 'client', [{ name: 'applicationData', type: 'ascii', length: 9 }]],
  ['0010', 'Tightening program numbers upload request', 'client', []],
  ['0011', 'Tightening program numbers upload response', 'controller', [{ name: 'rawPrograms', type: 'ascii', length: 0 }]],
  ['0012', 'Tightening program data upload request', 'client', [{ name: 'programNumber', type: 'number', length: 3 }]],
  ['0013', 'Tightening program data upload response', 'controller', [{ name: 'rawProgramData', type: 'ascii', length: 0 }]],
  ['0014', 'Tightening program selected subscription', 'client', []],
  ['0015', 'Tightening program selected', 'controller', [{ name: 'rawSelection', type: 'ascii', length: 22 }]],
  ['0016', 'Tightening program selected acknowledgement', 'client', []],
  ['0017', 'Cancel tightening program selected subscription', 'client', []],
  ['0018', 'Select tightening program', 'client', [{ name: 'programNumber', type: 'number', length: 3 }]],
  ['0019', 'Apply OK/NOK counter presetting', 'client', [
    { name: 'programNumber', type: 'number', length: 3 },
    { name: 'okCounter', type: 'number', length: 2 },
    { name: 'nokCounter', type: 'number', length: 2 },
  ]],
  ['0020', 'Deactivate selected OK/NOK counter', 'client', [{ name: 'programNumber', type: 'number', length: 3 }]],
  ['0021', 'Deactivate all OK/NOK counters', 'client', []],
  ['0030', 'OK counter / job number upload request', 'client', []],
  ['0031', 'OK counter / job number upload response', 'controller', [{ name: 'rawCountersOrJobs', type: 'ascii', length: 0 }]],
  ['0032', 'Job data upload request', 'client', [{ name: 'jobNumber', type: 'number', length: 2 }]],
  ['0033', 'Job data upload response', 'controller', [{ name: 'rawJobData', type: 'ascii', length: 0 }]],
  ['0034', 'Job info subscription', 'client', []],
  ['0035', 'Upload job info', 'controller', [{ name: 'rawJobInfo', type: 'ascii', length: 0 }]],
  ['0036', 'Acknowledgement of job info upload', 'client', []],
  ['0037', 'Cancel job info subscription', 'client', []],
  ['0038', 'Select job number', 'client', [{ name: 'jobNumber', type: 'number', length: 2 }]],
  ['0040', 'Tool data upload request', 'client', []],
  ['0041', 'Tool data upload', 'controller', [{ name: 'rawToolData', type: 'ascii', length: 0 }]],
  ['0042', 'Deactivate tool', 'client', []],
  ['0043', 'Activate tool', 'client', []],
  ['0045', 'Define calibration value request', 'client', [{ name: 'calibrationValue', type: 'ascii', length: 11 }]],
  ['0050', 'ID code download request', 'client', [{ name: 'idCode', type: 'ascii', length: 25 }]],
  ['0051', 'ID code upload subscription', 'client', []],
  ['0052', 'Upload ID code', 'controller', [{ name: 'idCode', type: 'ascii', length: 25 }]],
  ['0053', 'Upload ID code acknowledgement', 'client', []],
  ['0054', 'Cancel upload ID code subscription', 'client', []],
  ['0060', 'Last tightening results data subscription', 'client', []],
  ['0061', 'Upload last tightening results data response', 'controller', [{ name: 'rawResultData', type: 'ascii', length: 0 }]],
  ['0062', 'Last tightening results data acknowledgement', 'client', []],
  ['0063', 'Cancel last tightening results data', 'client', []],
  ['0064', 'Archived tightening results upload request', 'client', [{ name: 'tighteningId', type: 'number', length: 10 }]],
  ['0065', 'Archived tightening results response', 'controller', [{ name: 'rawArchivedResult', type: 'ascii', length: 0 }]],
  ['0070', 'Resulting system errors subscription', 'client', []],
  ['0071', 'Upload resulting system errors', 'controller', [{ name: 'rawSystemError', type: 'ascii', length: 33 }]],
  ['0072', 'Upload system errors acknowledgement', 'client', []],
  ['0073', 'Cancel system errors subscription', 'client', []],
  ['0074', 'System error in tightening controller acknowledged', 'controller', [{ name: 'errorNumber', type: 'number', length: 4 }]],
  ['0075', 'Acknowledgement of system error acknowledged', 'client', []],
  ['0076', 'System error status', 'controller', [{ name: 'rawErrorStatus', type: 'ascii', length: 36 }]],
  ['0077', 'System error status acknowledgement', 'client', []],
  ['0078', 'Acknowledge system error in tightening controller', 'client', []],
  ['0080', 'Time on tightening controller request', 'client', []],
  ['0081', 'Upload time', 'controller', [{ name: 'dateTime', type: 'ascii', length: 19 }]],
  ['0082', 'Set time in tightening controller', 'client', [{ name: 'dateTime', type: 'ascii', length: 19 }]],
  ['0111', 'Message on graphical display', 'client', [{ name: 'displayMessage', type: 'ascii', length: 117 }]],
  ['0127', 'Job abort', 'client', []],
  ['0150', 'ID code download request extended', 'client', [{ name: 'idCode', type: 'ascii', length: 100 }]],
  ['0210', 'Subscription output signal change', 'client', []],
  ['0211', 'Upload output signal change', 'controller', [{ name: 'rawOutputSignals', type: 'ascii', length: 0 }]],
  ['0212', 'Acknowledgement upload output signal change', 'client', []],
  ['0213', 'Cancel output signal change', 'client', []],
  ['0260', 'Tag ID request', 'client', []],
  ['0261', 'Tag ID subscription', 'client', []],
  ['0262', 'Upload of tag ID', 'controller', [{ name: 'rawTagId', type: 'ascii', length: 0 }]],
  ['0263', 'Acknowledgement of tag ID', 'client', []],
  ['0264', 'Cancel tag ID subscription', 'client', []],
  ['0400', 'Automatic/manual mode subscription', 'client', []],
  ['0401', 'Automatic/manual mode upload', 'controller', [{ name: 'operatingMode', type: 'number', length: 1 }]],
  ['0402', 'Automatic/manual mode upload acknowledgement', 'client', []],
  ['0403', 'Automatic/manual mode logout', 'client', []],
  ['0404', 'Automatic/manual mode selection', 'client', [{ name: 'operatingMode', type: 'number', length: 1 }]],
  ['0410', 'AutoDisable setting request', 'client', []],
  ['0411', 'AutoDisable setting response', 'controller', [{ name: 'rawAutoDisable', type: 'ascii', length: 4 }]],
  ['0500', 'PLC output signal change subscription', 'client', []],
  ['0501', 'PLC output signal change upload', 'controller', [{ name: 'rawPlcOutputSignals', type: 'ascii', length: 0 }]],
  ['0502', 'Acknowledgement PLC output signal change', 'client', []],
  ['0503', 'Cancel PLC output signal change', 'client', []],
  ['0504', 'Change value of input signals', 'client', [{ name: 'rawInputSignals', type: 'ascii', length: 16 }]],
  ['0570', 'Activate job', 'client', [{ name: 'jobNumber', type: 'number', length: 3 }]],
  ['0571', 'Start job sequence', 'client', [{ name: 'jobNumber', type: 'number', length: 3 }]],
  ['0573', 'Select job number', 'client', [{ name: 'jobNumber', type: 'number', length: 3 }]],
  ['0800', 'Battery level request', 'client', []],
  ['0801', 'Battery level response', 'controller', [{ name: 'rawBatteryLevel', type: 'ascii', length: 8 }]],
  ['0802', 'Battery level changes subscription', 'client', [{ name: 'threshold', type: 'number', length: 2 }]],
  ['0803', 'Battery level changes upload', 'controller', [{ name: 'rawBatteryLevel', type: 'ascii', length: 8 }]],
  ['0804', 'Cancel battery level changes subscription', 'client', []],
  ['0805', 'Reception quality request', 'client', []],
  ['0806', 'Reception quality response', 'controller', [{ name: 'rawReceptionQuality', type: 'ascii', length: 6 }]],
  ['0807', 'Reception quality change subscription', 'client', [{ name: 'threshold', type: 'number', length: 2 }]],
  ['0808', 'Reception quality change upload', 'controller', [{ name: 'rawReceptionQuality', type: 'ascii', length: 6 }]],
  ['0809', 'Cancel reception quality changes subscription', 'client', []],
  ['0900', 'Graph values message', 'controller', [{ name: 'rawGraphValues', type: 'ascii', length: 0 }]],
  ['2505', 'Changing and selecting tightening programs', 'client', [{ name: 'rawProgramChange', type: 'ascii', length: 0 }]],
  ['9999', 'Keep alive message', 'client', []],
];

export class MessageRegistry {
  constructor(messages = COMMON_MESSAGES) {
    this.messages = new Map();
    for (const [mid, description, sentBy, fields] of messages) {
      this.messages.set(mid, { mid, description, sentBy, revisions: { '001': { fields } }, fields });
    }
  }

  get(mid, revision = '001') {
    const key = String(mid).padStart(4, '0');
    const message = this.messages.get(key);
    if (!message) return null;
    return { ...message, revision, fields: message.revisions[revision]?.fields ?? message.fields };
  }

  list() {
    return [...this.messages.values()].map(({ mid, description, sentBy, fields }) => ({
      mid,
      description,
      sentBy,
      fields,
    }));
  }

  build(mid, values = {}, options = {}) {
    const schema = this.get(mid, options.revision ?? '001');
    const data = schema ? MessageCodec.encodeFields(schema.fields.filter((field) => field.length > 0), values) : values.rawData ?? '';
    return {
      mid: String(mid).padStart(4, '0'),
      revision: options.revision ?? '001',
      noAck: Boolean(options.noAck),
      data,
    };
  }

  parse(message) {
    const schema = this.get(message.mid, message.revision);
    if (!schema) return { schema: null, values: { rawData: message.data } };
    const fixedFields = schema.fields.filter((field) => field.length > 0);
    if (!fixedFields.length) return { schema, values: message.data ? { rawData: message.data } : {} };
    return { schema, values: MessageCodec.decodeFields(fixedFields, message.data) };
  }
}

export const defaultRegistry = new MessageRegistry();
