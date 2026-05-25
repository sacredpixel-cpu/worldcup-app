import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'google';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-brand text-[#06091A] hover:bg-brand-light',
      secondary: 'bg-card border border-border text-[#E8F0FF] hover:bg-surface',
      ghost: 'text-[#7A91BB] hover:bg-surface',
      danger: 'bg-accent text-[#06091A] hover:bg-red-700',
      google: 'text-[#E8F0FF] hover:opacity-90 border',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-11 px-5 text-base',
      lg: 'h-14 px-6 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
