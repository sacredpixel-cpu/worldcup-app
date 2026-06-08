'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (user) router.push('/schedule');
  }, [user]);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  async function handleGoogle() {
    if (isStandalone) {
      setError('Google sign-in doesn\'t work from the home screen app. Please use email and password below.');
      return;
    }
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in FirebaseAuthSync handles the rest
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in FirebaseAuthSync will call loginWithGoogle with real Firebase user
      router.push('/schedule');
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' ? 'No account found with this email. Please create a new account.' :
        err.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
        err.code === 'auth/invalid-credential' ? 'Incorrect email or password. If you registered before May 15, please create a new account.' :
        err.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
        err.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.' :
        err.message || 'Sign-in failed. Please try again.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">⚽</div>
        <h1 className="text-2xl font-black" style={{ color: '#E8F0FF' }}>Welcome Back</h1>
        <p className="mt-1 text-sm" style={{ color: '#7A91BB' }}>Sign in to submit predictions</p>
      </div>

      {isStandalone && (
        <div style={{
          width: '100%', marginBottom: 20, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,176,32,0.07)', border: '1px solid rgba(255,176,32,0.22)',
        }}>
          <p style={{ fontSize: 13, color: '#C8A84B', lineHeight: 1.5, margin: 0 }}>
            📲 <strong>Home screen tip:</strong> Use email &amp; password to sign in — Google login requires Safari.
          </p>
        </div>
      )}

      <Button variant="google" size="lg" className="mb-6 w-full" style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', opacity: isStandalone ? 0.45 : 1 }} onClick={handleGoogle} loading={loading}>
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
        <span className="text-xs" style={{ color: '#7A91BB' }}>or email</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleEmail} className="flex w-full flex-col gap-4">
        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,77,77,0.1)', color: '#FF6B6B', border: '1px solid rgba(255,77,77,0.2)' }}>
            {error}
            {(error.includes('create a new account') || error.includes('registered before')) && (
              <a href="/auth/register" className="ml-1 font-semibold underline">Register here →</a>
            )}
          </div>
        )}
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        <Button type="submit" size="lg" className="w-full" loading={loading}>Sign In</Button>
      </form>

      <p className="mt-6 text-sm" style={{ color: '#7A91BB' }}>
        No account?{' '}
        <Link href="/auth/register" className="text-brand-light hover:underline">Create one</Link>
      </p>
    </div>
  );
}
