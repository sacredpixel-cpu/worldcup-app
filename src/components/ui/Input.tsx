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
        {label && <label className="text-sm font-medium" style={{ color: '#C8D0E0' }}>{label}</label>}
        <input
          ref={ref}
          className={cn(
            'h-12 w-full rounded-xl border px-4 outline-none transition-colors',
            error ? 'border-accent focus:border-accent' : 'border-border focus:border-brand-light',
            className,
          )}
          style={{ background: 'rgba(255,255,255,0.05)', color: '#E8F0FF' }}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helper && !error && <p className="text-xs" style={{ color: '#7A91BB' }}>{helper}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
