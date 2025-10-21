import './globals.css';
import { Toaster } from './components/ui/Toaster';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background flex flex-col`}>
        <Providers>
          <main className="flex-grow pt-16">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}