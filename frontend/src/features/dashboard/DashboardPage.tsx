import { useAppSelector } from '@/store/hooks';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
}