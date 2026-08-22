// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const moodEntriesRouter = require('./routes/moodEntries');
// const insightsRouter = require('./routes/insights');
const insightsRoute = require('./routes/insightRoute');
const memoryRoute = require('./routes/memoryRoute');
const activityRoute = require('./routes/activityRoute');
const notificationRoute = require('./routes/notificationRoute');
const weeklyReportRoute = require('./routes/weeklyReportRoute');
// Load environment variables early before other requires
dotenv.config();
const mongoose=require('mongoose');
const { buildMongooseConnectOptions } = require('./lib/mongoOptions');
const jwt=require('jsonwebtoken');
const path=require('path');
const cors=require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  assessRisk,
  getCrisisResources,
  logRiskEvent,
} = require('./lib/riskDetection');
const { runChat, getModel } = require('./lib/runChat');
const { buildMemoryContextForChat, updateMemoryFromExchange } = require('./lib/memoryService');
const ChatExchange = require('./models/ChatExchange');
const { configurePush } = require('./lib/pushService');
const { startNotificationScheduler } = require('./lib/notificationScheduler');
const { isGoogleAuthConfigured, getGoogleClientId, verifyGoogleIdToken } = require('./lib/googleAuth');

const app = express();
const port = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('[mongo] MONGODB_URI is not set. Add it to Backend/.env (Atlas: Database → Connect → Drivers).');
} else {
  mongoose
    .connect(mongoUri, buildMongooseConnectOptions())
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      if (/certificate|TLS|SSL|UNABLE_TO_VERIFY/i.test(String(err.message))) {
        console.error(
          '[mongo] TLS / certificate: try (1) Node.js LTS 20+, (2) `npm update mongoose mongodb`, (3) Atlas IP Access List, (4) if behind a corporate proxy, set MONGODB_TLS_CA_FILE to your org root CA PEM, or temporarily MONGODB_TLS_INSECURE=true for local dev only.'
        );
      }
    });
}

app.get('/',(req,res)=>{
  res.send("Server is running");
})

const MODEL_NAME = "gemini-2.5-flash";
const API_KEY = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    const userId = req.body?.userId || null;
    const conversationHistory = req.body?.conversationHistory || [];
    console.log('Incoming /chat req', userInput);
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const risk = assessRisk(userInput);
    logRiskEvent(risk, userId);

    let memoryContext = '';
    let memoryUsed = false;
    if (userId) {
      try {
        const memoryData = await buildMemoryContextForChat(userId, userInput);
        memoryContext = memoryData.text || '';
        memoryUsed = Boolean(memoryData.memoryUsed);
      } catch (memErr) {
        console.error('[memory] context build failed:', memErr.message);
      }
    }

    const response = await runChat(userInput, {
      riskAssessment: risk,
      memoryContext,
      conversationHistory,
    });

    if (userId) {
      setImmediate(() => {
        ChatExchange.create({
          userId,
          userMessage: String(userInput).slice(0, 4000),
          assistantMessage: String(response || '').slice(0, 4000),
          recordedAt: new Date(),
        }).catch((err) => console.error('[chat] persist exchange:', err.message));

        updateMemoryFromExchange(userId, userInput, response).catch((err) =>
          console.error('[memory] async update:', err.message)
        );
      });
    }

    res.json({
      response,
      risk: {
        level: risk.level,
        detectedPhrases: risk.detectedPhrases,
        labels: risk.labels,
        requiresCrisisSupport: risk.requiresCrisisSupport,
        crisisResources: risk.requiresCrisisSupport ? getCrisisResources() : [],
      },
      memoryActive: memoryUsed,
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Safe for double-quoted HTML attributes (e.g. href). */
function escapeHtmlAttr(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function buildFromAddress() {
  const login = String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const app = process.env.EMAIL_APP_NAME || 'Mindful';
  const raw = String(process.env.SMTP_FROM || process.env.EMAIL_FROM || '').trim();
  if (raw) {
    if (raw.includes('<') && raw.includes('>')) return raw;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      return `"${app} Support" <${raw}>`;
    }
    return raw;
  }
  return `"${app} Support" <${login}>`;
}

function buildVerificationEmailHtml(displayName, verifyLink, appName) {
  const name = escapeHtml(displayName) || 'there';
  const href = escapeHtmlAttr(verifyLink);
  const linkPlain = verifyLink;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#2d3748;background:#f7fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <tr><td style="padding:32px 28px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#1a202c;">Welcome to ${escapeHtml(appName)}</h1>
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 24px;">Thanks for signing up. Please confirm your email address using the button below.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
        <tr>
          <td style="border-radius:6px;background:#4a5568;">
            <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Verify email address</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#718096;">If the button does not open, copy this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#4a5568;">${escapeHtml(linkPlain)}</p>
      <p style="margin:0;font-size:13px;color:#718096;">If you did not create an account, you can ignore this email.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function hashVerificationToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken), 'utf8').digest('hex');
}

