/**
 * Decree 30/2020/ND-CP administrative document rules & validation helpers
 * Specially calibrated for Trung tâm Mã số, mã vạch Quốc gia (MSMV)
 */

export interface BudgetItem {
  id: string;
  stt: number | string;
  content: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note?: string;
}

export interface BudgetEstimateData {
  taskName: string;
  totalAmount: number;
  totalAmountWords: string;
  fundingSource: string;
  implementationTime: string;
  implementingUnit?: string;
  items: BudgetItem[];
  customArticle2?: string;
  customArticle3?: string;
}

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
  budgetEstimate?: BudgetEstimateData;
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

  const isPhieuTrinh =
    doc.docType?.toLowerCase().includes('phiếu trình') ||
    doc.docType?.toLowerCase().includes('phieutrinh') ||
    doc.docType === 'phieutrinh';

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

export const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: 'b-1',
    stt: 1,
    content: 'Chi phí thù lao chuyên gia tư vấn xây dựng hệ thống định danh',
    unit: 'Người/tháng',
    quantity: 2,
    unitPrice: 15000000,
    amount: 30000000,
  },
  {
    id: 'b-2',
    stt: 2,
    content: 'Tổ chức hội thảo kỹ thuật tiêu chuẩn mã số mã vạch và truy xuất',
    unit: 'Cuộc',
    quantity: 1,
    unitPrice: 25000000,
    amount: 25000000,
  },
  {
    id: 'b-3',
    stt: 3,
    content: 'Thuê hạ tầng máy chủ điện toán đám mây và lưu trữ dữ liệu thử nghiệm',
    unit: 'Tháng',
    quantity: 3,
    unitPrice: 10000000,
    amount: 30000000,
  },
  {
    id: 'b-4',
    stt: 4,
    content: 'In ấn tài liệu hướng dẫn kỹ thuật và biểu mẫu kiểm tra định danh',
    unit: 'Bộ',
    quantity: 200,
    unitPrice: 50000,
    amount: 10000000,
  },
  {
    id: 'b-5',
    stt: 5,
    content: 'Công tác phí khảo sát, hỗ trợ kỹ thuật tại các doanh nghiệp địa phương',
    unit: 'Đợt',
    quantity: 2,
    unitPrice: 12500000,
    amount: 25000000,
  },
];

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng chẵn';
  if (!num || isNaN(num)) return '';

  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readTriple(n: number, showZeroHundred: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let res = '';

    if (h > 0 || showZeroHundred) {
      res += units[h] + ' trăm ';
    }

    if (t > 1) {
      res += units[t] + ' mươi ';
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += units[u] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += units[u] + ' ';
    } else if (t === 0 && (h > 0 || showZeroHundred) && u > 0) {
      res += 'linh ' + units[u] + ' ';
    } else if (t === 0 && u > 0) {
      res += units[u] + ' ';
    }

    return res.trim();
  }

  const tiers = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let absNum = Math.abs(Math.round(num));
  let tierIdx = 0;
  const parts: string[] = [];

  while (absNum > 0) {
    const triple = absNum % 1000;
    if (triple > 0) {
      const showHundred = absNum >= 1000;
      const str = readTriple(triple, showHundred);
      const tierName = tiers[tierIdx] ? ' ' + tiers[tierIdx] : '';
      parts.unshift(str + tierName);
    }
    absNum = Math.floor(absNum / 1000);
    tierIdx++;
  }

  let finalStr = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (finalStr.length > 0) {
    finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
    finalStr += ' đồng chẵn.';
  }
  return finalStr;
}

export const DEFAULT_ARTICLE_2 = `1. Phòng Kế hoạch Tài chính chịu trách nhiệm quản lý, sử dụng kinh phí được phê duyệt đúng mục đích, tiết kiệm, hiệu quả và thanh quyết toán theo khối lượng thực tế, định mức chi tiêu hiện hành của Nhà nước và Quy chế chi tiêu nội bộ của Trung tâm.
2. Các đơn vị liên quan có trách nhiệm phối hợp triển khai thực hiện nhiệm vụ bảo đảm chất lượng và tiến độ quy định.`;

export const DEFAULT_ARTICLE_3 = `Quyết định này có hiệu lực kể từ ngày ký. Trưởng phòng Phòng Tổ chức - Hành chính, Trưởng phòng Phòng Kế hoạch Tài chính, Thủ trưởng các phòng, đơn vị trực thuộc Trung tâm và các cá nhân có liên quan chịu trách nhiệm thi hành Quyết định này./.`;

export function buildDefaultQuyetDinhDuToanContent(data: BudgetEstimateData): string {
  const task = data.taskName || 'nhiệm vụ chuyên môn năm 2026';
  const unit = data.implementingUnit || 'Phòng Kế hoạch Tài chính chủ trì, phối hợp với các đơn vị liên quan';
  const total = data.totalAmount ?? (data.items?.reduce((s, it) => s + (Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0) || 0);
  const amtFormatted = new Intl.NumberFormat('vi-VN').format(total);
  const words = data.totalAmountWords || numberToVietnameseWords(total);
  const src = data.fundingSource || 'Nguồn thu hoạt động sự nghiệp của Trung tâm';
  const time = data.implementationTime || 'Quý IV năm 2026';
  const art2 = data.customArticle2 || DEFAULT_ARTICLE_2;
  const art3 = data.customArticle3 || DEFAULT_ARTICLE_3;

  return `Điều 1. Phê duyệt kèm theo Quyết định này dự toán chi tiết thực hiện nhiệm vụ: "${task}" với các nội dung chủ yếu sau:
1. Tên nhiệm vụ: ${task}.
2. Đơn vị thực hiện: ${unit}.
3. Tổng kinh phí phê duyệt: ${amtFormatted} đồng (Bằng chữ: ${words}).
(Chi tiết theo Phụ lục kèm theo Quyết định này).
4. Nguồn kinh phí: ${src}.
5. Thời gian thực hiện: ${time}.

Điều 2. Trách nhiệm tổ chức thực hiện
${art2}

Điều 3. Điều khoản thi hành
${art3}`;
}
