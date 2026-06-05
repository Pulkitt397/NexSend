'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase, ensureAuth } from '@/lib/supabase';
import { generateRoomCode } from '@/lib/utils';
import type { RoomData, FileItem, RoomRow } from '@/types';

function rowToRoom(row: RoomRow): RoomData {
  return {
    code: row.code,
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    senderConnected: row.sender_connected,
    receiverConnected: row.receiver_connected,
    status: row.status,
    files: (row.files || []) as FileItem[],
  };
}

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
      const supabase = getSupabase();
      let code = generateRoomCode();
      let attempts = 0;

      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('rooms')
          .select('code')
          .eq('code', code)
          .maybeSingle();
        if (!existing) break;
        code = generateRoomCode();
        attempts++;
      }

      const now = Date.now();
      const row: RoomRow = {
        code,
        created_at: now,
        expires_at: now + 60 * 60 * 1000,
        sender_id: uid,
        receiver_id: null,
        sender_connected: true,
        receiver_connected: false,
        status: 'waiting',
        files: [],
      };

      const { error: insertError } = await supabase.from('rooms').insert(row);
      if (insertError) throw insertError;

      setRoom(rowToRoom(row));

      // Subscribe to realtime changes
      const channel = supabase
        .channel(`room:${code}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `code=eq.${code}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setRoom(null);
              return;
            }
            const updated = payload.new as RoomRow;
            if (updated.expires_at < Date.now() && updated.status !== 'expired') {
              supabase.from('rooms').update({ status: 'expired' }).eq('code', code);
            }
            setRoom(rowToRoom(updated));
          }
        )
        .subscribe();

      unsubRef.current = () => {
        supabase.removeChannel(channel);
      };

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
      const supabase = getSupabase();

      const { data: row, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!row) throw new Error('Room not found');

      if (row.expires_at < Date.now() || row.status === 'expired') {
        await supabase.from('rooms').update({ status: 'expired' }).eq('code', code);
        throw new Error('This room has expired');
      }

      if (row.status !== 'waiting') {
        throw new Error('Room is no longer accepting connections');
      }

      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          receiver_id: uid,
          receiver_connected: true,
          status: 'connected',
        })
        .eq('code', code);

      if (updateError) throw updateError;

      row.receiver_id = uid;
      row.receiver_connected = true;
      row.status = 'connected';
      setRoom(rowToRoom(row));

      // Subscribe to realtime changes
      const channel = supabase
        .channel(`room:${code}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `code=eq.${code}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setRoom(null);
              return;
            }
            const updated = payload.new as RoomRow;
            setRoom(rowToRoom(updated));
          }
        )
        .subscribe();

      unsubRef.current = () => {
        supabase.removeChannel(channel);
      };
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
        const supabase = getSupabase();
        await supabase.from('rooms').delete().eq('code', room.code);
      } catch { }
    }
    setRoom(null);
    uidRef.current = null;
  }, [room, cleanup]);

  const updateRoom = useCallback(async (data: Partial<RoomRow>) => {
    if (!room) return;
    try {
      const supabase = getSupabase();
      await supabase.from('rooms').update(data).eq('code', room.code);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update room';
      setError(msg);
    }
  }, [room]);

  const addFile = useCallback(async (file: FileItem) => {
    if (!room) return;
    try {
      const supabase = getSupabase();
      const files = [...(room.files || []), file];
      await supabase
        .from('rooms')
        .update({ files: files, status: 'transferring' })
        .eq('code', room.code);
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
      const supabase = getSupabase();
      await supabase
        .from('rooms')
        .update({
          files,
          status: allDownloaded ? 'completed' : room.status,
        })
        .eq('code', room.code);

      if (allDownloaded) {
        await supabase.from('rooms').delete().eq('code', room.code);
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

export async function checkRoomExists(code: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data: row } = await supabase
      .from('rooms')
      .select('code, expires_at, status')
      .eq('code', code)
      .maybeSingle();

    if (!row) return false;
    if (row.expires_at < Date.now() || row.status === 'expired') {
      await supabase.from('rooms').update({ status: 'expired' }).eq('code', code);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
