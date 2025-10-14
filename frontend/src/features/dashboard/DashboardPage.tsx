import { useAppSelector } from '@/store/hooks';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Page Content - без дублюючої навігації */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
