import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  variant?: 'gold' | 'green' | 'red' | 'gray' | 'blue' | 'live';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  const variants = {
    gold: 'bg-gold/20 text-gold border border-gold/30',
    green: 'bg-brand/20 text-brand-light border border-brand/30',
    red: 'bg-accent/20 text-red-400 border border-accent/30',
    gray: 'bg-white/10 text-white/60 border border-white/10',
    blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    live: 'bg-red-500 text-white animate-pulse',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', variants[variant], className)}>
      {variant === 'live' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white" />}
      {children}
    </span>
  );
}
