import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import {
  User,
  MessageSquare,
  Calendar,
  TrendingUp,
  Globe,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tc = useThemeClasses();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 ${tc.cardBg} transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${tc.cardBorder}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`${tc.textPrimary} font-semibold`}>{user.full_name || user.email}</p>
              <p className={`${tc.textSecondary} text-sm`}>Account: {user.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${tc.textSecondary} ${tc.hoverText}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance */}
        <div className={`p-6 border-b ${tc.cardBorder}`}>
          <p className={`${tc.textSecondary} text-sm mb-2`}>TOTAL BALANCE (USD)</p>
          <p className={`${tc.textPrimary} text-3xl font-bold`}>
            ${parseFloat(user.balance).toFixed(2)}
          </p>
          <p className={`${tc.textSecondary} text-sm mt-2`}>
            PNL (USD): $0.00
          </p>
          <p className={`${tc.textTertiary} text-xs mt-4`}>
            {new Date().toLocaleTimeString('en-US')} (UTC)
          </p>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2 flex-1">
          <button className={`w-full flex items-center gap-3 px-4 py-3 ${tc.textSecondary} ${tc.hoverBg} rounded-lg transition`}>
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-3 ${tc.textSecondary} ${tc.hoverBg} rounded-lg transition`}>
            <MessageSquare className="w-5 h-5" />
            <span>Support</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-3 ${tc.textSecondary} ${tc.hoverBg} rounded-lg transition`}>
            <Calendar className="w-5 h-5" />
            <span>History</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-3 ${tc.textSecondary} ${tc.hoverBg} rounded-lg transition`}>
            <TrendingUp className="w-5 h-5" />
            <span>Trading</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-3 ${tc.textSecondary} ${tc.hoverBg} rounded-lg transition`}>
            <Globe className="w-5 h-5" />
            <span>Language</span>
          </button>
        </div>

        {/* Logout Button - FIXED: moved to bottom */}
        <div className={`p-4 border-t ${tc.cardBorder}`}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-danger-400 hover:bg-danger-500/10 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
