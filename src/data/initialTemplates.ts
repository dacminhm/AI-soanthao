export interface AdministrativeTemplate {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'draft';
  statusLabel: string;
  parentAgency: string;
  issuingAgency: string;
  headerRatio: string;
  defaultOpening: string;
  legalBases: string[];
  defaultClosing: string;
  distributionList: string[];
  defaultSignerRole: string;
}

export interface StoredDraft {
  id: string;
  title: string;
  docNumber: string;
  docSymbol: string;
  category: 'congvan' | 'totrinh' | 'thongbao' | 'quyetdinh';
  categoryLabel: string;
  updatedAt: string;
  author: string;
  driveStatus: 'synced' | 'local_only' | 'exported_word';
  drivePath: string;
  content: string;
  opening: string;
  closing: string;
  recipient: string;
  legalBases?: string[];
  distributionList?: string[];
  signerRole?: string;
  signerName?: string;
  parentAgency?: string;
  issuingAgency?: string;
  placeDate?: string;
  webViewLink?: string;
}

export const INITIAL_TEMPLATES: AdministrativeTemplate[] = [
  {
    id: 'cong-van',
    name: 'Công văn hành chính',
    code: '/MSMV-KHTC',
    status: 'active',
    statusLabel: 'Mặc định • Kích hoạt',
    parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
    issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
    headerRatio: '41% / 59%',
    defaultOpening: 'Phúc đáp công văn số ... ngày .../../2026 của ... về việc ..., Trung tâm Mã số, mã vạch Quốc gia có một số ý kiến như sau:',
    legalBases: [
      'Luật Tiêu chuẩn và Quy chuẩn kỹ thuật',
      'Nghị định 30/2020/NĐ-CP',
      'Quyết định số 100/QĐ-TTg',
      'Quyết định số 128/QĐ-TĐC'
    ],
    defaultClosing: 'Trung tâm Mã số, mã vạch Quốc gia xin kính gửi Quý ... để tổng hợp và xử lý các công việc tiếp theo.\nTrân trọng./.',
    distributionList: ['- Như trên;', '- Chủ tịch Nguyễn Nam Hải (để b/c);', '- Lưu: VT, KHTC.'],
    defaultSignerRole: 'GIÁM ĐỐC',
  },
  {
    id: 'to-trinh',
    name: 'Tờ trình',
    code: '/TTr-MSMV',
    status: 'draft',
    statusLabel: 'Draft • Đang soạn thảo',
    parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
    issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
    headerRatio: '40% / 60%',
    defaultOpening: 'Căn cứ yêu cầu thực tiễn và nhiệm vụ trọng tâm được giao, Trung tâm Mã số, mã vạch Quốc gia kính trình...',
    legalBases: [
      'Luật Tiêu chuẩn và Quy chuẩn kỹ thuật',
      'Nghị định 30/2020/NĐ-CP',
      'Quyết định số 128/QĐ-TĐC'
    ],
    defaultClosing: 'Kính trình Quý Cơ quan xem xét, phê duyệt để triển khai thực hiện./.',
    distributionList: ['- Như trên;', '- Lưu: VT, KHTC.'],
    defaultSignerRole: 'GIÁM ĐỐC',
  },
  {
    id: 'quyet-dinh',
    name: 'Quyết định cá biệt',
    code: '/QĐ-MSMV',
    status: 'draft',
    statusLabel: 'Draft • Đang soạn thảo',
    parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
    issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
    headerRatio: '40% / 60%',
    defaultOpening: 'GIÁM ĐỐC TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA\nCăn cứ Quyết định số 128/QĐ-TĐC...',
    legalBases: [
      'Quyết định số 128/QĐ-TĐC',
      'Luật Tiêu chuẩn và Quy chuẩn kỹ thuật',
      'Nghị định 30/2020/NĐ-CP'
    ],
    defaultClosing: 'Quyết định này có hiệu lực kể từ ngày ký. Các phòng, đơn vị trực thuộc chịu trách nhiệm thi hành Quyết định này./.',
    distributionList: ['- Ban Giám đốc;', '- Các phòng chuyên môn;', '- Lưu: VT, TCHC.'],
    defaultSignerRole: 'GIÁM ĐỐC',
  },
  {
    id: 'thong-bao',
    name: 'Thông báo nội bộ',
    code: '/TB-MSMV',
    status: 'draft',
    statusLabel: 'Draft • Đang soạn thảo',
    parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
    issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
    headerRatio: '40% / 60%',
    defaultOpening: 'Trung tâm Mã số, mã vạch Quốc gia xin thông báo đến toàn thể cán bộ, chuyên viên...',
    legalBases: [
      'Quy chế làm việc của Trung tâm Mã số, mã vạch Quốc gia',
      'Nghị định 30/2020/NĐ-CP'
    ],
    defaultClosing: 'Trung tâm thông báo để các phòng, đơn vị biết và khẩn trương phối hợp thực hiện./.',
    distributionList: ['- Như trên;', '- Lưu: VT.'],
    defaultSignerRole: 'GIÁM ĐỐC',
  },
];

// Kho dự thảo khởi tạo rỗng - dữ liệu thực tế do người dùng lưu từ màn hình soạn thảo
export const INITIAL_DRAFTS: StoredDraft[] = [];
