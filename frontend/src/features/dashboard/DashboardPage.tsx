import { useAppSelector } from '@/store/hooks';
import { Outlet } from 'react-router-dom';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

export default function DashboardLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const tc = useThemeClasses();

  if (!user) return null;

  return (
    <div className={tc.bg}>
      <Outlet />
    </div>
  );
}