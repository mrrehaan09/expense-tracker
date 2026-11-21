/**
 * Formats a number to Indian Rupee (₹) currency with Indian number grouping
 * Example: 125000 -> "₹1,25,000.00"
 */
export const formatINR = (amount = 0) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Compact Indian currency formatting for charts/axes
 * Example: 150000 -> "₹1.5L", 25000 -> "₹25k"
 */
export const formatCompactINR = (amount = 0) => {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (Math.abs(num) >= 1000) {
    return `₹${(num / 1000).toFixed(0)}k`;
  }
  return `₹${num}`;
};

/**
 * Obsidian Gold Theme: Payment method badge styling
 * Provides refined dark elevated surface pills with subtle accent borders
 */
export const getPaymentBadge = (method = 'Other') => {
  if (method.includes('PhonePe')) {
    return 'bg-[rgba(124,58,237,0.12)] text-[#C4B5FD] border-[rgba(124,58,237,0.30)]';
  }
  if (method.includes('Paytm')) {
    return 'bg-[rgba(2,132,199,0.12)] text-[#7DD3FC] border-[rgba(2,132,199,0.30)]';
  }
  if (method.includes('Google Pay')) {
    return 'bg-[rgba(59,130,246,0.12)] text-[#93C5FD] border-[rgba(59,130,246,0.30)]';
  }
  if (method.includes('UPI')) {
    return 'bg-[rgba(99,102,241,0.12)] text-[#A5B4FC] border-[rgba(99,102,241,0.30)]';
  }
  if (method === 'Cash') {
    return 'bg-[rgba(46,184,114,0.12)] text-[#2EB872] border-[rgba(46,184,114,0.30)]';
  }
  if (method.includes('Card')) {
    return 'bg-[rgba(212,175,114,0.12)] text-[#D4AF72] border-[rgba(212,175,114,0.30)]';
  }
  if (method.includes('Bank') || method.includes('Net Banking')) {
    return 'bg-[rgba(13,148,136,0.12)] text-[#5EEAD4] border-[rgba(13,148,136,0.30)]';
  }
  return 'bg-[#1E1E23] text-[#A6A19A] border-[#302B25]';
};

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Travel & Transport',
  'Bills & Utilities',
  'Rent',
  'Healthcare',
  'Education',
  'Entertainment',
  'Personal Care',
  'Other',
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI - Paytm',
  'UPI - PhonePe',
  'UPI - Google Pay',
  'Other UPI',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Net Banking',
  'Wallet',
  'Other',
];

export const INCOME_CATEGORIES = [
  'Salary & Wages',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Business Revenue',
  'Gifts & Bonuses',
  'Other Income',
];
