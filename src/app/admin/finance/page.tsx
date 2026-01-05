export default function FinancePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Controle Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Receitas</h3>
          <p className="text-3xl font-bold text-green-600">R$ 0,00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Despesas</h3>
          <p className="text-3xl font-bold text-red-600">R$ 0,00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Saldo</h3>
          <p className="text-3xl font-bold text-blue-600">R$ 0,00</p>
        </div>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {/* Placeholder for financial records */}
          <li className="px-6 py-4">
            <p className="text-gray-500">Registros financeiros aqui</p>
          </li>
        </ul>
      </div>
      <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Novo Registro
      </button>
    </div>
  )
}
