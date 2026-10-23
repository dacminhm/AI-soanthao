import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
} from 'docx';
import {
  DocumentState,
  DEFAULT_BUDGET_ITEMS,
  DEFAULT_ARTICLE_2,
  DEFAULT_ARTICLE_3,
  formatVND,
  numberToVietnameseWords,
  BudgetEstimateData,
  BudgetItem,
} from './decree30Rules.ts';

/**
 * Generate Microsoft Word (.docx) file
 * Routes between "PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC", "QUYẾT ĐỊNH PHÊ DUYỆT DỰ TOÁN" and standard "CÔNG VĂN ĐI"
 */
export async function generateDecree30Docx(doc: DocumentState): Promise<Blob> {
  const isPhieuTrinh =
    doc.docType?.toLowerCase().includes('phiếu trình') ||
    doc.docType?.toLowerCase().includes('phieutrinh') ||
    doc.docType === 'phieutrinh';

  if (isPhieuTrinh) {
    return await generatePhieuTrinhDocx(doc);
  }

  const isQuyetDinhDuToan =
    doc.docType?.toLowerCase().includes('dự toán') ||
    doc.docType?.toLowerCase().includes('dutoan') ||
    doc.docType === 'quyetdinh_dutoan';

  if (isQuyetDinhDuToan) {
    return await generateQuyetDinhDuToanDocx(doc);
  }

  return await generateStandardCongVanDocx(doc);
}

/**
 * Generate Word (.docx) specifically for "PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC"
 * Bám sát 100% mẫu Phiếu trình: Header 2 cột không V/v, Tiêu đề giữa trang,
 * Khối thông tin đầu phiếu (Vấn đề trình, Tài liệu kèm theo, Khung bút phê),
 * Thân 3 mục chuẩn và Khối ký duyệt 3 cấp không dấu.
 */

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


/**
 * Chuẩn hóa danh sách tài liệu kèm theo khi xuất file Word:
 * Thêm gạch đầu dòng '- ', phân cách bằng ';', dòng cuối kết thúc bằng '.'
 */
function formatAttachedDocuments(docs?: string[] | string): string[] {
  if (!docs) return [];
  const list = Array.isArray(docs)
    ? docs.map((s) => (s ? String(s).trim() : '')).filter(Boolean)
    : String(docs).split('\n').map((s) => s.trim()).filter(Boolean);

  if (list.length === 0) {
    return [
      '- Dự thảo Công văn;',
      '- Công văn đến số ....;',
      '- Quyết định số ......;',
      '- Tài liệu khác.',
    ];
  }

  return list.map((item, idx) => {
    let clean = item.replace(/^[-*•–—]\s*/, '').replace(/[;.]+$/, '');
    const isLast = idx === list.length - 1;
    return `- ${clean}${isLast ? '.' : ';'}`;
  });
}

