/**
 * Delete user documents by email without MongoDB Compass.
 * Uses the same TLS settings as the API (see Backend/.env).
 *
 * Usage (from Backend folder):
 *   node scripts/deleteUsersByEmail.js --list
 *   node scripts/deleteUsersByEmail.js you@example.com other@example.com
 *
 * If you see certificate errors, add to .env:
 *   MONGODB_TLS_INSECURE=true
 * (local dev only)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { buildMongooseConnectOptions } = require('../lib/mongoOptions');

const USERS_COLLECTION = process.env.MONGO_USERS_COLLECTION || 'users';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI. Set it in Backend/.env');
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => a && !a.startsWith('-'));

  if (args.length === 0 || process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage:
  node scripts/deleteUsersByEmail.js --list
  node scripts/deleteUsersByEmail.js email1@test.com email2@test.com

Environment:
  MONGODB_URI              (required)
  MONGODB_TLS_INSECURE=true   if Compass shows "certificate validation failed"
  MONGO_USERS_COLLECTION   default: users
`);
    process.exit(0);
  }

  await mongoose.connect(uri, buildMongooseConnectOptions());
  const col = mongoose.connection.db.collection(USERS_COLLECTION);

  if (process.argv.includes('--list')) {
    const docs = await col
      .find({}, { projection: { email: 1, name: 1, isVerified: 1, date: 1 } })
      .sort({ date: -1 })
      .limit(100)
      .toArray();
    console.log(`Collection "${USERS_COLLECTION}" (${docs.length} shown, max 100):\n`);
    console.table(docs.map((d) => ({ email: d.email, name: d.name, isVerified: d.isVerified, date: d.date })));
    await mongoose.disconnect();
    return;
  }

  let total = 0;
  for (const raw of args) {
    const email = raw.trim();
    if (!email) continue;
    const result = await col.deleteMany({
      email: new RegExp(`^${escapeRegex(email)}$`, 'i'),
    });
    console.log(`"${email}": deleted ${result.deletedCount}`);
    total += result.deletedCount;
  }
  console.log(`Done. Total deleted: ${total}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
