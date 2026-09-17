'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-card',
              toast.tone === 'success' && 'border-status-green/40 bg-base-raised text-ink',
              toast.tone === 'error' && 'border-status-red/50 bg-base-raised text-ink',
              toast.tone === 'info' && 'border-base-border bg-base-raised text-ink',
            )}
          >
            <span
              className={cn(
                'mr-2 inline-block h-2 w-2 rounded-full align-middle',
                toast.tone === 'success' && 'bg-status-green',
                toast.tone === 'error' && 'bg-status-red',
                toast.tone === 'info' && 'bg-accent',
              )}
              aria-hidden="true"
            />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