async function generatePhieuTrinhDocx(doc: DocumentState): Promise<Blob> {
  const FONT_FAMILY = 'Times New Roman';

  const topMargin = convertMillimetersToTwip(20);
  const bottomMargin = convertMillimetersToTwip(20);
  const leftMargin = convertMillimetersToTwip(30);
  const rightMargin = convertMillimetersToTwip(15);

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const boxBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '333333' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '333333' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '333333' },
  };

  // 1. Header Table (Left: 46%, Right: 54%)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Left: Agency & Symbol (KHÔNG CÓ V/V Ở GÓC NÀY)
          new TableCell({
            width: { size: 46, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: 'ỦY BAN TIÊU CHUẨN',
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: 'TRUNG TÂM MÃ SỐ,',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'MÃ VẠCH QUỐC GIA',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: '───────────────',
                    font: FONT_FAMILY,
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: `Số:          ${doc.docSymbol || '/PTr-MSMV'}`,
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
            ],
          }),
          // Right: Country Motto & Date
          new TableCell({
            width: { size: 54, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'Độc lập - Tự do - Hạnh phúc',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: '──────────────────────',
                    font: FONT_FAMILY,
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120, line: 240 },
                children: [
                  new TextRun({
                    text: doc.placeDate || 'Hà Nội, ngày ... tháng ... năm 2026',
                    font: FONT_FAMILY,
                    italics: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 2. Tiêu đề giữa trang: 14pt in hoa đậm, căn giữa
  const title1 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60, line: 280 },
    children: [
      new TextRun({
        text: 'PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC',
        font: FONT_FAMILY,
        bold: true,
        size: 28, // 14pt
      }),
    ],
  });

  const phieuTrinhRecipient = doc.recipient?.trim()
    ? (doc.recipient.trim().toLowerCase().startsWith('kính gửi')
        ? doc.recipient.trim()
        : `Kính gửi: ${doc.recipient.trim()}`)
    : 'Kính gửi: Lãnh đạo Trung tâm';

  const title2 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180, line: 260 },
    children: [
      new TextRun({
        text: phieuTrinhRecipient,
        font: FONT_FAMILY,
        bold: false,
        size: 26, // 13pt
      }),
    ],
  });

  // 3. Khối thông tin đầu phiếu (Meta Box)
  const displaySubject = doc.subject.replace(/^V\/v\s*:?\s*/i, '') || 'Phê duyệt phương án thẩm định và ban hành văn bản hướng dẫn';

  const vandeTrinhPara = new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 720 }, // 1.27cm
    spacing: { after: 100, line: 276 },
    children: [
      new TextRun({
        text: 'Vấn đề trình: ',
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
      new TextRun({
        text: displaySubject,
        font: FONT_FAMILY,
        bold: false,
        size: 26,
      }),
    ],
  });

  const tailieuHeader = new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { firstLine: 720 },
    spacing: { after: 30, line: 260 },
    children: [
      new TextRun({
        text: 'Tài liệu kèm theo:',
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
  });

  const formattedAttachedDocs = formatAttachedDocuments(doc.attachedDocuments);
  const tailieuParagraphs: Paragraph[] = formattedAttachedDocs.map((item, idx) => {
    const isLast = idx === formattedAttachedDocs.length - 1;
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 1080 },
      spacing: { after: isLast ? 120 : 30, line: 240 },
      children: [
        new TextRun({
          text: item,
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    });
  });

  // Khung bút phê Lãnh đạo: border hình chữ nhật
  const approvalBoxTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: boxBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: boxBorder,
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100, line: 240 },
                children: [
                  new TextRun({
                    text: 'Ý kiến chỉ đạo, phê duyệt của Lãnh đạo Trung tâm',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: '................................................................................................................................................',
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: '................................................................................................................................................',
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: '................................................................................................................................................',
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 4. Thân nội dung 3 mục chuẩn (định dạng gạch đầu dòng rõ ràng, không dính liền)
  const rawText = (doc.content || '').replace(/Trân trọng\.\/\./g, '').trim();
  const normalized = normalizePhieuTrinhSections(rawText);
  const lines = normalized.split('\n');
  const bodyContentParagraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Headings: 1., 2., 3.
    if (/^[123]\.\s+/.test(trimmed)) {
      bodyContentParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 140, after: 60, line: 276 },
          children: [
            new TextRun({
              text: trimmed,
              font: FONT_FAMILY,
              bold: true,
              size: 26, // 13pt
            }),
          ],
        })
      );
      continue;
    }

    // Sub items: a) Ý kiến đề xuất:, b) Kiến nghị:
    const subMatch = trimmed.match(/^([ab]\)\s*[^:]+:?)(.*)$/i);
    if (subMatch) {
      bodyContentParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 450 },
          spacing: { after: 60, line: 276 },
          children: [
            new TextRun({
              text: subMatch[1] + (subMatch[2] ? ' ' : ''),
              font: FONT_FAMILY,
              bold: true,
              size: 26,
            }),
            new TextRun({
              text: subMatch[2].trim(),
              font: FONT_FAMILY,
              bold: false,
              size: 26,
            }),
          ],
        })
      );
      continue;
    }

    // Bullets: - Về tiến độ..., - Về các công việc..., - Kết quả đạt được...
    const bulletMatch = trimmed.match(/^(-\s*[^:]+:)(.*)$/);
    if (bulletMatch) {
      bodyContentParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 450 },
          spacing: { after: 60, line: 276 },
          children: [
            new TextRun({
              text: bulletMatch[1] + (bulletMatch[2] ? ' ' : ''),
              font: FONT_FAMILY,
              bold: true,
              size: 26,
            }),
            new TextRun({
              text: bulletMatch[2].trim(),
              font: FONT_FAMILY,
              bold: false,
              size: 26,
            }),
          ],
        })
      );
      continue;
    }

    // Generic dash bullet
    if (trimmed.startsWith('-')) {
      bodyContentParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 450 },
          spacing: { after: 60, line: 276 },
          children: [
            new TextRun({
              text: trimmed,
              font: FONT_FAMILY,
              size: 26,
            }),
          ],
        })
      );
      continue;
    }

    // Final closing sentence
    if (trimmed.includes('Phòng Kế hoạch Tài chính kính trình Lãnh đạo')) {
      bodyContentParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { before: 120, after: 140, line: 276 },
          children: [
            new TextRun({
              text: trimmed,
              font: FONT_FAMILY,
              bold: false,
              size: 26,
            }),
          ],
        })
      );
      continue;
    }

    // Regular paragraph
    bodyContentParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 720 },
        spacing: { after: 100, line: 276 },
        children: [
          new TextRun({
            text: trimmed,
            font: FONT_FAMILY,
            size: 26,
          }),
        ],
      })
    );
  }

  // 5. Khối ký duyệt 2 cấp (2 CỘT NGANG CÂN ĐỐI: CHUYÊN VIÊN - TRƯỞNG PHÒNG)
  const signersTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Cột 1: CHUYÊN VIÊN (50%)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'CHUYÊN VIÊN',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800, line: 240 },
                children: [
                  new TextRun({
                    text: '(Ký, ghi rõ họ tên)',
                    font: FONT_FAMILY,
                    italics: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: doc.staffSignerName || '',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
          // Cột 2: TRƯỞNG PHÒNG (50%)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'TRƯỞNG PHÒNG',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800, line: 240 },
                children: [
                  new TextRun({
                    text: '(Ký, ghi rõ họ tên)',
                    font: FONT_FAMILY,
                    italics: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: doc.departmentHeadName || 'Nguyễn Đắc Minh',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Mục nơi nhận: căn lề trái, phía dưới khối chữ ký
  const recipientParagraph = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 140, after: 80, line: 240 },
    children: [
      new TextRun({
        text: '4. Nơi nhận: ',
        font: FONT_FAMILY,
        bold: true,
        size: 24, // 12pt
      }),
      new TextRun({
        text: 'Lãnh đạo Trung tâm.',
        font: FONT_FAMILY,
        bold: false,
        size: 24,
      }),
    ],
  });

  const wordDocument = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: topMargin,
              bottom: bottomMargin,
              left: leftMargin,
              right: rightMargin,
            },
          },
        },
        children: [
          headerTable,
          title1,
          title2,
          vandeTrinhPara,
          tailieuHeader,
          ...tailieuParagraphs,
          approvalBoxTable,
          ...bodyContentParagraphs,
          signersTable,
          recipientParagraph,
        ],
      },
    ],
  });

  return await Packer.toBlob(wordDocument);
}

