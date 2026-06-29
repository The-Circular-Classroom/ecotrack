import '@/lib/env'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EcoTrack',
  description: 'The Circular Classroom - School Uniform Donation Tracking Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
