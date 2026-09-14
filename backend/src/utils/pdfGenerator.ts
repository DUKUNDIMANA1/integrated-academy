import PDFDocument from 'pdfkit';
import fs from 'fs';
import QRCode from 'qrcode';

export const generateReceiptPDF = async (paymentData: {
  receiptNumber: string;
  studentName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  invoiceNumber: string;
  date: Date;
}): Promise<Buffer> => {
  return Buffer.from(`Receipt: ${paymentData.receiptNumber}`);
};

/**
 * Pixel-accurate recreation of the TrusterLabs certificate design:
 *
 * Layout (A4 Landscape 841.89 × 595.28 pt):
 *   • Light blue-gray gradient background (#e8eaf2 → #f5f6fb)
 *   • Dark navy organic blob — top-right corner
 *   • Gold organic wave — bottom-right corner (two-layer)
 *   • Logo top-left (image if available, else text badge)
 *   • "CERTIFICATE"  — large bold centered ~y 110
 *   • "OF COMPLETION" — italic centered ~y 165
 *   • Student name   — very large bold centered ~y 240
 *   • Horizontal rule full-width below name
 *   • Two italic description lines ~y 310
 *   • Bottom section at ~y 450:
 *       [sig line + Supervisor]  [QR code]  [sig line + Manager]
 */