function getVerificationTtlMs() {
  const hours = Number(process.env.VERIFICATION_TOKEN_HOURS || 24);
  const capped = Math.min(Math.max(Number.isFinite(hours) ? hours : 24, 1), 168);
  return capped * 60 * 60 * 1000;
}

function createMailTransport() {
  const user = String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || '')
    .trim()
    .replace(/\s+/g, '');
  const host =
    process.env.SMTP_HOST ||
    (user && pass ? 'smtp.gmail.com' : undefined);
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user, pass },
  });
}

function logGmailSmtpHint(err) {
  const m = String(err && err.message ? err.message : '');
  if (!/535|BadCredentials|Invalid login/i.test(m)) return;
  console.error(
    '[email] Gmail rejected SMTP login. Check: (1) EMAIL_USER = full Google address for the SAME account that created the app password. (2) EMAIL_PASS = 16-character App Password from https://myaccount.google.com/apppasswords — not your normal Gmail password. (3) 2-Step Verification must be on. (4) Workspace accounts need admin to allow "less secure" / SMTP — often still use App Passwords where allowed.'
  );
}

/** Recipient is always the signup address from the API — never EMAIL_USER (that is only SMTP auth + default From). */
async function sendVerificationEmail(recipientEmail, displayName, rawToken) {
  const toAddress = typeof recipientEmail === 'string' ? recipientEmail.trim() : String(recipientEmail || '').trim();
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const verifyLink = `${frontendBase}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const transport = createMailTransport();
  const appName = process.env.EMAIL_APP_NAME || 'Mindful';
  const subject =
    process.env.EMAIL_VERIFY_SUBJECT || `Verify your email – ${appName}`;

  const textBody = `Hi ${displayName ? String(displayName).trim() : 'there'},

Thanks for signing up with ${appName}.

Open this link in your browser to verify your email address:

${verifyLink}

If you did not create an account, you can ignore this email.

— ${appName}`;

  const htmlBody = buildVerificationEmailHtml(displayName, verifyLink, appName);

  if (!toAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddress)) {
    console.error('[email] Invalid or missing recipient address:', recipientEmail);
    return { sent: false, verifyLink };
  }

  if (!transport) {
    console.warn(
      '[email] Mail not configured. Set EMAIL_USER + EMAIL_PASS (Gmail App Password) or SMTP_HOST/SMTP_USER/SMTP_PASS. Verification link for',
      toAddress,
      ':',
      verifyLink
    );
    return { sent: false, verifyLink };
  }

  const smtpLoginUser = String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const fromAddr = buildFromAddress();

  console.log(
    '[email] Outgoing verification → to (recipient):',
    toAddress,
    '| from:',
    fromAddr,
    '| SMTP login:',
    smtpLoginUser || '(unset)'
  );

  try {
    await transport.sendMail({
      from: fromAddr,
      to: toAddress,
      replyTo: process.env.EMAIL_REPLY_TO || smtpLoginUser || undefined,
      subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (err) {
    logGmailSmtpHint(err);
    throw err;
  }
  return { sent: true };
}

async function sendPasswordResetEmail(recipientEmail, displayName, rawToken) {
  const toAddress = typeof recipientEmail === 'string' ? recipientEmail.trim() : String(recipientEmail || '').trim();
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const transport = createMailTransport();
  const appName = process.env.EMAIL_APP_NAME || 'Mindful';
  const subject = `Reset your ${appName} password`;
  const textBody = `Hi ${displayName ? String(displayName).trim() : 'there'},\n\nReset your password using this link:\n\n${resetLink}\n\nThis link expires in one hour. If you did not request a password reset, you can ignore this email.`;
  const htmlBody = `<p>Hi ${escapeHtml(displayName || 'there')},</p><p>Use the button below to reset your ${appName} password. This link expires in one hour.</p><p><a href="${escapeHtmlAttr(resetLink)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`;

  if (!toAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddress)) {
    return { sent: false, resetLink };
  }
  if (!transport) {
    console.warn('[email] Mail not configured. Password reset link for', toAddress, ':', resetLink);
    return { sent: false, resetLink };
  }

  const smtpLoginUser = String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  await transport.sendMail({
    from: buildFromAddress(),
    to: toAddress,
    replyTo: process.env.EMAIL_REPLY_TO || smtpLoginUser || undefined,
    subject,
    text: textBody,
    html: htmlBody,
  });
  return { sent: true };
}

const jwtSecret = () => process.env.JWT_SECRET || 'secret_chat';

