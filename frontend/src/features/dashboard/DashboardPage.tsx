import { useAppSelector } from '@/store/hooks';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Клас "animate-fade-in" було видалено звідси,
        оскільки він використовував 'transform' і ламав
        'position: fixed' у дочірніх модальних вікнах.
      */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}