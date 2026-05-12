import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AuthBanner } from '@/components/ui/AuthBanner';
import { BottomTabBar } from '@/components/ui/BottomTabBar';

export const metadata: Metadata = {
  title: 'World Cup 2026',
  description: 'Predict scores, track matches, and compete with friends for the 2026 FIFA World Cup.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WC2026',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0D0D0D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0D0D0D] text-white">
        <Providers>
          {/* Mobile frame wrapper */}
          <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-[#0D0D0D]">
            <AuthBanner />
            <main className="flex-1 overflow-y-auto pb-[72px]">
              {children}
            </main>
            <BottomTabBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
