'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, File, FileImage, FileVideo, FileAudio, FileText, FileArchive, X } from 'lucide-react';
import { formatBytes, getFileIcon } from '@/lib/utils';
import { toast } from './Toast';

const MAX_SIZE = 1 * 1024 * 1024 * 1024;
const FILE_ICONS: Record<string, React.FC<{ size?: number }>> = {
  FileImage, FileVideo, FileAudio, FileText, FileArchive, File,
};

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFileSelected, disabled }: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): boolean => {
    if (f.size === 0) {
      toast('File is empty', 'error');
      return false;
    }
    if (f.size > MAX_SIZE) {
      toast('File exceeds 1GB limit', 'error');
      return false;
    }
    return true;
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!validateFile(f)) return;
    setFile(f);
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile, disabled]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const confirmFile = () => {
    if (file && !disabled) {
      onFileSelected(file);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const getIcon = () => {
    if (!file) return <Upload size={24} />;
    const iconName = getFileIcon(file.type);
    const Icon = FILE_ICONS[iconName] || File;
    return <Icon size={24} />;
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          border-2 p-8 cursor-pointer transition-colors
          ${dragOver
            ? 'border-solid border-accent bg-accent/5'
            : file
              ? 'border-solid border-border'
              : 'border-dashed border-border hover:border-accent'
          }
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleInput}
          disabled={disabled}
        />

        {!file && (
          <>
            {dragOver ? (
              <Upload size={24} className="text-accent" />
            ) : (
              <Upload size={24} className="text-muted" />
            )}
            <div className="text-center">
              <p className="text-sm text-fg font-medium">
                {dragOver ? 'Drop to send' : 'Drop a file here'}
              </p>
              <p className="text-xs text-muted mt-1">or click to browse — max 1GB</p>
            </div>
          </>
        )}

        {file && (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center gap-3">
              <span className="text-fg">{getIcon()}</span>
              <div className="text-left">
                <p className="text-sm text-fg font-medium max-w-[200px] truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="text-muted hover:text-error transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); confirmFile(); }}
              className="border border-accent bg-accent text-white px-6 py-2 text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40"
              disabled={disabled}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
