import React, { useState, useEffect, useRef } from 'react';
import { DocumentState, formatSubject } from '../utils/decree30Rules.ts';
import { generateDecree30Docx, downloadBlob } from '../utils/docxExport.ts';

interface EditorAccordionProps {
  document: DocumentState;
  onUpdateField: (field: keyof DocumentState, value: any) => void;
  onRequestUnlock: (fieldId: keyof DocumentState, label: string) => void;
  unlockedFields: Record<string, boolean>;
  onResetDefault: () => void;
  onSaveToDrive?: () => void;
  onNotify: (msg: string) => void;
  activeStep?: 1 | 2 | 3;
  onStepChange?: (step: 1 | 2 | 3) => void;
  onExportDocx?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

interface AICallbackWarning {
  vi_tri: string;
  loi_nhan_xet: string;
  de_xuat_sua: string;
}

export const EditorAccordion: React.FC<EditorAccordionProps> = ({
  document: doc,
  onUpdateField,
  onRequestUnlock,
  unlockedFields,
  onResetDefault,
  onSaveToDrive,
  onNotify,
  activeStep = 2,
  onStepChange,
  onExportDocx,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [activeAIMode, setActiveAIMode] = useState<string>('');
  const [aiWarnings, setAiWarnings] = useState<AICallbackWarning[]>([]);
  // User custom prompt for AI writing
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');

  // Validation state for AI assistance inputs
  const [aiValidationErrors, setAiValidationErrors] = useState<{
    opening: boolean;
    content: boolean;
  }>({ opening: false, content: false });

  // Refs for scrolling and focusing input fields
  const openingInputRef = useRef<HTMLTextAreaElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // Accordion collapsed state
  const [isBlock1Open, setIsBlock1Open] = useState<boolean>(activeStep === 1);
  const [isBlock2Open, setIsBlock2Open] = useState<boolean>(activeStep === 2);
  const [isBlock3Open, setIsBlock3Open] = useState<boolean>(activeStep === 3);

  // Helper to switch step and smoothly scroll to target block
  const handleGoToStep = (targetStep: 1 | 2 | 3) => {
    onStepChange?.(targetStep);
    if (targetStep === 1) {
      setIsBlock1Open(true);
      setTimeout(() => {
        document.getElementById('block-step-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else if (targetStep === 2) {
      setIsBlock2Open(true);
      setTimeout(() => {
        document.getElementById('block-step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else if (targetStep === 3) {
      setIsBlock3Open(true);
      setTimeout(() => {
        document.getElementById('block-step-3')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  // Synchronize when activeStep changes from Stepper
  useEffect(() => {
    if (activeStep === 1) {
      setIsBlock1Open(true);
      setTimeout(() => {
        document.getElementById('block-step-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else if (activeStep === 2) {
      setIsBlock2Open(true);
      setTimeout(() => {
        document.getElementById('block-step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else if (activeStep === 3) {
      setIsBlock3Open(true);
      setTimeout(() => {
        document.getElementById('block-step-3')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [activeStep]);

  // Apply default opening template
  const handleApplySampleOpening = () => {
    const sample =
      'Phúc đáp công văn số ... ngày .../../2026 của Quý cơ quan về việc triển khai đề án, Trung tâm Mã số, mã vạch Quốc gia có một số ý kiến như sau:';
    onUpdateField('opening', sample);
    setAiValidationErrors((prev) => ({ ...prev, opening: false }));
    onNotify('Đã áp dụng mẫu câu mở đầu phúc đáp chuẩn của Trung tâm.');
  };

  // Add standard legal base chip
  const handleAddLegalBase = (base: string) => {
    if (!doc.legalBases.includes(base)) {
      onUpdateField('legalBases', [...doc.legalBases, base]);
    }
  };

  // Validate inputs before calling Gemini AI
  const validateInputsBeforeAI = (): boolean => {
    const isOpeningEmpty = !doc.opening || !doc.opening.trim();
    const isContentEmpty = !doc.content || !doc.content.trim();

    // Trường hợp 3: Cả 2 ô đều trống
    if (isOpeningEmpty && isContentEmpty) {
      setAiValidationErrors({ opening: true, content: true });
      setIsBlock2Open(true);
      setTimeout(() => {
        openingInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        openingInputRef.current?.focus();
      }, 50);
      onNotify('⚠️ Vui lòng điền nội dung mở đầu và các ý chính cần truyền tải trước khi yêu cầu Trợ lý AI hỗ trợ viết.');
      return false;
    }

    // Trường hợp 1: Ô [Đoạn mở đầu] đang trống hoặc chưa nhập lý do/dẫn chiếu
    if (isOpeningEmpty) {
      setAiValidationErrors({ opening: true, content: false });
      setIsBlock2Open(true);
      setTimeout(() => {
        openingInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        openingInputRef.current?.focus();
      }, 50);
      onNotify("⚠️ Vui lòng nhập thông tin tại 'Đoạn mở đầu công văn' (nêu lý do ban hành, dẫn chiếu công văn đến hoặc bối cảnh xử lý) để AI có cơ sở hoàn thiện văn bản.");
      return false;
    }

    // Trường hợp 2: Khung [Nội dung các điểm / điều khoản] đang hoàn toàn trống
    if (isContentEmpty) {
      setAiValidationErrors({ opening: false, content: true });
      setIsBlock2Open(true);
      setTimeout(() => {
        contentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        contentInputRef.current?.focus();
      }, 50);
      onNotify("⚠️ Vui lòng gõ ít nhất 1 - 2 ý chính hoặc gạch đầu dòng nháp về nội dung cần giải quyết để Trợ lý AI hỗ trợ viết và mở rộng.");
      return false;
    }

    // Hợp lệ: Cả 2 ô đều đã có nội dung
    setAiValidationErrors({ opening: false, content: false });
    return true;
  };

  // Trigger Gemini AI processing
  const handleCallAI = async (mode: 'standardize' | 'audit' | 'suggest_msmv') => {
    // 1. Kiểm tra tuần tự nội dung của cả 2 ô trước khi gửi API
    if (!validateInputsBeforeAI()) {
      return;
    }

    setIsProcessingAI(true);
    setActiveAIMode(mode);
    try {
      const response = await fetch('/api/ai/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          subject: doc.subject,
          recipient: doc.recipient,
          opening: doc.opening,
          content: doc.content,
          closing: doc.closing,
          customInstruction: aiCustomPrompt,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const d = resData.data;
        if (d.trich_yeu) onUpdateField('subject', formatSubject(d.trich_yeu));
        if (d.kinh_gui) onUpdateField('recipient', d.kinh_gui);
        if (d.phan_mo_dau) onUpdateField('opening', d.phan_mo_dau);
        if (d.cac_y_kien_noi_dung && Array.isArray(d.cac_y_kien_noi_dung)) {
          onUpdateField('content', d.cac_y_kien_noi_dung.join('\n\n'));
        }
        if (d.phan_ket_luan) {
          onUpdateField('closing', d.phan_ket_luan.replace(/Trân trọng\.\/\./g, '').trim());
        }
        if (d.canh_bao_logic_va_ngu_phap && Array.isArray(d.canh_bao_logic_va_ngu_phap)) {
          setAiWarnings(d.canh_bao_logic_va_ngu_phap);
        }

        const modeLabels = {
          standardize: 'Chuẩn hóa thể thức NĐ 30',
          audit: 'Soát xét logic & Pháp lý',
          suggest_msmv: 'Gợi ý chuyên môn MSMV',
        };
        onNotify(`Trợ lý AI đã hoàn tất ${modeLabels[mode]} thành công!`);
      } else {
        onNotify('Không nhận được kết quả từ Trợ lý AI. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error invoking AI:', err);
      onNotify('Có lỗi kết nối máy chủ AI. Đã kích hoạt bộ dữ liệu hành chính dự phòng.');
    } finally {
      setIsProcessingAI(false);
      setActiveAIMode('');
    }
  };

  // Apply suggestion from AI warning box
  const handleApplyWarningFix = (warning: AICallbackWarning, index: number) => {
    // Append or replace in content
    const updatedContent = `${doc.content}\n\n${warning.de_xuat_sua}`;
    onUpdateField('content', updatedContent);
    setAiWarnings((prev) => prev.filter((_, idx) => idx !== index));
    onNotify('Đã áp dụng câu văn hành chính đề xuất vào nội dung công văn.');
  };

  // Export .docx directly using docx generator
  const handleExportDocx = async () => {
    try {
      const blob = await generateDecree30Docx(doc);
      const filename = `CongVan_${doc.docNumber || '125'}_MSMV_KHTC.docx`;
      downloadBlob(blob, filename);
      onNotify(`Đã xuất văn bản ${filename} chuẩn Nghị định 30 thành công!`);
    } catch (error) {
      console.error('Docx generation error:', error);
      onNotify('Lỗi tạo file Word (.docx). Vui lòng kiểm tra lại dữ liệu.');
    }
  };

  return (
    <section
      className="flex-1 w-full max-w-none bg-slate-50 flex flex-col h-full overflow-hidden"
      data-purpose="administrative-editor-pane"
    >
      {/* Scrollable Accordion Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-5 space-y-4 sm:space-y-5 custom-scrollbar">
        {/* ======================================================== */}
        {/* KHỐI 1: THÔNG TIN ĐƠN VỊ & THỂ THỨC ĐẦU CÔNG VĂN (KHÓA)  */}
        {/* ======================================================== */}
        <div
          id="block-step-1"
          className={`bg-white rounded-xl shadow-2xs overflow-hidden transition-all ${
            activeStep === 1 ? 'ring-2 ring-red-200 border-2 border-red-800/40' : 'border border-gray-200'
          }`}
          data-purpose="accordion-general-info"
          onFocusCapture={() => onStepChange?.(1)}
        >
          {/* Header Accordion Toggle */}
          <div
            onClick={() => {
              const next = !isBlock1Open;
              setIsBlock1Open(next);
              if (next) onStepChange?.(1);
            }}
            className="w-full px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-gray-800">
                  Thông tin đơn vị &amp; Thể thức đầu công văn
                </h2>
                <p className="text-xs text-gray-500">
                  Ủy ban TĐC • Trung tâm MSMV • Thể thức Công văn
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <i className="fa-solid fa-lock text-[10px] mr-1"></i> Mặc định đã khóa
              </span>
              <i
                className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${
                  isBlock1Open ? 'rotate-180' : ''
                }`}
              ></i>
            </div>
          </div>

          {/* Accordion Content */}
          {isBlock1Open && (
            <div className="p-5 space-y-4 border-t border-gray-100 animate-in fade-in duration-150">
              {/* Row 1: Parent Agency & Issuing Agency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cơ quan chủ quản */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center">
                      Cơ quan chủ quản (Cỡ 12, hoa, đứng)
                      {!unlockedFields.parentAgency && (
                        <i className="fa-solid fa-lock text-[10px] text-gray-400 ml-1.5" title="Dữ liệu cố định"></i>
                      )}
                    </label>
                    {!unlockedFields.parentAgency ? (
                      <button
                        type="button"
                        onClick={() => onRequestUnlock('parentAgency', 'Cơ quan chủ quản')}
                        className="text-[11px] text-red-800 hover:text-red-900 font-semibold"
                      >
                        Mở khóa sửa
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold">Đã mở khóa</span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly={!unlockedFields.parentAgency}
                    value={doc.parentAgency}
                    onChange={(e) => onUpdateField('parentAgency', e.target.value)}
                    onClick={() => {
                      if (!unlockedFields.parentAgency) {
                        onRequestUnlock('parentAgency', 'Cơ quan chủ quản');
                      }
                    }}
                    className={`w-full text-xs rounded-lg font-medium transition ${
                      !unlockedFields.parentAgency
                        ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed focus:ring-0'
                        : 'bg-white border-red-700 text-gray-900 ring-1 ring-red-200'
                    }`}
                  />
                </div>

                {/* Cơ quan ban hành */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center">
                      Cơ quan ban hành (Cỡ 12, hoa, đậm)
                      {!unlockedFields.issuingAgency && (
                        <i className="fa-solid fa-lock text-[10px] text-gray-400 ml-1.5" title="Dữ liệu cố định"></i>
                      )}
                    </label>
                    {!unlockedFields.issuingAgency ? (
                      <button
                        type="button"
                        onClick={() => onRequestUnlock('issuingAgency', 'Cơ quan ban hành')}
                        className="text-[11px] text-red-800 hover:text-red-900 font-semibold"
                      >
                        Mở khóa sửa
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold">Đã mở khóa</span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly={!unlockedFields.issuingAgency}
                    value={doc.issuingAgency}
                    onChange={(e) => onUpdateField('issuingAgency', e.target.value)}
                    onClick={() => {
                      if (!unlockedFields.issuingAgency) {
                        onRequestUnlock('issuingAgency', 'Cơ quan ban hành');
                      }
                    }}
                    className={`w-full text-xs rounded-lg font-bold transition ${
                      !unlockedFields.issuingAgency
                        ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed focus:ring-0'
                        : 'bg-white border-red-700 text-gray-900 ring-1 ring-red-200'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Số & Ký hiệu công văn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số và ký hiệu công văn
                  </label>
                  <div className="flex rounded-lg shadow-2xs">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-medium">
                      Số:
                    </span>
                    <input
                      type="text"
                      value={doc.docNumber}
                      onChange={(e) => onUpdateField('docNumber', e.target.value)}
                      placeholder="125"
                      className="flex-1 min-w-0 block w-full px-3 py-1.5 text-xs border-gray-300 focus:ring-red-600 focus:border-red-600 font-medium"
                    />
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly={!unlockedFields.docSymbol}
                        value={doc.docSymbol}
                        onChange={(e) => onUpdateField('docSymbol', e.target.value)}
                        onClick={() => {
                          if (!unlockedFields.docSymbol) {
                            onRequestUnlock('docSymbol', 'Ký hiệu /MSMV-KHTC');
                          }
                        }}
                        className={`w-36 text-xs border border-l-0 border-gray-300 font-semibold rounded-r-lg px-2 py-1.5 ${
                          !unlockedFields.docSymbol
                            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                            : 'bg-white text-gray-900'
                        }`}
                      />
                      {!unlockedFields.docSymbol && (
                        <button
                          type="button"
                          onClick={() => onRequestUnlock('docSymbol', 'Ký hiệu /MSMV-KHTC')}
                          className="absolute right-2 text-gray-400 hover:text-red-800"
                          title="Mở khóa ký hiệu"
                        >
                          <i className="fa-solid fa-lock text-[10px]"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Đuôi &quot;/MSMV-KHTC&quot; là mã định danh chuẩn của Trung tâm
                  </p>
                </div>

                {/* Fixed Document Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Loại hình văn bản
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={doc.docType}
                      className="w-full text-xs rounded-lg bg-slate-100 border-gray-300 text-gray-700 font-bold cursor-not-allowed pl-8"
                    />
                    <i className="fa-solid fa-lock absolute left-3 top-2.5 text-xs text-gray-400"></i>
                  </div>
                  <p className="text-[10px] text-red-800 font-medium mt-1">
                    ✓ Đã cố định định dạng công văn theo đúng mẫu hành chính
                  </p>
                </div>
              </div>

              {/* Row 3: Trích yếu & Kính gửi */}
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Trích yếu nội dung (V/v) - Cỡ 12, chữ đứng, căn giữa, cách dòng single (0, 0)
                  </label>
                  <input
                    type="text"
                    value={doc.subject}
                    onChange={(e) => onUpdateField('subject', e.target.value)}
                    className="w-full text-xs rounded-lg border-gray-300 focus:ring-red-600 focus:border-red-600 font-normal text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kính gửi cơ quan, đơn vị nhận chính
                  </label>
                  <input
                    type="text"
                    value={doc.recipient}
                    onChange={(e) => onUpdateField('recipient', e.target.value)}
                    className="w-full text-xs rounded-lg border-gray-300 focus:ring-red-600 focus:border-red-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* KHỐI 2: SOẠN THẢO THÂN CÔNG VĂN (TRỌNG TÂM FOCUS CHÍNH)  */}
        {/* ======================================================== */}
        <div
          id="block-step-2"
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
            activeStep === 2
              ? 'border-2 border-red-700/60 ring-2 ring-red-200/50'
              : 'border border-gray-200'
          }`}
          data-purpose="accordion-body-content"
          onFocusCapture={() => onStepChange?.(2)}
        >
          {/* Active Section Header */}
          <div
            onClick={() => {
              const next = !isBlock2Open;
              setIsBlock2Open(next);
              if (next) onStepChange?.(2);
            }}
            className="px-5 py-3.5 bg-gradient-to-r from-red-50 to-white flex items-center justify-between border-b border-red-100 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-red-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                2
              </div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-red-950">
                  Nội dung thân công văn &amp; Trợ lý AI
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
                  Đang soạn thảo
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                MSMV AI Assist v2.4
              </span>
              <i
                className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${
                  isBlock2Open ? 'rotate-180' : ''
                }`}
              ></i>
            </div>
          </div>

          {isBlock2Open && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* ============================================================== */}
              {/* CỤM HỘP ĐIỀU KHIỂN TRỢ LÝ AI (AI COMMAND BOX) TRANG NHÃ       */}
              {/* ============================================================== */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-red-800 text-white flex items-center justify-center text-xs shadow-2xs">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </span>
                    <span className="text-xs font-bold text-gray-900 tracking-tight">
                      Trợ lý AI hỗ trợ viết &amp; hoàn thiện văn bản
                    </span>
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200/80">
                      Nghị định 30/2020/NĐ-CP
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 hidden sm:inline font-medium">
                    Tự động chuẩn hóa &amp; phát triển ý văn bản
                  </span>
                </div>

                {/* Ô nhập câu lệnh (Prompt Input) & Nút hành động chính */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isProcessingAI) {
                          e.preventDefault();
                          handleCallAI('standardize');
                        }
                      }}
                      placeholder="Gõ yêu cầu cụ thể cho AI (Ví dụ: Viết lại gãy gọn, bổ sung ý về tiến độ nghiệm thu, thêm đề xuất kinh phí...)"
                      className="w-full bg-white text-xs text-gray-800 placeholder:text-gray-400 placeholder:italic rounded-lg border border-slate-300 hover:border-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 py-2.5 pl-3.5 pr-8 outline-none transition shadow-2xs font-normal"
                    />
                    {aiCustomPrompt && (
                      <button
                        type="button"
                        onClick={() => setAiCustomPrompt('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                        title="Xóa yêu cầu"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingAI}
                    onClick={() => handleCallAI('standardize')}
                    className="px-4 py-2.5 bg-red-800 hover:bg-red-900 active:bg-red-950 text-white font-bold rounded-lg text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Gửi nội dung và yêu cầu đến Trợ lý AI"
                  >
                    {isProcessingAI ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                        <span>Đang phân tích &amp; soạn thảo văn bản...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles text-amber-300 text-xs"></i>
                        <span>✨ Trợ lý AI hỗ trợ viết</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Đoạn mở đầu công văn (Dẫn chiếu công văn đến) - Nổi bật, nền trắng, viền rõ, có icon bút chì */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-100 text-red-800 flex items-center justify-center text-[10px]">
                      <i className="fa-solid fa-feather-pointed"></i>
                    </span>
                    <span>Đoạn mở đầu công văn (Dẫn chiếu công văn đến)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplySampleOpening}
                    className="text-[11px] text-red-800 hover:text-red-950 font-semibold inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md border border-red-200 cursor-pointer transition shadow-2xs"
                    title="Chèn mẫu câu mở đầu phúc đáp chuẩn của Trung tâm"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-amber-600"></i>
                    <span>+ Mẫu phúc đáp chuẩn</span>
                  </button>
                </div>

                <div className="relative group">
                  <textarea
                    ref={openingInputRef}
                    rows={3}
                    value={doc.opening}
                    onChange={(e) => {
                      onUpdateField('opening', e.target.value);
                      if (aiValidationErrors.opening && e.target.value.trim()) {
                        setAiValidationErrors((prev) => ({ ...prev, opening: false }));
                      }
                    }}
                    placeholder="Nhập nội dung dẫn chiếu văn bản đến hoặc lý do ban hành công văn tại đây..."
                    className={`w-full bg-white text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 placeholder:italic rounded-lg shadow-sm p-3.5 pr-10 outline-none transition-all resize-y font-normal ${
                      aiValidationErrors.opening
                        ? 'border-2 border-red-500 ring-2 ring-red-100 bg-red-50/20'
                        : 'border border-slate-300 hover:border-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    }`}
                  />
                  {/* Icon chiếc bút chì nhỏ ở góc phải trên của ô để nhấn mạnh tính năng cho phép nhập liệu */}
                  <div
                    className="absolute top-3 right-3 text-slate-400 group-hover:text-red-700 transition pointer-events-none p-0.5"
                    title="Ô nhập liệu cho phép chỉnh sửa"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </div>
                </div>
                {aiValidationErrors.opening && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-150">
                    <i className="fa-solid fa-triangle-exclamation text-xs text-amber-500"></i>
                    <span>Vui lòng nhập thông tin tại ô Đoạn mở đầu công văn trước khi yêu cầu Trợ lý AI.</span>
                  </p>
                )}
              </div>

              {/* Danh sách chip tag gợi ý căn cứ pháp lý */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Căn cứ pháp lý viện dẫn
                  </label>
                  <span className="text-[10px] text-gray-400">Nhấn để thêm vào nội dung</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {doc.legalBases.map((base, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const updatedContent = `${doc.content}\n- Căn cứ ${base};`;
                        onUpdateField('content', updatedContent);
                        onNotify(`Đã chèn căn cứ "${base}" vào thân công văn.`);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-red-50 hover:text-red-900 hover:border-red-300 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium transition cursor-pointer"
                    >
                      <i className="fa-solid fa-scale-balanced text-[10px] text-slate-400"></i>
                      <span>{base}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Main Body (Rich-Text Editor) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                    <i className="fa-solid fa-pen-nib text-red-800 mr-1.5"></i>
                    Nội dung các điểm / điều khoản
                  </label>
                  <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                    Font Times New Roman • Căn đều 2 bên
                  </span>
                </div>

                {/* Editor Wrapper: Sạch sẽ, sáng sủa, thanh công cụ nằm ngay sát trên khung nội dung */}
                <div
                  className={`rounded-xl overflow-hidden bg-white shadow-2xs transition-all ${
                    aiValidationErrors.content
                      ? 'border-2 border-red-500 ring-2 ring-red-100 bg-red-50/10'
                      : 'border border-gray-300'
                  }`}
                >
                  <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center space-x-3 text-gray-600 text-xs">
                    <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateField('content', `**${doc.content}**`);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded font-bold"
                        title="In đậm"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateField('content', `*${doc.content}*`);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded italic"
                        title="In nghiêng"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateField('content', `<u>${doc.content}</u>`);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded underline"
                        title="Gạch chân"
                      >
                        U
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                      <button
                        type="button"
                        onClick={() => {
                          const lines = doc.content.split('\n');
                          const numbered = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
                          onUpdateField('content', numbered);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded"
                        title="Đánh số thứ tự"
                      >
                        <i className="fa-solid fa-list-ol"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const lines = doc.content.split('\n');
                          const bulleted = lines.map((l) => `- ${l}`).join('\n');
                          onUpdateField('content', bulleted);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded"
                        title="Danh sách gạch đầu dòng"
                      >
                        <i className="fa-solid fa-list-ul"></i>
                      </button>
                      <button
                        type="button"
                        className="p-1.5 hover:bg-gray-200 rounded text-red-800 font-semibold"
                        title="Thụt lề chuẩn 1.27cm"
                      >
                        <i className="fa-solid fa-indent"></i>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-1.5 hover:bg-gray-200 rounded text-red-800 font-bold"
                        title="Căn đều 2 bên (Justified) theo NĐ 30"
                      >
                        <i className="fa-solid fa-align-justify"></i>
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={contentInputRef}
                    rows={8}
                    value={doc.content}
                    onChange={(e) => {
                      onUpdateField('content', e.target.value);
                      if (aiValidationErrors.content && e.target.value.trim()) {
                        setAiValidationErrors((prev) => ({ ...prev, content: false }));
                      }
                    }}
                    placeholder="Nhập nội dung các điểm/điều khoản của công văn..."
                    className="w-full p-4 border-0 text-xs focus:ring-0 leading-relaxed text-gray-800 resize-y font-sans outline-none"
                  />
                  {aiValidationErrors.content && (
                    <div className="bg-red-50 border-t border-red-200 px-3 py-1.5 text-[11px] text-red-700 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                      <i className="fa-solid fa-triangle-exclamation text-xs text-amber-500"></i>
                      <span>Vui lòng gõ ít nhất 1 - 2 ý chính hoặc gạch đầu dòng nháp về nội dung cần giải quyết.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* HỘP CẢNH BÁO THÔNG MINH (canh_bao_logic_va_ngu_phap) */}
              {aiWarnings.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-shield-virus text-amber-600 text-sm"></i>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-tight">
                        Hộp cảnh báo thông minh: Rà soát logic &amp; Ngữ pháp ({aiWarnings.length} lưu ý)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiWarnings([])}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
                    >
                      Đóng cảnh báo
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {aiWarnings.map((warn, wIdx) => (
                      <div
                        key={wIdx}
                        className="p-3 bg-white rounded-lg border border-amber-200/80 shadow-2xs space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                            {warn.vi_tri}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyWarningFix(warn, wIdx)}
                            className="px-2.5 py-1 bg-red-800 hover:bg-red-900 text-white rounded text-[11px] font-bold shadow-2xs transition flex items-center space-x-1"
                          >
                            <i className="fa-solid fa-check text-[10px]"></i>
                            <span>Chấp nhận sửa đổi</span>
                          </button>
                        </div>
                        <p className="text-gray-700 leading-snug">
                          <strong>Nhận xét:</strong> {warn.loi_nhan_xet}
                        </p>
                        <div className="p-2 bg-emerald-50 rounded border border-emerald-200/60 text-emerald-900 leading-snug">
                          <strong>Đề xuất sửa:</strong> {warn.de_xuat_sua}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Đoạn kết thúc công văn */}
              <div className="pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Đoạn kết luận &amp; Đề nghị phối hợp
                </label>
                <textarea
                  rows={2}
                  value={doc.closing}
                  onChange={(e) => onUpdateField('closing', e.target.value)}
                  className="w-full text-xs rounded-lg border-gray-300 focus:border-red-600 focus:ring-red-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* KHỐI 3: NƠI NHẬN & CHỮ KÝ (MẶC ĐỊNH KHÓA)                */}
        {/* ======================================================== */}
        <div
          id="block-step-3"
          className={`bg-white rounded-xl shadow-2xs overflow-hidden transition-all ${
            activeStep === 3
              ? 'border-2 border-red-700/60 ring-2 ring-red-200/50'
              : 'border border-gray-200'
          }`}
          data-purpose="accordion-signatures"
          onFocusCapture={() => onStepChange?.(3)}
        >
          <div
            onClick={() => {
              const next = !isBlock3Open;
              setIsBlock3Open(next);
              if (next) onStepChange?.(3);
            }}
            className="w-full px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-gray-800">
                  Nơi nhận &amp; Thẩm quyền ký duyệt
                </h2>
                <p className="text-xs text-gray-500">
                  {doc.signerRole} {doc.signerName} • {doc.distributionList.length} địa chỉ nơi nhận mặc định
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <i className="fa-solid fa-lock text-[10px] mr-1"></i> Mặc định đã khóa
              </span>
              <i
                className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${
                  isBlock3Open ? 'rotate-180' : ''
                }`}
              ></i>
            </div>
          </div>

          {isBlock3Open && (
            <div className="p-5 space-y-4 border-t border-gray-100 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nơi nhận mặc định */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center">
                      Danh sách nơi nhận (Cỡ 11, chữ đứng)
                      {!unlockedFields.distributionList && (
                        <i className="fa-solid fa-lock text-[10px] text-gray-400 ml-1.5" title="Dữ liệu chuẩn"></i>
                      )}
                    </label>
                    {!unlockedFields.distributionList ? (
                      <button
                        type="button"
                        onClick={() => onRequestUnlock('distributionList', 'Danh sách nơi nhận')}
                        className="text-[11px] text-red-800 hover:text-red-900 font-semibold"
                      >
                        Mở khóa sửa
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold">Đã mở khóa</span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    readOnly={!unlockedFields.distributionList}
                    value={doc.distributionList.join('\n')}
                    onChange={(e) =>
                      onUpdateField(
                        'distributionList',
                        e.target.value.split('\n').filter((l) => l.trim().length > 0)
                      )
                    }
                    onClick={() => {
                      if (!unlockedFields.distributionList) {
                        onRequestUnlock('distributionList', 'Danh sách nơi nhận');
                      }
                    }}
                    className={`w-full text-xs rounded-lg font-sans ${
                      !unlockedFields.distributionList
                        ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
                        : 'bg-white border-red-700 text-gray-900 ring-1 ring-red-200'
                    }`}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Chuẩn nơi nhận công văn của Trung tâm MSMV
                  </p>
                </div>

                {/* Người ký & Chức vụ */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center">
                        Chức danh ký (Cỡ 13-14, hoa, đậm)
                        {!unlockedFields.signerRole && (
                          <i className="fa-solid fa-lock text-[10px] text-gray-400 ml-1.5"></i>
                        )}
                      </label>
                      {!unlockedFields.signerRole ? (
                        <button
                          type="button"
                          onClick={() => onRequestUnlock('signerRole', 'Chức danh ký duyệt')}
                          className="text-[11px] text-red-800 hover:text-red-900 font-semibold"
                        >
                          Mở khóa sửa
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">Đã mở khóa</span>
                      )}
                    </div>
                    <input
                      type="text"
                      readOnly={!unlockedFields.signerRole}
                      value={doc.signerRole}
                      onChange={(e) => onUpdateField('signerRole', e.target.value)}
                      onClick={() => {
                        if (!unlockedFields.signerRole) {
                          onRequestUnlock('signerRole', 'Chức danh ký duyệt');
                        }
                      }}
                      className={`w-full text-xs rounded-lg font-bold ${
                        !unlockedFields.signerRole
                          ? 'bg-gray-100 border-gray-300 text-gray-800 cursor-not-allowed'
                          : 'bg-white border-red-700 text-gray-900 ring-1 ring-red-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center">
                        Họ và tên người ký (Cỡ 13-14, đậm)
                        {!unlockedFields.signerName && (
                          <i className="fa-solid fa-lock text-[10px] text-gray-400 ml-1.5"></i>
                        )}
                      </label>
                      {!unlockedFields.signerName ? (
                        <button
                          type="button"
                          onClick={() => onRequestUnlock('signerName', 'Họ tên người ký')}
                          className="text-[11px] text-red-800 hover:text-red-900 font-semibold"
                        >
                          Mở khóa sửa
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">Đã mở khóa</span>
                      )}
                    </div>
                    <input
                      type="text"
                      readOnly={!unlockedFields.signerName}
                      value={doc.signerName}
                      onChange={(e) => onUpdateField('signerName', e.target.value)}
                      onClick={() => {
                        if (!unlockedFields.signerName) {
                          onRequestUnlock('signerName', 'Họ tên người ký');
                        }
                      }}
                      className={`w-full text-xs rounded-lg font-bold ${
                        !unlockedFields.signerName
                          ? 'bg-gray-100 border-gray-300 text-gray-800 cursor-not-allowed'
                          : 'bg-white border-red-700 text-gray-900 ring-1 ring-red-200'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BEGIN: Sticky Bottom Action Bar */}
      <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] shrink-0 z-20">
        <div className="flex items-center space-x-2.5 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
            <span>Đã đồng bộ thời gian thực với bản in A4</span>
          </div>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-red-800 underline transition cursor-pointer"
            >
              Chính sách quyền riêng tư
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-red-800 underline transition cursor-pointer"
            >
              Điều khoản sử dụng
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap">
          {/* Nút: Khôi phục mẫu gốc (Nút phụ viền xám) */}
          <button
            type="button"
            onClick={onResetDefault}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            title="Khôi phục lại mẫu chuẩn ban đầu của Trung tâm MSMV"
          >
            <i className="fa-solid fa-rotate text-gray-400"></i>
            <span>Khôi phục mẫu gốc</span>
          </button>

          {/* Nút: 💾 Lưu dự thảo (Nút nền trắng viền xám nhẹ) */}
          <button
            type="button"
            onClick={onSaveToDrive}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition flex items-center space-x-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Lưu bản dự thảo này vào Google Drive cá nhân"
          >
            <i className="fa-regular fa-floppy-disk text-red-700 text-sm"></i>
            <span>💾 Lưu dự thảo</span>
          </button>

          {/* ============================================================== */}
          {/* CỤM NÚT HÀNH ĐỘNG ĐIỀU HƯỚNG ĐỘNG (DYNAMIC PRIMARY ACTION)      */}
          {/* ============================================================== */}

          {/* Bước 1: Tiếp tục sang Bước 2 */}
          {activeStep === 1 && (
            <button
              type="button"
              onClick={() => handleGoToStep(2)}
              className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-2 cursor-pointer active:scale-95"
              title="Chuyển sang Bước 2: Soạn thảo nội dung & Trợ lý AI"
            >
              <span>Tiếp tục: Soạn nội dung AI</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          )}

          {/* Bước 2: Nút phụ quay lại Bước 1 & Nút chính tiếp tục sang Bước 3 */}
          {activeStep === 2 && (
            <>
              <button
                type="button"
                onClick={() => handleGoToStep(1)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all duration-300 flex items-center space-x-1.5 shadow-2xs cursor-pointer active:scale-95"
                title="Quay lại Bước 1: Thể thức & Đơn vị"
              >
                <i className="fa-solid fa-arrow-left text-xs text-slate-500"></i>
                <span>Quay lại Thể thức</span>
              </button>
              <button
                type="button"
                onClick={() => handleGoToStep(3)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-2 cursor-pointer active:scale-95"
                title="Chuyển sang Bước 3: Ký duyệt & Hoàn thiện"
              >
                <span>Tiếp tục: Ký duyệt &amp; Hoàn thiện</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </>
          )}

          {/* Bước 3: Nút phụ quay lại Bước 2 & Nút chính Xuất file Word (.docx) */}
          {activeStep === 3 && (
            <>
              <button
                type="button"
                onClick={() => handleGoToStep(2)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all duration-300 flex items-center space-x-1.5 shadow-2xs cursor-pointer active:scale-95"
                title="Quay lại Bước 2: Soạn thảo Công văn AI"
              >
                <i className="fa-solid fa-arrow-left text-xs text-slate-500"></i>
                <span>Quay lại Soạn thảo</span>
              </button>
              <button
                type="button"
                onClick={onExportDocx || handleExportDocx}
                className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 cursor-pointer ring-2 ring-red-300 active:scale-95"
                title="Tải file Word (.docx) để in theo chuẩn Nghị định 30/2020/NĐ-CP"
              >
                <i className="fa-solid fa-file-word text-sm"></i>
                <span>Xuất file Word để in</span>
              </button>
            </>
          )}
        </div>
      </footer>
    </section>
  );
};
