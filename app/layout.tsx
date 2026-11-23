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

// Postavlja temu prije prvog iscrtavanja (bez treptaja): spremljeni izbor, inače postavka uređaja
const themeScript = `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
