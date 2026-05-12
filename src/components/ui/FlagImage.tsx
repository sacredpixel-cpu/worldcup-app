import Image from 'next/image';
import { FLAG_CDN } from '@/data/teams';

interface FlagImageProps {
  code: string;
  size?: number;
  className?: string;
}

export function FlagImage({ code, size = 32, className }: FlagImageProps) {
  const alpha2 = FLAG_CDN[code];
  if (!alpha2) {
    return (
      <div
        className={`rounded-sm bg-white/10 flex items-center justify-center text-xs text-white/40 ${className ?? ''}`}
        style={{ width: size, height: size * 0.67 }}
      >
        ?
      </div>
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w40/${alpha2}.png`}
      alt={code}
      width={size}
      height={Math.round(size * 0.67)}
      className={`rounded-sm object-cover ${className ?? ''}`}
      loading="lazy"
      unoptimized
    />
  );
}
