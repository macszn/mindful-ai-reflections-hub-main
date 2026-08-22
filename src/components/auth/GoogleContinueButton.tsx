import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { getApiBase } from '@/utils/api';

type Props = {
  onCredential: (credential: string) => Promise<void> | void;
  disabled?: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

let gisLoadPromise: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-identity-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in'));
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

const GoogleContinueButton = ({ onCredential, disabled }: Props) => {
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [clientId, setClientId] = useState('');
  const hiddenBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${getApiBase()}/auth/google/config`);
        const data = await res.json();
        setConfigured(Boolean(data.enabled && data.clientId));
        setClientId(data.clientId || '');
      } catch {
        setConfigured(false);
      }
    };
    load();
  }, []);

  const handleClick = async () => {
    if (disabled || busy) return;
    if (!configured || !clientId) {
      toast.error('Google sign-in is not configured. Add GOOGLE_CLIENT_ID to the backend .env.');
      return;
    }

    setBusy(true);
    try {
      await loadGoogleIdentity();
      if (!window.google?.accounts?.id) {
        throw new Error('Google sign-in is unavailable in this browser');
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: async (response: { credential?: string }) => {
          try {
            if (!response.credential) {
              toast.error('Google sign-in was cancelled');
              return;
            }
            await onCredential(response.credential);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
          } finally {
            setBusy(false);
          }
        },
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          if (hiddenBtnRef.current) {
            hiddenBtnRef.current.innerHTML = '';
            window.google?.accounts.id.renderButton(hiddenBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              width: 320,
            });
            const btn = hiddenBtnRef.current.querySelector('div[role="button"]') as HTMLElement | null;
            btn?.click();
          }
          setBusy(false);
        }
      });
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        type="button"
        className="w-full gap-2"
        disabled={disabled || busy || configured === false}
        onClick={handleClick}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </Button>
      <div ref={hiddenBtnRef} className="flex justify-center min-h-0 overflow-hidden h-0 opacity-0 pointer-events-none" />
      {configured === false && (
        <p className="text-xs text-center text-muted-foreground">
          Google sign-in needs GOOGLE_CLIENT_ID in the backend environment.
        </p>
      )}
    </div>
  );
};

export default GoogleContinueButton;
