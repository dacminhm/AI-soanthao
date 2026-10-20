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
 * Generate Microsoft Word (.docx) file matching Decree 30/2020/ND-CP standard
 */
export async function generateDecree30Docx(doc: DocumentState): Promise<Blob> {
  const FONT_FAMILY = 'Times New Roman';

  // Margins in twips: Top 20mm, Bottom 20mm, Left 30mm, Right 15mm
  const topMargin = convertMillimetersToTwip(20);
  const bottomMargin = convertMillimetersToTwip(20);
  const leftMargin = convertMillimetersToTwip(30);
  const rightMargin = convertMillimetersToTwip(15);

  // Borderless style for layout tables
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

  // Body content paragraphs with 1.27cm indent (720 twips)
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
              // Stamp spacing
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
