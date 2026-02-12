'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface PortfolioImage {
  id: number
  title: string
  description?: string
  image_url: string
  display_order: number
  image_size?: string
}

export default function Home() {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolioImages()
  }, [])

  const loadPortfolioImages = async () => {
    try {
      const response = await fetch('/api/portfolio?activeOnly=true')
      if (response.ok) {
        const data = await response.json() as PortfolioImage[]
        setPortfolioImages(data)
      }
    } catch (error) {
      console.error('Error loading portfolio images:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageHeightClass = (size?: string) => {
    switch (size) {
      case 'small':
        return 'h-48' // 192px
      case 'large':
        return 'h-80' // 320px
      case 'medium':
      default:
        return 'h-64' // 256px
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-brand-yellow via-brand-blue to-brand-purple py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Brilhe e comemore com a Ax Festas
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow">
            Aqui seu sonho vira realidade!
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
              Confira fotos de festa, personalizados e doces que realizamos
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
              <p className="mt-4 text-gray-600">Carregando catálogo...</p>
            </div>
          ) : portfolioImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Nenhuma imagem de catálogo disponível no momento.</p>
              <p className="text-gray-500 text-sm mt-2">Em breve adicionaremos fotos dos nossos trabalhos!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {portfolioImages.map((image) => (
                <div 
                  key={image.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Portfolio Image */}
                  <div className={`${getImageHeightClass(image.image_size)} bg-gray-200 relative overflow-hidden`}>
                    <Image 
                      src={image.image_url} 
                      alt={image.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-brand-gray mb-2">
                      {image.title}
                    </h3>
                    {image.description && (
                      <p className="text-gray-600 text-sm">
                        {image.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-brand-gray text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para fazer sua reserva?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Confira nosso catálogo de itens e solicite seu orçamento personalizado
          </p>
          <a 
            href="/catalog" 
            className="inline-block bg-brand-yellow hover:bg-brand-yellow/90 text-brand-gray font-bold py-4 px-8 rounded-full transition-all duration-300"
          >
            Ver Catálogo de Itens
          </a>
        </div>
      </section>
    </div>
  )
}
