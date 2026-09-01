// utils/formatters.ts
export const roundPrice = (price: number): number => {
  return Math.round(price * 100) / 100;
};

export const formatCurrency = (amount: number): string => {
  let currency = 'INR';
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('erp:display-settings:active');
      currency = raw ? JSON.parse(raw).currency || 'INR' : 'INR';
    } catch {
      currency = 'INR';
    }
  }

  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatDate = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const safeToISOString = (date: Date | string | null): string => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  } catch {
    return '';
  }
};

export const parseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};