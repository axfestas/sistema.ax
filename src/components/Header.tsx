'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from './CartContext'

const LOGO_FORMATS = ['/1.png', '/logotipo.png', '/logotipo.jpg', '/logotipo.svg']

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoIndex, setLogoIndex] = useState(0)
  const [logoError, setLogoError] = useState(false)
  const [companyName, setCompanyName] = useState('Ax Festas')
  const { itemCount } = useCart()

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && !data.error && data.company_name) {
          setCompanyName(data.company_name)
        }
      })
      .catch(() => {
        // Use default company name on error
      });
  }, []);

  const handleLogoError = () => {
    const nextIndex = logoIndex + 1
    if (nextIndex < LOGO_FORMATS.length) {
      setLogoIndex(nextIndex)
    } else {
      setLogoError(true)
    }
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {!logoError ? (
              <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src={LOGO_FORMATS[logoIndex]}
                  alt={`${companyName} Logo`}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  onError={handleLogoError}
                  priority
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-gray">AX</span>
              </div>
            )}
            <span className="ml-3 text-xl font-bold text-brand-gray">{companyName}</span>
          </Link>

          {/* Right side: Cart + Hamburger Menu */}
          <div className="flex items-center space-x-4">
            {/* Shopping Cart Icon */}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition">
              <svg className="w-6 h-6 text-brand-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-yellow text-brand-gray text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-md transition"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-brand-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Dropdown Menu */}
      {isMenuOpen && (
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="px-4 py-2 hover:bg-brand-yellow/10 rounded-md transition text-brand-gray"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/catalog"
                className="px-4 py-2 hover:bg-brand-yellow/10 rounded-md transition text-brand-gray"
                onClick={() => setIsMenuOpen(false)}
              >
                Catálogo
              </Link>
              <Link
                href="/cart"
                className="px-4 py-2 hover:bg-brand-yellow/10 rounded-md transition text-brand-gray"
                onClick={() => setIsMenuOpen(false)}
              >
                Carrinho
              </Link>
              <hr className="border-gray-200" />
              <Link
                href="/admin"
                className="px-4 py-2 bg-brand-purple/10 hover:bg-brand-purple/20 rounded-md transition text-brand-purple font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                🔒 Sistema Ax
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
