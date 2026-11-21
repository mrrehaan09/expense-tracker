import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#D4AF72]/30 border-t-[#D4AF72] rounded-full animate-spin" />
          <span className="text-[#A6A19A] text-xs font-medium tracking-wide">Syncing FinTrack…</span>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
