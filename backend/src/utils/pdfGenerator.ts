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
  // In production, use pdfkit or similar library here
  // For now, return empty buffer as placeholder
  return Buffer.from(`Receipt: ${paymentData.receiptNumber}`);
};

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
}): Promise<Buffer> => {
  const qrCode = await QRCode.toBuffer(
    certData.verificationUrl || `https://trusterlabsacademy.com/verify/${certData.verificationCode}`,
    { type: 'png', width: 160, margin: 1 }
  );
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = 841.89;
    const height = 595.28;
    doc.rect(0, 0, width, height).fill('#ffffff');
    doc.rect(18, 18, width - 36, height - 36).lineWidth(2).stroke('#dfe3e8');
    doc.rect(30, 30, width - 60, height - 60).lineWidth(0.7).stroke('#eef0f3');

    // Subtle flowing lines echo the reference certificate's pale wave background.
    for (let i = 0; i < 14; i += 1) {
      const y = 42 + i * 9;
      doc.moveTo(30, y).bezierCurveTo(170, y - 42, 330, y + 48, 475, y - 5)
        .bezierCurveTo(620, y - 58, 735, y - 18, 812, y + 10)
        .lineWidth(0.45).stroke('#e7edf3');
    }

    if (certData.logoPath && fs.existsSync(certData.logoPath)) {
      doc.image(certData.logoPath, 58, 52, { fit: [105, 62], valign: 'center' });
    } else {
      doc.font('Helvetica-Bold').fontSize(17).fillColor('#173b7a').text('TrusterLabs', 58, 67);
      doc.font('Helvetica-Bold').fontSize(12).text('Academy', 58, 87);
    }

    doc.font('Helvetica').fontSize(16).fillColor('#1f2937')
      .text('This certificate is awarded to', 0, 123, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#075bb5')
      .text(certData.studentName, 65, 158, { align: 'center', width: width - 130 });
    doc.font('Helvetica').fontSize(17).fillColor('#1f2937')
      .text('for successfully completing', 0, 218, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(25).fillColor('#075bb5')
      .text(certData.courseName, 70, 253, { align: 'center', width: width - 140 });
    doc.font('Helvetica').fontSize(16).fillColor('#1f2937')
      .text(`offered by ${certData.providerName || 'TrusterLabs Academy'}`, 0, 307, { align: 'center' })
      .text(`through the ${certData.programName || 'TrusterLabs Academy'} program.`, 0, 333, { align: 'center' });

    doc.moveTo(72, 414).lineTo(770, 414).lineWidth(0.7).stroke('#d4d8dd');
    doc.font('Helvetica').fontSize(12).fillColor('#1f2937')
      .text(certData.providerName || 'TrusterLabs Academy', 72, 477)
      .text('Instructor', 72, 494)
      .text('TrusterLabs Academy', 72, 511);
    doc.image(qrCode, 380, 458, { width: 64, height: 64 });
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
      .text(`Cert ID: ${certData.verificationCode}`, 330, 528, { width: 180, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937')
      .text(certData.issuedAt.toLocaleDateString(), 667, 486, { width: 105, align: 'right' });
    doc.font('Helvetica').fontSize(12)
      .text('Completion Date', 650, 505, { width: 122, align: 'right' });
    doc.end();
  });
};
