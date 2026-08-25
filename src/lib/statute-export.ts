// Ekspor AD/ART ke Word (.docx) dan PDF. Semua dijalankan di browser: `docx` dan
// `jspdf` sengaja di-import dinamis supaya tidak ikut bundel halaman.
import {
  DEFAULT_PREAMBLE_TITLE,
  groupByBab,
  STATUTE_LABELS,
  toRoman,
  type StatuteType,
} from '@/lib/statute';

export type ExportArticle = {
  babNumber: number;
  babTitle: string;
  pasalNumber: number;
  pasalTitle: string | null;
  content: string;
};

export type StatuteExportData = {
  type: StatuteType;
  title: string;
  preamble: string | null;
  preambleTitle: string | null;
  publishedAt?: Date | null;
  articles: ExportArticle[];
};

/** Baris kosong dibuang: jarak antar paragraf sudah diatur lewat spacing. */
function contentLines(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function statuteFileName(data: StatuteExportData, extension: 'docx' | 'pdf') {
  const base = data.title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${base || data.type}.${extension}`;
}

/** Menyimpan blob lewat anchor sementara — satu-satunya cara di browser. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke ditunda: Safari membatalkan unduhan kalau URL dicabut terlalu cepat.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function subtitle(data: StatuteExportData) {
  const parts = [STATUTE_LABELS[data.type]];
  if (data.publishedAt) {
    parts.push(
      `Terakhir diterbitkan ${data.publishedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}`
    );
  }
  return parts.join(' • ');
}

export async function buildStatuteDocx(data: StatuteExportData): Promise<Blob> {
  const { AlignmentType, Document, Footer, Packer, PageNumber, Paragraph, TextRun } = await import(
    'docx'
  );

  const centered = (text: string, opts: { size: number; bold?: boolean; after?: number }) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: opts.after ?? 120 },
      children: [new TextRun({ text, bold: opts.bold ?? false, size: opts.size })],
    });

  const body = (text: string) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
      children: [new TextRun({ text, size: 24 })],
    });

  const children: InstanceType<typeof Paragraph>[] = [
    centered(data.title.toUpperCase(), { size: 32, bold: true, after: 80 }),
    centered(subtitle(data), { size: 20, after: 400 }),
  ];

  if (data.preamble?.trim()) {
    children.push(
      centered((data.preambleTitle?.trim() || DEFAULT_PREAMBLE_TITLE).toUpperCase(), {
        size: 26,
        bold: true,
        after: 200,
      })
    );
    for (const line of contentLines(data.preamble)) children.push(body(line));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  for (const bab of groupByBab(data.articles)) {
    children.push(centered(`BAB ${toRoman(bab.number)}`, { size: 26, bold: true, after: 0 }));
    children.push(centered(bab.title.toUpperCase(), { size: 26, bold: true, after: 240 }));

    for (const pasal of bab.items) {
      children.push(
        centered(`Pasal ${pasal.pasalNumber}`, {
          size: 24,
          bold: true,
          after: pasal.pasalTitle ? 0 : 160,
        })
      );
      if (pasal.pasalTitle) {
        children.push(centered(pasal.pasalTitle, { size: 24, bold: true, after: 160 }));
      }
      for (const line of contentLines(pasal.content)) children.push(body(line));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            // A4 dengan margin 1 inci (satuan twip: 1 inci = 1440).
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// Tata letak PDF dalam milimeter (A4 210 x 297, margin 20).
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_TOP = MARGIN + 5;
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN;
const LINE_FACTOR = 1.45;
const PT_TO_MM = 25.4 / 72;

export async function buildStatutePdf(data: StatuteExportData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: data.title, subject: STATUTE_LABELS[data.type] });

  let y = CONTENT_TOP;

  function newPage() {
    doc.addPage();
    y = CONTENT_TOP;
  }

  /** Pindah halaman lebih awal supaya judul tidak tertinggal sendirian di kaki halaman. */
  function keepTogether(millimeters: number) {
    if (y + millimeters > BOTTOM_LIMIT) newPage();
  }

  /** Menulis satu paragraf dengan pemenggalan halaman manual. */
  function writeBlock(
    text: string,
    opts: { size: number; bold?: boolean; align?: 'center' | 'justify'; after?: number }
  ) {
    doc.setFont('times', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size);
    const lineHeight = opts.size * PT_TO_MM * LINE_FACTOR;
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];

    if (opts.align === 'center') {
      for (const line of lines) {
        if (y + lineHeight > BOTTOM_LIMIT) newPage();
        doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
        y += lineHeight;
      }
    } else {
      // jsPDF hanya meratakan baris-baris di dalam satu panggilan dan membiarkan
      // baris terakhirnya rata kiri. Jadi kirim per potongan yang muat sehalaman:
      // pemenggalan tetap kita yang atur, perataannya biar jsPDF yang hitung.
      let index = 0;
      while (index < lines.length) {
        if (y + lineHeight > BOTTOM_LIMIT) newPage();
        const fits = Math.max(1, Math.floor((BOTTOM_LIMIT - y) / lineHeight));
        const chunk = lines.slice(index, index + fits);
        doc.text(chunk, MARGIN, y, {
          align: 'justify',
          maxWidth: CONTENT_WIDTH,
          lineHeightFactor: LINE_FACTOR,
        });
        y += chunk.length * lineHeight;
        index += chunk.length;
      }
    }

    y += opts.after ?? 0;
  }

  writeBlock(data.title.toUpperCase(), { size: 16, bold: true, align: 'center', after: 2 });
  doc.setTextColor(110);
  writeBlock(subtitle(data), { size: 10, align: 'center', after: 9 });
  doc.setTextColor(0);

  if (data.preamble?.trim()) {
    writeBlock((data.preambleTitle?.trim() || DEFAULT_PREAMBLE_TITLE).toUpperCase(), {
      size: 13,
      bold: true,
      align: 'center',
      after: 4,
    });
    for (const line of contentLines(data.preamble)) {
      writeBlock(line, { size: 12, align: 'justify', after: 2 });
    }
    y += 4;
  }

  for (const bab of groupByBab(data.articles)) {
    keepTogether(30);
    writeBlock(`BAB ${toRoman(bab.number)}`, { size: 13, bold: true, align: 'center' });
    writeBlock(bab.title.toUpperCase(), { size: 13, bold: true, align: 'center', after: 5 });

    for (const pasal of bab.items) {
      keepTogether(24);
      writeBlock(`Pasal ${pasal.pasalNumber}`, {
        size: 12,
        bold: true,
        align: 'center',
        after: pasal.pasalTitle ? 0 : 3,
      });
      if (pasal.pasalTitle) {
        writeBlock(pasal.pasalTitle, { size: 12, bold: true, align: 'center', after: 3 });
      }
      for (const line of contentLines(pasal.content)) {
        writeBlock(line, { size: 12, align: 'justify', after: 2 });
      }
      y += 4;
    }
  }

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${page} / ${total}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
  }

  return doc.output('blob');
}
