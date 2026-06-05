'use client';

import { useState, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, getBlob } from 'firebase/storage';
import { storage, ensureAuth } from '@/lib/firebase';
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
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const storagePath = `rooms/${roomCode}/${fileId}`;
      const storageRef = ref(storage, storagePath);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          roomCode,
          senderId: uid,
          fileName: file.name,
          originalSize: String(file.size),
        },
      };

      const task = uploadBytesResumable(storageRef, file, metadata);
      let lastBytes = 0;
      let lastTime = Date.now();
      const speedSamples: number[] = [];

      return new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => {
            if (cancelRef.current) {
              task.cancel();
              setSenderState({ status: 'cancelled', progress: 0, speed: 0, remaining: 0 });
              resolve(null);
              return;
            }

            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            const bytesDelta = snapshot.bytesTransferred - lastBytes;

            if (elapsed > 0.5) {
              const speed = bytesDelta / elapsed;
              speedSamples.push(speed);
              if (speedSamples.length > 5) speedSamples.shift();
              const avgSpeed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
              const remaining = avgSpeed > 0 ? (snapshot.totalBytes - snapshot.bytesTransferred) / avgSpeed : 0;

              setSenderState({ status: 'uploading', progress, speed: avgSpeed, remaining });
              lastBytes = snapshot.bytesTransferred;
              lastTime = now;
            } else {
              setSenderState((prev) => ({ ...prev, progress }));
            }
          },
          (error) => {
            setSenderState({ status: 'error', progress: 0, speed: 0, remaining: 0, error: error.message });
            reject(error);
          },
          async () => {
            setSenderState({ status: 'completed', progress: 100, speed: 0, remaining: 0 });
            const downloadURL = await getDownloadURL(task.snapshot.ref);

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
            resolve(fileItem);
          }
        );
      });
    } catch (e) {
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
      const storageRef = ref(storage, fileItem.storagePath);
      const blob = await getBlob(storageRef);

      setReceiverState({ status: 'completed', progress: 100, speed: 0, remaining: 0 });
      return blob;
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
