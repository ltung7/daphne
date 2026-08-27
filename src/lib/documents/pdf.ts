import PDFDocument from 'pdfkit';
import { writeFile } from "fs/promises";

// PAPER_SIZES.BARCODE
/** @deprecated */
export const DEFAULT_BARCODE_PAPER: PDFKit.PDFDocumentOptions = {
    margins: { top: 5, left: 5, right: 5, bottom: 5 },
    size: [ 117, 170 ],
    layout: 'landscape',
};

// PAPER_SIZES.A4
/** @deprecated */
export const PAPER_A4: PDFKit.PDFDocumentOptions = {
    margins: { top: 10, left: 10, right: 10, bottom: 10 },
    size: [ 595, 840 ],
};

type DefaultPaperSizes = 'A4';

export const PAPER_SIZES: Record<DefaultPaperSizes, PDFKit.PDFDocumentOptions> = {
    A4: {
        margins: { top: 10, left: 10, right: 10, bottom: 10 },
        size: [ 595, 840 ],
    }
};

export const preparePdf = (options: PDFKit.PDFDocumentOptions = PAPER_SIZES.A4, callback: (_pdf: PDFKit.PDFDocument) => void): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const pdf = new PDFDocument({
            ...options,
            // @ts-expect-error type mismatch
            font: false
        });

        const buffers: Buffer[] = [];
        pdf.on('data', buffers.push.bind(buffers));
        pdf.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        pdf.on('error', reject);
        pdf.registerFont('Regular', './data/NotoSans-Regular.ttf');
        pdf.registerFont('Bold', './data/NotoSans-Bold.ttf');
        pdf.font("Regular");

        callback(pdf);

        pdf.end();
    })
};

export const testZapfDingbats = async (fromChar: number = 0, toChar: number = 255) => {
    const buffer = await preparePdf(PAPER_SIZES.A4, (pdf) => {
        let x = 30, y = 50;
        for (let i = fromChar; i <= toChar; i++) {
            pdf.font('Regular').fontSize(10).text(i.toString(), x, y, { align: 'center', width: 30 })
            pdf.font('ZapfDingbats').fontSize(20).text(String.fromCharCode(i), x - 10, y - 10, { align: 'center', width: 30 });

            x += 30;
            if (x > 520) {
                x = 30;
                y += 50;
            }
        }
    })
    await writeFile('/tmp/zapf.pdf', new Uint8Array(buffer));
    return 'zapf.pdf'
};

// Helpers from proto.js - designed to work with pdf context
export class PdfHelpers {
    // Class properties for page dimensions and cursor
    private pdf: PDFKit.PDFDocument;
    private y: number;
    private pageLeft: number;
    private pageRight: number;
    private contentWidth: number;

    private static readonly PAGE_HEIGHT = 840;
    private static readonly PAGE_MARGIN_TOP = 20;
    private static readonly PAGE_MARGIN_BOTTOM = 20;
    private static readonly IMAGE_HEIGHT = PdfHelpers.PAGE_HEIGHT / 4;

    // Constructor calculates page dimensions from PDF object
    constructor(pdf: PDFKit.PDFDocument, startY: number) {
        this.pdf = pdf;
        this.y = startY;

        // Calculate page boundaries from document margins
        this.pageLeft = pdf.page.margins.left;
        this.pageRight = pdf.page.width - pdf.page.margins.right;
        this.contentWidth = this.pageRight - this.pageLeft;
    }

    // Getters/setters (optional but helpful)
    getY(): number { return this.y; }
    setY(y: number): void { this.y = y; }
    padY(py: number): void { this.y += py }

    // ********************************
    // Text-Formatting Helpers
    // ------------------------------

    title(text: string, size: number = 14): number {
        this.pdf.font('Bold').fontSize(size).fillColor('#000');
        this.pdf.text(text, this.pageLeft, this.y, {
            width: this.contentWidth,
            align: 'center'
        });
        this.y = this.pdf.y + 4;
        return this.y;
    }

    line() {
        this.pdf.moveTo(this.pageLeft, this.y).lineTo(this.pageRight, this.y).lineWidth(1.2).strokeColor('#000').stroke();
        this.y += 6;
    }

