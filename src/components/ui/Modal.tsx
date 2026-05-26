'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const DISMISS_THRESHOLD = 120; // px dragged before auto-close
const SPRING = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const [dragY, setDragY] = useState(0);
  const [animated, setAnimated] = useState(false); // enable transition for snap-back / close
  const touchStartY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setDragY(0);
      setAnimated(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  function handleDragStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = true;
    setAnimated(false);
  }

  function handleDragMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setDragY(dy);
  }

  function handleDragEnd() {
    if (!dragging.current) return;
    dragging.current = false;

    if (dragY > DISMISS_THRESHOLD) {
      // Slide off screen then fire onClose
      setAnimated(true);
      setDragY(window.innerHeight);
      setTimeout(() => { onClose(); setDragY(0); setAnimated(false); }, 300);
    } else {
      // Snap back with spring
      setAnimated(true);
      setDragY(0);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-[430px] rounded-t-2xl flex flex-col"
        style={{
          background: '#0E1535',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '90vh',
          transform: `translateY(${dragY}px)`,
          transition: animated ? SPRING : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drag handle row (swipe target + close button) ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 44,
            flexShrink: 0,
            touchAction: 'none', // let our handlers take over
            cursor: 'grab',
          }}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Pill */}
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }} />

          {/* Close button — absolute right, vertically centred in the row */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
            className="absolute right-4 flex h-7 w-7 items-center justify-center rounded-full active:scale-90 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#7A91BB' }}
          >
            <span className="text-sm font-bold leading-none">✕</span>
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className={cn('overflow-y-auto px-6 pb-8', className)}>
          {title && (
            <h2 className="mb-4 text-lg font-bold" style={{ color: '#E8F0FF' }}>{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
