export function generateRoomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '';
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatTime(seconds: number): string {
  if (seconds < 1) return '<1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'FileImage';
  if (type.startsWith('video/')) return 'FileVideo';
  if (type.startsWith('audio/')) return 'FileAudio';
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'FileText';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gz')) return 'FileArchive';
  return 'File';
}

export function getDeviceId(): string {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', id);
  }
  return id;
}