    subtitle(text: string, size: number = 10): number {
        this.pdf.font('Regular').fontSize(size).fillColor('#333');
        this.pdf.text(text, this.pageLeft, this.y, {
            width: this.contentWidth,
            align: 'center'
        });
        this.y = this.pdf.y + 6;
        return this.y;
    }

    sectionHeader(text: string): number {
        const newY = this.y + 4;

        // Header background
        this.pdf.rect(this.pageLeft, newY, this.contentWidth, 17).fill('#e8e8e8');

        // Text styling
        this.pdf.fillColor('#000').font('Bold').fontSize(10.5);
        this.pdf.text(text, this.pageLeft + 6, newY + 3.5, {
            width: this.contentWidth - 12
        });

        this.y = newY + 23; // 13 height + 10 padding
        return this.y;
    }

    // ********************************
    // Layout Helpers
    // ------------------------------

    labeledLine(label: string, opts: { value?: string } = {}): number {
        const labelWidth = this.pdf.widthOfString(label);
        this.pdf.font('Regular').fontSize(9).fillColor('#000');
        this.pdf.text(label, this.pageLeft, this.y, {
            width: labelWidth + 1
        });

        const lineStartX = this.pageLeft + labelWidth + 6;
        const lineEndX = this.pdf.page.width - this.pdf.page.margins.right;
        const lineY = this.y + 12;

        if (opts.value?.length) {
            this.pdf.font('Bold').text(opts.value, lineStartX + 5, this.y, {
                width: this.pageLeft + this.contentWidth - labelWidth - 30,
                lineBreak: false,
            });
        }

        this.pdf.moveTo(lineStartX, lineY)
            .lineTo(lineEndX, lineY)
            .lineWidth(0.7)
            .strokeColor('#999')
            .stroke();

        this.y += 18;
        return this.y;
    }

    twoColLabeledLines(
        labelA: string, labelB: string,
        opts: {
            valueA?: string,
            valueB?: string,
        } = {}
    ): number {
        const colWidth = (this.contentWidth / 2) - 10;
        const labelWidthA = this.pdf.widthOfString(labelA);
        const labelWidthB = this.pdf.widthOfString(labelB);

        // Left column
        this.pdf.fontSize(9).font('Regular').text(labelA, this.pageLeft, this.y, {
            width: labelWidthA + 1,
            lineBreak: false
        });
        const lx1 = this.pageLeft + labelWidthA + 5;
        if (opts.valueA?.length) {
            this.pdf.font('Bold').text(opts.valueA, lx1 + 5, this.y, {
                width: this.pageLeft + colWidth - labelWidthA - 30,
                lineBreak: false,
            });
        }
        this.pdf.moveTo(lx1, this.y + 12).lineTo(
            this.pageLeft + colWidth, this.y + 12
        ).lineWidth(0.7).strokeColor('#999').stroke();

        // Right column
        const rightStart = this.pageLeft + colWidth + 20;
        this.pdf.font('Regular').text(labelB, rightStart, this.y, {
            width: labelWidthB + 1,
            lineBreak: false
        });
        const rx1 = rightStart + labelWidthB + 5;
        if (opts.valueB?.length) {
            this.pdf.font('Bold').text(opts.valueB, rx1 + 5, this.y, {
                width: this.pageLeft + colWidth - labelWidthB - 30,
                lineBreak: false,
            });
        }
        this.pdf.moveTo(rx1, this.y + 12).lineTo(
            this.pageRight, this.y + 12
        ).lineWidth(0.7).strokeColor('#999').stroke();

        this.y += 18;
        return this.y;
    }

    twoColNumberedClause(
        num: number,
        textA: string | undefined,
        textB: string | undefined
    ): number {
        const colWidth = (this.contentWidth / 2) - 26;
        this.pdf.font('Regular').fontSize(8).fillColor('#000');

        // Left column
        if (textA?.length) {
            this.pdf.text(`${num}.`, this.pageLeft, this.y, { width: 16 });
            this.pdf.text(textA, this.pageLeft + 16, this.y, {
                width: colWidth,
                lineBreak: false
            });
        }

        // Right column
        if (textB?.length) {
            const rightStart = this.pageLeft + colWidth + 20;
            this.pdf.text(`${num}.`, rightStart, this.y, { width: 16 });
            this.pdf.font('Regular').text(textB, rightStart + 16, this.y, {
                width: colWidth,
                lineBreak: false
            });
        }

        this.y += Math.max(this.pdf.heightOfString(textA ?? "", { width: colWidth }), this.pdf.heightOfString(textB ?? "", { width: colWidth }));
        return this.y;
    }

