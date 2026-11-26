import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Zylo — Your true virtual identity',
  description: 'Hyper-local mood-matched social commerce. Connect with people nearby. Share your art. Be human-verified.',
  keywords: ['social', 'local', 'mood', 'art', 'creator', 'community', 'Zylo'],
  authors: [{ name: 'Zylo Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zylo.app',
    siteName: 'Zylo',
    title: 'Zylo — Your true virtual identity',
    description: 'Hyper-local mood-matched social commerce. Connect with people nearby. Share your art. Be human-verified.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zylo — Your true virtual identity',
    description: 'Hyper-local mood-matched social commerce. Connect with people nearby. Share your art. Be human-verified.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.apple.com" />
      </head>
      <body className="h-full min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}