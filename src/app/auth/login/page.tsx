'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithEmail } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.push('/schedule');
  }, [user]);

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  }

  function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setTimeout(() => {
      loginWithEmail(email, password);
      router.push('/schedule');
    }, 500);
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">⚽</div>
        <h1 className="text-2xl font-black text-white">Welcome Back</h1>
        <p className="mt-1 text-sm text-white/50">Sign in to submit predictions</p>
      </div>

      <Button variant="google" size="lg" className="mb-6 w-full" onClick={handleGoogle} loading={loading}>
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
        <span className="text-xs text-white/30">or email</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleEmail} className="flex w-full flex-col gap-4">
        {error && <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        <Button type="submit" size="lg" className="w-full" loading={loading}>Sign In</Button>
      </form>

      <p className="mt-6 text-sm text-white/40">
        No account?{' '}
        <Link href="/auth/register" className="text-brand-light hover:underline">Create one</Link>
      </p>
    </div>
  );
}
