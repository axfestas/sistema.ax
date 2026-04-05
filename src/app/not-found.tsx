import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-brand-yellow mb-4">404</p>
        <h1 className="text-2xl font-bold text-brand-gray mb-2">Página não encontrada</h1>
        <p className="text-gray-500 mb-8">
          Essa página não existe ou foi removida. Volte para a página inicial e explore nosso catálogo.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-yellow hover:brightness-95 text-brand-gray font-semibold px-6 py-3 rounded-lg transition-all"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  )
}
