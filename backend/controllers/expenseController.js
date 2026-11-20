import Expense from '../models/Expense.js';

// ─── @route  GET /api/expenses ───────────────────────────────────────────────
export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all transactions for this user, newest first
    const transactions = await Expense.find({ user: userId }).sort({ date: -1, createdAt: -1 });

    // Calculate summaries from real data
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};
    const monthlyMap = {};

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        // Category breakdown for expenses
        const cat = tx.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      }

      // Monthly aggregation: Format as 'YYYY-MM' and 'MMM YYYY'
      const txDate = new Date(tx.date);
      const yearMonthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = txDate.toLocaleString('en-IN', { month: 'short' });

      if (!monthlyMap[yearMonthKey]) {
        monthlyMap[yearMonthKey] = {
          key: yearMonthKey,
          month: monthLabel,
          year: txDate.getFullYear(),
          income: 0,
          expense: 0,
        };
      }
      if (tx.type === 'income') {
        monthlyMap[yearMonthKey].income += amount;
      } else {
        monthlyMap[yearMonthKey].expense += amount;
      }
    });

    const totalBalance = totalIncome - totalExpense;

    // Format category breakdown
    const categoryBreakdown = Object.keys(categoryTotals).map((cat) => ({
      name: cat,
      amount: categoryTotals[cat],
      percentage: totalExpense > 0 ? Math.round((categoryTotals[cat] / totalExpense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Format monthly stats sorted chronologically
    const monthlyStats = Object.keys(monthlyMap)
      .sort()
      .map((k) => monthlyMap[k]);

    res.status(200).json({
      success: true,
      summary: {
        totalBalance,
        totalIncome,
        totalExpense,
        transactionCount: transactions.length,
      },
      categoryBreakdown,
      monthlyStats,
      transactions,
    });
  } catch (err) {
    console.error('[getExpenses error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

// ─── @route  POST /api/expenses ──────────────────────────────────────────────
export const createExpense = async (req, res) => {
  try {
    const { title, amount, type, category, paymentMethod, date, note } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Transaction title is required' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid amount greater than 0' });
    }

    const txType = type === 'income' ? 'income' : 'expense';

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const expense = await Expense.create({
      user: req.user.id,
      title: title.trim(),
      amount: parsedAmount,
      type: txType,
      category: category.trim(),
      paymentMethod: paymentMethod && paymentMethod.trim() ? paymentMethod.trim() : 'Other',
      date: date ? new Date(date) : new Date(),
      note: note ? note.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction: expense,
    });
  } catch (err) {
    console.error('[createExpense error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
};

// ─── @route  DELETE /api/expenses/:id ────────────────────────────────────────
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOneAndDelete({ _id: id, user: req.user.id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      id,
    });
  } catch (err) {
    console.error('[deleteExpense error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
};
