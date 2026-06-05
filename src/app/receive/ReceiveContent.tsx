'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowDownToLine, Check } from 'lucide-react';
import { useRoom } from '@/hooks/useRoom';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import JoinRoom from '@/components/JoinRoom';
import FileReceiver from '@/components/FileReceiver';
import ToastContainer, { toast } from '@/components/Toast';
import type { FileItem } from '@/types';

export default function ReceiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    room, loading: roomLoading, error: roomError,
    joinRoom, markFileDownloaded, cleanup,
  } = useRoom();
  const { downloadFile, resetStates } = useFileTransfer();

  const [joined, setJoined] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const autoJoined = useRef(false);

  const handleJoin = useCallback(async (code: string) => {
    try {
      await joinRoom(code);
      setJoined(true);
      toast('Connected to sender', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to join room', 'error');
    }
  }, [joinRoom]);

  const handleDownload = useCallback(async (fileItem: FileItem): Promise<Blob | null> => {
    if (!room) return null;
    const blob = await downloadFile(fileItem, room.code);
    if (blob) {
      await markFileDownloaded(fileItem.id);
      setDownloadedIds((prev) => new Set(prev).add(fileItem.id));

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('File downloaded', 'success');
    }
    return blob;
  }, [room, downloadFile, markFileDownloaded]);

  const handleLeave = useCallback(async () => {
    await cleanup();
    resetStates();
    router.push('/');
  }, [cleanup, resetStates, router]);

  useEffect(() => {
    if (autoJoined.current) return;
    const codeParam = searchParams.get('code');
    if (codeParam && /^\d{6}$/.test(codeParam)) {
      autoJoined.current = true;
      handleJoin(codeParam);
    }
  }, [searchParams, handleJoin]);

  const files = room?.files || [];
  const pendingFiles = files.filter((f) => !downloadedIds.has(f.id));

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-bg">
      <div className="flex items-center justify-between p-6">
        <button
          onClick={joined ? handleLeave : () => router.push('/')}
          className="flex items-center gap-2 text-xs text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted tracking-[0.2em] uppercase mb-8">
          Receive Files
        </p>

        {!joined && (
          <div className="flex flex-col items-center gap-6 w-full">
            <ArrowDownToLine size={32} className="text-muted" />
            <p className="text-sm text-muted text-center">
              Enter the 6-digit code or scan the QR to connect.
            </p>
            <div className="w-full max-w-sm">
              <JoinRoom onJoin={handleJoin} loading={roomLoading} error={roomError} />
            </div>
          </div>
        )}

        {joined && room && (
          <div className="flex flex-col items-center gap-6 w-full animate-fade-in">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-2 text-success">
                <span className="w-2 h-2 bg-success inline-block" />
                Connected to sender
              </span>
            </div>

            {pendingFiles.length === 0 && downloadedIds.size === 0 && (
              <div className="flex flex-col items-center gap-3 py-12">
                <p className="text-sm text-muted">Waiting for incoming file</p>
                <span className="flex gap-1">
                  <span className="animate-dot">.</span>
                  <span className="animate-dot">.</span>
                  <span className="animate-dot">.</span>
                </span>
              </div>
            )}

            <div className="w-full flex flex-col gap-3">
              {pendingFiles.map((f) => (
                <FileReceiver
                  key={f.id}
                  fileItem={f}
                  onDownload={handleDownload}
                />
              ))}
            </div>

            {downloadedIds.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-success animate-fade-in">
                <Check size={16} />
                Downloaded {downloadedIds.size} file{downloadedIds.size > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
