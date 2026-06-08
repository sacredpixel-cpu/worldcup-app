'use client';

import { useAppVersion } from '@/hooks/useAppVersion';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useAppVersion();

  if (!updateAvailable) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      zIndex: 9999,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      background: 'linear-gradient(90deg, #0A1128 0%, #0E1535 100%)',
      borderBottom: '1px solid rgba(255,176,32,0.3)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#C8A84B', lineHeight: 1.3 }}>
          New version available
        </span>
      </div>
      <button
        onClick={applyUpdate}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          background: '#FFB020',
          color: '#06091A',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Update
      </button>
    </div>
  );
}
