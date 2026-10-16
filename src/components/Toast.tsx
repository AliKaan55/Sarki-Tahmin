import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-cyan-500/40 bg-[#12121a]/95 text-cyan-200';
        let Icon = Info;

        if (toast.type === 'success') {
          borderClass = 'border-lime-500/50 bg-[#12121a]/95 text-lime-300';
          Icon = CheckCircle2;
        } else if (toast.type === 'warning' || toast.type === 'error') {
          borderClass = 'border-rose-500/50 bg-[#12121a]/95 text-rose-300';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl shadow-black/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
