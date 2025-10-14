import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchUserProfile } from './store/slices/authSlice';
import Header from './components/layout/Header';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminProtectedRoute from './routes/AdminProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load components
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const DashboardLayout = lazy(() => import('./features/dashboard/DashboardPage'));
const DashboardHome = lazy(() => import('./features/dashboard/DashboardHome'));
const TradingPage = lazy(() => import('./features/trading/TradingPage'));
const BalancePage = lazy(() => import('./features/balance/BalancePage'));
const SupportPage = lazy(() => import('./features/support/SupportPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const AdminLogin = lazy(() => import('./features/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./features/admin/AdminUsers'));
const AdminTransactions = lazy(() => import('./features/admin/AdminTransactions'));
const AdminTrades = lazy(() => import('./features/admin/AdminTrades'));
const AdminSupportPage = lazy(() => import('./features/admin/AdminSupportPage'));


const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    const publicPages = ['/login', '/admin/login'];
    if (publicPages.includes(location.pathname)) {
      return;
    }
    dispatch(fetchUserProfile());
  }, [dispatch, location.pathname]);

  const isLoginPage = location.pathname === '/login';
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Initial load check for non-public pages
  if (isLoading && !isLoginPage && !isAdminRoute) {
    const publicPages = ['/login', '/admin/login'];
    if (!publicPages.includes(location.pathname)) {
      return <LoadingFallback />;
    }
  }


  return (
    <div className="min-h-screen bg-gray-900">
      <ScrollToTop />
      {!isLoginPage && !isAdminRoute && <Header />}

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="trading" element={<TradingPage />} />
              <Route path="balance" element={<BalancePage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="trades" element={<AdminTrades />} />
              <Route path="support" element={<AdminSupportPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}