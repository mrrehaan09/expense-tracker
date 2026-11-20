import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import Sidebar from './Sidebar';
import AddTransactionModal from './AddTransactionModal';
import ExportPdfModal from './ExportPdfModal';
import {
  Menu,
  Plus,
  RotateCw,
  Calendar,
  AlertCircle,
  FileDown,
} from 'lucide-react';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const {
    user,
    loading,
    isRefreshing,
    error,
    transactions,
    fetchExpenses,
    isModalOpen,
    setIsModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  } = useExpenses();

  // Page titles by pathname
  const pageTitle = {
    '/dashboard': 'Financial Dashboard',
    '/transactions': 'Transaction Ledger',
    '/analytics': 'Analytics & Insights',
  }[location.pathname] || 'FinTrack';

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Navbar */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {pageTitle}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayFormatted}</span>
              </div>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Export PDF */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={transactions.length === 0}
              title="Export complete financial statement as PDF"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 active:bg-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-200/70 disabled:opacity-40"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Export PDF</span>
            </button>

            {/* Refresh from MongoDB */}
            <button
              onClick={() => fetchExpenses(true)}
              disabled={isRefreshing || loading}
              title="Refresh Records"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-transparent hover:border-slate-200 disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
            </button>

            {/* Add Transaction */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-4 sm:mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between font-medium animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchExpenses()}
              className="underline font-bold text-rose-800 ml-3 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Routed Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchExpenses(true)}
      />

      {/* Global Export PDF Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTransactions={transactions}
        filteredTransactions={transactions}
        currentFilterLabel="All Time"
        filterDetails="Complete Ledger"
        user={user}
      />
    </div>
  );
}
