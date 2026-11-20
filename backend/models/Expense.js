import mongoose from 'mongoose';

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

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      default: 'expense',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'Other',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
