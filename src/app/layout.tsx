import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartContext'
import { ToastProvider } from '@/components/ToastProvider'
import SeoSchema from '@/components/SeoSchema'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Ax Festas - Aluguel de Itens para Festas e Eventos',
  description: 'A Ax Festas oferece aluguel de itens decorativos para festas e eventos com praticidade, qualidade e estilo. Transforme sua celebração com nossas peças modernas e versáteis.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/1.png', type: 'image/png', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/1.png',
    apple: '/1.png',
  },
  openGraph: {
    title: 'Ax Festas - Aluguel de Itens para Festas e Eventos',
    description: 'A Ax Festas oferece aluguel de itens decorativos para festas e eventos com praticidade, qualidade e estilo. Transforme sua celebração com nossas peças modernas e versáteis.',
    url: 'https://www.axfestas.com.br',
    siteName: 'Ax Festas',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://www.axfestas.com.br/1.png',
        width: 500,
        height: 500,
        alt: 'Ax Festas - Aluguel de Itens para Festas e Eventos',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Ax Festas - Aluguel de Itens para Festas e Eventos',
    description: 'A Ax Festas oferece aluguel de itens decorativos para festas e eventos com praticidade, qualidade e estilo.',
    images: ['https://www.axfestas.com.br/1.png'],
  },
  metadataBase: new URL('https://www.axfestas.com.br'),
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
