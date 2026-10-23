import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentState,
  formatAttachedDocuments,
  DEFAULT_BUDGET_ITEMS,
  DEFAULT_ARTICLE_2,
  DEFAULT_ARTICLE_3,
  formatVND,
  numberToVietnameseWords,
} from '../utils/decree30Rules.ts';

interface A4PreviewProps {
  document: DocumentState;
}

/**
 * Normalizes Phieu Trinh text to guarantee individual line breaks
 * between every heading, bullet, and sub-item.
 */
function normalizePhieuTrinhSections(rawText: string): string {
  let text = (rawText || '').replace(/Trân trọng\.\/\./g, '').trim();

  // Ensure line breaks before main section headings
  text = text.replace(/([^\n])\s*(1\.\s*Tóm tắt nội dung công việc:?)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(2\.\s*Ý kiến của các đơn vị liên quan:?)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(3\.\s*Ý kiến của đơn vị trình:?)/gi, '$1\n$2');

  // Ensure line break after section 1 heading if lead sentence is attached
  text = text.replace(/(1\.\s*Tóm tắt nội dung công việc:?)\s*(Thực hiện chỉ đạo)/gi, '$1\n$2');

  // Ensure line break before each sub bullet in Section 1
  text = text.replace(/([^\n])\s*(-\s*Về tiến độ thực hiện:)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(-\s*Về các công việc đã thực hiện:)/gi, '$1\n$2');
  text = text.replace(/([^\n])\s*(-\s*Kết quả đạt được:)/gi, '$1\n$2');

  // Ensure line break after section 2 heading
  text = text.replace(/(2\.\s*Ý kiến của các đơn vị liên quan:?)\s*([^\n]+)/gi, (match, h, rest) => {
    if (rest.trim()) return `${h}\n${rest.trim()}`;
    return match;
  });

  // Ensure line break after section 3 heading
  text = text.replace(/(3\.\s*Ý kiến của đơn vị trình:?)\s*(a\)\s*Ý kiến đề xuất:?)/gi, '$1\n$2');

  // Ensure line break before b) Kiến nghị:
  text = text.replace(/([^\n])\s*(b\)\s*Kiến nghị:?)/gi, '$1\n$2');

  // Ensure line break before final closing sentence
  text = text.replace(/([^\n])\s*(Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm)/gi, '$1\n$2');

  return text;
}

