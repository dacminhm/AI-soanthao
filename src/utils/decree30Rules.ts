/**
 * Decree 30/2020/ND-CP administrative document rules & validation helpers
 * Specially calibrated for Trung tâm Mã số, mã vạch Quốc gia (MSMV)
 */

export interface DocumentState {
  parentAgency: string;
  issuingAgency: string;
  docNumber: string;
  docSymbol: string;
  docType: string;
  subject: string;
  recipient: string;
  placeDate: string;
  opening: string;
  content: string;
  closing: string;
  distributionList: string[];
  signerRole: string;
  signerName: string;
  legalBases: string[];
  staffSignerName?: string;
  departmentHeadName?: string;
  attachedDocuments?: string[];
}

export interface RuleViolation {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

/**
 * Standard default document state for Trung tâm Mã số, mã vạch Quốc gia
 */
export function getDefaultDocumentState(): DocumentState {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();

  return {
    parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
    issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
    docNumber: '125',
    docSymbol: '/MSMV-KHTC',
    docType: 'CÔNG VĂN HÀNH CHÍNH',
    subject: 'báo cáo về tình hình triển khai đề án mã số mã vạch và truy xuất nguồn gốc năm 2026',
    recipient: 'Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia',
    placeDate: `Hà Nội, ngày ${day} tháng ${month} năm ${year}`,
    opening: 'Phúc đáp công văn số 384/TĐC-KHTC ngày 15/10/2026 của Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia về việc báo cáo tiến độ các đề án trọng điểm, Trung tâm Mã số, mã vạch Quốc gia có một số ý kiến như sau:',
    content: `1. Về tình hình triển khai hạ tầng kỹ thuật và cổng thông tin truy xuất: Trung tâm đã hoàn thành việc nâng cấp máy chủ cơ sở dữ liệu quốc gia về mã số mã vạch, kết nối chia sẻ dữ liệu thử nghiệm với hơn 350 doanh nghiệp sản xuất và xuất nhập khẩu trên toàn quốc.

2. Về công tác xây dựng tiêu chuẩn và quy chuẩn kỹ thuật: Đang khẩn trương phối hợp cùng các đơn vị chuyên môn hoàn thiện dự thảo tiêu chuẩn định danh số cho nhóm sản phẩm nông sản chủ lực, bảo đảm tính liên thông với tiêu chuẩn GS1 toàn cầu.`,
    closing: 'Trung tâm Mã số, mã vạch Quốc gia xin kính gửi Quý Ủy ban để tổng hợp và xử lý các công việc tiếp theo.',
    distributionList: [
      '- Như trên;',
      '- Chủ tịch Nguyễn Nam Hải (để b/c);',
      '- Lưu: VT, KHTC.',
    ],
    signerRole: 'GIÁM ĐỐC',
    signerName: 'Bùi Bá Chính',
    legalBases: [
      'Luật Tiêu chuẩn và Quy chuẩn kỹ thuật',
      'Nghị định 30/2020/NĐ-CP',
      'Quyết định số 100/QĐ-TTg',
      'Quyết định số 128/QĐ-TĐC',
    ],
    staffSignerName: '',
    departmentHeadName: 'Nguyễn Đắc Minh',
    attachedDocuments: [
      'Dự thảo Công văn',
      'Công văn đến số ....',
      'Quyết định số ......',
      'Tài liệu khác',
    ],
  };
}

/**
 * Standardize subject line (Trích yếu)
 */
export function formatSubject(subject: string): string {
  let cleaned = subject.trim();
  if (cleaned.toLowerCase().startsWith('v/v')) {
    cleaned = cleaned.replace(/^v\/v\s*:?\s*/i, '').trim();
  }
  return cleaned;
}

/**
 * Format full official code
 */
export function getFullDocCode(num: string, symbol: string): string {
  const cleanNum = num.trim() || '...';
  let cleanSym = symbol.trim();
  if (!cleanSym.startsWith('/')) {
    cleanSym = `/${cleanSym}`;
  }
  return `Số: ${cleanNum}${cleanSym}`;
}

/**
 * Validate document compliance with Decree 30/2020/ND-CP
 */
export function validateDecree30Compliance(doc: DocumentState): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // 1. Issuing agency check
  if (!doc.issuingAgency || doc.issuingAgency.trim().length === 0) {
    violations.push({
      field: 'issuingAgency',
      severity: 'error',
      message: 'Thiếu tên cơ quan ban hành văn bản (Bắt buộc theo Nghị định 30).',
    });
  }

