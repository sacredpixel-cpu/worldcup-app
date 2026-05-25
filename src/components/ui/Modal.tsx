'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Sheet */}
      <div className={cn(
        'relative z-10 w-full max-w-[430px] rounded-t-2xl p-6 pb-8',
        className,
      )} style={{ background: '#0E1535', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        {title && <h2 className="mb-4 text-lg font-bold" style={{ color: '#E8F0FF' }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
