import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCredentialsSchema, zodFieldErrors, type FieldErrors } from '@kharcha/shared';
import { useAuth } from '@/lib/auth-context';
import { hasSupabaseConfig } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupPage() {
  const { session, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/dashboard', { replace: true });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setInfo(null);
    const parsed = AuthCredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      setFields(issues.fields);
      setError(issues.error);
      return;
    }
    setSubmitting(true);
    const result = await signUp(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // ASSUMPTION: if email confirmation is on, there is no session yet.
    if (result.needsConfirm) {
      setInfo('Check your email to confirm the account, then sign in.');
      return;
    }
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <img src="/kharcha-icon.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
            <p className="text-base font-semibold text-foreground">Kharcha</p>
          </div>
          <CardTitle className="text-sm">Create account</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasSupabaseConfig ? (
            <p className="text-sm text-danger">
              Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3" noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(fields.email)}
                />
                <FieldError message={fields.email} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fields.password)}
                />
                <FieldError message={fields.password} />
              </div>
              {error && !fields.email && !fields.password ? <p className="text-xs text-danger">{error}</p> : null}
              {info ? <p className="text-xs text-success">{info}</p> : null}
              <Button type="submit" className="w-full min-h-[44px]" disabled={submitting}>
                {submitting ? 'Creating…' : 'Sign up'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-gold underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