// Schema for Creating user model
const Users = mongoose.model('Users', {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  googleId: { type: String },
  authProvider: { type: String, default: 'local' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  tokenExpiry: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpiry: { type: Date },
  date: { type: Date, default: Date.now },
  pushSubscriptions: [
    {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
      userAgent: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  notificationPrefs: {
    enabled: { type: Boolean, default: false },
    quotes: { type: Boolean, default: true },
    progressScore: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true },
    streakReminder: { type: Boolean, default: true },
  },
});

app.post('/forgot-password', async (req, res) => {
  const genericReply = { success: true, message: 'If an account exists for that email, a password reset link has been sent.' };

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

    const user = await Users.findOne({ email });
    if (!user) return res.json(genericReply);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashVerificationToken(rawToken);
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const emailOutcome = await sendPasswordResetEmail(email, user.name, rawToken);
    const response = { ...genericReply };
    if (!emailOutcome.sent && process.env.NODE_ENV !== 'production') response.resetLink = emailOutcome.resetLink;
    return res.json(response);
  } catch (err) {
    console.error('forgot-password:', err);
    return res.status(500).json({ success: false, error: 'Could not process the password reset request.' });
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!token || !password) return res.status(400).json({ success: false, error: 'Reset token and password are required.' });
    if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });

    const user = await Users.findOne({
      passwordResetToken: hashVerificationToken(token),
      passwordResetExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ success: false, error: 'This reset link is invalid or expired.' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();
    return res.json({ success: true, message: 'Your password has been reset. You can sign in now.' });
  } catch (err) {
    console.error('reset-password:', err);
    return res.status(500).json({ success: false, error: 'Could not reset the password.' });
  }
});

// Creating endpoint for signup — no JWT until email is verified
app.post('/signup', async (req, res) => {
  try {
    const emailRaw = req.body.email;
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';
    const password = req.body.password;
    const name = req.body.name ?? req.body.username;

    if (!email || !password) {
      return res.status(400).json({ success: false, errors: 'Email and password are required.' });
    }

    const existing = await Users.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, errors: 'User Already exist!' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashVerificationToken(rawToken);
    const tokenExpiry = new Date(Date.now() + getVerificationTtlMs());

    const user = new Users({
      name,
      email,
      password,
      isVerified: false,
      verificationToken: tokenHash,
      tokenExpiry,
    });

    await user.save();

    let emailOutcome;
    try {
      emailOutcome = await sendVerificationEmail(email, name, rawToken);
    } catch (e) {
      console.error('[email] send verification failed:', e.message);
      emailOutcome = { sent: false, error: true };
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.tokenExpiry;

    const emailSent = !!(emailOutcome && emailOutcome.sent);
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verificationLink = `${frontendBase}/verify-email?token=${encodeURIComponent(rawToken)}`;

    const payload = {
      success: true,
      requiresVerification: true,
      message: 'A verification link has been sent to your email.',
      emailSent,
      user: userResponse,
    };

    if (!emailSent && verificationLink) {
      payload.verificationLink = verificationLink;
      payload.message +=
        ' If no email arrives, configure SMTP (e.g. Gmail) on the server or use the link shown on the verification page.';
    }

    res.json(payload);
  } catch (err) {
    console.error('signup:', err);
    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, errors: 'User Already exist!' });
    }
    res.status(500).json({
      success: false,
      error: err.message || 'Could not create account. Check MongoDB connection and server logs.',
    });
  }
});

// Creating endpoint for UserLogin — only verified users receive a token
app.post('/login', async (req, res) => {
  const emailRaw = req.body.email;
  const email = typeof emailRaw === 'string' ? emailRaw.trim() : emailRaw;
  const { password } = req.body;

  const user = await Users.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  if (!user.password) {
    return res.status(401).json({
      success: false,
      error: 'This account uses Google sign-in. Use Continue with Google.',
    });
  }

  if (user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  if (user.isVerified === false) {
    return res.status(403).json({
      success: false,
      error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      requiresVerification: true,
      user: { email: user.email },
    });
  }

  const token = jwt.sign({ userId: user._id }, jwtSecret());
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.verificationToken;
  delete userResponse.tokenExpiry;
  res.json({ success: true, token, user: userResponse });
});

app.get('/auth/google/config', (_req, res) => {
  res.json({
    enabled: isGoogleAuthConfigured(),
    clientId: isGoogleAuthConfigured() ? getGoogleClientId() : null,
  });
});

app.post('/auth/google', async (req, res) => {
  try {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in Backend/.env.',
      });
    }

    const credential = req.body?.credential;
    const profile = await verifyGoogleIdToken(credential);

    let user = await Users.findOne({ email: profile.email });
    if (!user) {
      user = new Users({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        authProvider: 'google',
        isVerified: true,
      });
      await user.save();
    } else {
      user.googleId = profile.googleId;
      user.isVerified = true;
      if (!user.name && profile.name) user.name = profile.name;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret());
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.tokenExpiry;

    return res.json({ success: true, token, user: userResponse });
  } catch (err) {
    console.error('[auth/google]', err.message);
    return res.status(401).json({
      success: false,
      error: err.message || 'Google sign-in failed',
    });
  }
});

