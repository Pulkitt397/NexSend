'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import QRScanner from './QRScanner';

interface JoinRoomProps {
  onJoin: (code: string) => void;
  loading: boolean;
  error?: string | null;
}

export default function JoinRoom({ onJoin, loading, error }: JoinRoomProps) {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [showScanner, setShowScanner] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const codeStr = code.join('');

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && codeStr.length === 6) {
      onJoin(codeStr);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setCode(next);
    if (text.length === 6) {
      onJoin(text);
    } else {
      inputRefs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const handleScan = (scannedCode: string) => {
    onJoin(scannedCode);
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted">Enter the 6-digit code</p>
        <div
          className="flex items-center gap-2"
          onPaste={handlePaste}
        >
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-12 sm:w-12 sm:h-14 border-b-2 border-border bg-transparent text-center text-2xl font-mono font-semibold text-fg outline-none focus:border-accent transition-colors"
              autoComplete="off"
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => onJoin(codeStr)}
        disabled={codeStr.length !== 6 || loading}
        className="flex items-center justify-center gap-2 w-full max-w-xs border border-accent bg-accent text-white px-6 py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors cursor-pointer"
      >
        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            Join Room
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <div className="flex items-center gap-3 w-full max-w-xs">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="w-full max-w-xs">
        {showScanner ? (
          <QRScanner onScan={handleScan} />
        ) : (
          <button
            onClick={() => setShowScanner(true)}
            className="w-full border border-border bg-bg text-fg px-4 py-3 text-sm hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            Scan QR Code
          </button>
        )}
      </div>
    </div>
  );
}
