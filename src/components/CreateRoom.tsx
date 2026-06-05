'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import QRDisplay from './QRDisplay';
import { toast } from './Toast';

interface CreateRoomProps {
  roomCode: string;
}

export default function CreateRoom({ roomCode }: CreateRoomProps) {
  const [copied, setCopied] = useState(false);
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receive?code=${roomCode}`
    : '';

  const digits = roomCode.split('');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast('Code copied', 'success');
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted">Share this code with the receiver</p>
        <div className="flex items-center gap-2">
          {digits.map((d, i) => (
            <span
              key={i}
              className="font-mono text-4xl sm:text-5xl font-semibold text-fg tabular-nums"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {d}
            </span>
          ))}
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 text-xs text-muted hover:text-fg transition-colors cursor-pointer"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>

      <div className="w-px h-6 bg-border" />

      <QRDisplay value={roomUrl} label="Receiver: scan to join" />
    </div>
  );
}