    twoColNumberedClauses(
        listA: string[],
        listB: string[]
    ): number {
        for (let i = 0; i < Math.max(listA.length, listB.length); i++) {
            this.twoColNumberedClause(i + 1, listA[i], listB[i])
            this.padY(4)
        }
        return this.y;
    }

    // ********************************
    // Container & Formatting Helpers
    // ------------------------------

    notesBox(rows: number, text?: string): number {
        // Layout parameters
        const initialFontSize = 9.3;
        const reducedFontSize = 7.5; // Reduced font size for overflowing text
        const lineHeight = 12;       // Line height allocated per row
        const paddingX = 6;          // Horizontal inner margin
        const paddingY = 6;          // Vertical inner margin

        // Calculate dimensions
        const calculatedBoxHeight = (rows * lineHeight) + (paddingY * 2);
        const maxTextWidth = this.contentWidth - (paddingX * 2);
        const targetTextHeight = rows * lineHeight;
        const boxY = this.y;

        // 1. Draw bounding box rectangle
        this.pdf.rect(this.pageLeft, boxY, this.contentWidth, calculatedBoxHeight)
            .lineWidth(0.8)
            .strokeColor('#888')
            .stroke();

        // 2. Render text if provided
        if (text && text.trim().length > 0) {
            // Set font context to measure accurate height
            this.pdf.font('Regular').fontSize(initialFontSize);

            // Calculate text height before drawing
            const measuredHeight = this.pdf.heightOfString(text, {
                width: maxTextWidth,
            });

            // Determine font size: use reduced size if text height exceeds target row area
            const finalFontSize = measuredHeight > targetTextHeight
                ? reducedFontSize
                : initialFontSize;

            // Draw text with selected font size
            this.pdf
                .font('Regular')
                .fontSize(finalFontSize)
                .fillColor('#000')
                .text(text, this.pageLeft + paddingX, boxY + paddingY, {
                    width: maxTextWidth,
                    height: targetTextHeight,
                    ellipsis: true, // Safety fallback if text exceeds space even with reduced font size
                });
        }

        // 3. Update vertical layout offset
        this.y += calculatedBoxHeight + 4;
        return this.y;
    }

    signatureLine(signatureA: string, signatureB?: string): number {
        const colWidth = this.contentWidth / 2 - 15;
        const ly = this.y + 30;

        // Set font styles once for text rendering
        this.pdf.font('Regular').fontSize(8.5).fillColor('#333');

        // Signature A (Always drawn on the right)
        const rightStart = this.pageLeft + this.contentWidth - colWidth;

        this.pdf.moveTo(rightStart, ly)
            .lineTo(this.pdf.page.width - this.pdf.page.margins.right, ly)
            .lineWidth(0.7)
            .strokeColor('#000')
            .stroke();

        this.pdf.text(
            signatureA,
            rightStart,
            ly + 4,
            { width: colWidth, align: 'center' }
        );

        // Signature B (Drawn on the left only if provided and non-empty)
        if (signatureB && signatureB.trim() !== '') {
            this.pdf.moveTo(this.pageLeft, ly)
                .lineTo(this.pageLeft + colWidth, ly)
                .lineWidth(0.7)
                .strokeColor('#000')
                .stroke();

            this.pdf.text(
                signatureB,
                this.pageLeft,
                ly + 4,
                { width: colWidth, align: 'center' }
            );
        }

        this.y += 20;
        return this.y;
    }

    // ********************************
    // Helper Wrappers (from proto.js)
    // ------------------------------

    paragraph(text: string, opts: any = {}): number {
        const fontStyle = opts.Bold ? 'Bold' : 'Regular';
        this.pdf.font(fontStyle).fontSize(opts.size || 9).fillColor('#000');
        this.pdf.text(text, this.pageLeft, this.y, {
            width: this.contentWidth,
            align: opts.align || 'left',
            lineGap: 1
        });

        this.y = this.pdf.y;
        return this.y;
    }

