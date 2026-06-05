'use client';

import { useState } from 'react';
import { Download, File, FileImage, FileVideo, FileAudio, FileText, FileArchive, Check } from 'lucide-react';
import { formatBytes, getFileIcon } from '@/lib/utils';
import TransferProgress from './TransferProgress';
import type { FileItem, TransferState } from '@/types';

const FILE_ICONS: Record<string, React.FC<{ size?: number }>> = {
  FileImage, FileVideo, FileAudio, FileText, FileArchive, File,
};

interface FileReceiverProps {
  fileItem: FileItem;
  onDownload: (fileItem: FileItem) => Promise<Blob | null>;
}

export default function FileReceiver({ fileItem, onDownload }: FileReceiverProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iconName = getFileIcon(fileItem.type);
  const Icon = FILE_ICONS[iconName] || File;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const blob = await onDownload(fileItem);
      if (!blob) {
        throw new Error('Download failed');
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (downloaded) {
    return (
      <div className="flex items-center gap-3 border border-border p-4 animate-fade-in">
        <Check size={20} className="text-success" />
        <span className="text-sm text-fg">{fileItem.name} — Downloaded</span>
      </div>
    );
  }

  return (
    <div className="border border-border p-4 animate-border-flash">
      {downloading ? (
        <div className="flex items-center gap-3">
          <span className="text-fg"><Icon size={20} /></span>
          <span className="text-sm text-fg flex-1 truncate">{fileItem.name}</span>
          <div className="spinner" />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-fg shrink-0"><Icon size={20} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-fg font-medium truncate">{fileItem.name}</p>
            <p className="text-xs text-muted">{formatBytes(fileItem.size)}</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 border border-accent bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      )}
      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </div>
  );
}
