import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Users,
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
    { path: '/groups', label: 'Expense Groups', icon: Users },
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
    <div className="flex flex-col h-full bg-[#101013] text-[#F5F1E8] border-r border-[#302B25] shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#302B25] flex items-center justify-between">
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1E1E23] border border-[#302B25] flex items-center justify-center text-[#D4AF72] shadow-xs group-hover:border-[#D4AF72]/40 transition-colors">
            <CreditCard className="w-4 h-4 text-[#D4AF72]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#F5F1E8]">
                FinTrack
              </span>
              <span className="text-[10px] font-bold bg-[#D4AF72]/15 text-[#D4AF72] border border-[#D4AF72]/30 px-1.5 py-0.2 rounded">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#A6A19A]">Smart Expense Ledger</p>
          </div>
        </NavLink>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#1E1E23] transition border border-transparent hover:border-[#302B25]"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation with NavLink */}
      <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#A6A19A]/80">
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
                  ? 'bg-[#D4AF72]/10 text-[#D4AF72] border border-[#D4AF72]/25 font-bold shadow-xs'
                  : 'text-[#A6A19A] hover:text-[#F5F1E8] hover:bg-[#17171B] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#D4AF72]' : 'text-[#A6A19A]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF72] shadow-xs shadow-[#D4AF72]/50" />
              )}
            </NavLink>
          );
        })}

        {/* Quick Insight Mini-Card */}
        <div className="pt-6 px-1">
          <div className="p-3.5 rounded-xl bg-[#17171B] border border-[#302B25] text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#F5F1E8] font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4AF72]" />
              <span>INR Currency (₹)</span>
            </div>
            <p className="text-[#A6A19A] text-[11px] leading-relaxed">
              Auto-formatted Indian Rupees with real-time sync across MongoDB and instant PDF statements.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-3.5 border-t border-[#302B25] bg-[#101013]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#17171B] border border-[#302B25] shadow-xs mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1E1E23] border border-[#302B25] flex items-center justify-center text-xs font-bold text-[#D4AF72] flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-[#F5F1E8] truncate">{user?.name || 'User'}</p>
              <ShieldCheck className="w-3 h-3 text-[#2EB872] flex-shrink-0" />
            </div>
            <p className="text-[11px] text-[#A6A19A] truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#E05263] bg-[#E05263]/10 hover:bg-[#E05263]/20 border border-[#E05263]/25 rounded-xl transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-[#0B0B0D]/80 backdrop-blur-sm transition-opacity"
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
