import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartContext'
import { ToastProvider } from '@/components/ToastProvider'
import SeoSchema from '@/components/SeoSchema'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Ax Festas - Aluguel de Itens para Festas',
  description: 'Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/1.png',
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
            <ClientLayout>
              {children}
            </ClientLayout>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
