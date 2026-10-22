import React, { useState } from 'react';
import { DocumentState } from '../utils/decree30Rules.ts';

interface A4PreviewProps {
  document: DocumentState;
}

export const A4Preview: React.FC<A4PreviewProps> = ({ document: doc }) => {
  // Default zoom 65% ensures 794px A4 sheet renders at ~516px, fitting nicely into 38%-40% column
  const [zoomLevel, setZoomLevel] = useState<number>(65);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 5, 120));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 5, 45));
  const handleResetZoom = () => setZoomLevel(65);
  const handleActualSize = () => setZoomLevel(100);

  const handlePrint = () => {
    window.print();
  };

  // Format subject without duplicate V/v
  const displaySubject = doc.subject.replace(/^V\/v\s*:?\s*/i, '');

  // Split paragraphs
  const contentParagraphs = (doc.content || '')
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const scale = zoomLevel / 100;
  const A4_WIDTH_PX = 794;
  const A4_MIN_HEIGHT_PX = 1123;

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
            Xem trước bản in A4
          </span>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono hidden xl:inline-block">
            Lề: T:20 B:20 L:30 R:15 (mm)
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

      {/* Outer Scroll Container (Col 38-40% width, overflow: auto) */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start custom-scrollbar bg-slate-200/90">
        {/* Scaled Wrapper: occupies exact transformed footprint to ensure proper scroll boundaries */}
        <div
          style={{
            width: `${Math.round(A4_WIDTH_PX * scale)}px`,
            minHeight: `${Math.round(A4_MIN_HEIGHT_PX * scale)}px`,
          }}
          className="relative shrink-0 mx-auto my-2"
        >
          {/* Real physical A4 Page: 210mm x 297mm (794px x 1123px) */}
          <article
            id="printable-a4"
            style={{
              width: `${A4_WIDTH_PX}px`,
              minHeight: `${A4_MIN_HEIGHT_PX}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              boxSizing: 'border-box',
              background: '#ffffff',
              padding: '20mm 15mm 20mm 30mm',
              fontFamily: "'Tinos', 'Times New Roman', Times, serif",
              lineHeight: '1.4',
              color: '#000000',
            }}
            className="a4-page absolute top-0 left-0 flex flex-col justify-start shadow-xl ring-1 ring-black/10 select-text"
          >
            {/* Top Block: Header, Recipient, Body, and Closing */}
            <div>
              {/* Header 2 columns: Left Agency 40%, Right Country Motto 60% */}
              <div className="w-full flex justify-between items-start text-center pb-2">
                {/* Left Column (40%): Superior Agency, Issuing Agency, Symbol, Subject */}
                <div style={{ width: '40%' }} className="text-center leading-snug shrink-0">
                  {/* Superior Agency: Times New Roman, 12pt, uppercase, regular (chữ đứng, không in đậm), 2 independent lines, text-center */}
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

                  {/* Issuing Agency: 12pt, uppercase, bold, centered, 2 independent lines */}
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

                  {/* Number & Symbol: 12pt */}
                  <p style={{ fontSize: '16px' }} className="mt-1 leading-tight text-black">
                    Số: <span>{doc.docNumber || '...'}</span>
                    <span>{doc.docSymbol || '/MSMV-KHTC'}</span>
                  </p>

                  {/* Subject: V/v underneath without gap */}
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

                {/* Right Column (60%): Motto, Country name, Date */}
                <div style={{ width: '60%' }} className="text-center leading-snug pl-3 shrink-0">
                  {/* Country name: 12pt, uppercase, bold, whitespace-nowrap */}
                  <p
                    style={{ fontSize: '16px', letterSpacing: '-0.2px' }}
                    className="font-bold uppercase whitespace-nowrap text-black text-center"
                  >
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>

                  {/* Motto: 13pt, bold */}
                  <p
                    style={{ fontSize: '17px' }}
                    className="font-bold text-black mt-1 text-center"
                  >
                    Độc lập - Tự do - Hạnh phúc
                  </p>

                  {/* Underline separator */}
                  <div className="w-48 mx-auto border-b-2 border-black mt-1 mb-1"></div>

                  {/* Location & Date: 13pt, italic, centered */}
                  <p
                    style={{ fontSize: '16px', textAlign: 'center' }}
                    className="italic text-center text-black mt-2"
                  >
                    {doc.placeDate}
                  </p>
                </div>
              </div>

              {/* Recipient Line: 13-14pt */}
              <div className="mt-6 mb-4 text-center">
                <p style={{ fontSize: '17px' }} className="text-black">
                  <span className="font-semibold">Kính gửi:</span>{' '}
                  <span className="font-normal">{doc.recipient}</span>
                </p>
              </div>

              {/* Body Content: Justified, 1.27cm indent, 13-14pt */}
              <div
                style={{ fontSize: '16.5px', lineHeight: '1.5' }}
                className="text-justify space-y-3.5 text-black"
              >
                {/* Opening paragraph */}
                {doc.opening && (
                  <p style={{ textIndent: '1.27cm' }} className="leading-relaxed">
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
                        className="leading-relaxed"
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
                      className="leading-relaxed"
                    >
                      {para}
                    </p>
                  );
                })}

                {/* Closing paragraph */}
                {doc.closing && (
                  <p
                    style={{ textIndent: '1.27cm' }}
                    className="mt-4 leading-relaxed"
                  >
                    {doc.closing.replace(/Trân trọng\.\/\./g, '').trim()}
                  </p>
                )}

                {/* Formal sign-off */}
                <p style={{ textIndent: '1.27cm' }} className="mt-2 font-normal">
                  Trân trọng./.
                </p>
              </div>
            </div>

            {/* Bottom Footer Area: Distribution (Left) & Signer/Stamp (Right) - spaced 14px directly after formal sign-off */}
            <div
              style={{ marginTop: '14px' }}
              className="w-full flex justify-between items-start pt-0"
            >
              {/* Left Column: Nơi nhận (11-12pt) */}
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

              {/* Right Column: Signer role, Stamp, Name (13-14pt) */}
              <div style={{ width: '50%' }} className="text-center leading-normal">
                <p
                  style={{ fontSize: '17px' }}
                  className="font-bold uppercase text-black"
                >
                  {doc.signerRole}
                </p>

                {/* Simulated official stamp */}
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
          </article>
        </div>
      </div>

      {/* Preview Notice Footer */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-center text-[11px] text-gray-500 flex items-center justify-center space-x-2 shrink-0">
        <i className="fa-solid fa-shield-halved text-amber-700"></i>
        <span>
          Trang in đạt chuẩn kỹ thuật trình bày theo Phụ lục I - Nghị định số 30/2020/NĐ-CP
        </span>
      </div>
    </section>
  );
};
