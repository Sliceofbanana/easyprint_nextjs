import './globals.css';
import { Toaster } from './components/ui/Toaster';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';

const inter = Inter({ subsets: ['latin'] });

// ✅ Metadata configuration
export const metadata: Metadata = {
  title: 'MQ Printing - EasyPrint',
  description: 'Professional printing services for documents, IDs, and more. Fast, reliable, and affordable printing solutions.',
  keywords: ['printing', 'document printing', 'ID printing', 'MQ Printing', 'EasyPrint'],
  authors: [{ name: 'MQ Printing' }],
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: '32x32' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mqprintsph.com/',
    title: 'MQ Printing - EasyPrint',
    description: 'Professional printing services for documents, IDs, and more',
    siteName: 'MQ Printing',
    images: [
      {
        url: '/images/logo.webp',
        width: 400,
        height: 400,
        alt: 'MQ Printing Logo',
      },
    ],
  },
};

// ✅ Viewport configuration (moved themeColor here)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1e3a8a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background flex flex-col`}>
        <Providers>
          <main className="flex-grow pt-16">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}