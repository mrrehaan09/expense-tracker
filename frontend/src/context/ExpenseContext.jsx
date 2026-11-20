import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [data, setData] = useState({
    summary: {
      totalBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: 0,
    },
    categoryBreakdown: [],
    monthlyStats: [],
    transactions: [],
  });

  // Fetch real data from MongoDB backend
  const fetchExpenses = useCallback(async (isSilent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);
    setError('');

    try {
      const res = await api.get('/expenses');
      if (res.data && res.data.success) {
        setData({
          summary: res.data.summary || {
            totalBalance: 0,
            totalIncome: 0,
            totalExpense: 0,
            transactionCount: 0,
          },
          categoryBreakdown: res.data.categoryBreakdown || [],
          monthlyStats: res.data.monthlyStats || [],
          transactions: res.data.transactions || [],
        });
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError('Unable to sync records with server. Please verify your backend connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Create transaction
  const addTransaction = async (formData) => {
    try {
      const res = await api.post('/expenses', formData);
      if (res.data && res.data.success) {
        await fetchExpenses(true);
        return { success: true };
      }
      return { success: false, message: 'Failed to add transaction' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating transaction';
      return { success: false, message: msg };
    }
  };

  // Delete transaction
  const deleteTransaction = async (id) => {
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data && res.data.success) {
        await fetchExpenses(true);
        return { success: true };
      }
      return { success: false, message: 'Failed to delete transaction' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error deleting transaction';
      return { success: false, message: msg };
    }
  };

  const value = {
    user,
    loading,
    isRefreshing,
    error,
    summary: data.summary,
    categoryBreakdown: data.categoryBreakdown,
    monthlyStats: data.monthlyStats,
    transactions: data.transactions,
    fetchExpenses,
    addTransaction,
    deleteTransaction,
    isModalOpen,
    setIsModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
