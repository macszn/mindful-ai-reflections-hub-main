import { getApiBase, getStoredUser } from '@/utils/api';

function urlBase64ToUint8Array(base64String: string) {
  const normalized = base64String.trim();
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const base64 = (normalized + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function waitForServiceWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) return registration;

  const worker = registration.installing || registration.waiting;
  if (!worker) {
    await navigator.serviceWorker.ready;
    return registration;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Service worker activation timed out'));
    }, 10000);

    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout);
        resolve();
      }
    });
  });

  await navigator.serviceWorker.ready;
  return registration;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function registerPushServiceWorker() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return waitForServiceWorker(registration);
}

async function resetPushServiceWorker() {
  if (!isPushSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistrations();
  for (const reg of existing) {
    await reg.unregister().catch(() => undefined);
  }
  return registerPushServiceWorker();
}

export type NotificationPreferences = {
  enabled: boolean;
  quotes: boolean;
  progressScore: boolean;
  weeklyReport?: boolean;
  streakReminder?: boolean;
};

export async function fetchNotificationStatus() {
  const user = getStoredUser();
  if (!user?.id) return null;
  const res = await fetch(`${getApiBase()}/api/notifications/preferences/${user.id}`);
  if (!res.ok) throw new Error('Failed to load notification preferences');
  return res.json() as Promise<{
    preferences: NotificationPreferences;
    deviceCount: number;
    pushConfigured: boolean;
  }>;
}

export async function enablePushNotifications(
  preferences: Partial<NotificationPreferences> = {}
) {
  const user = getStoredUser();
  if (!user?.id) throw new Error('Please log in to enable notifications');
  if (!isPushSupported()) throw new Error('Push notifications are not supported on this device');

  const keyRes = await fetch(`${getApiBase()}/api/notifications/vapid-public-key`);
  if (!keyRes.ok) {
    const err = await keyRes.json().catch(() => ({}));
    throw new Error(err.error || 'Server push is not configured');
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey || typeof publicKey !== 'string') {
    throw new Error('Server returned an invalid VAPID public key');
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  if (applicationServerKey.length !== 65) {
    throw new Error('Invalid VAPID public key length from server');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied');
  }

  const registration = await resetPushServiceWorker();
  if (!registration) throw new Error('Could not register service worker');

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    await existingSubscription.unsubscribe().catch(() => undefined);
  }

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/push service error|push service not available/i.test(message)) {
      throw new Error(
        'Browser push service failed. Clear this site\'s data (Application → Service Workers / Storage), reload, and try again. Also ensure notifications are allowed for this browser.'
      );
    }
    throw err;
  }

  const subscriptionJson =
    typeof subscription.toJSON === 'function' ? subscription.toJSON() : subscription;

  const res = await fetch(`${getApiBase()}/api/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      subscription: subscriptionJson,
      preferences: {
        enabled: true,
        quotes: preferences.quotes !== false,
        progressScore: preferences.progressScore !== false,
        weeklyReport: preferences.weeklyReport !== false,
      },
    }),
  });

  if (!res.ok) {
    await subscription.unsubscribe().catch(() => undefined);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to save push subscription (${res.status})`);
  }

  return res.json();
}

export async function disablePushNotifications() {
  const user = getStoredUser();
  if (!user?.id) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) {
    await subscription.unsubscribe().catch(() => undefined);
  }

  await fetch(`${getApiBase()}/api/notifications/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, endpoint }),
  });
}

export async function sendTestNotification(
  type: 'quote' | 'score' | 'weekly-report' | 'streak' = 'quote'
) {
  const user = getStoredUser();
  if (!user?.id) throw new Error('Please log in');

  const res = await fetch(`${getApiBase()}/api/notifications/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, type }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send test notification');
  }
  if (data.success === false) {
    throw new Error(data.message || 'Test notification was not sent');
  }
  return data;
}
