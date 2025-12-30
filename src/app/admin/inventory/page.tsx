export default function InventoryPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Controle de Estoque</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {/* Placeholder for items */}
          <li className="px-6 py-4">
            <p className="text-gray-500">Lista de itens aqui</p>
          </li>
        </ul>
      </div>
      <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Adicionar Item
      </button>
    </div>
  )
}