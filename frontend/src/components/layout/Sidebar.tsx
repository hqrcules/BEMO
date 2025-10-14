import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
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
        className={`fixed top-0 left-0 h-full w-80 bg-gray-800 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">{user.full_name || user.email}</p>
              <p className="text-gray-400 text-sm">Account: {user.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance */}
        <div className="p-6 border-b border-gray-700">
          <p className="text-gray-400 text-sm mb-2">TOTAL BALANCE (USD)</p>
          <p className="text-white text-3xl font-bold">
            ${parseFloat(user.balance).toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            PNL (USD): $0.00
          </p>
          <p className="text-gray-500 text-xs mt-4">
            {new Date().toLocaleTimeString('en-US')} (UTC)
          </p>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition">
            <MessageSquare className="w-5 h-5" />
            <span>Support</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition">
            <Calendar className="w-5 h-5" />
            <span>History</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition">
            <TrendingUp className="w-5 h-5" />
            <span>Trading</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition">
            <Globe className="w-5 h-5" />
            <span>Language</span>
          </button>
        </div>

        {/* Logout Button - FIXED: moved to bottom */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
