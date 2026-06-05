'use client';

import { X } from 'lucide-react';
import { formatSpeed, formatTime } from '@/lib/utils';
import type { TransferState } from '@/types';

interface TransferProgressProps {
  state: TransferState;
  onCancel?: () => void;
  label?: string;
}

export default function TransferProgress({ state, onCancel, label }: TransferProgressProps) {
  if (state.status === 'idle') return null;

  const isError = state.status === 'error';
  const isComplete = state.status === 'completed';
  const isCancelled = state.status === 'cancelled';

  return (
    <div className="w-full">
      {label && (
        <p className="text-xs text-muted mb-2">{label}</p>
      )}

      <div className="progress-track w-full h-1">
        <div
          className={`h-full transition-all duration-300 ${
            isError ? 'bg-error' : isComplete ? 'bg-success' : 'bg-accent'
          }`}
          style={{ width: `${Math.min(state.progress, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-xs text-success">Complete</span>
          )}
          {isError && (
            <span className="text-xs text-error">{state.error || 'Error'}</span>
          )}
          {isCancelled && (
            <span className="text-xs text-muted">Cancelled</span>
          )}
          {state.status === 'uploading' && (
            <span className="text-xs text-muted">
              {Math.round(state.progress)}%{state.speed > 0 && ` · ${formatSpeed(state.speed)}`}
              {state.remaining > 0 && ` · ${formatTime(state.remaining)} remaining`}
            </span>
          )}
          {state.status === 'downloading' && (
            <span className="text-xs text-muted">
              {Math.round(state.progress)}%
              {state.speed > 0 && ` · ${formatSpeed(state.speed)}`}
            </span>
          )}
        </div>

        {(state.status === 'uploading' || state.status === 'downloading') && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-xs text-muted hover:text-error transition-colors cursor-pointer"
          >
            <X size={12} />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
