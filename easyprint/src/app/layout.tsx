import './globals.css';
import { Toaster } from './components/ui/Toaster';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

// ✅ Add metadata for favicon and SEO
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
  themeColor: '#1e3a8a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mqprinting.com',
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
  twitter: {
    card: 'summary',
    title: 'MQ Printing - EasyPrint',
    description: 'Professional printing services',
    images: ['/images/logo.webp'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1e3a8a" />
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