import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

/**
 * Requires auth token and verified email (via /auth/me).
 * Redirects to /login or /verification-pending when not allowed.
 */
export default function useRequireVerifiedUser() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    fetch(`${config.API_URL}/auth/me`, {
      headers: { Authorization: token },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          localStorage.removeItem('auth-token');
          navigate('/login', { replace: true });
          return;
        }
        if (res.status === 403 && data.requiresVerification) {
          const email = data.user?.email || sessionStorage.getItem('pendingVerificationEmail') || '';
          if (email) sessionStorage.setItem('pendingVerificationEmail', email);
          navigate('/verification-pending', { replace: true, state: { email } });
          return;
        }
        if (!data.success) {
          navigate('/login', { replace: true });
          return;
        }
        setAllowed(true);
      })
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate]);

  return allowed;
}
