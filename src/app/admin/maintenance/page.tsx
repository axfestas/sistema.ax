export default function MaintenancePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Controle de Manutenção</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {/* Placeholder for maintenance records */}
          <li className="px-6 py-4">
            <p className="text-gray-500">Registro de manutenções aqui</p>
          </li>
        </ul>
      </div>
      <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Registrar Manutenção
      </button>
    </div>
  )
}
