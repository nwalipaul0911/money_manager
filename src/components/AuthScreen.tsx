import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, name: string) => Promise<void>
}

export function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') await onLogin(email, password)
      else await onRegister(email, password, name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-income/20 text-income text-2xl mb-4">$</div>
          <h1 className="text-2xl font-bold">Money Manager</h1>
          <p className="text-text-muted mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-muted">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full" required />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-muted">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-muted">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" minLength={8} required />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <p className="text-sm text-text-muted text-center mt-4">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="text-income hover:underline"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </Card>
      </div>
    </div>
  )
}
