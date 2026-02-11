export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin - Ax Festas</h1>
        </div>
      </header>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4">
            <a href="/admin" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
            <a href="/admin/inventory" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Estoque</a>
            <a href="/admin/portfolio" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Catálogo</a>
            <a href="/admin/reservations" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Reservas</a>
            <a href="/admin/maintenance" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Manutenção</a>
            <a href="/admin/finance" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Financeiro</a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}