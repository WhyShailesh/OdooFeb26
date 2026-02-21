import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, MapPin, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left: Branding & features */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-border bg-gradient-to-br from-sky-950/40 via-background to-indigo-950/30 p-10 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">FleetFlow</span>
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Fleet command center</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Manage vehicles, drivers, trips, and analytics in one place. Built for Indian logistics.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              { icon: MapPin, text: 'Live map & real-time vehicle tracking' },
              { icon: BarChart3, text: 'Profit, fuel & expense analytics in ₹' },
              { icon: Shield, text: 'Role-based access & safety compliance' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">© FleetFlow · Fleet Management Platform</p>
      </div>

      {/* Right: Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-sky-500/5 via-transparent to-transparent lg:left-1/2" />
        <Card className="relative w-full max-w-md border-border bg-card/95 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/25">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in to your command center</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-background/50"
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Register
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
