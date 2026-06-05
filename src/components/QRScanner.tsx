'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimerRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 320, height: 320 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanFrame();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera access denied';
      setCameraError(msg);
      if (onError) onError(msg);
    }
  };

  const scanFrame = () => {
    if (scanTimerRef.current) return;
    scanTimerRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const { default: jsQR } = await import('jsqr');
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data.length >= 4) {
          const match = code.data.match(/(\d{6})/);
          if (match) {
            stopCamera();
            onScan(match[1]);
          }
        }
      } catch { }
    }, 500);
  };

  useEffect(() => {
    return stopCamera;
  }, []);

  return (
    <div>
      {!scanning && !cameraError && (
        <button
          onClick={startCamera}
          className="flex items-center justify-center gap-2 w-full border border-border bg-bg text-fg px-4 py-3 text-sm hover:bg-bg-secondary transition-colors cursor-pointer"
        >
          <Camera size={16} />
          Scan QR Code
        </button>
      )}

      {cameraError && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <CameraOff size={14} />
          Camera unavailable — use manual entry
        </div>
      )}

      {scanning && (
        <div className="relative border border-border overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full max-w-sm mx-auto block"
            playsInline
          />
          <div className="absolute inset-0 border-[80px] border-transparent pointer-events-none">
            <div className="w-full h-full border border-white/30" />
          </div>
          <div className="absolute left-[80px] right-[80px] h-0.5 bg-accent animate-scan-line pointer-events-none" />
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 bg-bg text-fg border border-border px-2 py-1 text-xs cursor-pointer hover:bg-bg-secondary"
          >
            Cancel
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
