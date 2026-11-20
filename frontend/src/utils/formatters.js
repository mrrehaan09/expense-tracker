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
