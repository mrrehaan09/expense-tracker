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
  const [groups, setGroups] = useState([]);

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

  // Fetch expense groups
  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      return;
    }
    try {
      const res = await api.get('/groups');
      if (res.data && res.data.success) {
        setGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  }, [user]);

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
        fetchGroups();
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError('Unable to sync records with server. Please verify your backend connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, fetchGroups]);

  useEffect(() => {
    fetchExpenses();
    fetchGroups();
  }, [fetchExpenses, fetchGroups]);

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

  // Update transaction (e.g. reassign group, edit details)
  const updateTransaction = async (id, updateData) => {
    try {
      const res = await api.put(`/expenses/${id}`, updateData);
      if (res.data && res.data.success) {
        await fetchExpenses(true);
        await fetchGroups();
        return { success: true, transaction: res.data.transaction };
      }
      return { success: false, message: 'Failed to update transaction' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating transaction';
      return { success: false, message: msg };
    }
  };

  // Reassign transaction to a group or Personal (null)
  const updateTransactionGroup = async (transactionId, groupId) => {
    return updateTransaction(transactionId, { group: groupId || null });
  };

  // Create new group
  const createGroup = async (groupData) => {
    try {
      const res = await api.post('/groups', groupData);
      if (res.data && res.data.success) {
        await fetchGroups();
        await fetchExpenses(true);
        return { success: true, group: res.data.group };
      }
      return { success: false, message: 'Failed to create group' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating group';
      return { success: false, message: msg };
    }
  };

  // Update existing group
  const updateGroup = async (id, groupData) => {
    try {
      const res = await api.put(`/groups/${id}`, groupData);
      if (res.data && res.data.success) {
        await fetchGroups();
        await fetchExpenses(true);
        return { success: true, group: res.data.group };
      }
      return { success: false, message: 'Failed to update group' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating group';
      return { success: false, message: msg };
    }
  };

  // Delete group (associated transactions automatically revert to personal)
  const deleteGroup = async (id) => {
    try {
      const res = await api.delete(`/groups/${id}`);
      if (res.data && res.data.success) {
        await fetchGroups();
        await fetchExpenses(true);
        return { success: true };
      }
      return { success: false, message: 'Failed to delete group' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error deleting group';
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
    groups,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    fetchExpenses,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    updateTransactionGroup,
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
