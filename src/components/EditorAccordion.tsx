import React, { useState, useEffect, useRef } from 'react';
import { DocumentState, formatSubject, DEFAULT_PHIEU_TRINH_ATTACHMENTS } from '../utils/decree30Rules.ts';
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


interface PhieuTrinhFields {
  chiDao: string;
  tienDo: string;
  congViec: string;
  ketQua: string;
  yKienDonVi: string;
  deXuat: string;
  kienNghi: string;
}

function normalizePhieuTrinhSections(rawText: string): string {
  let text = (rawText || '').replace(/Trân trọng\.\/\./g, '').trim();

  text = text.replace(/([^\n])\s*(1\.\s*Tóm tắt nội dung công việc:?)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(2\.\s*Ý kiến của các đơn vị liên quan:?)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(3\.\s*Ý kiến của đơn vị trình:?)/gi, '$1\n$2');
  text = text.replace(/(1\.\s*Tóm tắt nội dung công việc:?)\s*(Thực hiện chỉ đạo)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(-\s*Về tiến độ thực hiện:)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(-\s*Về các công việc đã thực hiện:)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(-\s*Kết quả đạt được:)/gi, '$1\n$2');
  text = text.replace(/(2\.\s*Ý kiến của các đơn vị liên quan:?)\s*([^\n]+)/gi, (match, h, rest) => {
    if (rest.trim()) return `${h}\n${rest.trim()}`;
    return match;
  });
  text = text.replace(/(3\.\s*Ý kiến của đơn vị trình:?)\s*(a\)\s*Ý kiến đề xuất:?)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(b\)\s*Kiến nghị:?)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm)/gi, '$1\n$2');

  return text;
}

function parsePhieuTrinh(raw: string): PhieuTrinhFields {
  if (!raw) {
    return {
      chiDao: '',
      tienDo: '',
      congViec: '',
      ketQua: '',
      yKienDonVi: '',
      deXuat: '',
      kienNghi: '',
    };
  }

  let chiDao = '';
  const cdMatch = raw.match(/Thực hiện chỉ đạo của Lãnh đạo Trung tâm tại\s*([^\n\r]*?)(?=(?:\r?\n\s*-\s*Về|\r?\n\s*-\s*Kết quả|$))/i);
  if (cdMatch && cdMatch[1].trim() !== '...') chiDao = cdMatch[1].trim();

  let tienDo = '';
  const tdMatch = raw.match(/-\s*Về tiến độ thực hiện:\s*([^\n\r]*?)(?=(?:\r?\n\s*-\s*Về các công việc|\r?\n\s*-\s*Kết quả|$))/i);
  if (tdMatch && tdMatch[1].trim() !== '...') tienDo = tdMatch[1].trim();

  let congViec = '';
  const cvMatch = raw.match(/-\s*Về các công việc đã thực hiện:\s*([^\n\r]*?)(?=(?:\r?\n\s*-\s*Kết quả|\r?\n\s*2\.|$))/i);
  if (cvMatch && cvMatch[1].trim() !== '...') congViec = cvMatch[1].trim();

  let ketQua = '';
  const kqMatch = raw.match(/-\s*Kết quả đạt được:\s*([^\n\r]*?)(?=(?:\r?\n\s*2\.|\r?\n\s*3\.|$))/i);
  if (kqMatch && kqMatch[1].trim() !== '...') ketQua = kqMatch[1].trim();

  let yKienDonVi = '';
  const ykMatch = raw.match(/2\.\s*Ý kiến của các đơn vị liên quan:\s*([\s\S]*?)(?=(?:\r?\n\s*3\.\s*Ý kiến|$))/i);
  if (ykMatch) {
    const val = ykMatch[1].trim();
    if (!val.includes('Nội dung tóm tắt ý kiến')) yKienDonVi = val;
  }

  let deXuat = '';
  const dxMatch = raw.match(/a\)\s*Ý kiến đề xuất:\s*([\s\S]*?)(?=(?:\r?\n\s*b\)\s*Kiến nghị:|$))/i);
  if (dxMatch) {
    const val = dxMatch[1].trim();
    if (!val.includes('[Nêu rõ phương án')) deXuat = val;
  }

  let kienNghi = '';
  const knMatch = raw.match(/b\)\s*Kiến nghị:\s*([\s\S]*?)(?=(?:\r?\n\s*Phòng Kế hoạch Tài chính kính trình|$))/i);
  if (knMatch) {
    const val = knMatch[1].trim();
    if (!val.includes('[Nêu cụ thể')) kienNghi = val;
  }

  return { chiDao, tienDo, congViec, ketQua, yKienDonVi, deXuat, kienNghi };
}

