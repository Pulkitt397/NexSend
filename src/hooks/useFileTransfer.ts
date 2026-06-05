'use client';

import { useState, useRef, useCallback } from 'react';
import { getSupabase, ensureAuth } from '@/lib/supabase';
import type { FileItem, TransferState } from '@/types';

export function useFileTransfer() {
  const [senderState, setSenderState] = useState<TransferState>({
    status: 'idle',
    progress: 0,
    speed: 0,
    remaining: 0,
  });
  const [receiverState, setReceiverState] = useState<TransferState>({
    status: 'idle',
    progress: 0,
    speed: 0,
    remaining: 0,
  });
  const cancelRef = useRef(false);

  const uploadFile = useCallback(async (
    file: File,
    roomCode: string,
    onFileReady: (fileItem: FileItem) => void
  ): Promise<FileItem | null> => {
    cancelRef.current = false;
    setSenderState({ status: 'uploading', progress: 0, speed: 0, remaining: 0 });

    try {
      const uid = await ensureAuth();
      const supabase = getSupabase();
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const storagePath = `rooms/${roomCode}/${fileId}`;

      // Get auth session for the upload request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/transfers/${storagePath}`;

      let lastBytes = 0;
      let lastTime = Date.now();
      const speedSamples: number[] = [];

      const xhrResult = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.setRequestHeader('x-upsert', 'true');

        xhr.upload.onprogress = (e) => {
          if (cancelRef.current) {
            xhr.abort();
            setSenderState({ status: 'cancelled', progress: 0, speed: 0, remaining: 0 });
            resolve({ ok: false, error: 'Cancelled' });
            return;
          }

          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;

            if (elapsed > 0.5) {
              const speed = (e.loaded - lastBytes) / elapsed;
              speedSamples.push(speed);
              if (speedSamples.length > 5) speedSamples.shift();
              const avgSpeed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
              const remaining = avgSpeed > 0 ? (e.total - e.loaded) / avgSpeed : 0;

              setSenderState({ status: 'uploading', progress, speed: avgSpeed, remaining });
              lastBytes = e.loaded;
              lastTime = now;
            } else {
              setSenderState((prev) => ({ ...prev, progress }));
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ ok: true });
          } else {
            resolve({ ok: false, error: `Upload failed (${xhr.status})` });
          }
        };

        xhr.onerror = () => resolve({ ok: false, error: 'Network error' });
        xhr.send(file);
      });

      if (!xhrResult.ok) {
        if (xhrResult.error === 'Cancelled') return null;
        throw new Error(xhrResult.error);
      }

      setSenderState({ status: 'completed', progress: 100, speed: 0, remaining: 0 });

      const fileItem: FileItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath,
        uploadedAt: Date.now(),
        downloaded: false,
        progress: 100,
      };

      onFileReady(fileItem);
      return fileItem;
    } catch (e) {
      if (e instanceof Error && e.message === 'Cancelled') return null;
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setSenderState({ status: 'error', progress: 0, speed: 0, remaining: 0, error: msg });
      return null;
    }
  }, []);

  const downloadFile = useCallback(async (
    fileItem: FileItem,
    roomCode: string
  ): Promise<Blob | null> => {
    cancelRef.current = false;
    setReceiverState({ status: 'downloading', progress: 0, speed: 0, remaining: 0 });

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.storage
        .from('transfers')
        .download(fileItem.storagePath);

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      setReceiverState({ status: 'completed', progress: 100, speed: 0, remaining: 0 });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Download failed';
      setReceiverState({ status: 'error', progress: 0, speed: 0, remaining: 0, error: msg });
      return null;
    }
  }, []);

  const cancelTransfer = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const resetStates = useCallback(() => {
    setSenderState({ status: 'idle', progress: 0, speed: 0, remaining: 0 });
    setReceiverState({ status: 'idle', progress: 0, speed: 0, remaining: 0 });
    cancelRef.current = false;
  }, []);

  return {
    senderState,
    receiverState,
    uploadFile,
    downloadFile,
    cancelTransfer,
    resetStates,
  };
}
