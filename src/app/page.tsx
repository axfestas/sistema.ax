export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema Ax Festas
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Sistema de controle de estoque, reservas e manutenção
          </p>
          <p className="text-lg text-gray-500">
            Aluguel de Itens para Festas
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Catalog Card */}
          <a 
            href="/catalog"
            className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border-2 border-transparent hover:border-green-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Catálogo de Itens
              </h2>
              <p className="text-gray-600 mb-4">
                Explore nossos itens disponíveis para aluguel e faça suas reservas
              </p>
              <span className="inline-block bg-green-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
                Ver Catálogo
              </span>
            </div>
          </a>

          {/* Admin Card */}
          <a 
            href="/admin"
            className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Painel Administrativo
              </h2>
              <p className="text-gray-600 mb-4">
                Gerencie estoque, reservas, manutenção e finanças
              </p>
              <span className="inline-block bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Acessar Painel
              </span>
            </div>
          </a>
        </div>

        {/* Features */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Funcionalidades do Sistema
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl mb-2">📦</div>
              <h4 className="font-semibold text-gray-900 mb-1">Estoque</h4>
              <p className="text-sm text-gray-600">Controle completo de inventário</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl mb-2">📅</div>
              <h4 className="font-semibold text-gray-900 mb-1">Reservas</h4>
              <p className="text-sm text-gray-600">Gestão de reservas e agendamentos</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl mb-2">🔧</div>
              <h4 className="font-semibold text-gray-900 mb-1">Manutenção</h4>
              <p className="text-sm text-gray-600">Controle de manutenções</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl mb-2">💰</div>
              <h4 className="font-semibold text-gray-900 mb-1">Financeiro</h4>
              <p className="text-sm text-gray-600">Gestão financeira integrada</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}