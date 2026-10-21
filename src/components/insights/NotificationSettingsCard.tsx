import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import {
  disablePushNotifications,
  enablePushNotifications,
  fetchNotificationStatus,
  isPushSupported,
  sendTestNotification,
} from '@/utils/pushNotifications';
import { getStoredUser } from '@/utils/api';

const NotificationSettingsCard = () => {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [statusError, setStatusError] = useState('');
  const supported = isPushSupported();

  const refresh = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const status = await fetchNotificationStatus();
      setStatusError('');
      if (status) {
        setEnabled(Boolean(status.preferences?.enabled && status.deviceCount > 0));
        setDeviceCount(status.deviceCount || 0);
        setPushConfigured(Boolean(status.pushConfigured));
      }
    } catch (err) {
      console.error(err);
      setStatusError(err instanceof Error ? err.message : 'Could not load notification settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user?.id) return null;

  const handleEnable = async () => {
    setBusy(true);
    try {
      await enablePushNotifications({ quotes: true, progressScore: true });
      toast.success('Notifications enabled on this device');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable notifications');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await disablePushNotifications();
      toast.success('Notifications disabled');
      setEnabled(false);
      setDeviceCount(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not disable notifications');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async (
    type: 'quote' | 'score' | 'weekly-report' | 'streak'
  ) => {
    setBusy(true);
    try {
      await sendTestNotification(type);
      toast.success(
        type === 'quote'
          ? 'Motivational quote sent'
          : type === 'score'
            ? 'Progress score sent'
            : type === 'weekly-report'
              ? 'Weekly report notification sent'
              : 'Streak reminder sent'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Test notification failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {enabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5" />}
          Device notifications
        </CardTitle>
        <CardDescription>
          Get daily motivational quotes, weekly mental health reports, wellness progress scores, and streak reminders on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking notification status…</p>
        ) : statusError ? (
          <p role="alert" className="text-sm text-destructive">{statusError}</p>
        ) : !supported ? (
          <p className="text-sm text-muted-foreground">Push notifications are not supported in this browser.</p>
        ) : !pushConfigured ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Server push is not configured yet. Add VAPID keys to the backend <code>.env</code>.
          </p>
        ) : (
          <>
            {enabled ? (
              <Button variant="outline" disabled={busy} onClick={handleDisable}>
                Disable on this device
              </Button>
            ) : (
              <Button disabled={busy} onClick={handleEnable}>
                Enable notifications
              </Button>
            )}
            {enabled && (
              <>
                <Button variant="secondary" disabled={busy} onClick={() => handleTest('quote')}>
                  Test quote
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => handleTest('score')}>
                  Test progress score
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => handleTest('weekly-report')}>
                  Test weekly report
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => handleTest('streak')}>
                  Test streak reminder
                </Button>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              {deviceCount} device{deviceCount === 1 ? '' : 's'} registered · quotes daily · score Mon · weekly report Mon · streak reminders
            </span>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsCard;
