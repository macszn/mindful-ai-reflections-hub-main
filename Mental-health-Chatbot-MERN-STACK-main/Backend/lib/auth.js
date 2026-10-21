const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

async function verifyAuthToken(req) {
  const header = req.headers.authorization;
  const token =
    typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : '';
  const secret = process.env.JWT_SECRET || 'secret_chat';

  if (!token) return { error: 'Authentication required', status: 401 };

  try {
    const payload = jwt.verify(token, secret);
    const userId = String(payload.userId || '');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid authentication token', status: 401 };
    }
    return { userId };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { error: 'Invalid or expired authentication token', status: 401 };
    }
    throw error;
  }
}

function requireOwnUser(req, res, next) {
  verifyAuthToken(req)
    .then((result) => {
      if (result.error) return res.status(result.status).json({ error: result.error });
      const requestedUserId = req.params.userId || req.body?.userId || req.query.userId;
      if (String(requestedUserId || '') !== result.userId) {
        return res.status(403).json({ error: 'You can only access your own data' });
      }
      req.authUserId = result.userId;
      return next();
    })
    .catch(next);
}

module.exports = { requireOwnUser, verifyAuthToken };