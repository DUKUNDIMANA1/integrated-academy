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
 * Generates a certificate PDF that matches the TrusterLabs design:
 *  - White landscape background with a soft light-gray gradient feel
 *  - Dark navy filled shape in the top-right corner
 *  - Gold/yellow decorative wave in the bottom-right corner
 *  - Logo (or org name text) in the top-left
 *  - Bold "CERTIFICATE" heading, italic "OF COMPLETION" subtitle
 *  - Student name large, centered, with a horizontal rule beneath
 *  - Description paragraph in italic
 *  - QR code centered at the bottom with two side signatories
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
  programName?: string;
  supervisorName?: string;
  supervisorTitle?: string;
  managerName?: string;
  managerTitle?: string;
}): Promise<Buffer> => {
  // ── QR code ──────────────────────────────────────────────────────────────
  const verifyUrl =
    certData.verificationUrl ||
    `https://trusterlabsacademy.com/verify/${certData.verificationCode}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 130,
    margin: 1,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  // ── Document setup ────────────────────────────────────────────────────────
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 841.89; // A4 landscape width  (pts)
    const H = 595.28; // A4 landscape height (pts)

    // ── 1. White background ──────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill('#f5f6fb');

    // ── 2. Very subtle inner white panel ────────────────────────────────────
    doc.roundedRect(22, 22, W - 44, H - 44, 8).fill('#ffffff');

    // ── 3. Navy corner shape — top-right ────────────────────────────────────
    // Roughly matches the dark navy blob in the reference image
    doc
      .save()
      .moveTo(W - 22, 22)           // top-right of inner panel
      .lineTo(W - 22, 22 + 180)     // down the right edge
      .bezierCurveTo(
        W - 22, 22 + 230,
        W - 130, 22 + 180,
        W - 180, 22 + 100
      )
      .bezierCurveTo(
        W - 240, 22 + 30,
        W - 200, 22,
        W - 22, 22
      )
      .fill('#0d1b4b')
      .restore();

    // ── 4. Gold / yellow decorative wave — bottom-right ─────────────────────
    doc
      .save()
      .moveTo(W - 22, H - 22)       // bottom-right corner
      .lineTo(W - 22, H - 140)
      .bezierCurveTo(
        W - 22, H - 180,
        W - 100, H - 160,
        W - 160, H - 110
      )
      .bezierCurveTo(
        W - 240, H - 55,
        W - 200, H - 22,
        W - 22, H - 22
      )
      .fill('#e8b84b')
      .restore();

    // Thin gold accent line (secondary highlight strip inside bottom-right)
    doc
      .save()
      .moveTo(W - 22, H - 22)
      .lineTo(W - 22, H - 90)
      .bezierCurveTo(
        W - 22, H - 120,
        W - 60, H - 110,
        W - 100, H - 80
      )
      .bezierCurveTo(
        W - 150, H - 40,
        W - 110, H - 22,
        W - 22, H - 22
      )
      .fill('#f5c842')
      .restore();

    // ── 5. Logo or org name — top-left ───────────────────────────────────────
    const logoX = 52;
    const logoY = 40;
    if (certData.logoPath && fs.existsSync(certData.logoPath)) {
      doc.image(certData.logoPath, logoX, logoY, { fit: [120, 60], valign: 'center' });
    } else {
      // Fallback text badge that mimics the "TRUSTER LABS" lock-icon style
      doc
        .roundedRect(logoX, logoY, 130, 52, 4)
        .fill('#ffffff')
        .stroke('#e2e8f0');
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0d1b4b')
        .text('TRUSTER LABS', logoX + 8, logoY + 10, { width: 114 });
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#5a7ab5')
        .text('FORTIFY · EMPOWER · DEFEND', logoX + 8, logoY + 30, { width: 114 });
    }

    // ── 6. "CERTIFICATE" heading ─────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(44)
      .fillColor('#0d1b4b')
      .text('CERTIFICATE', 0, 88, { align: 'center', width: W });

    // ── 7. "OF COMPLETION" subtitle ──────────────────────────────────────────
    doc
      .font('Helvetica-Oblique')
      .fontSize(18)
      .fillColor('#444c6e')
      .text('OF COMPLETION', 0, 142, { align: 'center', width: W });

    // ── 8. Student name — large, centered ────────────────────────────────────
    const nameY = 205;
    doc
      .font('Helvetica-Bold')
      .fontSize(36)
      .fillColor('#0d1b4b')
      .text(certData.studentName, 80, nameY, { align: 'center', width: W - 160 });

    // Underline beneath the name
    const nameTextWidth = Math.min(certData.studentName.length * 18, W - 200);
    const underlineX = (W - nameTextWidth) / 2;
    const underlineY = nameY + 46;
    doc
      .moveTo(underlineX, underlineY)
      .lineTo(underlineX + nameTextWidth, underlineY)
      .lineWidth(1.2)
      .stroke('#0d1b4b');

    // ── 9. Description paragraph ──────────────────────────────────────────────
    const dateStr = certData.issuedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const org = certData.providerName || 'TrusterLabs Academy';
    const course = certData.courseName;

    doc
      .font('Helvetica-Oblique')
      .fontSize(12)
      .fillColor('#333333')
      .text(
        `has successfully completed the "${course}" professional training program`,
        80,
        underlineY + 16,
        { align: 'center', width: W - 160 }
      );
    doc
      .font('Helvetica-Oblique')
      .fontSize(12)
      .fillColor('#333333')
      .text(
        `conducted by ${org} on ${dateStr}.`,
        80,
        underlineY + 34,
        { align: 'center', width: W - 160 }
      );
    doc
      .font('Helvetica-Oblique')
      .fontSize(11.5)
      .fillColor('#555555')
      .text(
        'Their dedication and commitment to the learning process are truly commendable.',
        80,
        underlineY + 54,
        { align: 'center', width: W - 160 }
      );

    // ── 10. Horizontal divider ────────────────────────────────────────────────
    const divY = underlineY + 82;
    doc
      .moveTo(52, divY)
      .lineTo(W - 52, divY)
      .lineWidth(0.6)
      .stroke('#c8cfe0');

    // ── 11. Bottom section: left signatory | QR code | right signatory ───────
    const bottomY = divY + 18;
    const sigLineLen = 130;

    // Left signatory
    const leftX = 70;
    const supervisor = certData.supervisorName || 'Academy Director';
    const supervisorTitle = certData.supervisorTitle || 'Supervisor';
    doc
      .moveTo(leftX, bottomY + 38)
      .lineTo(leftX + sigLineLen, bottomY + 38)
      .lineWidth(0.8)
      .stroke('#555555');
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0d1b4b')
      .text(supervisor, leftX, bottomY + 44, { width: sigLineLen, align: 'center' });
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#666666')
      .text(supervisorTitle, leftX, bottomY + 60, { width: sigLineLen, align: 'center' });

    // QR code — center
    const qrSize = 80;
    const qrX = (W - qrSize) / 2;
    const qrY = bottomY + 4;
    doc
      .rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8)
      .fill('#ffffff')
      .stroke('#e2e8f0');
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#888888')
      .text(certData.verificationCode, qrX - 10, qrY + qrSize + 4, {
        width: qrSize + 20,
        align: 'center',
      });

    // Right signatory
    const rightX = W - 70 - sigLineLen;
    const manager = certData.managerName || 'Program Manager';
    const managerTitle = certData.managerTitle || 'Manager';
    doc
      .moveTo(rightX, bottomY + 38)
      .lineTo(rightX + sigLineLen, bottomY + 38)
      .lineWidth(0.8)
      .stroke('#555555');
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0d1b4b')
      .text(manager, rightX, bottomY + 44, { width: sigLineLen, align: 'center' });
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#666666')
      .text(managerTitle, rightX, bottomY + 60, { width: sigLineLen, align: 'center' });

    // ── 12. Certificate number — very bottom center ───────────────────────────
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#aaaaaa')
      .text(`Certificate No: ${certData.certificateNumber}`, 0, H - 38, {
        align: 'center',
        width: W,
      });

    doc.end();
  });
};
