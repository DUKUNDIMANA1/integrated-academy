import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const formatDate = (date: string | Date | undefined | null, fmt = 'dd MMM yyyy'): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : '—';
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
};

export const timeAgo = (date: string | Date | undefined | null): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
};
