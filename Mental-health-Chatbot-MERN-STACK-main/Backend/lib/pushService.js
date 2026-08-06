const webpush = require('web-push');

let configured = false;

function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:support@Mindful.app').trim();

  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

function isPushConfigured() {
  if (!configured) configurePush();
  return configured;
}

function getPublicKey() {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

async function sendPushToSubscription(subscription, payload) {
  if (!isPushConfigured()) {
    throw new Error('Push notifications are not configured (missing VAPID keys)');
  }

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return webpush.sendNotification(subscription, body);
}

/**
 * Send to all of a user's stored subscriptions. Removes expired endpoints.
 */
async function sendToUser(userDoc, payload) {
  if (!userDoc?.pushSubscriptions?.length) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const stale = [];

  for (const sub of userDoc.pushSubscriptions) {
    try {
      await sendPushToSubscription(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
        },
        payload
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        stale.push(sub.endpoint);
      }
      console.error('[push] send failed:', status || err.message);
    }
  }

  if (stale.length && typeof userDoc.save === 'function') {
    userDoc.pushSubscriptions = userDoc.pushSubscriptions.filter(
      (s) => !stale.includes(s.endpoint)
    );
    await userDoc.save();
  }

  return { sent, failed, removed: stale.length };
}

module.exports = {
  configurePush,
  isPushConfigured,
  getPublicKey,
  sendPushToSubscription,
  sendToUser,
};
