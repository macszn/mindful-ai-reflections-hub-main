const { OAuth2Client } = require('google-auth-library');

function getGoogleClientId() {
  return String(process.env.GOOGLE_CLIENT_ID || '').trim();
}

function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId());
}

async function verifyGoogleIdToken(credential) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }
  if (!credential || typeof credential !== 'string') {
    throw new Error('Missing Google credential');
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error('Google account did not provide an email address');
  }

  return {
    googleId: payload.sub,
    email: String(payload.email).trim().toLowerCase(),
    name: payload.name || String(payload.email).split('@')[0],
    emailVerified: Boolean(payload.email_verified),
  };
}

module.exports = {
  getGoogleClientId,
  isGoogleAuthConfigured,
  verifyGoogleIdToken,
};
