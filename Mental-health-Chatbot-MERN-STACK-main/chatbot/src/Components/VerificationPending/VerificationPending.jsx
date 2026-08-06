import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../LoginSignup/LoginSignup.css';
import config from '../../config';

function VerificationPending() {
  const location = useLocation();
  const initialEmail =
    (location.state && location.state.email) ||
    sessionStorage.getItem('pendingVerificationEmail') ||
    '';
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);

  const devLink = useMemo(() => sessionStorage.getItem('devVerificationLink') || '', []);

  const resend = async () => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      window.alert('Enter the email you used to sign up, then tap Resend.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${config.API_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();
      window.alert(data.message || data.error || 'Request completed.');
    } catch (_e) {
      window.alert('Could not reach the server. Try again later.');
    }
    setBusy(false);
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container" style={{ height: 'auto', minHeight: '380px' }}>
        <h1>Verify your email</h1>
        <p className="loginsignup-login" style={{ marginBottom: '16px' }}>
          A verification link has been sent to your email.
        </p>
        <p className="loginsignup-login" style={{ marginBottom: '24px' }}>
          Please check your inbox (and spam folder) and click the link to verify your account.
        </p>
        <div className="loginsignup-fields" style={{ gap: '16px' }}>
          <input
            type="email"
            placeholder="Your email (for resend)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="button" disabled={busy} onClick={resend}>
          {busy ? 'Sending…' : 'Resend verification email'}
        </button>
        {devLink ? (
          <p className="loginsignup-login" style={{ marginTop: '16px', wordBreak: 'break-all' }}>
            Development link (SMTP not configured):{' '}
            <a href={devLink} style={{ color: '#ff4141' }}>
              Open verification link
            </a>
          </p>
        ) : null}
        <p className="loginsignup-login" style={{ marginTop: '20px' }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerificationPending;
