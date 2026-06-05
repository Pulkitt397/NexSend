export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  storagePath: string;
  uploadedAt: number;
  downloaded: boolean;
  progress: number;
}

export interface RoomData {
  code: string;
  createdAt: number;
  expiresAt: number;
  senderId: string;
  receiverId: string | null;
  senderConnected: boolean;
  receiverConnected: boolean;
  status: 'waiting' | 'connected' | 'transferring' | 'completed' | 'expired';
  files: FileItem[];
}

export type UserRole = 'sender' | 'receiver';

export interface TransferState {
  status: 'idle' | 'uploading' | 'downloading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  speed: number;
  remaining: number;
  error?: string;
}