export const generateCertificatePDF = async (certData: {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issuedAt: Date;
  verificationCode: string;
  verificationUrl?: string;
  logoPath?: string;
  providerName?: string;
  supervisorName?: string;
  supervisorTitle?: string;
  managerName?: string;
  managerTitle?: string;
}): Promise<Buffer> => {
  /* ── QR code ── */
  const verifyUrl =
    certData.verificationUrl ||
    `https://trusterlabsacademy.com/verify/${certData.verificationCode}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 200,
    margin: 1,
    color: { dark: '#0d1b4b', light: '#ffffff' },
  });

  /* ── Document ── */
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 841.89;
    const H = 595.28;

    /* ── 1. Background — light blue-gray ── */
    // Simulate the soft radial gradient with a plain fill + a lighter center highlight
    doc.rect(0, 0, W, H).fill('#e9ecf5');

    // Lighter central area to mimic the gradient glow
    const cx = W * 0.42;
    const cy = H * 0.44;
    const steps = 18;
    for (let i = steps; i >= 0; i--) {
      const ratio = i / steps;
      const r = 340 * (1 - ratio * 0.5);
      // interpolate from #e9ecf5 (outer) to #f4f5fb (inner)
      const lum = Math.round(233 + (244 - 233) * (1 - ratio));
      const lumHex = lum.toString(16).padStart(2, '0');
      const color = `#${lumHex}${lumHex}fb`.replace('fbfbfb', 'f4f5fb');
      doc.circle(cx, cy, r).fill(color);
    }

    /* ── 2. Navy organic blob — top-right ── */
    // Traced from the reference: starts at top-right corner, sweeps left/down
    // then curves back up and closes at top-right.
    doc
      .save()
      .moveTo(W, 0)                            // top-right corner
      .lineTo(W, 0)
      .bezierCurveTo(W, 0, W - 5, 0, W - 60, 0)      // top edge going left
      .bezierCurveTo(W - 160, 0, W - 220, 30, W - 200, 100)  // dip into page
      .bezierCurveTo(W - 185, 155, W - 130, 195, W - 60, 200) // curve down
      .bezierCurveTo(W - 10, 203, W, 185, W, 160)    // curve back to right edge
      .lineTo(W, 0)                            // close back to top-right
      .fill('#0d1b4b')
      .restore();

    /* ── 3. Gold wave — bottom-right ── */
    // Outer (darker gold)
    doc
      .save()
      .moveTo(W, H)                            // bottom-right
      .lineTo(W, H - 165)
      .bezierCurveTo(W, H - 200, W - 40, H - 195, W - 80, H - 165)
      .bezierCurveTo(W - 140, H - 125, W - 185, H - 70, W - 220, H - 40)
      .bezierCurveTo(W - 250, H - 15, W - 230, H, W - 180, H)
      .lineTo(W, H)
      .fill('#d4a843')
      .restore();

    // Inner (lighter gold / cream highlight)
    doc
      .save()
      .moveTo(W, H)
      .lineTo(W, H - 100)
      .bezierCurveTo(W - 5, H - 130, W - 35, H - 125, W - 65, H - 100)
      .bezierCurveTo(W - 110, H - 65, W - 145, H - 30, W - 170, H - 10)
      .bezierCurveTo(W - 185, H - 2, W - 175, H, W - 140, H)
      .lineTo(W, H)
      .fill('#f0c84a')
      .restore();

    /* ── 4. Logo — top-left ── */
    if (certData.logoPath && fs.existsSync(certData.logoPath)) {
      doc.image(certData.logoPath, 38, 28, { fit: [130, 58] });
    } else {
      // White badge with "TRUSTER LABS" text to match the reference
      doc.roundedRect(32, 24, 148, 60, 5).fill('#ffffff');
      // Lock icon placeholder (circle)
      doc.circle(58, 54, 14).fill('#f5c518');
      doc.circle(58, 54, 9).fill('#1a3a8a');
      // Text
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0d1b4b')
        .text('TRUSTER LABS', 78, 38);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6b7ba8')
        .text('FORTIFY · EMPOWER · DEFEND', 78, 57);
    }

    /* ── 5. "CERTIFICATE" ── */
    doc
      .font('Helvetica-Bold')
      .fontSize(52)
      .fillColor('#0d1b4b')
      .text('CERTIFICATE', 0, 100, { align: 'center', width: W, characterSpacing: 2 });

    /* ── 6. "OF COMPLETION" ── */
    doc
      .font('Helvetica-Oblique')
      .fontSize(20)
      .fillColor('#2a3560')
      .text('OF COMPLETION', 0, 165, { align: 'center', width: W, characterSpacing: 3 });

    /* ── 7. Student name ── */
    const nameY = 248;
    doc
      .font('Helvetica-Bold')
      .fontSize(40)
      .fillColor('#0d1b4b')
      .text(certData.studentName, 60, nameY, { align: 'center', width: W - 120 });

    /* ── 8. Underline beneath name ── */
    // Full-width rule matching the reference (runs almost full width)
    const ruleY = nameY + 50;
    doc
      .moveTo(55, ruleY)
      .lineTo(W - 55, ruleY)
      .lineWidth(1.0)
      .strokeColor('#0d1b4b')
      .stroke();

    /* ── 9. Description lines ── */
    const dateStr = certData.issuedAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Line 1
    doc
      .font('Helvetica-Oblique')
      .fontSize(13)
      .fillColor('#2a2a2a')
      .text(
        `has successfully completed a professional training program conducted on ${dateStr}.`,
        80,
        ruleY + 14,
        { align: 'center', width: W - 160 }
      );

    // Line 2
    doc
      .font('Helvetica-Oblique')
      .fontSize(13)
      .fillColor('#2a2a2a')
      .text(
        `${_pronoun(certData.studentName)} dedication and commitment to the learning process are truly commendable.`,
        80,
        ruleY + 38,
        { align: 'center', width: W - 160 }
      );

    /* ── 10. Bottom section ── */
    const botY = 458;          // vertical start of the signatory section
    const sigW = 150;          // width of each sig block
    const leftSigX = 72;       // left sig block left edge
    const rightSigX = W - 72 - sigW; // right sig block left edge
    const qrSize = 90;
    const qrX = (W - qrSize) / 2;
    const qrY = botY - 8;

    // Left sig line
    doc
      .moveTo(leftSigX, botY + 30)
      .lineTo(leftSigX + sigW, botY + 30)
      .lineWidth(0.9)
      .strokeColor('#333333')
      .stroke();

    // Left name
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#0d1b4b')
      .text(certData.supervisorName || 'Academy Director', leftSigX, botY + 36, {
        width: sigW,
        align: 'center',
      });

    // Left title
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#555555')
      .text(certData.supervisorTitle || 'Supervisor', leftSigX, botY + 54, {
        width: sigW,
        align: 'center',
      });

    // QR code — white box border then image
    doc
      .rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
      .fill('#ffffff');
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    // Right sig line
    doc
      .moveTo(rightSigX, botY + 30)
      .lineTo(rightSigX + sigW, botY + 30)
      .lineWidth(0.9)
      .strokeColor('#333333')
      .stroke();

    // Right name
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#0d1b4b')
      .text(certData.managerName || 'Program Manager', rightSigX, botY + 36, {
        width: sigW,
        align: 'center',
      });

    // Right title
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#555555')
      .text(certData.managerTitle || 'Manager', rightSigX, botY + 54, {
        width: sigW,
        align: 'center',
      });

    /* ── 11. Cert number micro text ── */
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#9aa3be')
      .text(`Certificate No: ${certData.certificateNumber}`, 0, H - 22, {
        align: 'center',
        width: W,
      });

    doc.end();
  });
};

/** Returns "Their" always (gender-neutral fallback). */
function _pronoun(_name: string): string {
  return 'Their';
}
