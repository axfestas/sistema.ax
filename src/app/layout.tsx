import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartContext'
import { ToastProvider } from '@/components/ToastProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SeoSchema from '@/components/SeoSchema'

export const metadata: Metadata = {
  title: 'Ax Festas - Aluguel de Itens para Festas',
  description: 'Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logotipo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className="font-sans flex flex-col min-h-screen">
        <ToastProvider>
          <CartProvider>
            <SeoSchema />
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
