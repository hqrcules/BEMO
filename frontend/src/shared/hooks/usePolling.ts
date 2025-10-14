import { useEffect, useRef, useCallback } from 'react';

type PollingFunction = () => Promise<void>;

interface UsePollingOptions {
  interval?: number; // Interval in milliseconds
  enabled?: boolean; // Whether polling is enabled
  onError?: (error: Error) => void;
}

export function usePolling(
  pollingFunction: PollingFunction,
  options: UsePollingOptions = {}
) {
  const {
    interval = 3000, // Default 3 seconds
    enabled = true,
    onError
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  const startPolling = useCallback(async () => {
    if (isRunningRef.current || !enabled) return;
    
    isRunningRef.current = true;

    const poll = async () => {
      try {
        await pollingFunction();
      } catch (error) {
        console.error('Polling error:', error);
        if (onError) {
          onError(error as Error);
        }
      }

      if (isRunningRef.current && enabled) {
        intervalRef.current = setTimeout(poll, interval);
      }
    };

    // Start first poll immediately
    await poll();
  }, [pollingFunction, interval, enabled, onError]);

  const stopPolling = useCallback(() => {
    isRunningRef.current = false;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [startPolling, stopPolling, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  return { startPolling, stopPolling };
}