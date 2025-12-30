export default function CatalogPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Itens</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for items */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Item Exemplo</h2>
          <p className="text-gray-600 mb-4">Descrição do item.</p>
          <p className="text-lg font-bold mb-4">R$ 50,00</p>
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Reservar
          </button>
        </div>
      </div>
    </div>
  )
}