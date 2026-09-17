'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { ROLE_META } from '@obliq/shared';
import { createClient } from '@/lib/supabase/client';
import { DEMO_FIRMS, DEMO_MODE, DEMO_PASSWORD } from '@/lib/demo-accounts';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function signIn(credentials: { email: string; password: string }) {
    setError(null);
    setLoading(credentials.email);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(credentials);

    setLoading(null);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(searchParams.get('redirectTo') ?? '/dashboard');
    router.refresh();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn({ email, password });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>

      <div className={DEMO_MODE ? 'grid w-full max-w-4xl gap-6 md:grid-cols-[360px_1fr]' : 'w-full max-w-sm'}>
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-semibold text-ink">Log in</h1>
            <p className="mt-1 text-sm text-ink-muted">Accounts are created by your firm. There is no public sign-up.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-status-red">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading !== null}>
                {loading === email && email ? 'Logging in…' : 'Log in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {DEMO_MODE && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold text-ink">Demo accounts</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Two separate firms. Sign in as different roles to walk the review workflow and test firm isolation. Password:{' '}
                <code className="rounded bg-base px-1.5 py-0.5 text-ink">{DEMO_PASSWORD}</code>
              </p>
              <div className="mt-5 space-y-5">
                {DEMO_FIRMS.map((group) => (
                  <div key={group.firm}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{group.firm}</p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {group.accounts.map((account) => (
                        <li key={account.email}>
                          <button
                            type="button"
                            onClick={() => signIn({ email: account.email, password: DEMO_PASSWORD })}
                            disabled={loading !== null}
                            className="w-full rounded-xl border border-base-border px-3 py-2.5 text-left transition-colors hover:border-accent/60 hover:bg-base disabled:opacity-60"
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-ink">{account.name}</span>
                              <span className="text-xs text-accent">{ROLE_META[account.role].label}</span>
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-muted">
                              {loading === account.email ? 'Signing in…' : account.note}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
