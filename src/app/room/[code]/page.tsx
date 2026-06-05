'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, ensureAuth } from '@/lib/firebase';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import CreateRoom from '@/components/CreateRoom';
import FileDropzone from '@/components/FileDropzone';
import FileReceiver from '@/components/FileReceiver';
import TransferProgress from '@/components/TransferProgress';
import ToastContainer, { toast } from '@/components/Toast';
import type { RoomData, FileItem } from '@/types';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [role, setRole] = useState<'sender' | 'receiver' | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  const {
    senderState, receiverState, uploadFile, downloadFile, cancelTransfer,
  } = useFileTransfer();

  useEffect(() => {
    if (!code || typeof code !== 'string') return;
    let cancelled = false;

    const init = async () => {
      try {
        const snap = await getDoc(doc(db, 'rooms', code));
        if (!snap.exists()) {
          toast('Room not found', 'error');
          router.push('/');
          return;
        }
        const data = snap.data() as RoomData;

        if (data.expiresAt < Date.now() || data.status === 'expired') {
          toast('This room has expired', 'error');
          router.push('/');
          return;
        }

        const uid = await ensureAuth();
        let detectedRole: 'sender' | 'receiver' = 'receiver';

        if (data.senderId === uid) {
          detectedRole = 'sender';
        }
        // if no receiver assigned yet, assign this device as receiver
        if (detectedRole === 'receiver' && !data.receiverId) {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'rooms', code), {
            receiverId: uid,
            receiverConnected: true,
            status: 'connected',
          });
        }

        if (cancelled) return;
        setRole(detectedRole);
        setRoom(data);
        setLoading(false);

        const unsub = onSnapshot(doc(db, 'rooms', code), (s) => {
          if (!s.exists()) { setRoom(null); return; }
          setRoom(s.data() as RoomData);
        });
        unsubRef.current = unsub;
      } catch {
        if (!cancelled) router.push('/');
      }
    };

    init();
    return () => {
      cancelled = true;
      unsubRef.current?.();
    };
  }, [code, router]);

  const handleFileSelected = useCallback(async (file: File) => {
    if (!room) return;
    const fileItem = await uploadFile(file, room.code, async (item) => {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'rooms', room.code), {
        files: [item],
        status: 'transferring',
      });
    });
    if (fileItem) toast('File uploaded', 'success');
  }, [room, uploadFile]);

  const handleDownload = useCallback(async (fileItem: FileItem): Promise<Blob | null> => {
    if (!room) return null;
    const blob = await downloadFile(fileItem, room.code);
    if (blob) {
      const { updateDoc } = await import('firebase/firestore');
      const updatedFiles = (room.files || []).map((f) =>
        f.id === fileItem.id ? { ...f, downloaded: true } : f
      );
      const allDownloaded = updatedFiles.every((f) => f.downloaded);
      await updateDoc(doc(db, 'rooms', room.code), {
        files: updatedFiles,
        status: allDownloaded ? 'completed' : room.status,
      });
      if (allDownloaded) {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'rooms', room.code));
      }
      toast('File downloaded', 'success');
    }
    return blob;
  }, [room, downloadFile]);

  if (loading || !room || !role) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-bg">
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Leave
        </button>
        <p className="text-xs text-muted font-mono">{code}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted tracking-[0.2em] uppercase mb-8">
          {role === 'sender' ? 'Sending' : 'Receiving'}
        </p>

        {role === 'sender' && (
          <SenderView
            room={room}
            onFileSelected={handleFileSelected}
            senderState={senderState}
            onCancel={cancelTransfer}
          />
        )}

        {role === 'receiver' && (
          <ReceiverView
            room={room}
            onDownload={handleDownload}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

function SenderView({
  room, onFileSelected, senderState, onCancel,
}: {
  room: RoomData;
  onFileSelected: (f: File) => void;
  senderState: { status: string; progress: number; speed: number; remaining: number };
  onCancel: () => void;
}) {
  const isConnected = room.receiverConnected;
  const hasFiles = room.files && room.files.length > 0;
  const allDownloaded = room.files?.every((f) => f.downloaded);

  return (
    <div className="flex flex-col items-center gap-8 w-full animate-fade-in">
      <CreateRoom roomCode={room.code} />

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

      {isConnected && !hasFiles && (
        <div className="w-full">
          {senderState.status === 'uploading' ? (
            <TransferProgress state={senderState as any} onCancel={onCancel} label="Uploading..." />
          ) : (
            <FileDropzone onFileSelected={onFileSelected} />
          )}
        </div>
      )}

      {hasFiles && allDownloaded && (
        <div className="flex items-center gap-2 text-sm text-success animate-fade-in">
          <Check size={16} />
          Completed
        </div>
      )}
    </div>
  );
}

function ReceiverView({
  room, onDownload,
}: {
  room: RoomData;
  onDownload: (f: FileItem) => Promise<Blob | null>;
}) {
  const files = room.files || [];
  const pendingFiles = files.filter((f) => !f.downloaded);
  const completedCount = files.filter((f) => f.downloaded).length;

  return (
    <div className="flex flex-col items-center gap-6 w-full animate-fade-in">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center gap-2 text-success">
          <span className="w-2 h-2 bg-success inline-block" />
          Connected
        </span>
      </div>

      {files.length === 0 && (
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
          <FileReceiver key={f.id} fileItem={f} onDownload={onDownload} />
        ))}
      </div>

      {completedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-success animate-fade-in">
          <Check size={16} />
          Downloaded {completedCount} file{completedCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
