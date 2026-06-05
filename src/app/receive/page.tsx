'use client';

import { Suspense } from 'react';
import ReceiveContent from './ReceiveContent';

export default function ReceivePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div className="spinner" />
      </div>
    }>
      <ReceiveContent />
    </Suspense>
  );
}
