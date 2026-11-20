import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  LogOut,
  X,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
  ];

  // User initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'US';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200/80 shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-600 transition-colors">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                FinTrack
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Smart Expense Ledger</p>
          </div>
        </NavLink>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation with NavLink */}
      <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </NavLink>
          );
        })}

        {/* Quick Insight Mini-Card */}
        <div className="pt-6 px-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>INR Currency (₹)</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Auto-formatted Indian Rupees with real-time sync across MongoDB and instant PDF statements.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-xs mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
              <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/60 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-xs h-full z-10 animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
