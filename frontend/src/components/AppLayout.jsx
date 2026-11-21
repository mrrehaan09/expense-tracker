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
    groups,
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
    '/groups': 'Expense Groups',
    '/analytics': 'Analytics & Insights',
  }[location.pathname] || 'FinTrack';

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F5F1E8] flex">
      {/* 1. Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Navbar */}
        <header className="sticky top-0 z-10 bg-[#101013]/90 backdrop-blur-md border-b border-[#302B25] px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] transition border border-transparent hover:border-[#302B25] shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-black text-[#F5F1E8] tracking-tight truncate">
                  {pageTitle}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#2EB872]/10 text-[#2EB872] border border-[#2EB872]/20 px-2.5 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2EB872] animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#A6A19A] mt-0.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-[#A6A19A] shrink-0" />
                <span className="truncate">{todayFormatted}</span>
              </div>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Export PDF */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={transactions.length === 0}
              title="Export complete financial statement as PDF"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-[#1E1E23] hover:bg-[#25252B] active:bg-[#1E1E23] text-[#F5F1E8] text-xs font-semibold rounded-xl transition cursor-pointer border border-[#302B25] hover:border-[#D4AF72]/40 disabled:opacity-40 shrink-0"
            >
              <FileDown className="w-3.5 h-3.5 text-[#D4AF72]" />
              <span className="hidden md:inline">Export PDF</span>
            </button>

            {/* Refresh from MongoDB */}
            <button
              onClick={() => fetchExpenses(true)}
              disabled={isRefreshing || loading}
              title="Refresh Records"
              className="p-2 text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] rounded-xl transition border border-transparent hover:border-[#302B25] disabled:opacity-50 cursor-pointer shrink-0"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4AF72]' : ''}`} />
            </button>

            {/* Add Transaction (Primary Gold CTA) */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-[#D4AF72] hover:bg-[#E0C28A] active:bg-[#B89455] text-[#0B0B0D] text-xs font-bold rounded-xl shadow-sm transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-4 sm:mx-8 mt-4 p-3.5 bg-[#E05263]/10 border border-[#E05263]/25 text-[#E05263] rounded-xl text-xs flex items-center justify-between font-medium animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#E05263] flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchExpenses()}
              className="underline font-bold text-[#F5F1E8] hover:text-white ml-3 cursor-pointer"
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
        groups={groups}
        user={user}
        defaultPreset="this_month"
      />
    </div>
  );
}
