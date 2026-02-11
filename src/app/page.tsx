'use client'

import { useCart } from '@/components/CartContext'

// Sample data - in production this would come from a database/API
const portfolioItems = [
  {
    id: '1',
    name: 'Mesa Decorada Infantil',
    description: 'Mesa completa com decoração temática para festa infantil',
    price: 150.00,
    image: '/placeholder-1.jpg'
  },
  {
    id: '2',
    name: 'Kit Festa Completo',
    description: 'Inclui mesas, cadeiras, toalhas e decoração',
    price: 350.00,
    image: '/placeholder-2.jpg'
  },
  {
    id: '3',
    name: 'Decoração Balões Premium',
    description: 'Arco de balões personalizados para eventos',
    price: 200.00,
    image: '/placeholder-3.jpg'
  },
  {
    id: '4',
    name: 'Toalhas de Mesa Luxo',
    description: 'Toalhas de alta qualidade em diversas cores',
    price: 50.00,
    image: '/placeholder-4.jpg'
  },
  {
    id: '5',
    name: 'Conjunto de Louças',
    description: 'Pratos, copos e talheres para 50 pessoas',
    price: 120.00,
    image: '/placeholder-5.jpg'
  },
  {
    id: '6',
    name: 'Iluminação LED Decorativa',
    description: 'Sistema de iluminação LED para ambientes',
    price: 180.00,
    image: '/placeholder-6.jpg'
  },
]

export default function Home() {
  const { addItem } = useCart()

  const handleAddToCart = (item: typeof portfolioItems[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-brand-yellow via-brand-blue to-brand-purple py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Transforme sua Festa em Momentos Inesquecíveis
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow">
            Aluguel de itens para festas e eventos com qualidade e excelência
          </p>
          <a 
            href="/catalog" 
            className="inline-block bg-white text-brand-gray font-bold py-4 px-8 rounded-full hover:bg-brand-yellow hover:text-white transition-all duration-300 shadow-lg"
          >
            Ver Nosso Catálogo
          </a>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
              Nosso Portfólio
            </h2>
            <p className="text-lg text-gray-600">
              Confira nossos itens disponíveis para aluguel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Placeholder Image */}
                <div className="h-64 bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
                  <span className="text-white text-6xl">📸</span>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-brand-gray mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {item.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-brand-yellow">
                      R$ {item.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-brand-gray text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para fazer sua reserva?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Adicione os itens ao carrinho e solicite seu orçamento personalizado
          </p>
          <a 
            href="/cart" 
            className="inline-block bg-brand-yellow hover:bg-brand-yellow/90 text-brand-gray font-bold py-4 px-8 rounded-full transition-all duration-300"
          >
            Ver Carrinho e Solicitar Orçamento
          </a>
        </div>
      </section>
    </div>
  )
}
