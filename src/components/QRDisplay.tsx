'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
  value: string;
  label?: string;
}

export default function QRDisplay({ value, label }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="border border-border p-3 bg-white">
        <QRCodeSVG
          value={value}
          size={160}
          level="M"
          fgColor="#111111"
          bgColor="#ffffff"
        />
      </div>
      {label && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
}
