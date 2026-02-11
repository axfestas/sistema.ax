'use client'

import { useCart } from '@/components/CartContext'
import { useToast } from '@/hooks/useToast'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const { showSuccess } = useToast()
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    message: ''
  })

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would send the quote request to your backend
    showSuccess('Orçamento solicitado com sucesso! Entraremos em contato em breve.')
    setShowQuoteForm(false)
    clearCart()
  }

  if (items.length === 0 && !showQuoteForm) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="w-24 h-24 text-brand-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-brand-gray mb-4">
            Seu carrinho está vazio
          </h1>
          <p className="text-gray-600 mb-8">
            Adicione itens do nosso catálogo para solicitar um orçamento
          </p>
          <a
            href="/#portfolio"
            className="inline-block bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Ver Catálogo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-gray mb-8">
          Carrinho de Reservas
        </h1>

        {!showQuoteForm ? (
          <>
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-200 py-4 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-bold text-brand-gray">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-brand-yellow font-bold mt-1">
                      R$ {item.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-brand-gray">Total Estimado:</span>
                <span className="text-3xl font-bold text-brand-yellow">
                  R$ {total.toFixed(2)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={clearCart}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-brand-gray font-bold py-3 px-6 rounded-full transition-colors"
                >
                  Limpar Carrinho
                </button>
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-3 px-6 rounded-full transition-colors"
                >
                  Solicitar Orçamento
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Quote Form */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-brand-gray mb-6">
              Solicitar Orçamento
            </h2>
            
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-gray mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-gray mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-gray mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-gray mb-2">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-brand-gray mb-2">
                  Mensagem Adicional
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  placeholder="Conte-nos mais sobre seu evento..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-brand-gray font-bold py-3 px-6 rounded-full transition-colors"
                >
                  Voltar ao Carrinho
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-3 px-6 rounded-full transition-colors"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
