import React, { useState } from 'react';
import { AdministrativeTemplate, INITIAL_TEMPLATES } from '../data/initialTemplates.ts';

interface AdminTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: AdministrativeTemplate) => void;
}

export const AdminTemplateModal: React.FC<AdminTemplateModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<AdministrativeTemplate[]>(INITIAL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cong-van');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newLegalBaseInput, setNewLegalBaseInput] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleUpdateCurrent = (field: keyof AdministrativeTemplate, value: any) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === currentTemplate.id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddLegalBase = () => {
    if (!newLegalBaseInput.trim()) return;
    const updated = [...currentTemplate.legalBases, newLegalBaseInput.trim()];
    handleUpdateCurrent('legalBases', updated);
    setNewLegalBaseInput('');
    setIsAddingNew(false);
  };

  const handleRemoveLegalBase = (index: number) => {
    const updated = currentTemplate.legalBases.filter((_, idx) => idx !== index);
    handleUpdateCurrent('legalBases', updated);
  };

  const handleCreateNewTemplate = () => {
    const newId = `template-${Date.now()}`;
    const newTemplate: AdministrativeTemplate = {
      id: newId,
      name: 'MẪU VĂN BẢN MỚI',
      code: '/VB-MSMV',
      status: 'draft',
      statusLabel: 'Draft • Đang soạn thảo',
      parentAgency: 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
      issuingAgency: 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA',
      headerRatio: '40% / 60%',
      defaultOpening: 'Trung tâm Mã số, mã vạch Quốc gia kính gửi...',
      legalBases: ['Luật Tiêu chuẩn và Quy chuẩn kỹ thuật', 'Nghị định 30/2020/NĐ-CP'],
      defaultClosing: 'Trân trọng kính báo để triển khai thực hiện./.',
      distributionList: ['- Như trên;', '- Lưu: VT, KHTC.'],
      defaultSignerRole: 'GIÁM ĐỐC',
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setSelectedTemplateId(newId);
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveAndActivate = () => {
    onApplyTemplate(currentTemplate);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-[1100px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 flex items-center justify-center text-lg shadow-2xs">
              <i className="fa-solid fa-gear"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">
                  QUẢN TRỊ MẪU LOẠI HÌNH VĂN BẢN
                </h3>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  (Chỉ dành cho dacminhm@gmail.com)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Thiết lập cấu trúc thể thức mặc định, căn cứ pháp lý và phân quyền áp dụng cho từng loại văn bản.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body: Left column (Templates list) & Right column (Form) */}
        <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: 4 cols */}
          <div className="col-span-12 md:col-span-4 border-r border-gray-200 p-4 bg-gray-50/80 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm loại mẫu..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border-gray-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-200 bg-white"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-xs text-gray-400"></i>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-1">
                  Danh sách loại văn bản hiện có
                </p>

                {filteredTemplates.map((tmpl) => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-3 rounded-xl cursor-pointer transition shadow-2xs ${
                        isSelected
                          ? 'bg-amber-50/80 border-2 border-amber-600/60 shadow-xs'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-amber-900' : 'text-gray-800'
                          }`}
                        >
                          {tmpl.name}
                        </span>
                        {tmpl.status === 'active' ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <i className="fa-solid fa-check text-[9px]"></i> Mặc định
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                            {tmpl.statusLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Mã: {tmpl.code} • Chuẩn NĐ 30
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateNewTemplate}
              className="mt-4 w-full py-2.5 px-3 border-2 border-dashed border-amber-200 hover:border-amber-600 bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Thêm loại hình văn bản mới</span>
            </button>
          </div>

          {/* Right Column: 8 cols */}
          <div className="col-span-12 md:col-span-8 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700"></span>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                  Cấu hình chi tiết: Mẫu văn bản {currentTemplate.name}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Phiên bản quản trị: 2026.01
              </span>
            </div>

            {/* General Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên loại văn bản <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) => handleUpdateCurrent('name', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 focus:ring-amber-200 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mã viết tắt ký hiệu <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={currentTemplate.code}
                  onChange={(e) => handleUpdateCurrent('code', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 focus:ring-amber-200 font-semibold"
                />
              </div>
            </div>

            {/* Block 1: Header */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                  <i className="fa-solid fa-table-columns text-amber-700"></i> 1. Cấu trúc Header mặc định
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Tỷ lệ {currentTemplate.headerRatio}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Cơ quan chủ quản mặc định
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.parentAgency}
                    onChange={(e) => handleUpdateCurrent('parentAgency', e.target.value)}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Cơ quan ban hành mặc định
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.issuingAgency}
                    onChange={(e) => handleUpdateCurrent('issuingAgency', e.target.value)}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Block 2: Body */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <span className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                <i className="fa-solid fa-align-left text-amber-700"></i> 2. Cấu trúc Thân văn bản mặc định
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Mẫu câu mở đầu (Prompt / Template mặc định)
                </label>
                <textarea
                  rows={2}
                  value={currentTemplate.defaultOpening}
                  onChange={(e) => handleUpdateCurrent('defaultOpening', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 bg-white"
                />
              </div>

              {/* Legal bases chip tags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-gray-600">
                    Các căn cứ pháp lý gợi ý mặc định
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i> Thêm căn cứ
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentTemplate.legalBases.map((base, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-300 px-2.5 py-1 rounded-lg text-gray-700 font-medium shadow-2xs"
                    >
                      {base}
                      <button
                        type="button"
                        onClick={() => handleRemoveLegalBase(idx)}
                        className="text-gray-400 hover:text-amber-600 ml-1"
                        title="Xóa căn cứ này"
                      >
                        <i className="fa-solid fa-xmark text-[11px]"></i>
                      </button>
                    </span>
                  ))}
                </div>

                {isAddingNew && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newLegalBaseInput}
                      onChange={(e) => setNewLegalBaseInput(e.target.value)}
                      placeholder="Nhập tên văn bản quy phạm pháp luật..."
                      className="text-xs flex-1 rounded-lg border-gray-300 bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddLegalBase}
                      className="px-3 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-amber-800"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-2.5 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Mẫu câu kết luận / Kiến nghị mặc định
                </label>
                <textarea
                  rows={2}
                  value={currentTemplate.defaultClosing}
                  onChange={(e) => handleUpdateCurrent('defaultClosing', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 bg-white"
                />
              </div>
            </div>

            {/* Block 3: Footer */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <span className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                <i className="fa-solid fa-signature text-amber-700"></i> 3. Cấu trúc Footer mặc định
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Nơi nhận mặc định (mỗi dòng 1 địa chỉ)
                  </label>
                  <textarea
                    rows={2}
                    value={currentTemplate.distributionList.join('\n')}
                    onChange={(e) =>
                      handleUpdateCurrent(
                        'distributionList',
                        e.target.value.split('\n').filter((l) => l.trim().length > 0)
                      )
                    }
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Thẩm quyền ký mặc định
                  </label>
                  <select
                    value={currentTemplate.defaultSignerRole}
                    onChange={(e) => handleUpdateCurrent('defaultSignerRole', e.target.value)}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 bg-white font-bold"
                  >
                    <option value="GIÁM ĐỐC">GIÁM ĐỐC</option>
                    <option value="PHÓ GIÁM ĐỐC">PHÓ GIÁM ĐỐC</option>
                    <option value="TRƯỞNG PHÒNG">TRƯỞNG PHÒNG</option>
                    <option value="CHÁNH VĂN PHÒNG">CHÁNH VĂN PHÒNG</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <i className="fa-solid fa-lock text-amber-700"></i>
            <span>
              Phiên bảo mật: Chỉ khả dụng với tài khoản Quản trị viên{' '}
              <strong className="text-gray-800">dacminhm@gmail.com</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-2xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAndActivate}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm hover:shadow-md transition flex items-center space-x-1.5"
            >
              <i className="fa-regular fa-floppy-disk text-xs"></i>
              <span>Lưu &amp; Kích hoạt mẫu này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