/**
 * Generate Word (.docx) specifically for "QUYẾT ĐỊNH PHÊ DUYỆT DỰ TOÁN"
 * Page 1: Quyết định phê duyệt dự toán (Cơ quan, Quốc hiệu, Tiêu đề, Căn cứ, Điều 1-3, Chữ ký Giám đốc)
 * Page 2: Phụ lục dự toán kinh phí chi tiết (Bảng 6 cột chi phí, Tổng cộng, Bằng chữ, Chữ ký Người lập biểu & Trưởng phòng KHTC)
 */
async function generateQuyetDinhDuToanDocx(doc: DocumentState): Promise<Blob> {
  const FONT_FAMILY = 'Times New Roman';

  const topMargin = convertMillimetersToTwip(20);
  const bottomMargin = convertMillimetersToTwip(20);
  const leftMargin = convertMillimetersToTwip(30);
  const rightMargin = convertMillimetersToTwip(15);

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const estimate = doc.budgetEstimate || {
    taskName: doc.subject || 'Nâng cấp cơ sở dữ liệu quốc gia về mã số mã vạch và cổng thông tin truy xuất năm 2026',
    totalAmount: 120000000,
    totalAmountWords: 'Một trăm hai mươi triệu đồng chẵn.',
    fundingSource: 'Nguồn thu hoạt động sự nghiệp của Trung tâm',
    implementationTime: 'Quý IV năm 2026',
    implementingUnit: 'Phòng Kế hoạch Tài chính chủ trì, phối hợp với các đơn vị liên quan',
    items: DEFAULT_BUDGET_ITEMS,
  };

  const budgetItems = estimate.items && estimate.items.length > 0 ? estimate.items : DEFAULT_BUDGET_ITEMS;
  const totalCalculated = budgetItems.reduce((acc, it) => acc + (Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);
  const totalToDisplay = estimate.totalAmount || totalCalculated;
  const totalFormatted = new Intl.NumberFormat('vi-VN').format(totalToDisplay);
  const words = estimate.totalAmountWords || numberToVietnameseWords(totalToDisplay);
  const taskTitle = estimate.taskName || doc.subject || 'nhiệm vụ chuyên môn năm 2026';
  const implementingUnit = estimate.implementingUnit || 'Phòng Kế hoạch Tài chính chủ trì, phối hợp với các đơn vị liên quan';
  const fundingSource = estimate.fundingSource || 'Nguồn thu hoạt động sự nghiệp của Trung tâm';
  const implementationTime = estimate.implementationTime || 'Quý IV năm 2026';
  const article2Text = estimate.customArticle2 || DEFAULT_ARTICLE_2;
  const article3Text = estimate.customArticle3 || DEFAULT_ARTICLE_3;

  // 1. Header Table Quyết định (Left: 46%, Right: 54%)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Left: Agency & Symbol
          new TableCell({
            width: { size: 46, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: (doc.parentAgency || 'ỦY BAN TIÊU CHUẨN ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA').toUpperCase(),
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: (doc.issuingAgency || 'TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA').toUpperCase(),
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: '───────────────',
                    font: FONT_FAMILY,
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: `Số: ${doc.docNumber || '      '}${doc.docSymbol || '/QĐ-MSMV'}`,
                    font: FONT_FAMILY,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
          // Right: Quốc hiệu & Tiêu ngữ & Địa danh ngày tháng
          new TableCell({
            width: { size: 54, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'Độc lập - Tự do - Hạnh phúc',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: '──────────────────────',
                    font: FONT_FAMILY,
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: doc.placeDate || 'Hà Nội, ngày ... tháng ... năm 2026',
                    font: FONT_FAMILY,
                    italics: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 2. Tiêu đề Quyết định
  const title1 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 180, after: 60, line: 240 },
    children: [
      new TextRun({
        text: 'QUYẾT ĐỊNH',
        font: FONT_FAMILY,
        bold: true,
        size: 28, // 14pt
      }),
    ],
  });

  const title2 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40, line: 240 },
    children: [
      new TextRun({
        text: 'Về việc phê duyệt dự toán chi tiết thực hiện nhiệm vụ:',
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
    ],
  });

  const title3 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, line: 240 },
    children: [
      new TextRun({
        text: `"${taskTitle}"`,
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
    ],
  });

  const authorityPara = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 140, line: 240 },
    children: [
      new TextRun({
        text: (doc.signerRole && doc.signerRole.includes('GIÁM ĐỐC') ? doc.signerRole : 'GIÁM ĐỐC TRUNG TÂM MÃ SỐ, MÃ VẠCH QUỐC GIA').toUpperCase(),
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
    ],
  });

  // 3. Căn cứ pháp lý
  const legalBaseParagraphs: Paragraph[] = (doc.legalBases && doc.legalBases.length > 0
    ? doc.legalBases
    : [
        'Căn cứ Luật Ngân sách nhà nước số 83/2015/QH13 ngày 25 tháng 6 năm 2015;',
        'Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;',
        'Căn cứ Quyết định số 128/QĐ-TĐC ngày 28 tháng 02 năm 2024 của Tổng cục Tiêu chuẩn Đo lường Chất lượng quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Trung tâm Mã số, mã vạch Quốc gia;',
        'Căn cứ Quyết định giao quyền tự chủ tài chính cho Trung tâm Mã số, mã vạch Quốc gia;',
        'Theo đề nghị của Trưởng phòng Phòng Kế hoạch Tài chính.',
      ]
  ).map((base, idx, arr) => {
    let clean = base.trim();
    if (!clean.startsWith('Căn cứ') && !clean.startsWith('Theo')) {
      clean = `Căn cứ ${clean}`;
    }
    const isLast = idx === arr.length - 1;
    clean = clean.replace(/[;.]+$/, '') + (isLast ? '.' : ';');

    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: clean,
          font: FONT_FAMILY,
          italics: true,
          size: 26, // 13pt
        }),
      ],
    });
  });

  const quyetDinhHeader = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120, line: 240 },
    children: [
      new TextRun({
        text: 'QUYẾT ĐỊNH:',
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
    ],
  });

  // 4. Thân Quyết định (3 Điều) - Tự động sinh trực tiếp từ thông số (Single Source of Truth)
  const bodyParagraphs: Paragraph[] = [
    // Điều 1: Tiêu đề
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 60, line: 276 },
      children: [
        new TextRun({
          text: 'Điều 1. ',
          font: FONT_FAMILY,
          bold: true,
          size: 26, // 13pt
        }),
        new TextRun({
          text: `Phê duyệt kèm theo Quyết định này dự toán chi tiết thực hiện nhiệm vụ: "${taskTitle}" với các nội dung chủ yếu sau:`,
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    }),
    // Khoản 1: Tên nhiệm vụ
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: `1. Tên nhiệm vụ: ${taskTitle}.`,
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    }),
    // Khoản 2: Đơn vị thực hiện
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: `2. Đơn vị thực hiện: ${implementingUnit}.`,
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    }),
    // Khoản 3: Tổng kinh phí phê duyệt
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: '3. Tổng kinh phí phê duyệt: ',
          font: FONT_FAMILY,
          size: 26,
        }),
        new TextRun({
          text: `${totalFormatted} đồng `,
          font: FONT_FAMILY,
          bold: true,
          size: 26,
        }),
        new TextRun({
          text: '(Bằng chữ: ',
          font: FONT_FAMILY,
          size: 26,
        }),
        new TextRun({
          text: words,
          font: FONT_FAMILY,
          italics: true,
          size: 26,
        }),
        new TextRun({
          text: ').',
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    }),
    // Phụ lục dẫn chiếu
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: '(Chi tiết tại Phụ lục kèm theo Quyết định này).',
          font: FONT_FAMILY,
          italics: true,
          size: 26,
        }),
      ],
    }),
    // Khoản 4: Nguồn kinh phí
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: `4. Nguồn kinh phí: ${fundingSource}.`,
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    }),
    // Khoản 5: Thời gian thực hiện
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 80, line: 276 },
      children: [
        new TextRun({
          text: `5. Thời gian thực hiện: ${implementationTime}.`,
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    }),
    // Điều 2
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 60, line: 276 },
      children: [
        new TextRun({
          text: 'Điều 2. ',
          font: FONT_FAMILY,
          bold: true,
          size: 26,
        }),
        new TextRun({
          text: 'Trách nhiệm tổ chức thực hiện',
          font: FONT_FAMILY,
          bold: true,
          size: 26,
        }),
      ],
    }),
    ...article2Text.split('\n').filter((l) => l.trim()).map((line) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: line.trim(),
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    })),
    // Điều 3
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { before: 100, after: 60, line: 276 },
      children: [
        new TextRun({
          text: 'Điều 3. ',
          font: FONT_FAMILY,
          bold: true,
          size: 26,
        }),
        new TextRun({
          text: 'Điều khoản thi hành',
          font: FONT_FAMILY,
          bold: true,
          size: 26,
        }),
      ],
    }),
    ...article3Text.split('\n').filter((l) => l.trim()).map((line) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 720 },
      spacing: { after: 60, line: 276 },
      children: [
        new TextRun({
          text: line.trim(),
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    })),
  ];

  // 5. Khối chữ ký Quyết định (Nơi nhận & Giám đốc)
  const distributionParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40, line: 220 },
      children: [
        new TextRun({
          text: 'Nơi nhận:',
          font: FONT_FAMILY,
          bold: true,
          italics: true,
          size: 24, // 12pt
        }),
      ],
    }),
  ];

  const distItems = (doc.distributionList && doc.distributionList.length > 0
    ? doc.distributionList
    : ['- Như Điều 3;', '- Ban Giám đốc;', '- Lưu: VT, KHTC.']
  );

  distItems.forEach((item) => {
    distributionParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 20, line: 220 },
        children: [
          new TextRun({
            text: item,
            font: FONT_FAMILY,
            size: 22, // 11pt
          }),
        ],
      })
    );
  });

  const decisionFooterTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Left: Nơi nhận
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: distributionParagraphs,
          }),
          // Right: Giám đốc
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'GIÁM ĐỐC',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800, line: 240 },
                children: [
                  new TextRun({
                    text: ' ',
                    font: FONT_FAMILY,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: doc.signerName || 'Bùi Bá Chính',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ==============================================================
  // SECTION 2: PHỤ LỤC DỰ TOÁN KINH PHÍ CHI TIẾT
  // ==============================================================
  const appendixTitle1 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 40, line: 240 },
    children: [
      new TextRun({
        text: 'PHỤ LỤC',
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
    ],
  });

  const appendixTitle2 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40, line: 240 },
    children: [
      new TextRun({
        text: 'DỰ TOÁN KINH PHÍ CHI TIẾT',
        font: FONT_FAMILY,
        bold: true,
        size: 28, // 14pt
      }),
    ],
  });

  const appendixTitle3 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, line: 240 },
    children: [
      new TextRun({
        text: `(Kèm theo Quyết định số: ${doc.docNumber || '       '}${doc.docSymbol || '/QĐ-MSMV'} ngày ... của Giám đốc Trung tâm Mã số, mã vạch Quốc gia)`,
        font: FONT_FAMILY,
        italics: true,
        size: 24, // 12pt
      }),
    ],
  });

  const appendixTask = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 40, line: 240 },
    children: [
      new TextRun({
        text: `Tên nhiệm vụ: ${taskTitle}`,
        font: FONT_FAMILY,
        bold: true,
        size: 26, // 13pt
      }),
    ],
  });

  const appendixUnit = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 140, line: 240 },
    children: [
      new TextRun({
        text: `Đơn vị thực hiện: ${estimate.implementingUnit || 'Phòng Kế hoạch Tài chính chủ trì, phối hợp với các đơn vị liên quan'}`,
        font: FONT_FAMILY,
        size: 26, // 13pt
      }),
    ],
  });

  // Table rows with cell margins (padding 6pt top/bottom, 7.5pt left/right)
  const cellMargins = { top: 120, bottom: 120, left: 150, right: 150 };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 7, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        shading: { fill: 'F2F2F2' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'STT', font: FONT_FAMILY, bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 41, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        shading: { fill: 'F2F2F2' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Nội dung chi', font: FONT_FAMILY, bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        shading: { fill: 'F2F2F2' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ĐVT', font: FONT_FAMILY, bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        shading: { fill: 'F2F2F2' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Số lượng', font: FONT_FAMILY, bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        shading: { fill: 'F2F2F2' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Đơn giá (đồng)', font: FONT_FAMILY, bold: true, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        shading: { fill: 'F2F2F2' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Thành tiền (đồng)', font: FONT_FAMILY, bold: true, size: 22 })],
          }),
        ],
      }),
    ],
  });

  const dataRows: TableRow[] = budgetItems.map((it, idx) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const amt = Number(it.amount) || qty * price;

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 240 },
              children: [new TextRun({ text: String(it.stt || idx + 1), font: FONT_FAMILY, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 41, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 240 },
              children: [new TextRun({ text: it.content, font: FONT_FAMILY, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 240 },
              children: [new TextRun({ text: it.unit, font: FONT_FAMILY, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 240 },
              children: [new TextRun({ text: String(qty), font: FONT_FAMILY, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 240 },
              children: [
                new TextRun({
                  text: new Intl.NumberFormat('vi-VN').format(price),
                  font: FONT_FAMILY,
                  size: 22,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 240 },
              children: [
                new TextRun({
                  text: new Intl.NumberFormat('vi-VN').format(amt),
                  font: FONT_FAMILY,
                  bold: true,
                  size: 22,
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  const totalRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 84, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        columnSpan: 5,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 240 },
            children: [
              new TextRun({
                text: 'Tổng cộng',
                font: FONT_FAMILY,
                bold: true,
                size: 24, // 12pt
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 240 },
            children: [
              new TextRun({
                text: new Intl.NumberFormat('vi-VN').format(totalToDisplay),
                font: FONT_FAMILY,
                bold: true,
                size: 24, // 12pt
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const appendixTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [headerRow, ...dataRows, totalRow],
  });

  const wordsPara = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 180, line: 240 },
    children: [
      new TextRun({
        text: `(Bằng chữ: ${words.replace(/[\s./;]+$/, '')}./.)`,
        font: FONT_FAMILY,
        italics: true,
        size: 24, // 12pt
      }),
    ],
  });

  const wordDocument = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: topMargin,
              bottom: bottomMargin,
              left: leftMargin,
              right: rightMargin,
            },
          },
        },
        children: [
          headerTable,
          title1,
          title2,
          title3,
          authorityPara,
          ...legalBaseParagraphs,
          quyetDinhHeader,
          ...bodyParagraphs,
          decisionFooterTable,
        ],
      },
      {
        properties: {
          page: {
            margin: {
              top: topMargin,
              bottom: bottomMargin,
              left: leftMargin,
              right: rightMargin,
            },
          },
        },
        children: [
          appendixTitle1,
          appendixTitle2,
          appendixTitle3,
          appendixTask,
          appendixUnit,
          appendixTable,
          wordsPara,
        ],
      },
    ],
  });

  return await Packer.toBlob(wordDocument);
}

/**
 * Generate standard Decree 30 Docx for Công văn đi
 */
async function generateStandardCongVanDocx(doc: DocumentState): Promise<Blob> {
  const FONT_FAMILY = 'Times New Roman';

  // Margins in twips: Top 20mm, Bottom 20mm, Left 30mm, Right 15mm
  const topMargin = convertMillimetersToTwip(20);
  const bottomMargin = convertMillimetersToTwip(20);
  const leftMargin = convertMillimetersToTwip(30);
  const rightMargin = convertMillimetersToTwip(15);

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  // Build Header Table (Left: ~42%, Right: ~58%)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Left Column
          new TableCell({
            width: { size: 42, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: 'ỦY BAN TIÊU CHUẨN',
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'ĐO LƯỜNG CHẤT LƯỢNG QUỐC GIA',
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: 'TRUNG TÂM MÃ SỐ,',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'MÃ VẠCH QUỐC GIA',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80, line: 240 },
                children: [
                  new TextRun({
                    text: '───────────────',
                    font: FONT_FAMILY,
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: `Số: ${doc.docNumber || '125'}${doc.docSymbol || '/MSMV-KHTC'}`,
                    font: FONT_FAMILY,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120, line: 240 },
                children: [
                  new TextRun({
                    text: 'V/v ',
                    font: FONT_FAMILY,
                    italics: true,
                    size: 23, // ~11.5pt
                  }),
                  new TextRun({
                    text: doc.subject.replace(/^V\/v\s*/i, ''),
                    font: FONT_FAMILY,
                    size: 23,
                  }),
                ],
              }),
            ],
          }),
          // Right Column
          new TableCell({
            width: { size: 58, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: 'Độc lập - Tự do - Hạnh phúc',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100, line: 240 },
                children: [
                  new TextRun({
                    text: '──────────────────────',
                    font: FONT_FAMILY,
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120, line: 240 },
                children: [
                  new TextRun({
                    text: doc.placeDate || 'Hà Nội, ngày 19 tháng 10 năm 2026',
                    font: FONT_FAMILY,
                    italics: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const indentTwips = 720; // 1.27cm
  const bodyParagraphs: Paragraph[] = [];

  // 1. Recipient Paragraph
  bodyParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200, line: 276 },
      children: [
        new TextRun({
          text: 'Kính gửi: ',
          font: FONT_FAMILY,
          bold: false,
          size: 26, // 13pt
        }),
        new TextRun({
          text: doc.recipient || 'Ủy ban Tiêu chuẩn Đo lường Chất lượng Quốc gia',
          font: FONT_FAMILY,
          bold: false,
          size: 26,
        }),
      ],
    })
  );

  // 2. Opening Paragraph
  if (doc.opening) {
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: indentTwips },
        spacing: { after: 140, line: 276 },
        children: [
          new TextRun({
            text: doc.opening,
            font: FONT_FAMILY,
            size: 26, // 13pt
          }),
        ],
      })
    );
  }

  // 3. Main Clauses / Items
  const contentSections = (doc.content || '').split('\n\n').filter((s) => s.trim().length > 0);
  for (const section of contentSections) {
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: indentTwips },
        spacing: { after: 140, line: 276 },
        children: [
          new TextRun({
            text: section.trim(),
            font: FONT_FAMILY,
            size: 26, // 13pt
          }),
        ],
      })
    );
  }

  // 4. Closing Paragraph
  if (doc.closing) {
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: indentTwips },
        spacing: { before: 100, after: 140, line: 276 },
        children: [
          new TextRun({
            text: doc.closing.replace(/Trân trọng\.\/\./g, '').trim(),
            font: FONT_FAMILY,
            size: 26,
          }),
        ],
      })
    );
  }

  // 5. Formal sign-off
  bodyParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: indentTwips },
      spacing: { after: 200, line: 276 },
      children: [
        new TextRun({
          text: 'Trân trọng./.',
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
    })
  );

  // Footer Table (Nơi nhận on left, Signer on right)
  const distributionRuns = (doc.distributionList || ['- Như trên;', '- Lưu: VT, KHTC.']).map(
    (item) =>
      new Paragraph({
        spacing: { after: 40, line: 220 },
        children: [
          new TextRun({
            text: item,
            font: FONT_FAMILY,
            size: 22, // 11pt
          }),
        ],
      })
  );

  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          // Left: Nơi nhận
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: 'Nơi nhận:',
                    font: FONT_FAMILY,
                    bold: true,
                    italics: true,
                    size: 24, // 12pt
                  }),
                ],
              }),
              ...distributionRuns,
            ],
          }),
          // Right: Thẩm quyền ký & Họ tên
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: (doc.signerRole || 'GIÁM ĐỐC').toUpperCase(),
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 800, line: 240 },
                children: [
                  new TextRun({
                    text: ' ',
                    font: FONT_FAMILY,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60, line: 240 },
                children: [
                  new TextRun({
                    text: doc.signerName || 'Bùi Bá Chính',
                    font: FONT_FAMILY,
                    bold: true,
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const wordDocument = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: topMargin,
              bottom: bottomMargin,
              left: leftMargin,
              right: rightMargin,
            },
          },
        },
        children: [headerTable, ...bodyParagraphs, footerTable],
      },
    ],
  });

  return await Packer.toBlob(wordDocument);
}

/**
 * Trigger download of the generated .docx file in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
