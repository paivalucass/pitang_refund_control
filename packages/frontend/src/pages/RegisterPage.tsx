import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/AuthContext'
import { firstZodError, passwordSchema, registerSchema } from '@/lib/validation'
import type { ApiError, UserRole } from '@/types'

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'EMPLOYEE', label: 'Colaborador' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'ADMIN', label: 'Admin' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [role, setRole] = React.useState<UserRole>('EMPLOYEE')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const passwordResult = passwordSchema.safeParse(password)
  const showPasswordValidation = password.length > 0

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const result = registerSchema.safeParse({ name, email, password, role })
    if (!result.success) {
      setError(firstZodError(result.error))
      return
    }

    setLoading(true)
    try {
      await register(result.data.name, result.data.email, result.data.password, result.data.role)
      toast.success('Cadastro realizado com sucesso.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError((err as ApiError).message || 'Não foi possível cadastrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-red-700 p-4">
      <div className="absolute -right-24 top-10 h-72 w-72 rounded-full border border-white/20" />
      <div className="absolute bottom-[-90px] left-[-70px] h-80 w-80 rounded-full border-[28px] border-white/10" />
      <div className="absolute left-8 top-8 hidden h-24 w-24 rounded-full bg-white/10 md:block" />
      <div className="absolute right-[18%] top-[18%] hidden h-16 w-16 rounded-full border-8 border-white/10 lg:block" />
      <div className="absolute left-[22%] top-[28%] h-10 w-10 rounded-full bg-white/10" />
      <div className="absolute bottom-[20%] right-[12%] h-24 w-24 rounded-full border border-white/15" />
      <div className="absolute bottom-[12%] left-[32%] hidden h-14 w-14 rounded-full bg-white/10 md:block" />
      <div className="absolute right-[38%] top-8 h-8 w-8 rounded-full border border-white/20" />
      <Card className="relative w-full max-w-md border-white/20 bg-white shadow-2xl">
        <CardHeader className="space-y-5">
          <div className="flex w-full items-stretch overflow-hidden rounded-md">
            <div className="flex items-center bg-red-700 px-3 py-2">
              <img className="h-8 w-auto" src="/logo-pitang.png" alt="Pitang" />
            </div>
            <div className="flex flex-1 items-center justify-end bg-slate-100 px-4 py-2 text-right">
              <span className="text-xl font-semibold leading-tight text-red-700">Controle de Reembolsos</span>
            </div>
          </div>
          <div>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>Cadastre um usuário para acessar o sistema.</CardDescription>
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
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
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
                aria-describedby="password-validation"
              />
              {showPasswordValidation ? (
                <p
                  id="password-validation"
                  className={passwordResult.success ? 'text-sm text-green-700' : 'text-sm text-red-700'}
                >
                  {passwordResult.success
                    ? 'Senha com tamanho válido.'
                    : 'A senha deve ter no mínimo 6 caracteres.'}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select id="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Já tem conta?{' '}
              <Link className="font-medium text-slate-950 underline" to="/login">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
