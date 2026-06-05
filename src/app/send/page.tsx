'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpFromLine, Check } from 'lucide-react';
import { useRoom } from '@/hooks/useRoom';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import CreateRoom from '@/components/CreateRoom';
import FileDropzone from '@/components/FileDropzone';
import TransferProgress from '@/components/TransferProgress';
import ToastContainer from '@/components/Toast';
import { toast } from '@/components/Toast';
import type { FileItem } from '@/types';

export default function SendPage() {
  const router = useRouter();
  const {
    room, loading: roomLoading, error: roomError,
    createRoom, addFile, markFileDownloaded, cleanup,
  } = useRoom();
  const {
    senderState, uploadFile, cancelTransfer, resetStates,
  } = useFileTransfer();

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [showDropzone, setShowDropzone] = useState(false);
  const [sentFile, setSentFile] = useState(false);

  const handleCreateRoom = useCallback(async () => {
    try {
      const code = await createRoom();
      setRoomCode(code);
      toast('Room created', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create room';
      toast(msg, 'error');
    }
  }, [createRoom]);

  const handleFileSelected = useCallback(async (file: File) => {
    if (!roomCode) return;
    setShowDropzone(false);
    setSentFile(false);

    const fileItem = await uploadFile(file, roomCode, (item) => {
      addFile(item);
    });

    if (fileItem) {
      toast('File uploaded. Waiting for download...', 'success');
    }
  }, [roomCode, uploadFile, addFile]);

  const handleLeave = useCallback(async () => {
    await cleanup();
    resetStates();
    router.push('/');
  }, [cleanup, resetStates, router]);

  const isConnected = room?.receiverConnected;
  const allDownloaded = room?.files?.every((f) => f.downloaded);

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-bg">
      <div className="flex items-center justify-between p-6">
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 text-xs text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted tracking-[0.2em] uppercase mb-8">
          Send Files
        </p>

        {!roomCode && (
          <div className="flex flex-col items-center gap-6 w-full">
            <ArrowUpFromLine size={32} className="text-muted" />
            <p className="text-sm text-muted text-center">
              Create a room to start sending files.
            </p>
            <button
              onClick={handleCreateRoom}
              disabled={roomLoading}
              className="flex items-center justify-center gap-2 border border-accent bg-accent text-white px-8 py-3 text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 w-full max-w-xs"
            >
              {roomLoading ? <div className="spinner" /> : 'Create Room'}
            </button>
            {roomError && (
              <p className="text-xs text-error">{roomError}</p>
            )}
          </div>
        )}

        {roomCode && room && (
          <div className="flex flex-col items-center gap-8 w-full animate-fade-in">
            <CreateRoom roomCode={roomCode} />

            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <span className="flex items-center gap-2 text-success">
                  <span className="w-2 h-2 bg-success inline-block" />
                  Receiver connected
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted">
                  <span className="w-2 h-2 bg-muted inline-block animate-pulse" />
                  Waiting for receiver
                  <span className="animate-dot">.</span>
                  <span className="animate-dot">.</span>
                  <span className="animate-dot">.</span>
                </span>
              )}
            </div>

            {isConnected && !sentFile && (
              <div className="w-full animate-fade-in">
                {senderState.status === 'uploading' || senderState.status === 'completed' ? (
                  <TransferProgress
                    state={senderState}
                    onCancel={cancelTransfer}
                    label="Uploading..."
                  />
                ) : (
                  <FileDropzone
                    onFileSelected={handleFileSelected}
                  />
                )}
                {allDownloaded && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-success animate-fade-in">
                    <Check size={16} />
                    File downloaded by receiver
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
