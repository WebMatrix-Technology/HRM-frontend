import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} matrix-pattern`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <IdleTimerProvider>
            {children}
          </IdleTimerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