  // 2. Official code check
  if (!doc.docSymbol || !doc.docSymbol.includes('/')) {
    violations.push({
      field: 'docSymbol',
      severity: 'warning',
      message: 'Ký hiệu văn bản phải có dấu gạch chéo phân cách chữ viết tắt tên cơ quan (vd: /MSMV-KHTC).',
      suggestion: '/MSMV-KHTC',
    });
  }

  // 3. Subject check
  if (!doc.subject || doc.subject.trim().length < 5) {
    violations.push({
      field: 'subject',
      severity: 'error',
      message: 'Trích yếu nội dung công văn quá ngắn hoặc chưa được điền.',
    });
  }

  // 4. Recipient check
  if (!doc.recipient || doc.recipient.trim().length === 0) {
    violations.push({
      field: 'recipient',
      severity: 'error',
      message: 'Thiếu nơi nhận chính (Kính gửi: ...) của công văn hành chính.',
    });
  }

  // 5. Signer role check
  if (!isPhieuTrinh && (!doc.signerRole || doc.signerRole.trim().length === 0)) {
    violations.push({
      field: 'signerRole',
      severity: 'error',
      message: 'Thiếu thẩm quyền ký của người có trách nhiệm (vd: GIÁM ĐỐC).',
    });
  }

  // 6. Signer name check
  if (!isPhieuTrinh && (!doc.signerName || doc.signerName.trim().length === 0)) {
    violations.push({
      field: 'signerName',
      severity: 'error',
      message: 'Thiếu họ và tên người ký văn bản.',
    });
  }

  // 7. Check distribution list (Nơi nhận)
  if (!isPhieuTrinh && (!doc.distributionList || doc.distributionList.length === 0)) {
    violations.push({
      field: 'distributionList',
      severity: 'warning',
      message: 'Nơi nhận lưu trữ (Lưu: VT, ...) chưa được cấu hình.',
    });
  }

  return violations;
}

/**
 * Filter documents by keyword or tab category
 */
export function filterDocumentsList<T extends { title: string; docNumber: string; category: string }>(
  docs: T[],
  query: string,
  category: string
): T[] {
  return docs.filter((item) => {
    const matchesCat =
      category === 'all' ||
      item.category.toLowerCase().includes(category.toLowerCase());
    if (!matchesCat) return false;

    if (!query || query.trim() === '') return true;
    const q = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.docNumber.toLowerCase().includes(q)
    );
  });
}

export const DEFAULT_PHIEU_TRINH_ATTACHMENTS: string[] = [
  'Dự thảo Công văn',
  'Công văn đến số ....',
  'Quyết định số ......',
  'Tài liệu khác',
];

/**
 * Standardize attached documents list with Decree 30 punctuation:
 * - Automatically prepends '- '
 * - Adds ';' at the end of middle items
 * - Adds '.' at the end of the last item
 * - Preserves ellipsis (e.g. '....' or '......')
 */
export function formatAttachedDocuments(items?: string[] | string): string[] {
  let list: string[] = [];
  if (Array.isArray(items)) {
    list = items.map((s) => s.trim()).filter((s) => s.length > 0);
  } else if (typeof items === 'string') {
    list = items.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  if (list.length === 0) {
    list = [...DEFAULT_PHIEU_TRINH_ATTACHMENTS];
  }

  return list.map((item, index) => {
    let clean = item
      .replace(/^[-*•–—]\s*/, '')
      .replace(/^\d+[\.)]\s*/, '')
      .trim();

    // If item ends with a single period and NOT an ellipsis (...), strip that trailing period
    if (!/\.{2,}$/.test(clean)) {
      clean = clean.replace(/\.$/, '').trim();
    }
    // Strip trailing semicolon or comma
    clean = clean.replace(/[;,]\s*$/, '').trim();

    const isLast = index === list.length - 1;
    let punct = ';';
    if (isLast) {
      punct = clean.endsWith('.') ? '' : '.';
    }
    return `- ${clean}${punct}`;
  });
}
