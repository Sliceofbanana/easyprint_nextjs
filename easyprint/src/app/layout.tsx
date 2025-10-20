// app/layout.tsx
import '@/app/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // optional: manage user session globally
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const session = localStorage.getItem('userSession')
    if (session) {
      try {
        setUser(JSON.parse(session))
      } catch {
        localStorage.removeItem('userSession')
      }
    }
  }, [])

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('userSession')
  }

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background flex flex-col`}>
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className={`flex-grow ${user ? 'pt-20' : ''}`}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
