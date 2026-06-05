'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-bg">
      <div className="flex justify-end p-6">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        <p className="text-xs text-muted tracking-[0.2em] uppercase mb-8">
          NexSend
        </p>

        <h1 className="text-3xl sm:text-4xl font-semibold text-fg text-center leading-tight mb-2">
          Share files.
        </h1>
        <h1 className="text-3xl sm:text-4xl font-semibold text-fg text-center leading-tight mb-2">
          No accounts.
        </h1>
        <h1 className="text-3xl sm:text-4xl font-semibold text-fg text-center leading-tight mb-12">
          No bullshit.
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            onClick={() => router.push('/send')}
            className="flex items-center justify-center gap-3 border border-accent bg-accent text-white px-8 py-4 text-base font-medium hover:bg-accent-hover transition-colors cursor-pointer w-full"
          >
            <ArrowUpFromLine size={18} />
            Send
          </button>
          <button
            onClick={() => router.push('/receive')}
            className="flex items-center justify-center gap-3 border border-border bg-bg text-fg px-8 py-4 text-base font-medium hover:bg-bg-secondary transition-colors cursor-pointer w-full"
          >
            <ArrowDownToLine size={18} />
            Receive
          </button>
        </div>
      </div>

      <div className="h-10 border-t border-border overflow-hidden flex items-center">
        <div className="animate-marquee text-xs text-muted whitespace-nowrap">
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
          <span className="mx-4">Shourya has a lil dih</span>
          <span className="mx-4">✦</span>
        </div>
      </div>
    </div>
  );
}
