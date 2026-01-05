export default function ReservationsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Gerenciamento de Reservas</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {/* Placeholder for reservations */}
          <li className="px-6 py-4">
            <p className="text-gray-500">Lista de reservas aqui</p>
          </li>
        </ul>
      </div>
      <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Nova Reserva
      </button>
    </div>
  )
}
