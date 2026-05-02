import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-slate-500">O endereço informado não existe.</p>
        <Button className="mt-6" type="button" variant="outline">
          <Link to="/dashboard">Voltar ao dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
