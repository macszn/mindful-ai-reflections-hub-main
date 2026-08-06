import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../LoginSignup/LoginSignup.css';
import config from '../../config';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or expired verification link.');
      return;
    }

    let cancelled = false;
    fetch(`${config.API_URL}/verify-email?token=${encodeURIComponent(token)}`)
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
    <div className="loginsignup">
      <div className="loginsignup-container" style={{ height: 'auto', minHeight: '280px' }}>
        <h1>Email verification</h1>
        {status === 'loading' ? (
          <p className="loginsignup-login">Verifying your link…</p>
        ) : (
          <p className="loginsignup-login" style={{ marginBottom: '24px' }}>
            {message}
          </p>
        )}
        {status === 'ok' ? (
          <button type="button" onClick={() => navigate('/login?verified=1')}>
            Continue to login
          </button>
        ) : null}
        {status === 'error' ? (
          <p className="loginsignup-login" style={{ marginTop: '16px' }}>
            <Link to="/login">Back to login</Link>
            {' · '}
            <Link to="/verification-pending">Verification help</Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default VerifyEmail;