export const A4Preview: React.FC<A4PreviewProps> = ({ document: doc }) => {
  // Default zoom 65% ensures 794px A4 sheet renders at ~516px, fitting nicely into 38%-40% column
  const [zoomLevel, setZoomLevel] = useState<number>(65);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 5, 120));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 5, 45));
  const handleResetZoom = () => setZoomLevel(65);
  const handleActualSize = () => setZoomLevel(100);

  // Check if current document is Phieu Trinh
  const isPhieuTrinh =
    doc.docType?.toLowerCase().includes('phiếu trình') ||
    doc.docType?.toLowerCase().includes('phieutrinh') ||
    doc.docType === 'phieutrinh';

  // Check if current document is Quyet Dinh Phe Duyet Du Toan
  const isQuyetDinhDuToan =
    doc.docType?.toLowerCase().includes('dự toán') ||
    doc.docType?.toLowerCase().includes('dutoan') ||
    doc.docType === 'quyetdinh_dutoan';

  const budgetItems = doc.budgetEstimate?.items && doc.budgetEstimate.items.length > 0
    ? doc.budgetEstimate.items
    : DEFAULT_BUDGET_ITEMS;

  const calculatedBudgetTotal = budgetItems.reduce(
    (sum, it) => sum + (Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
    0
  );
  const budgetTotalAmount = doc.budgetEstimate?.totalAmount || calculatedBudgetTotal;
  const budgetWords = doc.budgetEstimate?.totalAmountWords || numberToVietnameseWords(budgetTotalAmount);

  // Format subject without duplicate V/v
  const displaySubject = doc.subject.replace(/^V\/v\s*:?\s*/i, '');

  // Format recipient for Phieu Trinh
  const phieuTrinhRecipient = doc.recipient?.trim()
    ? (doc.recipient.trim().toLowerCase().startsWith('kính gửi')
        ? doc.recipient.trim()
        : `Kính gửi: ${doc.recipient.trim()}`)
    : 'Kính gửi: Lãnh đạo Trung tâm';

  // Format attached documents list with Decree 30 punctuation (- item; ... - item.)
  const formattedAttachedDocs = formatAttachedDocuments(doc.attachedDocuments);

  // Split paragraphs for regular Cong Van
  const contentParagraphs = (doc.content || '')
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const scale = zoomLevel / 100;
  const A4_WIDTH_PX = 794;
  const A4_MIN_HEIGHT_PX = 1123; // 297mm in pixels at 96 DPI

  // Dynamic height calculation for multi-page document support
  const articleRef = useRef<HTMLElement>(null);
  const [actualHeight, setActualHeight] = useState<number>(A4_MIN_HEIGHT_PX);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const updateHeight = () => {
      if (el) {
        // Measure real content height to allow natural expansion beyond 1 page
        const h = Math.max(el.scrollHeight, A4_MIN_HEIGHT_PX);
        setActualHeight(h);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [doc]);

  /**
   * Render Phieu Trinh structured body lines with whitespace-pre-line and dedicated paragraphs
   */
  const renderPhieuTrinhContent = () => {
    const rawText = doc.content || `1. Tóm tắt nội dung công việc:
Thực hiện chỉ đạo của Lãnh đạo Trung tâm tại ...
- Về tiến độ thực hiện: ...
- Về các công việc đã thực hiện: ...
- Kết quả đạt được: ...

2. Ý kiến của các đơn vị liên quan:
Nội dung tóm tắt ý kiến phối hợp/thống nhất của các đơn vị chuyên môn liên quan.

3. Ý kiến của đơn vị trình:
a) Ý kiến đề xuất: [Nêu rõ phương án, giải pháp hoặc thẩm quyền xử lý]
b) Kiến nghị: [Nêu cụ thể các kiến nghị đối với Lãnh đạo Trung tâm]
Phòng Kế hoạch Tài chính kính trình Lãnh đạo Trung tâm xem xét, cho ý kiến chỉ đạo và ký Công văn ....../.`;

    const normalized = normalizePhieuTrinhSections(rawText);
    const lines = normalized.split('\n');

    return (
      <div style={{ fontSize: '15px', lineHeight: '1.45' }} className="space-y-1.5 text-black text-justify mt-3 select-text whitespace-pre-line">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1"></div>;
          }

          // Section Headings: 1. Tóm tắt nội dung công việc, 2. Ý kiến..., 3. Ý kiến...
          if (/^[123]\.\s+/.test(trimmed)) {
            return (
              <p key={idx} className="font-bold text-black mt-2.5 mb-1 text-left whitespace-pre-line">
                {trimmed}
              </p>
            );
          }

          // Sub letter items: a) Ý kiến đề xuất: ..., b) Kiến nghị: ...
          const subMatch = trimmed.match(/^([ab]\)\s*[^:]+:?)(.*)$/i);
          if (subMatch) {
            return (
              <p key={idx} style={{ paddingLeft: '0.6cm' }} className="leading-relaxed whitespace-pre-line">
                <strong>{subMatch[1]}</strong>
                {subMatch[2]}
              </p>
            );
          }

          // Bullets: - Về tiến độ..., - Về các công việc..., - Kết quả đạt được...
          const bulletMatch = trimmed.match(/^(-\s*[^:]+:)(.*)$/);
          if (bulletMatch) {
            return (
              <p key={idx} style={{ paddingLeft: '0.6cm' }} className="leading-relaxed whitespace-pre-line">
                <strong>{bulletMatch[1]}</strong>
                {bulletMatch[2]}
              </p>
            );
          }

          // Generic dash bullet
          if (trimmed.startsWith('-')) {
            return (
              <p key={idx} style={{ paddingLeft: '0.6cm' }} className="leading-relaxed whitespace-pre-line">
                {trimmed}
              </p>
            );
          }

          // Final closing sentence
          if (trimmed.includes('Phòng Kế hoạch Tài chính kính trình Lãnh đạo')) {
            return (
              <p key={idx} style={{ textIndent: '1.27cm' }} className="leading-relaxed mt-2.5 font-normal whitespace-pre-line">
                {trimmed}
              </p>
            );
          }

          // Standard paragraph
          return (
            <p key={idx} style={{ textIndent: '1.27cm' }} className="leading-relaxed whitespace-pre-line">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  /**
   * Render Legal bases for Quyết định phê duyệt dự toán
   */
  const renderQuyetDinhLegalBases = () => {
    const bases = doc.legalBases && doc.legalBases.length > 0
      ? doc.legalBases
      : [
          'Luật Ngân sách nhà nước số 83/2015/QH13 ngày 25 tháng 6 năm 2015',
          'Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư',
          'Quyết định số 128/QĐ-TĐC ngày 28 tháng 02 năm 2024 của Tổng cục Tiêu chuẩn Đo lường Chất lượng quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Trung tâm Mã số, mã vạch Quốc gia',
          'Quyết định giao quyền tự chủ tài chính cho Trung tâm Mã số, mã vạch Quốc gia',
          'Theo đề nghị của Trưởng phòng Phòng Kế hoạch Tài chính',
        ];

    return (
      <div className="space-y-1 my-2.5 text-justify select-text">
        {bases.map((base, idx) => {
          let clean = base.trim();
          if (!clean.startsWith('Căn cứ') && !clean.startsWith('Theo')) {
            clean = `Căn cứ ${clean}`;
          }
          const isLast = idx === bases.length - 1;
          clean = clean.replace(/[;.]+$/, '') + (isLast ? '.' : ';');

          return (
            <p key={idx} style={{ textIndent: '1.27cm', fontSize: '14.5px', lineHeight: '1.4' }} className="italic text-black text-justify">
              {clean}
            </p>
          );
        })}
      </div>
    );
  };

  /**
   * Render Body of Quyết định (3 Điều) - Tự động sinh dựa trên thông số (Single Source of Truth)
   */
  const renderQuyetDinhContent = () => {
    const taskName = doc.budgetEstimate?.taskName || doc.subject || 'nhiệm vụ chuyên môn năm 2026';
    const implementingUnit = doc.budgetEstimate?.implementingUnit || 'Phòng Kế hoạch Tài chính chủ trì, phối hợp với các đơn vị liên quan';
    const fundingSource = doc.budgetEstimate?.fundingSource || 'Nguồn thu hoạt động sự nghiệp của Trung tâm';
    const implementationTime = doc.budgetEstimate?.implementationTime || 'Quý IV năm 2026';
    const article2Text = doc.budgetEstimate?.customArticle2 || DEFAULT_ARTICLE_2;
    const article3Text = doc.budgetEstimate?.customArticle3 || DEFAULT_ARTICLE_3;

    return (
      <div style={{ fontSize: '15px', lineHeight: '1.45' }} className="space-y-1.5 text-black text-justify select-text whitespace-pre-line">
        {/* Điều 1: Ghép chuỗi chuẩn xác từ các ô thông số */}
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed mt-2.5 mb-1 text-justify">
          <strong>Điều 1.</strong> Phê duyệt kèm theo Quyết định này dự toán chi tiết thực hiện nhiệm vụ: "{taskName}" với các nội dung chủ yếu sau:
        </p>
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
          1. Tên nhiệm vụ: {taskName}.
        </p>
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
          2. Đơn vị thực hiện: {implementingUnit}.
        </p>
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
          3. Tổng kinh phí phê duyệt: <strong>{new Intl.NumberFormat('vi-VN').format(budgetTotalAmount)} đồng</strong> (Bằng chữ: <em>{budgetWords}</em>).
        </p>
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed italic text-gray-800 text-justify">
          (Chi tiết tại Phụ lục kèm theo Quyết định này).
        </p>
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
          4. Nguồn kinh phí: {fundingSource}.
        </p>
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
          5. Thời gian thực hiện: {implementationTime}.
        </p>

        {/* Điều 2: Trách nhiệm tổ chức thực hiện */}
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed mt-3 mb-1 text-justify">
          <strong>Điều 2.</strong> Trách nhiệm tổ chức thực hiện
        </p>
        {article2Text.split('\n').map((line, lIdx) => (
          line.trim() && (
            <p key={lIdx} style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
              {line.trim()}
            </p>
          )
        ))}

        {/* Điều 3: Điều khoản thi hành */}
        <p style={{ textIndent: '1.27cm' }} className="leading-relaxed mt-3 mb-1 text-justify">
          <strong>Điều 3.</strong> Điều khoản thi hành
        </p>
        {article3Text.split('\n').map((line, lIdx) => (
          line.trim() && (
            <p key={lIdx} style={{ textIndent: '1.27cm' }} className="leading-relaxed text-justify">
              {line.trim()}
            </p>
          )
        ))}
      </div>
    );
  };

  return (
    <section
      className="w-full h-full bg-slate-200/95 border-r border-slate-300 flex flex-col relative z-10 shrink-0 overflow-hidden"
      data-purpose="document-preview-pane"
    >
      {/* Quick Toolbar */}
      <div className="h-11 bg-white/95 backdrop-blur-xs border-b border-gray-200 px-4 flex items-center justify-between text-xs text-gray-600 select-none shrink-0 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-800 flex items-center">
            <i className="fa-solid fa-print text-slate-700 mr-1.5"></i>
            Xem trước bản in A4 {isPhieuTrinh ? '(Phiếu trình)' : isQuyetDinhDuToan ? '(Quyết định dự toán)' : '(Công văn)'}
          </span>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono hidden xl:inline-block">
            {actualHeight > A4_MIN_HEIGHT_PX ? `Đa trang (~ ${Math.ceil(actualHeight / A4_MIN_HEIGHT_PX)} trang)` : 'Khổ A4: 210 x 297mm'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1 px-2 hover:bg-gray-100 rounded text-gray-600 transition cursor-pointer"
            title="Thu nhỏ"
            type="button"
          >
            <i className="fa-solid fa-minus text-[11px]"></i>
          </button>
          <button
            onClick={handleResetZoom}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700 transition cursor-pointer"
            title="Vừa vặn cột (65%)"
            type="button"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 px-2 hover:bg-gray-100 rounded text-gray-600 transition cursor-pointer"
            title="Phóng to"
            type="button"
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
          </button>
          <button
            onClick={handleActualSize}
            className="hidden sm:inline-block text-[10px] text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-gray-100 transition cursor-pointer"
            title="Kích thước thực 100%"
            type="button"
          >
            100%
          </button>
        </div>
      </div>

      {/* Outer Scroll Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start custom-scrollbar bg-slate-200/90">
        {/* Scaled Wrapper: dynamically expands height when document content spans multiple pages */}
        <div
          style={{
            width: `${Math.round(A4_WIDTH_PX * scale)}px`,
            height: `${Math.round(actualHeight * scale)}px`,
            minHeight: `${Math.round(A4_MIN_HEIGHT_PX * scale)}px`,
          }}
          className="relative shrink-0 mx-auto my-2 transition-[height] duration-150"
        >
          {/* Physical A4 Sheet Container: min-h-[297mm] h-auto pb-12 allowing natural multi-page flow */}
          <article
            ref={articleRef}
            id="printable-a4"
            style={{
              width: `${A4_WIDTH_PX}px`,
              minHeight: `${A4_MIN_HEIGHT_PX}px`,
              height: 'auto',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              boxSizing: 'border-box',
              background: '#ffffff',
              padding: '20mm 15mm 20mm 30mm',
              fontFamily: "'Tinos', 'Times New Roman', Times, serif",
              lineHeight: '1.4',
              color: '#000000',
            }}
            className="a4-page absolute top-0 left-0 flex flex-col justify-start shadow-xl ring-1 ring-black/10 select-text pb-12"
          >
            {/* Visual multi-page break divider when content exceeds 1123px */}
            {actualHeight > A4_MIN_HEIGHT_PX && (
              <div
                style={{ top: '1123px' }}
                className="absolute left-0 right-0 border-b-2 border-dashed border-slate-300 pointer-events-none flex items-center justify-center -translate-y-1/2 z-20 print:hidden"
              >
                <span className="bg-slate-100 text-slate-500 text-[11px] font-mono px-3 py-0.5 rounded-full border border-slate-300 shadow-2xs">
                  --- Ranh giới trang in 2 (297mm) ---
                </span>
              </div>
            )}

            {isPhieuTrinh ? (
              /* ========================================================================= */
              /* LAYOUT DÀNH RIÊNG CHO PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC (BÁM SÁT 100% MẪU) */
              /* ========================================================================= */
              <div>
                {/* 1. HEADER 2 CỘT */}
                <div className="w-full flex justify-between items-start text-center pb-2">
                  {/* Cột trái (46%): Tên cơ quan & Số hiệu (KHÔNG CÓ DÒNG V/V) */}
                  <div style={{ width: '46%' }} className="text-center leading-snug shrink-0">
                    <div
                      style={{
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: '14px',
                        lineHeight: '1.25',
                      }}
                      className="uppercase font-normal text-black text-center select-text"
                    >
                      <div>ỦY BAN TIÊU CHUẨN</div>
                      <div>ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA</div>
                    </div>

                    <div
                      style={{
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: '14px',
                        lineHeight: '1.25',
                      }}
                      className="font-bold uppercase text-black mt-1 text-center select-text"
                    >
                      <div>TRUNG TÂM MÃ SỐ,</div>
                      <div>MÃ VẠCH QUỐC GIA</div>
                    </div>

                    {/* Đường gạch chân cơ quan */}
                    <div className="w-28 mx-auto border-b-2 border-black mt-1 mb-1.5"></div>

                    {/* Số hiệu: Số:       /PTr-MSMV */}
                    <p style={{ fontSize: '15px' }} className="mt-1 leading-tight text-black text-center">
                      Số: <span className="inline-block w-8"></span><span>{doc.docSymbol || '/PTr-MSMV'}</span>
                    </p>
                  </div>

                  {/* Cột phải (54%): Quốc hiệu, Tiêu ngữ, Địa danh & Ngày tháng */}
                  <div style={{ width: '54%' }} className="text-center leading-snug pl-2 shrink-0">
                    <p
                      style={{ fontSize: '14.5px', letterSpacing: '-0.2px' }}
                      className="font-bold uppercase whitespace-nowrap text-black text-center"
                    >
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>

                    <p
                      style={{ fontSize: '15.5px' }}
                      className="font-bold text-black mt-1 text-center"
                    >
                      Độc lập - Tự do - Hạnh phúc
                    </p>

                    {/* Đường gạch chân tiêu ngữ */}
                    <div className="w-40 mx-auto border-b-2 border-black mt-1 mb-1.5"></div>

                    <p
                      style={{ fontSize: '15px', textAlign: 'center' }}
                      className="italic text-center text-black mt-1.5"
                    >
                      {doc.placeDate || 'Hà Nội, ngày ... tháng ... năm 2026'}
                    </p>
                  </div>
                </div>

                {/* 2. TIÊU ĐỀ GIỮA TRANG */}
                <div className="mt-5 mb-3 text-center space-y-1">
                  <h1
                    style={{ fontSize: '18px', lineHeight: '1.3' }}
                    className="font-bold uppercase text-black tracking-wide text-center"
                  >
                    PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC
                  </h1>
                  <p
                    style={{ fontSize: '16.5px' }}
                    className="font-normal text-black text-center"
                  >
                    {phieuTrinhRecipient}
                  </p>
                </div>

                {/* 3. KHỐI THÔNG TIN ĐẦU PHIẾU (META BOX) */}
                <div style={{ fontSize: '15.5px', lineHeight: '1.45' }} className="space-y-2 text-black">
                  {/* Dòng vấn đề trình (thụt đầu dòng 1.27cm) */}
                  <p style={{ textIndent: '1.27cm' }} className="leading-relaxed">
                    <strong>Vấn đề trình:</strong> {displaySubject || 'Phê duyệt phương án thẩm định và ban hành văn bản hướng dẫn'}
                  </p>

                  {/* Khối tài liệu kèm theo (thụt đầu dòng 1.27cm) */}
                  <div style={{ paddingLeft: '1.27cm' }} className="leading-snug space-y-0.5">
                    <p className="font-normal">Tài liệu kèm theo:</p>
                    {formattedAttachedDocs.map((item, idx) => (
                      <p key={idx} className="pl-4 font-normal">
                        {item}
                      </p>
                    ))}
                  </div>

                  {/* Khung bút phê Lãnh đạo: Tiêu đề in đậm, CĂN GIỮA, có 3 dòng kẻ chấm nhạt */}
                  <div className="border border-slate-700 rounded-xs p-3 my-2.5 w-full bg-white">
                    <p className="font-bold text-black text-[15px] text-center mb-2">
                      Ý kiến chỉ đạo, phê duyệt của Lãnh đạo Trung tâm
                    </p>
                    {/* 3 dòng kẻ chấm nhạt với khoảng trống tự nhiên 40-50px */}
                    <div className="space-y-3.5 pt-1.5 pb-1">
                      <div className="border-b border-dotted border-slate-400 h-3 w-full"></div>
                      <div className="border-b border-dotted border-slate-400 h-3 w-full"></div>
                      <div className="border-b border-dotted border-slate-400 h-3 w-full"></div>
                    </div>
                  </div>
                </div>

                {/* 4. THÂN NỘI DUNG 3 MỤC CHUẨN */}
                {renderPhieuTrinhContent()}

                {/* 5. KHỐI KÝ DUYỆT 2 CẤP (2 CỘT NGANG CÂN ĐỐI) & NƠI NHẬN */}
                <div className="w-full grid grid-cols-2 text-center my-5 pt-2 border-t border-transparent">
                  {/* Cột 1: CHUYÊN VIÊN */}
                  <div className="text-center leading-normal">
                    <p style={{ fontSize: '15px' }} className="font-bold uppercase text-black">
                      CHUYÊN VIÊN
                    </p>
                    <p style={{ fontSize: '12px' }} className="italic text-gray-700 mt-0.5">
                      (Ký, ghi rõ họ tên)
                    </p>
                    <div className="h-16"></div>
                    <p style={{ fontSize: '15px' }} className="font-bold text-black min-h-[22px]">
                      {doc.staffSignerName || ''}
                    </p>
                  </div>

                  {/* Cột 2: TRƯỞNG PHÒNG */}
                  <div className="text-center leading-normal">
                    <p style={{ fontSize: '15px' }} className="font-bold uppercase text-black">
                      TRƯỞNG PHÒNG
                    </p>
                    <p style={{ fontSize: '12px' }} className="italic text-gray-700 mt-0.5">
                      (Ký, ghi rõ họ tên)
                    </p>
                    <div className="h-16"></div>
                    <p style={{ fontSize: '15px' }} className="font-bold text-black">
                      {doc.departmentHeadName || 'Nguyễn Đắc Minh'}
                    </p>
                  </div>
                </div>

                {/* Mục nơi nhận: Đặt ngay phía dưới khối chữ ký, căn lề trái */}
                <div className="text-left mt-2">
                  <p style={{ fontSize: '14.5px' }} className="text-black font-normal">
                    <strong>4. Nơi nhận:</strong> Lãnh đạo Trung tâm.
                  </p>
                </div>
              </div>
            ) : isQuyetDinhDuToan ? (
              /* ========================================================================= */
              /* LAYOUT DÀNH CHO QUYẾT ĐỊNH PHÊ DUYỆT DỰ TOÁN KÈM PHỤ LỤC CHI TIẾT        */
              /* ========================================================================= */
              <div>
                {/* 1. Header 2 Cột */}
                <div className="w-full flex justify-between items-start text-center pb-2">
                  {/* Left Column (44%) */}
                  <div style={{ width: '44%' }} className="text-center leading-snug shrink-0">
                    <div style={{ fontSize: '13px', lineHeight: '1.25' }} className="uppercase font-normal text-black text-center select-text">
                      <div>ỦY BAN TIÊU CHUẨN</div>
                      <div>ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA</div>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.25' }} className="font-bold uppercase text-black mt-1 text-center select-text">
                      <div>TRUNG TÂM MÃ SỐ,</div>
                      <div>MÃ VẠCH QUỐC GIA</div>
                    </div>
                    <div className="w-24 mx-auto border-b-2 border-black mt-1 mb-1"></div>
                    <p style={{ fontSize: '14.5px' }} className="mt-1 leading-tight text-black">
                      Số: <span>{doc.docNumber || '...'}</span>
                      <span>{doc.docSymbol || '/QĐ-MSMV'}</span>
                    </p>
                  </div>

                  {/* Right Column (56%) */}
                  <div style={{ width: '56%' }} className="text-center leading-snug pl-2 shrink-0">
                    <p style={{ fontSize: '13.5px', letterSpacing: '-0.2px' }} className="font-bold uppercase whitespace-nowrap text-black text-center">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p style={{ fontSize: '14.5px' }} className="font-bold text-black mt-1 text-center">
                      Độc lập - Tự do - Hạnh phúc
                    </p>
                    <div className="w-36 mx-auto border-b-2 border-black mt-1 mb-1"></div>
                    <p style={{ fontSize: '14px', textAlign: 'center' }} className="italic text-center text-black mt-1.5">
                      {doc.placeDate || 'Hà Nội, ngày ... tháng ... năm 2026'}
                    </p>
                  </div>
                </div>

                {/* 2. Tiêu đề Quyết định */}
                <div className="text-center mt-3 mb-2">
                  <p style={{ fontSize: '17px' }} className="font-bold uppercase tracking-wide text-black">
                    QUYẾT ĐỊNH
                  </p>
                  <p style={{ fontSize: '15px' }} className="font-bold text-black mt-1">
                    Về việc phê duyệt dự toán chi tiết thực hiện nhiệm vụ:
                  </p>
                  <p style={{ fontSize: '15px' }} className="font-bold text-slate-900 mt-0.5">
                    "{doc.budgetEstimate?.taskName || doc.subject}"
                  </p>
                  <p style={{ fontSize: '14.5px' }} className="font-bold uppercase text-black mt-2.5 mb-2">
                    {(doc.signerRole && doc.signerRole.includes('GIÁM ĐỐC') ? doc.signerRole : 'GIÁM ĐỐC TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA').toUpperCase()}
                  </p>
                </div>

                {/* 3. Căn cứ pháp lý */}
                {renderQuyetDinhLegalBases()}

                {/* 4. Cụm từ QUYẾT ĐỊNH: */}
                <div className="text-center my-3">
                  <p style={{ fontSize: '15px' }} className="font-bold uppercase tracking-wider text-black">
                    QUYẾT ĐỊNH:
                  </p>
                </div>

                {/* 5. Thân Quyết định (3 Điều) */}
                {renderQuyetDinhContent()}

                {/* 6. Khối chữ ký và nơi nhận Quyết định */}
                <div style={{ marginTop: '16px' }} className="w-full flex justify-between items-start pt-2">
                  {/* Nơi nhận (45%) */}
                  <div style={{ width: '45%' }} className="text-left leading-normal">
                    <p style={{ fontSize: '14px' }} className="font-bold italic text-black">
                      Nơi nhận:
                    </p>
                    <div style={{ fontSize: '13px', lineHeight: '1.35' }} className="space-y-0.5 mt-1 font-normal text-black">
                      {(doc.distributionList && doc.distributionList.length > 0
                        ? doc.distributionList
                        : ['- Như Điều 3;', '- Ban Giám đốc;', '- Lưu: VT, KHTC.']
                      ).map((item, idx) => (
                        <p key={idx}>{item}</p>
                      ))}
                    </div>
                  </div>

                  {/* Giám đốc ký (55%) */}
                  <div style={{ width: '55%' }} className="text-center leading-normal">
                    <p style={{ fontSize: '15px' }} className="font-bold uppercase text-black">
                      GIÁM ĐỐC
                    </p>
                    <div className="h-20 flex items-center justify-center relative my-1">
                      <div className="w-20 h-20 rounded-full border-2 border-amber-700/40 flex items-center justify-center -rotate-12 text-[10px] text-amber-800/50 font-bold uppercase select-none pointer-events-none">
                        (DẤU CƠ QUAN)
                      </div>
                    </div>
                    <p style={{ fontSize: '15px' }} className="font-bold text-black">
                      {doc.signerName || 'Bùi Bá Chính'}
                    </p>
                  </div>
                </div>

                {/* 7. PHỤ LỤC DỰ TOÁN KINH PHÍ CHI TIẾT */}
                <div className="my-8 pt-6 border-t-2 border-dashed border-slate-300">
                  <div className="text-center mb-3">
                    <p style={{ fontSize: '15px' }} className="font-bold uppercase text-black">
                      PHỤ LỤC
                    </p>
                    <p style={{ fontSize: '16px' }} className="font-bold uppercase tracking-wide text-black mt-0.5">
                      DỰ TOÁN KINH PHÍ CHI TIẾT
                    </p>
                    <p style={{ fontSize: '13px' }} className="italic text-gray-700 mt-1">
                      (Kèm theo Quyết định số: {doc.docNumber || '...    '}{doc.docSymbol || '/QĐ-MSMV'} ngày ... của Giám đốc Trung tâm Mã số, mã vạch Quốc gia)
                    </p>
                  </div>

                  <div style={{ fontSize: '14.5px' }} className="text-left space-y-1 mb-3 text-black">
                    <p><strong>Tên nhiệm vụ:</strong> {doc.budgetEstimate?.taskName || doc.subject}</p>
                    <p><strong>Đơn vị thực hiện:</strong> {doc.budgetEstimate?.implementingUnit || 'Phòng Kế hoạch Tài chính chủ trì, phối hợp với các đơn vị liên quan'}</p>
                  </div>

                  {/* Bảng dự toán 6 cột - Căn chỉnh khoảng đệm đẹp mắt, không dính viền */}
                  <table className="w-full border-collapse border border-black text-[13px] text-black my-3 leading-normal">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black px-2 py-2 w-10 text-center">STT</th>
                        <th className="border border-black px-3 py-2 text-left">Nội dung chi</th>
                        <th className="border border-black px-2 py-2 w-16 text-center">ĐVT</th>
                        <th className="border border-black px-2 py-2 w-16 text-center">Số lượng</th>
                        <th className="border border-black px-2.5 py-2 w-32 text-right pr-3">Đơn giá (đồng)</th>
                        <th className="border border-black px-2.5 py-2 w-36 text-right pr-3">Thành tiền (đồng)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="border border-black px-2 py-2 text-center align-middle">{item.stt || idx + 1}</td>
                          <td className="border border-black px-3 py-2 text-left leading-snug align-middle">{item.content}</td>
                          <td className="border border-black px-2 py-2 text-center align-middle">{item.unit}</td>
                          <td className="border border-black px-2 py-2 text-center align-middle font-mono">{item.quantity}</td>
                          <td className="border border-black px-2.5 py-2 text-right font-mono pr-3 align-middle">
                            {new Intl.NumberFormat('vi-VN').format(item.unitPrice)}
                          </td>
                          <td className="border border-black px-2.5 py-2 text-right font-mono font-bold pr-3 align-middle">
                            {new Intl.NumberFormat('vi-VN').format(item.amount || (item.quantity * item.unitPrice))}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-slate-50">
                        <td colSpan={5} className="border border-black px-3 py-2 text-center font-bold uppercase tracking-wide">
                          Tổng cộng
                        </td>
                        <td className="border border-black px-2.5 py-2 text-right font-mono font-bold text-[13.5px] pr-3">
                          {new Intl.NumberFormat('vi-VN').format(budgetTotalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p style={{ fontSize: '13.5px' }} className="italic text-left mt-2.5 mb-4 text-black leading-relaxed">
                    (Bằng chữ: {budgetWords.replace(/[\s./;]+$/, '')}./.)
                  </p>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* LAYOUT TIÊU CHUẨN CÔNG VĂN ĐI THEO NGHỊ ĐỊNH 30/2020/NĐ-CP                 */
              /* ========================================================================= */
              <div>
                {/* Header 2 columns */}
                <div className="w-full flex justify-between items-start text-center pb-2">
                  {/* Left Column (40%) */}
                  <div style={{ width: '40%' }} className="text-center leading-snug shrink-0">
                    <div
                      style={{
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: '16px',
                        lineHeight: '1.25',
                      }}
                      className="uppercase font-normal text-black text-center select-text"
                    >
                      <div>ỦY BAN TIÊU CHUẨN</div>
                      <div>ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA</div>
                    </div>

                    <div
                      style={{
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: '16px',
                        lineHeight: '1.25',
                      }}
                      className="font-bold uppercase text-black mt-1 text-center select-text"
                    >
                      <div>TRUNG TÂM MÃ SỐ,</div>
                      <div>MÃ VẠCH QUỐC GIA</div>
                    </div>

                    {/* Underline separator */}
                    <div className="w-24 mx-auto border-b-2 border-black mt-1 mb-1"></div>

                    {/* Number & Symbol */}
                    <p style={{ fontSize: '16px' }} className="mt-1 leading-tight text-black">
                      Số: <span>{doc.docNumber || '...'}</span>
                      <span>{doc.docSymbol || '/MSMV-KHTC'}</span>
                    </p>

                    {/* Subject */}
                    <div className="mt-1 text-center">
                      <p
                        style={{ fontSize: '15px', lineHeight: '1.25' }}
                        className="text-center text-black m-0"
                      >
                        <span className="italic">V/v </span>
                        <span className="font-normal">{displaySubject}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Column (60%) */}
                  <div style={{ width: '60%' }} className="text-center leading-snug pl-3 shrink-0">
                    <p
                      style={{ fontSize: '16px', letterSpacing: '-0.2px' }}
                      className="font-bold uppercase whitespace-nowrap text-black text-center"
                    >
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>

                    <p
                      style={{ fontSize: '17px' }}
                      className="font-bold text-black mt-1 text-center"
                    >
                      Độc lập - Tự do - Hạnh phúc
                    </p>

                    <div className="w-48 mx-auto border-b-2 border-black mt-1 mb-1"></div>

                    <p
                      style={{ fontSize: '16px', textAlign: 'center' }}
                      className="italic text-center text-black mt-2"
                    >
                      {doc.placeDate}
                    </p>
                  </div>
                </div>

                {/* Recipient Line */}
                <div className="mt-6 mb-4 text-center">
                  <p style={{ fontSize: '17px' }} className="text-black">
                    <span className="font-semibold">Kính gửi:</span>{' '}
                    <span className="font-normal">{doc.recipient}</span>
                  </p>
                </div>

                {/* Body Content */}
                <div
                  style={{ fontSize: '16.5px', lineHeight: '1.5' }}
                  className="text-justify space-y-3.5 text-black"
                >
                  {/* Opening paragraph */}
                  {doc.opening && (
                    <p style={{ textIndent: '1.27cm' }} className="leading-relaxed whitespace-pre-line">
                      {doc.opening}
                    </p>
                  )}

                  {/* Main Clauses / Points */}
                  {contentParagraphs.map((para, idx) => {
                    const colonMatch = para.match(/^(\d+\.\s*[^:]+:)(.*)$/s);
                    if (colonMatch) {
                      return (
                        <p
                          key={idx}
                          style={{ textIndent: '1.27cm' }}
                          className="leading-relaxed whitespace-pre-line"
                        >
                          <strong>{colonMatch[1]}</strong>
                          {colonMatch[2]}
                        </p>
                      );
                    }
                    return (
                      <p
                        key={idx}
                        style={{ textIndent: '1.27cm' }}
                        className="leading-relaxed whitespace-pre-line"
                      >
                        {para}
                      </p>
                    );
                  })}

                  {/* Closing paragraph */}
                  {doc.closing && (
                    <p
                      style={{ textIndent: '1.27cm' }}
                      className="mt-4 leading-relaxed whitespace-pre-line"
                    >
                      {doc.closing.replace(/Trân trọng\.\/\./g, '').trim()}
                    </p>
                  )}

                  {/* Formal sign-off */}
                  <p style={{ textIndent: '1.27cm' }} className="mt-2 font-normal">
                    Trân trọng./.
                  </p>
                </div>

                {/* Footer Area */}
                <div
                  style={{ marginTop: '14px' }}
                  className="w-full flex justify-between items-start pt-0"
                >
                  {/* Left Column: Nơi nhận */}
                  <div style={{ width: '45%' }} className="text-left leading-normal">
                    <p
                      style={{ fontSize: '15px' }}
                      className="font-bold italic text-black"
                    >
                      Nơi nhận:
                    </p>
                    <div
                      style={{ fontSize: '14px', lineHeight: '1.35' }}
                      className="space-y-0.5 mt-1 font-normal text-black"
                    >
                      {doc.distributionList.map((item, idx) => (
                        <p key={idx}>{item}</p>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Signer role & Stamp */}
                  <div style={{ width: '50%' }} className="text-center leading-normal">
                    <p
                      style={{ fontSize: '17px' }}
                      className="font-bold uppercase text-black"
                    >
                      {doc.signerRole}
                    </p>

                    <div className="h-20 flex items-center justify-center relative my-1">
                      <div className="w-20 h-20 rounded-full border-2 border-amber-700/40 flex items-center justify-center -rotate-12 text-[10px] text-amber-800/50 font-bold uppercase select-none pointer-events-none">
                        (DẤU CƠ QUAN)
                      </div>
                    </div>

                    <p
                      style={{ fontSize: '17px' }}
                      className="font-bold text-black"
                    >
                      {doc.signerName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>

      {/* Preview Notice Footer */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-center text-[11px] text-gray-500 flex items-center justify-center space-x-2 shrink-0">
        <i className="fa-solid fa-shield-halved text-amber-700"></i>
        <span>
          {isPhieuTrinh
            ? 'Mẫu Phiếu trình giải quyết công việc nội bộ theo quy định quản lý văn thư'
            : isQuyetDinhDuToan
            ? 'Mẫu Quyết định phê duyệt dự toán kèm Phụ lục chi tiết theo chuẩn Trung tâm MSMV & NĐ 30'
            : 'Trang in đạt chuẩn kỹ thuật trình bày theo Phụ lục I - Nghị định số 30/2020/NĐ-CP'}
        </span>
      </div>
    </section>
  );
};