    numberedClause(num: number, text: string): number {
        this.pdf.font('Regular').fontSize(9).fillColor('#000');

        // Number
        this.pdf.text(`${num}.`, this.pageLeft, this.y, { width: 16 });

        // Text content
        this.pdf.text(text, this.pageLeft + 20, this.y, {
            width: this.contentWidth - 16,
            lineGap: 1,
            align: 'justify'
        });

        this.y = this.pdf.y + 4;
        return this.y;
    }

    numberedClauses(clauses: string[]) {
        clauses.forEach((text, num) => this.numberedClause(num + 1, text))
    }

    checkbox(x: number, yPos: number, size: number = 9): void {
        this.pdf.rect(x, yPos, size, size).lineWidth(0.8).strokeColor('#000').stroke();
    }

    checkboxLine(items: any[]): number {
        this.pdf.font('Regular').fontSize(9.5).fillColor('#000');
        let x = this.pageLeft;
        const boxSize = 9;

        items.forEach(item => {
            this.pdf.rect(x, this.y + 1, boxSize, boxSize).lineWidth(0.8).strokeColor('#000').stroke();
            this.pdf.text(item, x + boxSize + 5, this.y, { continued: false });
            x += boxSize + 5 + this.pdf.widthOfString(item) + 25;
        });

        this.y += 24;
        return this.y;
    }

    equipmentGrid(items: [string, (boolean | undefined)?][]): number {
        const boxSize = 8;
        const rowH = 16;
        this.pdf.font('Regular').fontSize(9.3).fillColor('#000');

        const colWidth = this.contentWidth / 2;
        const half = Math.ceil(items.length / 2);
        const itemsLeft = items.slice(0, half);
        const itemsRight = items.slice(half);

        for (let i = 0; i < half; i++) {
            const rowY = this.y + i * rowH;

            const renderCell = (item: [string, (boolean | undefined)?], startX: number) => {
                const [ label, isChecked ] = item;

                // 1. Draw checkbox border
                this.pdf.rect(startX, rowY + 1, boxSize, boxSize)
                    .lineWidth(0.8)
                    .strokeColor('#000')
                    .stroke();

                // 2. Draw checkmark if state is true
                if (isChecked === true) {
                    this.pdf
                        .moveTo(startX + 1.5, rowY + 4.5)
                        .lineTo(startX + 3.5, rowY + 6.5)
                        .lineTo(startX + 6.5, rowY + 2.5)
                        .lineWidth(1.2)
                        .strokeColor('#000')
                        .stroke();
                }

                // 3. Render label text
                this.pdf.text(label, startX + boxSize + 5, rowY, {
                    width: colWidth - boxSize - 15,
                });
            };

            if (itemsLeft[i]) {
                renderCell(itemsLeft[i], this.pageLeft);
            }
            if (itemsRight[i]) {
                renderCell(itemsRight[i], this.pageLeft + colWidth);
            }
        }

        this.y += half * rowH + 6;
        return this.y;
    }

    drawImage(photoNumber: number, imageBuffer: Buffer, photoLabel: string): void {
        // Caption
        this.pdf.fontSize(12).text(photoLabel.replaceAll('{i}', photoNumber.toString()), this.pageLeft, this.y, {
            width: this.contentWidth,
            align: 'center',
        });
        this.y = this.pdf.y + 10;

        // Fit image into fixed height, capped at content width, centered horizontally
        const { width: imgW, height: imgH } = (this.pdf as any).openImage(imageBuffer);
        const scale = Math.min(this.contentWidth / imgW, PdfHelpers.IMAGE_HEIGHT / imgH);
        const drawWidth = imgW * scale;
        const drawHeight = imgH * scale;
        const x = this.pageLeft + (this.contentWidth - drawWidth) / 2;

        this.pdf.image(imageBuffer, x, this.y, {
            width: drawWidth,
            height: drawHeight,
        });

        this.y += drawHeight + 10;
    }

    addAttachmentPage(title: string, subtitle: string) {
        this.pdf.addPage();
        this.setY(20)
        this.title(title);
        this.subtitle(subtitle);
        this.line();
    }
}