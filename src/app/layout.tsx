import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ax Festas - Aluguel de Itens para Festas',
  description: 'Sistema de controle de estoque, reservas e manutenção para Ax Festas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className="font-sans">{children}</body>
    </html>
  )
}