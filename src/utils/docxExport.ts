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
import { DocumentState } from './decree30Rules.ts';

/**
 * Generate Microsoft Word (.docx) file
 * Routes between "PHIẾU TRÌNH GIẢI QUYẾT CÔNG VIỆC" and standard "CÔNG VĂN ĐI"
 */
export async function generateDecree30Docx(doc: DocumentState): Promise<Blob> {
  const isPhieuTrinh =
    doc.docType?.toLowerCase().includes('phiếu trình') ||
    doc.docType?.toLowerCase().includes('phieutrinh') ||
    doc.docType === 'phieutrinh';

  if (isPhieuTrinh) {
    return await generatePhieuTrinhDocx(doc);
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

  const title2 = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180, line: 260 },
    children: [
      new TextRun({
        text: 'Kính gửi: Lãnh đạo Trung tâm',
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

  const tailieu1 = new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 1080 },
    spacing: { after: 30, line: 240 },
    children: [new TextRun({ text: '- Dự thảo Công văn;', font: FONT_FAMILY, size: 26 })],
  });

  const tailieu2 = new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 1080 },
    spacing: { after: 30, line: 240 },
    children: [new TextRun({ text: '- Công văn đến số ....;', font: FONT_FAMILY, size: 26 })],
  });

  const tailieu3 = new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 1080 },
    spacing: { after: 30, line: 240 },
    children: [new TextRun({ text: '- Quyết định số ......;', font: FONT_FAMILY, size: 26 })],
  });

  const tailieu4 = new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 1080 },
    spacing: { after: 120, line: 240 },
    children: [new TextRun({ text: '- Tài liệu khác.', font: FONT_FAMILY, size: 26 })],
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
          tailieu1,
          tailieu2,
          tailieu3,
          tailieu4,
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