function buildPhieuTrinh(data: PhieuTrinhFields): string {
  const cd = data.chiDao.trim() || '...';
  const td = data.tienDo.trim() || '...';
  const cv = data.congViec.trim() || '...';
  const kq = data.ketQua.trim() || '...';

  const m1 = `1. Tóm tắt nội dung công việc:\nThực hiện chỉ đạo của Lãnh đạo Trung tâm tại ${cd}\n- Về tiến độ thực hiện: ${td}\n- Về các công việc đã thực hiện: ${cv}\n- Kết quả đạt được: ${kq}`;

  const m2 = `2. Ý kiến của các đơn vị liên quan:\n${data.yKienDonVi.trim() || 'Nội dung tóm tắt ý kiến phối hợp/thống nhất của các đơn vị chuyên môn liên quan.'}`;

  const dx = data.deXuat.trim() || '[Nêu rõ phương án, giải pháp hoặc thẩm quyền xử lý]';
  const kn = data.kienNghi.trim() || '[Nêu cụ thể các kiến nghị đối với Lãnh đạo Trung tâm]';

  const m3 = `3. Ý kiến của đơn vị trình:\na) Ý kiến đề xuất: ${dx}\nb) Kiến nghị: ${kn}\nPhòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.`;

  return `${m1}\n\n${m2}\n\n${m3}`;
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

  // Check if current document is Phieu Trinh
  const isPhieuTrinh =
    doc.docType?.toLowerCase().includes('phiếu trình') ||
    doc.docType?.toLowerCase().includes('phieutrinh') ||
    doc.docType === 'phieutrinh';

  // Toggle view mode for Phieu Trinh: structured form vs full-text editor
  const [phieuTrinhViewMode, setPhieuTrinhViewMode] = useState<'structured' | 'fulltext'>('structured');

  // Structured subfields state for Phieu Trinh
  const [ptData, setPtData] = useState<PhieuTrinhFields>(() => parsePhieuTrinh(doc.content));

  const lastBuiltContentRef = useRef<string>('');

  // Sync ptData when doc.content changes externally (e.g. from AI or template load)
  useEffect(() => {
    if (isPhieuTrinh && doc.content) {
      if (doc.content !== lastBuiltContentRef.current) {
        lastBuiltContentRef.current = doc.content;
        setPtData(parsePhieuTrinh(doc.content));
      }
    }
  }, [doc.content, isPhieuTrinh]);

  // Handler for updating any subfield of Phieu Trinh (executed outside React state updater)
  const handleUpdatePtField = (field: keyof PhieuTrinhFields, value: string) => {
    const next = { ...ptData, [field]: value };
    setPtData(next);
    const built = buildPhieuTrinh(next);
    lastBuiltContentRef.current = built;
    onUpdateField('content', built);
  };

  // Attached documents view mode and state handlers for Phieu Trinh
  const [attachedViewMode, setAttachedViewMode] = useState<'list' | 'text'>('list');

  const attachedDocs: string[] = Array.isArray(doc.attachedDocuments) && doc.attachedDocuments.length > 0
    ? doc.attachedDocuments
    : DEFAULT_PHIEU_TRINH_ATTACHMENTS;

  const handleUpdateAttachedDoc = (index: number, val: string) => {
    const next = [...attachedDocs];
    next[index] = val;
    onUpdateField('attachedDocuments', next);
  };

  const handleAddAttachedDoc = () => {
    const next = [...attachedDocs, ''];
    onUpdateField('attachedDocuments', next);
  };

  const handleRemoveAttachedDoc = (index: number) => {
    if (attachedDocs.length <= 1) return;
    const next = attachedDocs.filter((_, idx) => idx !== index);
    onUpdateField('attachedDocuments', next);
  };

  const handleResetAttachedDocs = () => {
    onUpdateField('attachedDocuments', [...DEFAULT_PHIEU_TRINH_ATTACHMENTS]);
  };

  const handleTextareaAttachedChange = (text: string) => {
    const lines = text.split('\n');
    onUpdateField('attachedDocuments', lines);
  };

  const handlePasteAttachedDoc = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.includes('\n')) {
      e.preventDefault();
      const newItems = pastedText
        .split('\n')
        .map((s) => s.trim().replace(/^[-*•–—]\s*/, ''))
        .filter(Boolean);
      if (newItems.length > 0) {
        const next = [...attachedDocs];
        next.splice(index, 1, ...newItems);
        onUpdateField('attachedDocuments', next);
      }
    }
  };
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

  // Trigger Gemini AI processing (Full Document Rewrite & Refinement)
  const handleCallAI = async (mode: 'standardize' | 'audit' | 'suggest_msmv' | 'phieutrinh' = 'standardize') => {
    const hasPrompt = aiCustomPrompt && aiCustomPrompt.trim().length > 0;
    const hasExistingContent =
      (doc.content && doc.content.trim().length > 0) ||
      (doc.opening && doc.opening.trim().length > 0) ||
      (doc.subject && doc.subject.trim().length > 0);

    if (!hasPrompt && !hasExistingContent) {
      setIsBlock2Open(true);
      onNotify('⚠️ Vui lòng nhập yêu cầu vào ô chat Trợ lý AI hoặc điền nội dung dự thảo trước khi gửi.');
      return;
    }

    setAiValidationErrors({ opening: false, content: false });
    const aiEffectiveMode = isPhieuTrinh ? 'phieutrinh' : mode;
    setIsProcessingAI(true);
    setActiveAIMode(aiEffectiveMode);
    try {
      const response = await fetch('/api/ai/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: aiEffectiveMode,
          docType: doc.docType,
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
          const rawJoined = d.cac_y_kien_noi_dung.join('\n\n');
          const finalContent = isPhieuTrinh ? normalizePhieuTrinhSections(rawJoined) : rawJoined;
          onUpdateField('content', finalContent);
        }
        if (d.phan_ket_luan) {
          onUpdateField('closing', d.phan_ket_luan.replace(/Trân trọng\.\/\./g, '').trim());
        }
        if (d.can_cu_phap_ly && Array.isArray(d.can_cu_phap_ly) && d.can_cu_phap_ly.length > 0) {
          onUpdateField('legalBases', d.can_cu_phap_ly);
        }
        if (d.canh_bao_logic_va_ngu_phap && Array.isArray(d.canh_bao_logic_va_ngu_phap)) {
          setAiWarnings(d.canh_bao_logic_va_ngu_phap);
        }

        onNotify('✨ Trợ lý AI đã soạn thảo và đồng bộ toàn văn công văn thành công!');
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
            activeStep === 1 ? 'ring-2 ring-slate-300 border-2 border-slate-400' : 'border border-gray-200'
          }`}
          data-purpose="accordion-general-info"
          onFocusCapture={() => { if (activeStep !== 1) onStepChange?.(1); }}
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
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">
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
                        className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold"
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
                        : 'bg-white border-amber-600 text-gray-900 ring-1 ring-amber-200'
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
                        className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold"
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
                        : 'bg-white border-amber-600 text-gray-900 ring-1 ring-amber-200'
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
                      className="flex-1 min-w-0 block w-full px-3 py-1.5 text-xs border-gray-300 focus:ring-amber-600 focus:border-amber-600 font-medium"
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
                          className="absolute right-2 text-gray-400 hover:text-amber-800"
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

                {/* Document Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Loại hình văn bản
                  </label>
                  <div className="relative">
                    <select
                      value={isPhieuTrinh ? 'phieutrinh' : (doc.docType || 'congvan')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'phieutrinh') {
                          onUpdateField('docType', 'PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC');
                          if (!doc.docSymbol || doc.docSymbol === '/MSMV-KHTC') {
                            onUpdateField('docSymbol', '/PTr-MSMV');
                          }
                          if (!doc.recipient || doc.recipient === 'Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia') {
                            onUpdateField('recipient', 'Lãnh đạo Trung tâm');
                          }
                          if (!doc.opening || doc.opening.includes('Phúc đáp công văn số')) {
                            onUpdateField('opening', 'Kính gửi: Lãnh đạo Trung tâm Mã số, mã vạch Quốc gia');
                          }
                          if (!doc.closing || doc.closing.includes('Trung tâm Mã số')) {
                            onUpdateField('closing', 'Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.');
                          }
                          if (!doc.departmentHeadName) {
                            onUpdateField('departmentHeadName', 'Nguyễn Đắc Minh');
                          }
                          if (!doc.attachedDocuments || doc.attachedDocuments.length === 0) {
                            onUpdateField('attachedDocuments', [...DEFAULT_PHIEU_TRINH_ATTACHMENTS]);
                          }
                          if (!doc.content || doc.content.includes('nâng cấp máy chủ cơ sở dữ liệu')) {
                            const defaultPT = `1. Tóm tắt nội dung công việc:\nThực hiện chỉ đạo của Lãnh đạo Trung tâm tại ...\n- Về tiến độ thực hiện: ...\n- Về các công việc đã thực hiện: ...\n- Kết quả đạt được: ...\n\n2. Ý kiến của các đơn vị liên quan:\nNội dung tóm tắt ý kiến phối hợp/thống nhất của các đơn vị chuyên môn liên quan.\n\n3. Ý kiến của đơn vị trình:\na) Ý kiến đề xuất: [Nêu rõ phương án, giải pháp hoặc thẩm quyền xử lý]\nb) Kiến nghị: [Nêu cụ thể các kiến nghị đối với Lãnh đạo Trung tâm]\nPhòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.`;
                            onUpdateField('content', defaultPT);
                          }
                          onNotify('Đã chuyển sang mẫu: PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC');
                        } else if (val === 'congvan' || val === 'CÔNG VĂN HÀNH CHÍNH') {
                          onUpdateField('docType', 'CÔNG VĂN HÀNH CHÍNH');
                          if (doc.docSymbol === '/PTr-MSMV') onUpdateField('docSymbol', '/MSMV-KHTC');
                          onNotify('Đã chuyển sang mẫu: CÔNG VĂN HÀNH CHÍNH');
                        } else {
                          onUpdateField('docType', val);
                        }
                      }}
                      className="w-full text-xs rounded-lg bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-600 focus:ring-amber-200 text-slate-800 font-bold py-2 pl-3 pr-8 cursor-pointer shadow-2xs"
                    >
                      <option value="congvan">CÔNG VĂN HÀNH CHÍNH</option>
                      <option value="phieutrinh">PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC</option>
                      <option value="TỜ TRÌNH">TỜ TRÌNH</option>
                      <option value="QUYẾT ĐỊNH CÁ BIỆT">QUYẾT ĐỊNH CÁ BIỆT</option>
                      <option value="THÔNG BÁO NỘI BỘ">THÔNG BÁO NỘI BỘ</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium mt-1">
                    {isPhieuTrinh ? '✓ Đang kích hoạt cấu trúc Phiếu trình chuẩn NĐ 30/2020' : '✓ Chuẩn thể thức văn bản hành chính Nghị định 30/2020/NĐ-CP'}
                  </p>
                </div>
              </div>

              {/* Row 3: Các trường nội dung đầu văn bản (Kính gửi, Vấn đề trình, Tài liệu kèm theo) */}
              {isPhieuTrinh ? (
                /* ======================================================== */
                /* THỨ TỰ NHẬP LIỆU PHIẾU TRÌNH CHUẨN KHỚP BẢN IN A4         */
                /* ======================================================== */
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  {/* VỊ TRÍ 1: Kính gửi */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center">
                        <i className="fa-solid fa-envelope-open-text text-amber-700 mr-1.5"></i>
                        1. Kính gửi (Cỡ 13-14, chữ đứng, căn giữa dưới tiêu đề Phiếu trình)
                      </label>
                      <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Mặc định: Lãnh đạo Trung tâm
                      </span>
                    </div>
                    <input
                      type="text"
                      value={doc.recipient || ''}
                      onChange={(e) => onUpdateField('recipient', e.target.value)}
                      placeholder="Lãnh đạo Trung tâm"
                      className="w-full text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-600 font-semibold px-3 py-2 bg-white text-slate-800 shadow-2xs"
                    />
                  </div>

                  {/* VỊ TRÍ 2: Vấn đề trình */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center">
                        <i className="fa-solid fa-file-pen text-amber-700 mr-1.5"></i>
                        2. Vấn đề trình (Nội dung trình Lãnh đạo Trung tâm giải quyết)
                      </label>
                      <span className="text-[10px] text-slate-500 italic">
                        Thụt đầu dòng 1.27cm trên bản in
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={doc.subject}
                      onChange={(e) => onUpdateField('subject', e.target.value)}
                      placeholder="Nhập vấn đề trình (VD: Phê duyệt phương án thẩm định và ban hành văn bản hướng dẫn)..."
                      className="w-full text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-600 font-normal px-3 py-2 bg-white text-slate-800 shadow-2xs resize-none leading-relaxed"
                    />
                  </div>

                  {/* VỊ TRÍ 3: Tài liệu kèm theo */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center">
                        <i className="fa-solid fa-paperclip text-amber-700 mr-1.5"></i>
                        3. Tài liệu kèm theo (Mỗi dòng 1 tài liệu)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {/* Toggle mode: list vs textarea */}
                        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setAttachedViewMode('list')}
                            className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                              attachedViewMode === 'list'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <i className="fa-solid fa-list-ul mr-1"></i> Từng mục
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttachedViewMode('text')}
                            className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                              attachedViewMode === 'text'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <i className="fa-solid fa-align-left mr-1"></i> Soạn nhiều dòng
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleResetAttachedDocs}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/50 transition cursor-pointer"
                          title="Khôi phục 4 mục tài liệu mẫu ban đầu"
                        >
                          Khôi phục mẫu
                        </button>

                        <button
                          type="button"
                          onClick={handleAddAttachedDoc}
                          className="inline-flex items-center text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded-lg shadow-2xs transition cursor-pointer"
                        >
                          <i className="fa-solid fa-plus text-[10px] mr-1 text-amber-400"></i>
                          Thêm tài liệu
                        </button>
                      </div>
                    </div>

                    {attachedViewMode === 'list' ? (
                      /* Dynamic List Mode */
                      <div className="space-y-1.5">
                        {attachedDocs.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span className="text-slate-400 font-bold text-xs select-none pl-1 w-3 text-center">-</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleUpdateAttachedDoc(idx, e.target.value)}
                              onPaste={(e) => handlePasteAttachedDoc(idx, e)}
                              placeholder={`Tài liệu ${idx + 1}...`}
                              className="flex-1 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-600 px-2.5 py-1.5 bg-white text-slate-800 shadow-2xs"
                            />
                            {attachedDocs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachedDoc(idx)}
                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="Xóa dòng tài liệu này"
                              >
                                <i className="fa-solid fa-xmark text-xs"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Textarea Mode */
                      <div>
                        <textarea
                          rows={4}
                          value={attachedDocs.join('\n')}
                          onChange={(e) => handleTextareaAttachedChange(e.target.value)}
                          placeholder="Nhập mỗi tài liệu trên một dòng..."
                          className="w-full text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-600 font-normal px-3 py-2 bg-white text-slate-800 shadow-2xs leading-relaxed custom-scrollbar"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span className="italic flex items-center">
                        <i className="fa-solid fa-wand-magic-sparkles text-amber-600 mr-1"></i>
                        Tự động thêm dấu chấm phẩy (;) ở các dòng giữa và dấu chấm (.) ở dòng cuối khi in / xuất Word.
                      </span>
                      <span className="font-mono text-slate-400">
                        {attachedDocs.filter((s) => s.trim().length > 0).length} tài liệu
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* BỐ CỤC CÔNG VĂN ĐI NGHỊ ĐỊNH 30 */
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Trích yếu nội dung (V/v) - Cỡ 12, chữ đứng, căn giữa, cách dòng single (0, 0)
                    </label>
                    <input
                      type="text"
                      value={doc.subject}
                      onChange={(e) => onUpdateField('subject', e.target.value)}
                      placeholder="V/v ..."
                      className="w-full text-xs rounded-lg border-gray-300 focus:ring-amber-600 focus:border-amber-600 font-normal text-center"
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
                      className="w-full text-xs rounded-lg border-gray-300 focus:ring-amber-600 focus:border-amber-600"
                    />
                  </div>
                </div>
              )}
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
              ? 'border-2 border-slate-300 ring-2 ring-slate-100 shadow-sm'
              : 'border border-gray-200'
          }`}
          data-purpose="accordion-body-content"
          onFocusCapture={() => { if (activeStep !== 2) onStepChange?.(2); }}
        >
          {/* Active Section Header */}
          <div
            onClick={() => {
              const next = !isBlock2Open;
              setIsBlock2Open(next);
              if (next) onStepChange?.(2);
            }}
            className="px-5 py-3.5 bg-gradient-to-r from-slate-100 to-white flex items-center justify-between border-b border-slate-200 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold shadow-2xs">
                2
              </div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Nội dung thân công văn &amp; Trợ lý AI
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
                  Đang soạn thảo
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBlock2Open(true);
                  setTimeout(() => {
                    document.getElementById('ai-chat-prompt-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const input = document.querySelector('#ai-chat-prompt-box textarea') as HTMLTextAreaElement | null;
                    if (input) input.focus();
                  }, 80);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-lg transition shadow-2xs cursor-pointer border border-slate-700"
                title="Cuộn nhanh tới khung Chat Gemini AI"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                <span>Trợ lý AI</span>
              </button>
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
              {/* Đoạn mở đầu công văn (Dẫn chiếu công văn đến) - Nổi bật, nền trắng, viền rõ, có icon bút chì */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                      <i className="fa-solid fa-feather-pointed"></i>
                    </span>
                    <span>Đoạn mở đầu công văn (Dẫn chiếu công văn đến)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplySampleOpening}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 cursor-pointer transition shadow-2xs"
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
                        ? 'border-2 border-amber-600 ring-2 ring-amber-100 bg-amber-50/20'
                        : 'border border-slate-300 hover:border-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-100'
                    }`}
                  />
                  {/* Icon chiếc bút chì nhỏ ở góc phải trên của ô để nhấn mạnh tính năng cho phép nhập liệu */}
                  <div
                    className="absolute top-3 right-3 text-slate-400 group-hover:text-amber-700 transition pointer-events-none p-0.5"
                    title="Ô nhập liệu cho phép chỉnh sửa"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </div>
                </div>
                {aiValidationErrors.opening && (
                  <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1.5 mt-1 animate-in fade-in duration-150">
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
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium transition cursor-pointer"
                    >
                      <i className="fa-solid fa-scale-balanced text-[10px] text-slate-400"></i>
                      <span>{base}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Main Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                    <i className="fa-solid fa-pen-nib text-amber-800 mr-1.5"></i>
                    {isPhieuTrinh ? 'Nội dung Phiếu trình giải quyết công việc' : 'Nội dung các điểm / điều khoản'}
                  </label>
                  {isPhieuTrinh && (
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPhieuTrinhViewMode('structured')}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                          phieuTrinhViewMode === 'structured'
                            ? 'bg-white text-amber-900 shadow-2xs border border-amber-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <i className="fa-solid fa-table-list text-[10px]"></i>
                        <span>Khung cấu trúc (Mục 1, 2, 3)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhieuTrinhViewMode('fulltext')}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                          phieuTrinhViewMode === 'fulltext'
                            ? 'bg-white text-amber-900 shadow-2xs border border-amber-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                        <span>Soạn thảo tự do</span>
                      </button>
                    </div>
                  )}
                  {!isPhieuTrinh && (
                    <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                      Font Times New Roman • Căn đều 2 bên
                    </span>
                  )}
                </div>

                {isPhieuTrinh && phieuTrinhViewMode === 'structured' ? (
                  /* ========================================================= */
                  /* KHUNG SOẠN THẢO CẤU TRÚC CHI TIẾT CHO PHIẾU TRÌNH         */
                  /* ========================================================= */
                  <div className="space-y-3.5 bg-gradient-to-b from-slate-50/80 to-amber-50/20 p-3 sm:p-4 rounded-xl border border-amber-200/80 shadow-2xs">
                    {/* MỤC 1: TÓM TẮT NỘI DUNG CÔNG VIỆC */}
                    <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-amber-400 font-bold text-[10px] flex items-center justify-center">1</span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">1. Tóm tắt nội dung công việc</h4>
                        </div>
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          4 nhánh bắt buộc
                        </span>
                      </div>

                      {/* 1.1 Câu dẫn đầu */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Câu dẫn đầu chỉ đạo của Lãnh đạo Trung tâm:
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                          <span className="text-[11px] text-slate-700 font-semibold shrink-0 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 select-none">
                            Thực hiện chỉ đạo của Lãnh đạo Trung tâm tại:
                          </span>
                          <input
                            type="text"
                            value={ptData.chiDao}
                            onChange={(e) => handleUpdatePtField('chiDao', e.target.value)}
                            placeholder="Thông báo kết luận số 45/TB-MSMV ngày 10/10/2026..."
                            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800"
                          />
                        </div>
                      </div>

                      {/* 1.2 Tiến độ thực hiện */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="text-amber-800 font-bold">•</span>
                          <span>Về tiến độ thực hiện:</span>
                        </label>
                        <textarea
                          rows={2}
                          value={ptData.tienDo}
                          onChange={(e) => handleUpdatePtField('tienDo', e.target.value)}
                          placeholder="Nêu rõ tiến độ thực hiện nhiệm vụ (đúng hạn, trước hạn hay đang triển khai theo kế hoạch)..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800 leading-relaxed"
                        />
                      </div>

                      {/* 1.3 Công việc đã thực hiện */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="text-amber-800 font-bold">•</span>
                          <span>Về các công việc đã thực hiện:</span>
                        </label>
                        <textarea
                          rows={2}
                          value={ptData.congViec}
                          onChange={(e) => handleUpdatePtField('congViec', e.target.value)}
                          placeholder="Liệt kê chi tiết các công việc đã triển khai, dự thảo văn bản hoặc hồ sơ kỹ thuật đã xử lý..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800 leading-relaxed"
                        />
                      </div>

                      {/* 1.4 Kết quả đạt được */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="text-amber-800 font-bold">•</span>
                          <span>Kết quả đạt được:</span>
                        </label>
                        <textarea
                          rows={2}
                          value={ptData.ketQua}
                          onChange={(e) => handleUpdatePtField('ketQua', e.target.value)}
                          placeholder="Nêu rõ các kết quả, sản phẩm, dữ liệu hoặc số liệu cụ thể đạt được..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800 leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* MỤC 2: Ý KIẾN CỦA CÁC ĐƠN VỊ LIÊN QUAN */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                        <span className="w-5 h-5 rounded-md bg-slate-900 text-amber-400 font-bold text-[10px] flex items-center justify-center">2</span>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">2. Ý kiến của các đơn vị liên quan:</h4>
                      </div>
                      <textarea
                        rows={2}
                        value={ptData.yKienDonVi}
                        onChange={(e) => handleUpdatePtField('yKienDonVi', e.target.value)}
                        placeholder="Nội dung tóm tắt ý kiến phối hợp/thống nhất của các đơn vị chuyên môn liên quan..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800 leading-relaxed"
                      />
                    </div>

                    {/* MỤC 3: Ý KIẾN CỦA ĐƠN VỊ TRÌNH */}
                    <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-amber-400 font-bold text-[10px] flex items-center justify-center">3</span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">3. Ý kiến của đơn vị trình:</h4>
                        </div>
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Đề xuất &amp; Kiến nghị
                        </span>
                      </div>

                      {/* 3.a Ý kiến đề xuất */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="text-amber-800 font-bold">a)</span>
                          <span>Ý kiến đề xuất (phương án, giải pháp hoặc thẩm quyền xử lý):</span>
                        </label>
                        <textarea
                          rows={2}
                          value={ptData.deXuat}
                          onChange={(e) => handleUpdatePtField('deXuat', e.target.value)}
                          placeholder="a) Ý kiến đề xuất: [Nêu rõ phương án, giải pháp hoặc thẩm quyền xử lý]"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800 leading-relaxed"
                        />
                      </div>

                      {/* 3.b Kiến nghị */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="text-amber-800 font-bold">b)</span>
                          <span>Kiến nghị (nêu cụ thể các kiến nghị đối với Lãnh đạo Trung tâm):</span>
                        </label>
                        <textarea
                          rows={2}
                          value={ptData.kienNghi}
                          onChange={(e) => handleUpdatePtField('kienNghi', e.target.value)}
                          placeholder="b) Kiến nghị: [Nêu cụ thể các kiến nghị đối với Lãnh đạo Trung tâm]"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-amber-600 focus:ring-amber-200 text-slate-800 leading-relaxed"
                        />
                      </div>

                      {/* Câu kết chuẩn cố định của Mục 3 */}
                      <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2">
                        <i className="fa-solid fa-circle-check text-amber-700 text-xs mt-0.5"></i>
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 block">Câu kết chuẩn NĐ 30 đã tích hợp tự động:</span>
                          <p className="text-xs text-amber-900 italic mt-0.5 font-medium">
                            &quot;Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                  className={`rounded-xl overflow-hidden bg-white shadow-2xs transition-all ${
                    aiValidationErrors.content
                      ? 'border-2 border-amber-600 ring-2 ring-amber-100 bg-amber-50/10'
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
                        className="p-1.5 hover:bg-gray-200 rounded text-slate-700 font-semibold"
                        title="Thụt lề chuẩn 1.27cm"
                      >
                        <i className="fa-solid fa-indent"></i>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-1.5 hover:bg-gray-200 rounded text-slate-800 font-bold"
                        title="Căn đều 2 bên (Justified) theo NĐ 30"
                      >
                        <i className="fa-solid fa-align-justify"></i>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('ai-chat-prompt-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          const input = document.querySelector('#ai-chat-prompt-box textarea') as HTMLTextAreaElement | null;
                          if (input) input.focus();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-lg transition cursor-pointer shadow-2xs"
                        title="Cuộn tới Trợ lý AI ở cuối khối để viết lại toàn bộ hoặc tinh chỉnh"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-amber-700"></i>
                        <span>Viết lại với Gemini AI</span>
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
                    <div className="bg-amber-50 border-t border-amber-200 px-3 py-1.5 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                      <i className="fa-solid fa-triangle-exclamation text-xs text-amber-500"></i>
                      <span>Vui lòng gõ ít nhất 1 - 2 ý chính hoặc gạch đầu dòng nháp về nội dung cần giải quyết.</span>
                    </div>
                  )}
                </div>
                )}
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
                          <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            {warn.vi_tri}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyWarningFix(warn, wIdx)}
                            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-bold shadow-2xs transition flex items-center space-x-1"
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
                  className="w-full text-xs rounded-lg border-gray-300 focus:border-amber-600 focus:ring-amber-200"
                />
              </div>
              {/* ============================================================== */}
              {/* KHUNG CHAT COMMAND AI TINH GỌN DƯỚI CÙNG (CHAT PROMPT BOX)    */}
              {/* ============================================================== */}
              <div className="pt-3 border-t border-slate-200" id="ai-chat-prompt-box">
                <div className="bg-gradient-to-r from-slate-50 to-amber-50/50 border border-amber-200/80 rounded-2xl p-3 shadow-2xs space-y-2 focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center text-[10px] shadow-xs">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </span>
                      <span className="text-xs font-bold text-slate-800 tracking-tight">
                        Trợ lý AI - Viết lại toàn bộ &amp; Tinh chỉnh
                      </span>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 hidden sm:inline">
                        {isPhieuTrinh ? 'Gemini AI • Phiếu trình NĐ 30' : 'Gemini AI • Nghị định 30'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                      Nhấn Enter để gửi lệnh
                    </span>
                  </div>

                  <div className="relative flex items-center bg-white rounded-xl border border-slate-300 shadow-2xs pl-3 pr-1.5 py-1 focus-within:border-amber-600 transition">
                    <textarea
                      rows={2}
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isProcessingAI) {
                          e.preventDefault();
                          handleCallAI(isPhieuTrinh ? 'phieutrinh' : 'standardize');
                        }
                      }}
                      placeholder={
                        isPhieuTrinh
                          ? "Nhập yêu cầu để AI tự động phân bổ vào 4 nhánh Mục 1 và 2 nhánh Mục 3 của Phiếu trình (VD: Ghi nhận kết quả thẩm định ngày 20/10, tiến độ đúng hạn và kiến nghị Lãnh đạo ký ban hành...)"
                          : "Nhập yêu cầu để AI viết lại toàn bộ hoặc tinh chỉnh (VD: Viết lại toàn bộ công văn theo hướng khẩn trương, bổ sung căn cứ pháp lý và thời hạn bàn giao...)"
                      }
                      className="w-full text-xs text-slate-800 placeholder:text-slate-400 placeholder:italic outline-none resize-none font-normal leading-relaxed custom-scrollbar py-1"
                    />

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      {aiCustomPrompt && !isProcessingAI && (
                        <button
                          type="button"
                          onClick={() => setAiCustomPrompt('')}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-xs"
                          title="Xóa yêu cầu"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isProcessingAI}
                        onClick={() => handleCallAI(isPhieuTrinh ? 'phieutrinh' : 'standardize')}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isProcessingAI
                            ? 'bg-amber-600 text-white'
                            : aiCustomPrompt.trim()
                            ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-700/20 ring-1 ring-amber-600'
                            : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700'
                        }`}
                        title={isProcessingAI ? 'Đang soạn thảo...' : 'Gửi yêu cầu tới Trợ lý AI (Enter)'}
                      >
                        {isProcessingAI ? (
                          <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                        ) : (
                          <i className="fa-solid fa-paper-plane text-xs"></i>
                        )}
                      </button>
                    </div>
                  </div>

                  {isProcessingAI && (
                    <div className="flex items-center space-x-2 text-[11px] text-amber-800 font-semibold px-2 animate-pulse">
                      <i className="fa-solid fa-spinner fa-spin text-amber-600 text-xs"></i>
                      <span>Trợ lý AI đang phân tích toàn văn và soạn thảo đồng bộ...</span>
                    </div>
                  )}
                </div>
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
              ? 'border-2 border-slate-300 ring-2 ring-slate-100 shadow-sm'
              : 'border border-gray-200'
          }`}
          data-purpose="accordion-signatures"
          onFocusCapture={() => { if (activeStep !== 3) onStepChange?.(3); }}
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
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-gray-800">
                  {isPhieuTrinh ? 'Đơn vị trình & Cán bộ ký xác nhận' : 'Nơi nhận & Thẩm quyền ký duyệt'}
                </h2>
                <p className="text-xs text-gray-500">
                  {isPhieuTrinh
                    ? `Chuyên viên & Trưởng phòng: ${doc.departmentHeadName || 'Nguyễn Đắc Minh'} • Nơi nhận: Lãnh đạo Trung tâm`
                    : `${doc.signerRole} ${doc.signerName} • ${doc.distributionList.length} địa chỉ nơi nhận mặc định`}
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
              {isPhieuTrinh ? (
                /* PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC: Chỉ hiển thị 2 ô nhập họ tên */
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-circle-info text-amber-600 shrink-0"></i>
                      <span>
                        Ý kiến phê duyệt của Giám đốc/Lãnh đạo Trung tâm đã nằm ở khung bút phê phía trên. Phần cuối phiếu chỉ là phần xác nhận của đơn vị trình.
                      </span>
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-amber-200 shadow-2xs shrink-0 self-start sm:self-auto">
                      4. Nơi nhận: Lãnh đạo Trung tâm
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ô 1: Họ và tên Chuyên viên */}
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Họ và tên Chuyên viên (Cột trái)
                      </label>
                      <input
                        type="text"
                        value={doc.staffSignerName || ''}
                        onChange={(e) => onUpdateField('staffSignerName', e.target.value)}
                        placeholder="Nhập họ và tên chuyên viên soạn thảo..."
                        className="w-full text-xs rounded-lg font-medium bg-white border border-gray-300 text-gray-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-200 px-3 py-2 transition"
                      />
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        In đậm bên dưới chữ ký chuyên viên ở cuối phiếu
                      </p>
                    </div>

                    {/* Ô 2: Họ và tên Trưởng phòng (Mặc định: Nguyễn Đắc Minh) */}
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Họ và tên Trưởng phòng (Cột phải)
                      </label>
                      <input
                        type="text"
                        value={doc.departmentHeadName ?? 'Nguyễn Đắc Minh'}
                        onChange={(e) => onUpdateField('departmentHeadName', e.target.value)}
                        placeholder="Nguyễn Đắc Minh"
                        className="w-full text-xs rounded-lg font-bold bg-white border border-gray-300 text-gray-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-200 px-3 py-2 transition"
                      />
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Mặc định hiển thị: <strong className="text-slate-700">Nguyễn Đắc Minh</strong> (có thể chỉnh sửa khi cần)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* LAYOUT TIÊU CHUẨN CÔNG VĂN ĐI NĐ 30 */
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
                          className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold"
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
                          : 'bg-white border-amber-600 text-gray-900 ring-1 ring-amber-200'
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
                            className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold"
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
                            : 'bg-white border-amber-600 text-gray-900 ring-1 ring-amber-200'
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
                            className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold"
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
                            : 'bg-white border-amber-600 text-gray-900 ring-1 ring-amber-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
