import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-white/80">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'h-12 w-full rounded-xl border bg-card px-4 text-white placeholder-white/30 outline-none transition-colors',
            error ? 'border-accent focus:border-accent' : 'border-border focus:border-brand-light',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helper && !error && <p className="text-xs text-white/40">{helper}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
