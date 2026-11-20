# 001 - Smart Daily Expense Tracker

> Project 001 of the 100 Full Stack Websites Challenge

## Stack
- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 + Recharts
- **Backend**: Node.js + Express + Mongoose
- **Database**: Local MongoDB (`mongodb://localhost:27017/expense_tracker`)
- **Auth**: JWT + bcryptjs

## Features
- **Indian Rupees (₹ INR) Throughout**: Strict Indian numbering system formatting (e.g., `₹1,25,000.00`).
- **User Authentication**: Secure registration, login, JWT validation, and logout.
- **Financial Metric Cards**: Real-time Total Balance, Total Income, and Total Expenses formatted in ₹.
- **Recharts Monthly Visualizations**: Income vs. Expense monthly bar chart in ₹.
- **Expense Category Breakdown**: 11 dedicated categories (*Food & Dining, Groceries, Shopping, Travel & Transport, Bills & Utilities, Rent, Healthcare, Education, Entertainment, Personal Care, Other*).
- **Payment Method Tracking**: 11 payment modes (*Cash, UPI - Paytm, UPI - PhonePe, UPI - Google Pay, Other UPI, Debit Card, Credit Card, Bank Transfer, Net Banking, Wallet, Other*).
- **Multi-Factor Filtering**: Filter transactions by type (*All/Income/Expense*), Category, and Payment Method, with full-text search.
- **Transaction Management**: Add Income/Expense modal with date, category, and payment method selectors; delete transactions.
- **Responsive Dashboard UI**: Collapsible sidebar, user profile card, and mobile navigation drawer.

## API Endpoints
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user & return JWT
- `GET /api/auth/me` — Authenticated user profile (Protected)
- `GET /api/expenses` — Retrieve transactions, summary totals, monthly trends, and category breakdown (Protected)
- `POST /api/expenses` — Add new transaction (Protected)
- `DELETE /api/expenses/:id` — Delete transaction (Protected)

## Running Locally

### 1. Backend Server
```bash
cd backend
node server.js   # or: npm run dev
```
Runs at `http://localhost:5000`

### 2. Frontend Application
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:5173`
