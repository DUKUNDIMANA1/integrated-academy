import { v4 as uuidv4 } from 'uuid';

export const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${rand}`;
};

export const generatePaymentNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PAY-${year}-${rand}`;
};

export const generateReceiptNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RCP-${year}-${rand}`;
};

export const generateStudentCode = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `STD-${year}-${rand}`;
};

export const generateEmployeeCode = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${year}-${rand}`;
};

export const generateTicketNumber = (): string => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${rand}`;
};

export const generateCertificateNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CERT-${year}-${rand}`;
};

export const generateVerificationCode = (): string => {
  return uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
};
