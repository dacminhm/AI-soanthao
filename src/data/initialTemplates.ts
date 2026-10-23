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
  defaultContent?: string;
  attachedDocuments?: string[];
}

export interface StoredDraft {
  id: string;
  title: string;
  docNumber: string;
  docSymbol: string;
  category: 'congvan' | 'totrinh' | 'thongbao' | 'quyetdinh' | 'phieutrinh';
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
  staffSignerName?: string;
  departmentHeadName?: string;
  parentAgency?: string;
  issuingAgency?: string;
  placeDate?: string;
  webViewLink?: string;
  attachedDocuments?: string[];
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
    defaultContent: `1. Về tình hình triển khai hạ tầng kỹ thuật và cổng thông tin truy xuất: Trung tâm đã hoàn thành việc nâng cấp máy chủ cơ sở dữ liệu quốc gia về mã số mã vạch, kết nối chia sẻ dữ liệu thử nghiệm với hơn 350 doanh nghiệp sản xuất và xuất nhập khẩu trên toàn quốc.

2. Về công tác xây dựng tiêu chuẩn và quy chuẩn kỹ thuật: Đang khẩn trương phối hợp cùng các đơn vị chuyên môn hoàn thiện dự thảo tiêu chuẩn định danh số cho nhóm sản phẩm nông sản chủ lực, bảo đảm tính liên thông với tiêu chuẩn GS1 toàn cầu.`,
  },
  {
    id: 'phieu-trinh',
    name: 'PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC',
    code: '/PTr-MSMV',
    status: 'active',
    statusLabel: 'Mặc định • Chuẩn hóa',
    parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
    issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
    headerRatio: '40% / 60%',
    defaultOpening: 'Kính gửi: Lãnh đạo Trung tâm Mã số, mã vạch Quốc gia',
    legalBases: [
      'Quy chế làm việc của Trung tâm Mã số, mã vạch Quốc gia',
      'Nghị định 30/2020/NĐ-CP ngày 05/03/2020 của Chính phủ',
      'Quyết định số 128/QĐ-TĐC quy định chức năng, nhiệm vụ của Trung tâm'
    ],
    defaultClosing: 'Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.',
    distributionList: ['- Lãnh đạo Trung tâm (để b/c và chỉ đạo);', '- Lưu: VT, KHTC.'],
    defaultSignerRole: 'TRƯỞNG PHÒNG KẾ HOẠCH TÀI CHÍNH',
    attachedDocuments: [
      'Dự thảo Công văn',
      'Công văn đến số ....',
      'Quyết định số ......',
      'Tài liệu khác',
    ],
    defaultContent: `1. Tóm tắt nội dung công việc:
Thực hiện chỉ đạo của Lãnh đạo Trung tâm tại ...
- Về tiến độ thực hiện: ...
- Về các công việc đã thực hiện: ...
- Kết quả đạt được: ...

2. Ý kiến của các đơn vị liên quan:
Nội dung tóm tắt ý kiến phối hợp/thống nhất của các đơn vị chuyên môn liên quan.

3. Ý kiến của đơn vị trình:
a) Ý kiến đề xuất: [Nêu rõ phương án, giải pháp hoặc thẩm quyền xử lý]
b) Kiến nghị: [Nêu cụ thể các kiến nghị đối với Lãnh đạo Trung tâm]
Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.`,
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
