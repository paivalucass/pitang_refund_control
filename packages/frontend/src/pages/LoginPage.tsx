import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/AuthContext'
import { firstZodError, loginSchema } from '@/lib/validation'
import type { ApiError } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(firstZodError(result.error))
      return
    }

    setLoading(true)
    try {
      await login(result.data.email, result.data.password)
      toast.success('Login realizado com sucesso.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-red-700 p-4">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full border border-white/20" />
      <div className="absolute bottom-[-90px] right-[-70px] h-80 w-80 rounded-full border-[28px] border-white/10" />
      <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full bg-white/10 md:block" />
      <Card className="relative w-full max-w-md border-white/20 bg-white shadow-2xl">
        <CardHeader className="space-y-5">
          <div className="flex w-full items-stretch overflow-hidden rounded-md">
            <div className="flex items-center bg-red-700 px-3 py-2">
              <img className="h-8 w-auto" src="/logo-pitang.png" alt="Pitang" />
            </div>
            <div className="flex flex-1 items-center justify-end bg-slate-100 px-4 py-2 text-right">
              <span className="text-xl font-bold leading-tight text-red-700">Controle de Reembolsos</span>
            </div>
          </div>
          <div>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse o controle de reembolsos da Pitang.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Não tem conta?{' '}
              <Link className="font-medium text-slate-950 underline" to="/register">
                Cadastre-se
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
