'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, ensureAuth } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/utils';
import type { RoomData, FileItem } from '@/types';

export function useRoom() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const uidRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  const createRoom = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const uid = await ensureAuth();
      uidRef.current = uid;
      let code = generateRoomCode();
      let attempts = 0;

      while (attempts < 10) {
        const existing = await getDoc(doc(db, 'rooms', code));
        if (!existing.exists()) break;
        code = generateRoomCode();
        attempts++;
      }

      const now = Date.now();
      const roomData: RoomData = {
        code,
        createdAt: now,
        expiresAt: now + 60 * 60 * 1000,
        senderId: uid,
        receiverId: null,
        senderConnected: true,
        receiverConnected: false,
        status: 'waiting',
        files: [],
      };

      await setDoc(doc(db, 'rooms', code), roomData);
      setRoom(roomData);

      unsubRef.current = onSnapshot(
        doc(db, 'rooms', code),
        (snap) => {
          if (!snap.exists()) {
            setRoom(null);
            return;
          }
          const data = snap.data() as RoomData;
          if (data.expiresAt < Date.now() && data.status !== 'expired') {
            updateDoc(doc(db, 'rooms', code), { status: 'expired' });
          }
          setRoom(data);
        }
      );

      return code;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create room';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const uid = await ensureAuth();
      uidRef.current = uid;
      const snap = await getDoc(doc(db, 'rooms', code));

      if (!snap.exists()) {
        throw new Error('Room not found');
      }

      const data = snap.data() as RoomData;

      if (data.expiresAt < Date.now() || data.status === 'expired') {
        await updateDoc(doc(db, 'rooms', code), { status: 'expired' });
        throw new Error('This room has expired');
      }

      if (data.status !== 'waiting') {
        throw new Error('Room is no longer accepting connections');
      }

      await updateDoc(doc(db, 'rooms', code), {
        receiverId: uid,
        receiverConnected: true,
        status: 'connected',
      });

      data.receiverId = uid;
      data.receiverConnected = true;
      data.status = 'connected';
      setRoom(data);

      unsubRef.current = onSnapshot(
        doc(db, 'rooms', code),
        (snap) => {
          if (!snap.exists()) {
            setRoom(null);
            return;
          }
          setRoom(snap.data() as RoomData);
        }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to join room';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    cleanup();
    if (room && uidRef.current) {
      try {
        await deleteDoc(doc(db, 'rooms', room.code));
        const storageRef = ref(storage, `rooms/${room.code}`);
        try {
          await deleteObject(storageRef);
        } catch { }
      } catch { }
    }
    setRoom(null);
    uidRef.current = null;
  }, [room, cleanup]);

  const updateRoom = useCallback(async (data: Partial<RoomData>) => {
    if (!room) return;
    try {
      await updateDoc(doc(db, 'rooms', room.code), data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update room';
      setError(msg);
    }
  }, [room]);

  const addFile = useCallback(async (file: FileItem) => {
    if (!room) return;
    try {
      await updateDoc(doc(db, 'rooms', room.code), {
        files: [...(room.files || []), file],
        status: 'transferring',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add file';
      setError(msg);
    }
  }, [room]);

  const markFileDownloaded = useCallback(async (fileId: string) => {
    if (!room) return;
    const files = (room.files || []).map((f) =>
      f.id === fileId ? { ...f, downloaded: true } : f
    );
    const allDownloaded = files.every((f) => f.downloaded);
    try {
      await updateDoc(doc(db, 'rooms', room.code), {
        files,
        status: allDownloaded ? 'completed' : room.status,
      });
      if (allDownloaded) {
        await cleanupRoom(room.code);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update file';
      setError(msg);
    }
  }, [room]);

  return {
    room,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    updateRoom,
    addFile,
    markFileDownloaded,
    cleanup,
  };
}

async function cleanupRoom(code: string) {
  try {
    await deleteDoc(doc(db, 'rooms', code));
  } catch { }
  try {
    const storageRef = ref(storage, `rooms/${code}`);
    await deleteObject(storageRef);
  } catch { }
}

export async function checkRoomExists(code: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'rooms', code));
    if (!snap.exists()) return false;
    const data = snap.data() as RoomData;
    if (data.expiresAt < Date.now() || data.status === 'expired') {
      await updateDoc(doc(db, 'rooms', code), { status: 'expired' });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
