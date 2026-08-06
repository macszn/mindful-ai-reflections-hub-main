const fs = require('fs');

/**
 * Mongoose connect options (TLS) — shared by `index.js` and maintenance scripts.
 * Set `MONGODB_TLS_INSECURE=true` in `.env` only for local dev if certificate validation fails.
 */
function buildMongooseConnectOptions() {
  const options = {
    serverSelectionTimeoutMS: 20000,
  };
  if (String(process.env.MONGODB_TLS_INSECURE).toLowerCase() === 'true') {
    options.tlsAllowInvalidCertificates = true;
    console.warn(
      '[mongo] MONGODB_TLS_INSECURE=true — TLS certificate checks are off. Use only for local debugging, never in production.'
    );
  }
  const caFile = process.env.MONGODB_TLS_CA_FILE;
  if (caFile && fs.existsSync(caFile)) {
    options.tlsCAFile = caFile;
  } else if (caFile) {
    console.warn('[mongo] MONGODB_TLS_CA_FILE not found on disk:', caFile);
  }
  return options;
}

module.exports = { buildMongooseConnectOptions };
