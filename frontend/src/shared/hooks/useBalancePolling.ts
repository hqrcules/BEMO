import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authService } from '@/services/authService';
import { updateBalance } from '@/store/slices/authSlice';

export function useBalancePolling(intervalMs = 5000) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isAuthenticated) return;
      try {
        const { balance } = await authService.getBalance();
        dispatch(updateBalance(balance));
      } catch (error) {
        console.error('Polling failed to fetch balance:', error);
      }
    };

    if (isAuthenticated) {
      fetchBalance();
      intervalRef.current = setInterval(fetchBalance, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, dispatch, intervalMs]);
}