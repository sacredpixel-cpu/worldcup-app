'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/schedule';

  const { register, loginWithGoogle } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Display name is required.';
    if (!usePhone && !email) e.email = 'Email is required.';
    if (usePhone && !phone) e.phone = 'Phone number is required.';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      register(usePhone ? `${phone}@phone.wc2026` : email, password, name.trim());
      router.push(from);
    }, 500);
  }

  function handleGoogle() {
    loginWithGoogle();
    router.push(from);
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-8">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🏆</div>
        <h1 className="text-2xl font-black text-white">Create Account</h1>
        <p className="mt-1 text-sm text-white/50">Join the prediction challenge</p>
      </div>

      <Button variant="google" size="lg" className="mb-6 w-full" onClick={handleGoogle}>
        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      <div className="mb-6 flex w-full items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-white/30">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Email / Phone toggle */}
      <div className="mb-4 flex w-full rounded-xl border border-border p-1">
        {['Email', 'Phone'].map((opt, i) => (
          <button
            key={opt}
            onClick={() => setUsePhone(i === 1)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              usePhone === (i === 1) ? 'bg-brand text-white' : 'text-white/40'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <Input
          label="Display Name"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
        />
        {!usePhone ? (
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
        ) : (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            error={errors.phone}
          />
        )}
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-sm text-white/40">
        Already have an account?{' '}
        <Link href={`/auth/login?from=${encodeURIComponent(from)}`} className="text-brand-light hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
