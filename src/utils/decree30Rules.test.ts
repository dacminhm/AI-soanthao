import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultDocumentState,
  formatSubject,
  getFullDocCode,
  validateDecree30Compliance,
  filterDocumentsList,
} from './decree30Rules.ts';

test('getDefaultDocumentState returns complete Decree 30 template for MSMV', () => {
  const doc = getDefaultDocumentState();
  assert.equal(doc.issuingAgency, 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA');
  assert.equal(doc.docSymbol, '/MSMV-KHTC');
  assert.equal(doc.signerRole, 'GIÁM ĐỐC');
  assert.equal(doc.signerName, 'Bùi Bá Chính');
  assert.ok(doc.distributionList.length >= 3);
  assert.ok(doc.opening.includes('Phúc đáp công văn số'));
});

test('formatSubject strips prefix V/v and normalizes whitespace', () => {
  assert.equal(
    formatSubject('V/v báo cáo tiến độ đề án'),
    'báo cáo tiến độ đề án'
  );
  assert.equal(
    formatSubject('  v/v:   triển khai tiêu chuẩn GS1  '),
    'triển khai tiêu chuẩn GS1'
  );
  assert.equal(
    formatSubject('kế hoạch công tác năm 2026'),
    'kế hoạch công tác năm 2026'
  );
});

test('getFullDocCode generates standard official code', () => {
  assert.equal(getFullDocCode('125', '/MSMV-KHTC'), 'Số: 125/MSMV-KHTC');
  assert.equal(getFullDocCode('42', 'MSMV-KHTC'), 'Số: 42/MSMV-KHTC');
  assert.equal(getFullDocCode('', '/MSMV-KHTC'), 'Số: .../MSMV-KHTC');
});

test('validateDecree30Compliance flags missing mandatory components', () => {
  const validDoc = getDefaultDocumentState();
  const validCheck = validateDecree30Compliance(validDoc);
  assert.equal(validCheck.filter((v) => v.severity === 'error').length, 0);

  const invalidDoc = {
    ...validDoc,
    issuingAgency: '',
    recipient: '',
    signerName: '',
  };
  const errors = validateDecree30Compliance(invalidDoc);
  assert.ok(errors.some((e) => e.field === 'issuingAgency'));
  assert.ok(errors.some((e) => e.field === 'recipient'));
  assert.ok(errors.some((e) => e.field === 'signerName'));
});

test('filterDocumentsList correctly filters by query and category', () => {
  const docs = [
    { title: 'V/v báo cáo tiến độ mã số mã vạch', docNumber: '125/MSMV-KHTC', category: 'congvan' },
    { title: 'Tờ trình phê duyệt đề án nông sản', docNumber: '08/TTr-MSMV', category: 'totrinh' },
    { title: 'Thông báo tập huấn GS1', docNumber: '42/TB-MSMV', category: 'thongbao' },
  ];

  const filteredCat = filterDocumentsList(docs, '', 'totrinh');
  assert.equal(filteredCat.length, 1);
  assert.equal(filteredCat[0].docNumber, '08/TTr-MSMV');

  const filteredQuery = filterDocumentsList(docs, 'GS1', 'all');
  assert.equal(filteredQuery.length, 1);
  assert.equal(filteredQuery[0].docNumber, '42/TB-MSMV');
});
