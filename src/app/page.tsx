'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem('userSession')
    router.replace(session ? '/dashboard' : '/login')
  }, [router])

  return null // or loading spinner
}
