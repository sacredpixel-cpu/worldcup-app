import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-white/5', className)} />
  );
}
