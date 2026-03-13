import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prijava servisa | LOGOKOD',
  description: 'Prijava kvara ili zahtjeva za servisnom intervencijom',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-zinc-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
