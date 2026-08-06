import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or expired verification link.');
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.success) {
          setStatus('ok');
          setMessage(data.message || 'Your email has been verified.');
          sessionStorage.removeItem('devVerificationLink');
          return;
        }
        setStatus('error');
        setMessage(data.error || 'Invalid or expired verification link.');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setMessage('Could not reach the server. Try again later.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>
            {status === 'loading' ? 'Verifying your link…' : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'ok' ? (
            <Button onClick={() => navigate('/login?verified=1')}>Continue to sign in</Button>
          ) : null}
          {status === 'error' ? (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Button variant="outline" asChild>
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
