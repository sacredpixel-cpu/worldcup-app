import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Golos_Text } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-barlow-condensed',
});

const golosText = Golos_Text({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-golos-text',
});
import { AuthBanner } from '@/components/ui/AuthBanner';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { NotificationPrompt } from '@/components/ui/NotificationPrompt';
import { UpdateBanner } from '@/components/ui/UpdateBanner';
import { FirebaseAuthSync } from '@/components/FirebaseAuthSync';
import { PredictionsSync } from '@/components/PredictionsSync';
import { MatchUpdatesSync } from '@/components/MatchUpdatesSync';
import { ForegroundNotifications } from '@/components/ForegroundNotifications';
import { Rd32Modal } from '@/components/Rd32Modal';

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
  themeColor: '#E91E8C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${golosText.variable}`}>
      <body className="bg-[#06091A] text-[#E8F0FF]">
        <Providers>
          {/* Mobile frame wrapper */}
          <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-[#06091A]">
            <Rd32Modal />
            <UpdateBanner />
            <FirebaseAuthSync />
            <PredictionsSync />
            <MatchUpdatesSync />
            <ForegroundNotifications />
            <AuthBanner />
            <main className="flex-1 overflow-y-auto pb-[72px]">
              {children}
            </main>
            <NotificationPrompt />
            <BottomTabBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
