import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'stockd — household supply tracker',
  description: 'Track your household supplies and never run out again.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