app.get('/verify-email', async (req, res) => {
  try {
    const rawToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    if (!rawToken) {
      return res.status(400).json({ success: false, error: 'Verification token is required.' });
    }

    const tokenHash = hashVerificationToken(rawToken);
    const user = await Users.findOne({
      verificationToken: tokenHash,
      tokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification link.',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.tokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Your email has been verified. You can sign in now.',
    });
  } catch (err) {
    console.error('verify-email:', err);
    res.status(500).json({ success: false, error: 'Could not verify email.' });
  }
});

app.post('/resend-verification', async (req, res) => {
  const genericReply = () =>
    res.json({
      success: true,
      message:
        'If that email is registered and still needs verification, a new verification email has been sent.',
    });

  try {
    const emailRaw = req.body.email;
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return genericReply();
    }

    if (user.isVerified === true) {
      return genericReply();
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = hashVerificationToken(rawToken);
    user.tokenExpiry = new Date(Date.now() + getVerificationTtlMs());
    await user.save();

    try {
      await sendVerificationEmail(email, user.name, rawToken);
    } catch (e) {
      console.error('[email] resend failed:', e.message);
      return res.status(500).json({ success: false, error: 'Could not send verification email.' });
    }

    return genericReply();
  } catch (err) {
    console.error('resend-verification:', err);
    res.status(500).json({ success: false, error: 'Could not resend verification email.' });
  }
});

app.get('/auth/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
    const tokenData = jwt.verify(raw, jwtSecret());
    const user = await Users.findById(tokenData.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        user: { email: user.email },
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.tokenExpiry;
    res.json({ success: true, user: userResponse });
  } catch (_e) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});


app.use("/api/journal", moodEntriesRouter);
app.use("/api/insights", insightsRoute);
app.use("/api/memory", memoryRoute);
app.use("/api/activities", activityRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/weekly-reports", weeklyReportRoute);






//Endpoint for random good thoughts
const thoughts=[
  {
      id:1,
      joketext:"Smile please!!",
      joketype:"",
  },
  {
      id:2,
      joketext:"You are good!!",
      joketype:"Normal",
  },
  {
      id:3,
      joketext:"Be happy!!!",
      joketype:"Moderate",
  },
  {
      id:4,
      joketext:"If you can stay positive in a negative situation, you win!!",
      joketype:"",
  },{
      id:5,
      joketext:"Stay positive. Better days are on their way.!!",
      joketype:"Normal",
  },{
      id:6,
      joketext:"Say something positive, and you'll see something positive.",
      joketype:"Moderate",
  },{
      id:7,
      joketext:"Don't take stress!!",
      joketype:"",
  },
  {
    id:8,
    joketext:"You can have it all. Just not all at once.!!",
    joketype:"",
},
{
  id:9,
  joketext:"Keep your face always toward the sunshine—and shadows will fall behind you.!!",
  joketype:"",
},
{
  id:10,
  joketext:"If you want to live a happy life, tie it to a goal, not to people or things.!!",
  joketype:"",
},
{
  id:11,
  joketext:"Never let the fear of striking out keep you from playing the game!!",
  joketype:"",
},
{
  id:12,
  joketext:"In order to write about life first you must live it.",
  joketype:"",
},
{
  id:13,
  joketext:"Sing like no one's listening, love like you've never been hurt, dance like nobody's watching, and live like it's heaven on earth!!",
  joketype:"",
},
{
  id:14,
  joketext:"Life is like riding a bicycle. To keep your balance, you must keep moving.",
  joketype:"",
},
{
  id:15,
  joketext:"Live for each second without hesitation.!!",
  joketype:"",
},
{
  id:16,
  joketext:"The healthiest response to life is joy.!!",
  joketype:"",
},
{
  id:17,
  joketext:"Once you replace negative thoughts with positive ones, you'll start having positive results!!",
  joketype:"",
},
{
  id:18,
  joketext:"Whenever something bad happens, keep calm, take a few deep breaths and shift the focus to something positive.",
  joketype:"",
},

]

app.get('/goodthoughts',(req,res)=>{
  const thoughtindex=Math.floor(Math.random()*thoughts.length);
  res.json(thoughts[thoughtindex]);
})


app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  configurePush();
  startNotificationScheduler();
});
