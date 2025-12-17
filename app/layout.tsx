import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClientLayout } from "@/components/client-layout"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Saukhya - Menstrual Health Support",
  description: "Comprehensive menstrual health tracking and support platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saukhya",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#368241" />
        <meta name="mobile-web-app-capable" content="true" />
        <meta name="apple-mobile-web-app-capable" content="true" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Saukhya" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.jpg" />
        <link rel="icon" type="image/png" href="/favicon.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {
                  console.log('Service Worker registration failed');
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${geistSans.className} bg-background text-foreground`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
