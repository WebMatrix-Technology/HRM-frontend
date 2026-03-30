import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { IdleTimerProvider } from '@/components/providers/IdleTimerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WebMatrix HRM System',
  description: 'Human Resource Management System by WebMatrix - Premium Web Development Studio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className="dark">
      <body className={`${inter.className} matrix-pattern dark:bg-slate-950 dark:text-white`}>
        <IdleTimerProvider>
          {children}
        </IdleTimerProvider>
      </body>
    </html>
  )
}
