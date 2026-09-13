export const formatCurrency = (amount: number | string, currency = 'RWF'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0`;
  return `${currency} ${num.toLocaleString('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return isNaN(n) ? '0' : n.toLocaleString();
};
