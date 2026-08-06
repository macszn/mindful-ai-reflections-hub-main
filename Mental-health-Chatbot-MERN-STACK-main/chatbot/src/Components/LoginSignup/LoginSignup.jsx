import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './LoginSignup.css';
import config from '../../config';

function LoginSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState('Signup');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  });

  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      window.alert('Your email is verified. You can sign in now.');
      setState('Login');
    }
  }, [searchParams]);

  const login = async () => {
    const response = await fetch(`${config.API_URL}/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });
    const responsedata = await response.json();

    if (responsedata.success && responsedata.token) {
      localStorage.setItem('auth-token', responsedata.token);
      window.location.replace('/home');
      return;
    }

    const errMsg = responsedata.error || 'Login failed';
    const emailTrim = (formData.email || '').trim();
    if (
      responsedata.requiresVerification ||
      response.status === 403 ||
      (typeof errMsg === 'string' && errMsg.toLowerCase().includes('verify'))
    ) {
      if (emailTrim) sessionStorage.setItem('pendingVerificationEmail', emailTrim);
      navigate('/verification-pending', { state: { email: emailTrim } });
      return;
    }
    window.alert(errMsg);
  };

  const signup = async () => {
    let responsedata;
    try {
      const response = await fetch(`${config.API_URL}/signup`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });
      const text = await response.text();
      responsedata = text ? JSON.parse(text) : {};
    } catch (_e) {
      window.alert(
        'Could not reach the server. Check that the backend is running and REACT_APP_API_URL matches it.'
      );
      return;
    }

    if (responsedata.success) {
      const emailTrim = (formData.email || '').trim();
      if (emailTrim) sessionStorage.setItem('pendingVerificationEmail', emailTrim);
      const fallback = typeof responsedata.verificationLink === 'string' ? responsedata.verificationLink : '';
      if (fallback) sessionStorage.setItem('devVerificationLink', fallback);
      else sessionStorage.removeItem('devVerificationLink');

      if (responsedata.emailSent === false) {
        window.alert(
          'No verification email was sent (SMTP is often not configured in development). Use the link on the next screen or configure Gmail SMTP on the server.'
        );
      }
      navigate('/verification-pending', { replace: true, state: { email: emailTrim } });
      return;
    }
    window.alert(responsedata.errors || responsedata.error || 'Signup failed');
  };

  const resendVerification = async () => {
    const email = (formData.email || '').trim();
    if (!email) {
      window.alert('Enter your email above, then try resend.');
      return;
    }
    setResendBusy(true);
    try {
      const response = await fetch(`${config.API_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      window.alert(data.message || data.error || 'Done');
    } catch (_e) {
      window.alert('Could not resend. Try again later.');
    }
    setResendBusy(false);
  };

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className="loginsignup-fields">
          {state === 'Signup' ? (
            <input
              name="username"
              value={formData.username}
              onChange={changeHandler}
              type="text"
              placeholder="Your name"
            />
          ) : null}
          <input name="email" value={formData.email} onChange={changeHandler} type="email" placeholder="Email" />
          <input
            name="password"
            value={formData.password}
            onChange={changeHandler}
            type="password"
            placeholder="Password"
          />
        </div>
        <button type="button" onClick={() => (state === 'Login' ? login() : signup())}>
          {state}
        </button>
        {state === 'Login' ? (
          <p className="loginsignup-login">
            Need another link?{' '}
            <span
              style={{ opacity: resendBusy ? 0.5 : 1, pointerEvents: resendBusy ? 'none' : 'auto' }}
              onClick={() => !resendBusy && resendVerification()}
              onKeyDown={(e) => e.key === 'Enter' && !resendBusy && resendVerification()}
              role="button"
              tabIndex={0}
            >
              {resendBusy ? 'Sending…' : 'Resend verification email'}
            </span>
          </p>
        ) : null}
        {state === 'Signup' ? (
          <p className="loginsignup-login">
            Already have an account ? <span onClick={() => setState('Login')}>Login</span>
          </p>
        ) : (
          <p className="loginsignup-login">
            Don&apos;t have an account?
            <span className="loginsignup-login">
              {' '}
              Create an account <span onClick={() => setState('Signup')}>Click here</span>
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginSignup;
