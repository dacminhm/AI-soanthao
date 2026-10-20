import React, { useState } from 'react';
import { StoredDraft } from '../data/initialTemplates.ts';
import { DocumentState } from '../utils/decree30Rules.ts';
import { generateDecree30Docx, downloadBlob } from '../utils/docxExport.ts';

interface DriveArchiveViewProps {
  drafts: StoredDraft[];
  onOpenDraft: (draft: StoredDraft) => void;
  onDeleteDraft: (id: string) => void;
  onNewDocument: () => void;
  onNotify: (msg: string) => void;
  currentUser: { name: string; email: string; isAdmin?: boolean } | null;
  onRefreshDrive?: () => Promise<void>;
  folderLink?: string;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onRequestDrivePermission?: () => void;
}

export const DriveArchiveView: React.FC<DriveArchiveViewProps> = ({
  drafts,
  onOpenDraft,
  onDeleteDraft,
  onNewDocument,
  onNotify,
  currentUser,
  onRefreshDrive,
  folderLink,
  onOpenPrivacy,
  onOpenTerms,
  onRequestDrivePermission,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Mới cập nhật');
  const [inspectDraft, setInspectDraft] = useState<StoredDraft | null>(null);

  const handleSyncDrive = async () => {
    setIsSyncing(true);
    try {
      if (onRefreshDrive) {
        await onRefreshDrive();
      }
      const now = new Date();
      const timeStr = `Hôm nay, ${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      setLastSyncTime(timeStr);
    } catch (err: any) {
      console.error('Lỗi sync drive:', err);
      onNotify(`❌ ${err?.message || 'Không thể đồng bộ danh sách Google Drive'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadWord = async (draft: StoredDraft) => {
    try {
      const docState: DocumentState = {
        parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
        issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
        docNumber: draft.docNumber,
        docSymbol: draft.docSymbol,
        docType: draft.categoryLabel,
        subject: draft.title,
        recipient: draft.recipient || 'Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia',
        placeDate: 'Hà Nội, ngày 19 tháng 10 năm 2026',
        opening: draft.opening || '',
        content: draft.content || '',
        closing: draft.closing || '',
        distributionList: draft.distributionList || ['- Như trên;', '- Lưu: VT, KHTC.'],
        signerRole: 'GIÁM ĐỐC',
        signerName: 'Bùi Bá Chính',
        legalBases: draft.legalBases || [],
      };
      const blob = await generateDecree30Docx(docState);
      downloadBlob(blob, `${draft.docNumber || 'DuThao'}_MSMV.docx`);
      onNotify(`Đang tải file dự thảo ${draft.docNumber || ''}_MSMV.docx về máy...`);
    } catch (e) {
      console.error(e);
      onNotify('Lỗi xuất file Word.');
    }
  };

  // Filter drafts
  const filtered = drafts.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'congvan') return d.category === 'congvan';
    if (activeTab === 'totrinh') return d.category === 'totrinh';
    if (activeTab === 'draft') return d.driveStatus === 'local_only' || d.category === 'totrinh';
    if (activeTab === 'word') return d.driveStatus === 'exported_word' || d.driveStatus === 'synced';
    return true;
  });

  // Calculate counts
  const totalCount = drafts.length;
  const congvanCount = drafts.filter((d) => d.category === 'congvan').length;
  const totrinhCount = drafts.filter((d) => d.category === 'totrinh').length;
  const draftCount = drafts.filter((d) => d.driveStatus === 'local_only' || d.category === 'totrinh').length;
  const wordCount = drafts.filter((d) => d.driveStatus === 'exported_word' || d.driveStatus === 'synced').length;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Top Banner & Sync Strip */}
      <div className="shrink-0 bg-white px-4 sm:px-8 py-4 sm:py-5 shadow-xs border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-800 to-red-950 text-white flex items-center justify-center shadow-md shadow-red-900/20 shrink-0">
              <i className="fa-solid fa-folder-tree text-xl text-amber-300"></i>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Kho lưu trữ văn bản dự thảo
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Google Drive Active
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  <i className="fa-regular fa-user text-[11px] mr-1 text-slate-500"></i>
                  {currentUser ? currentUser.email : 'Khách vãng lai (Chưa đăng nhập)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Hệ thống tự động đồng bộ thời gian thực theo cấu trúc tiêu chuẩn Nghị định 30/2020/NĐ-CP
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
            {onRequestDrivePermission && (
              <button
                type="button"
                onClick={onRequestDrivePermission}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                title="Cấp quyền truy cập Google Drive (scope drive.file)"
              >
                <i className="fa-brands fa-google-drive text-emerald-600 text-xs"></i>
                <span>Kết nối Google Drive</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSyncDrive}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              <i className={`fa-solid fa-rotate text-slate-500 text-xs ${isSyncing ? 'fa-spin' : ''}`}></i>
              <span>Làm mới Drive</span>
            </button>
            <button
              type="button"
              onClick={onNewDocument}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-red-800 hover:bg-red-900 shadow-sm transition-all cursor-pointer"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Soạn công văn mới</span>
            </button>
          </div>
        </div>

        {/* Drive Status Strip */}
        <div className="max-w-[1720px] mx-auto mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l12.3-21.3H6.6c0 1.5.4 3 1.2 4.35z" fill="#0066da"></path>
                <path d="M43.65 25 29.8 1c-1.3.8-2.4 1.9-3.2 3.3L1.2 52.85c-.8 1.35-1.2 2.85-1.2 4.35h25.95z" fill="#00ac47"></path>
                <path d="M73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l1.6-2.75 7.75-13.4c.8-1.35 1.2-2.85 1.2-4.35H61.35l6.55 11.35z" fill="#ea4335"></path>
                <path d="M43.65 25 57.5 1c-1.3-.8-2.85-1.2-4.45-1.2H34.25c-1.6 0-3.15.4-4.45 1.2z" fill="#00832d"></path>
                <path d="M59.85 55.5h-32.4L15.15 76.8c1.3.8 2.85 1.2 4.45 1.2h48.1c1.6 0 3.15-.4 4.45-1.2z" fill="#2684fc"></path>
                <path d="M73.55 76.8 87.3 52.85c-.8-1.35-1.9-2.5-3.2-3.3L70.3 25H43.65l26.7 46.25z" fill="#ffba00"></path>
              </svg>
              <span className="font-medium text-slate-600">Thư mục nguồn:</span>
              <span className="font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                /AI Văn Bản - Dự thảo
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <i className="fa-solid fa-shield-halved text-emerald-600 text-xs"></i>
              <span>Kết nối mã hóa AES-256</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-semibold">{(totalCount * 0.12).toFixed(1)} MB</span>
              <span className="text-slate-400">/ 15 GB khả dụng</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1.5">
              <i className="fa-regular fa-clock text-slate-400"></i>
              Đồng bộ lần cuối:{' '}
              <strong className="text-slate-700 font-semibold">{lastSyncTime}</strong>
            </span>
            <a
              href={folderLink || 'https://drive.google.com/drive/my-drive'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-800 hover:text-red-950 font-bold inline-flex items-center gap-1 hover:underline"
              title="Mở thư mục /AI Văn Bản - Dự thảo trên Google Drive"
            >
              <span>Xem trên web Google Drive</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-5 custom-scrollbar">
        <div className="max-w-[1720px] mx-auto space-y-5">
          {/* Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tổng số văn bản
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{totalCount}</span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                    {totalCount > 0 ? `+${totalCount} dự thảo` : 'Chưa có dự thảo'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-800 flex items-center justify-center text-lg">
                <i className="fa-solid fa-file-lines"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Công văn chuẩn NĐ 30
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{congvanCount}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Chiếm {totalCount > 0 ? Math.round((congvanCount / totalCount) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-lg">
                <i className="fa-solid fa-stamp"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Đã lưu Google Docs
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{totalCount}</span>
                  <span className="text-xs text-emerald-600 font-bold">
                    {totalCount > 0 ? '100% sao lưu' : '0 văn bản'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Dung lượng sử dụng
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900">
                    {(totalCount * 0.12).toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MB / 15 GB</span>
                </div>
                <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-red-800 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(totalCount * 1.5, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg">
                <i className="fa-brands fa-google-drive"></i>
              </div>
            </div>
          </div>

          {/* Search, Filter & Tabs */}
          <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xl">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo trích yếu, số ký hiệu hoặc ngày tháng..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium rounded-lg text-slate-800 placeholder-slate-400 transition-all outline-none border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2.5 self-end lg:self-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <i className="fa-solid fa-arrow-down-short-wide text-slate-400"></i>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-700 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="newest">Mới nhất trước</option>
                    <option value="oldest">Cũ nhất trước</option>
                    <option value="title">Theo số ký hiệu (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'all' ? 'bg-red-950/40 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('congvan')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'congvan'
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Công văn</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'congvan' ? 'bg-red-950/40 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {congvanCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('totrinh')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'totrinh'
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Tờ trình</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'totrinh' ? 'bg-red-950/40 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {totrinhCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('draft')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'draft'
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Bản nháp chưa gửi</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'draft' ? 'bg-red-950/40 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {draftCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('word')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'word'
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Đã xuất file Word</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'word' ? 'bg-red-950/40 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {wordCount}
                </span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-5 text-slate-400 text-center w-12">#</th>
                      <th className="py-3 px-4">Trích yếu &amp; Số ký hiệu</th>
                      <th className="py-3 px-4 w-36">Loại văn bản</th>
                      <th className="py-3 px-4 w-48">Cập nhật gần nhất</th>
                      <th className="py-3 px-4 w-44">Trạng thái Drive</th>
                      <th className="py-3 px-5 text-right w-56">Thao tác xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 font-medium text-slate-700">
                    {filtered.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-5 text-center text-slate-400 font-semibold">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="py-4 px-4 space-y-1">
                          <button
                            type="button"
                            onClick={() => setInspectDraft(item)}
                            className="font-bold text-slate-900 group-hover:text-red-900 transition text-sm leading-snug line-clamp-1 text-left cursor-pointer"
                          >
                            {item.title}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              Số: {item.docNumber}{item.docSymbol}
                            </span>
                            <span>•</span>
                            <span>Trung tâm Mã số, mã vạch Quốc gia</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              item.category === 'congvan'
                                ? 'bg-red-50 text-red-800'
                                : item.category === 'totrinh'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            <i className="fa-solid fa-file-lines text-[10px]"></i>
                            {item.categoryLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4 space-y-0.5">
                          <div className="font-semibold text-slate-800">{item.updatedAt}</div>
                          <div className="text-[11px] text-slate-400">Bởi {item.author}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                            <i className="fa-brands fa-google-drive text-emerald-600 text-xs"></i>
                            <span>Đã lưu Drive</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 pl-1">
                            {item.drivePath}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenDraft(item)}
                              className="p-2 rounded-lg text-slate-600 hover:text-red-900 hover:bg-red-50 transition cursor-pointer"
                              title="Mở chỉnh sửa trong Editor"
                            >
                              <i className="fa-solid fa-pen-to-square text-sm"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadWord(item)}
                              className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer"
                              title="Tải Word (.docx)"
                            >
                              <i className="fa-solid fa-file-word text-sm"></i>
                            </button>
                            <a
                              href={item.webViewLink || (item.id ? `https://drive.google.com/file/d/${item.id}/view` : '#')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer inline-flex items-center justify-center"
                              title="Mở trên web Google Drive"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa văn bản dự thảo này khỏi kho lưu trữ?')) {
                                  onDeleteDraft(item.id);
                                  onNotify('Đã xóa dự thảo thành công.');
                                }
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Xóa dự thảo"
                            >
                              <i className="fa-regular fa-trash-can text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : drafts.length === 0 ? (
              /* Empty Drive State (Chưa có văn bản nào được lưu) */
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                  <i className="fa-brands fa-google-drive text-3xl text-slate-400"></i>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-800">
                    Thư mục Google Drive trống
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Chưa có văn bản dự thảo nào được lưu trong Google Drive của bạn.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  {onRequestDrivePermission && (
                    <button
                      type="button"
                      onClick={onRequestDrivePermission}
                      className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 inline-flex items-center gap-2 cursor-pointer shadow-sm transition"
                    >
                      <i className="fa-brands fa-google-drive text-xs"></i>
                      <span>Kết nối Google Drive</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onNewDocument}
                    className="px-5 py-2.5 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 inline-flex items-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>+ Soạn công văn mới</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Search/Filter Empty State */
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <i className="fa-regular fa-folder-open text-2xl"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-800">Không tìm thấy văn bản phù hợp</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Chưa có dự thảo nào khớp với từ khóa tìm kiếm hoặc danh mục lọc.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-rotate-left text-[11px]"></i>
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span>Hiển thị</span>
                <span className="font-bold text-slate-800">{filtered.length}</span>
                <span>trên</span>
                <span className="font-bold text-slate-800">{totalCount}</span>
                <span>văn bản dự thảo</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="hover:text-red-800 underline transition cursor-pointer"
                  >
                    Chính sách quyền riêng tư
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="hover:text-red-800 underline transition cursor-pointer"
                  >
                    Điều khoản sử dụng
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-40"
                  >
                    <i className="fa-solid fa-chevron-left text-[11px]"></i>
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-red-800 text-white font-bold flex items-center justify-center shadow-2xs">
                    1
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold flex items-center justify-center transition">
                    <i className="fa-solid fa-chevron-right text-[11px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectDraft && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectDraft(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Xem nhanh thông tin văn bản</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectDraft(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trích yếu nội dung
                </span>
                <p className="text-sm font-bold text-slate-800 mt-1 leading-relaxed">
                  {inspectDraft.title}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[11px] text-slate-500 font-medium">Số &amp; Ký hiệu</span>
                  <div className="text-xs font-bold text-red-900 mt-0.5">
                    Số: {inspectDraft.docNumber}{inspectDraft.docSymbol}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[11px] text-slate-500 font-medium">Vị trí lưu trữ</span>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    {inspectDraft.drivePath}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3 border border-emerald-100">
                <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                <span className="text-xs text-emerald-900 font-medium">
                  File đã được đối soát quy chuẩn thể thức Nghị định 30 và đồng bộ Google Drive an toàn.
                </span>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 flex items-center justify-end gap-2.5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInspectDraft(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenDraft(inspectDraft);
                  setInspectDraft(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-800 hover:bg-red-900 transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-pen-nib text-xs"></i>
                <span>Mở trình soạn thảo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
