/**
 * Risk Detection Module — flags concerning language and drives crisis support.
 */

const RISK_LEVELS = {
  NONE: 'none',
  ELEVATED: 'elevated',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/** Ghana-focused defaults; extend via CRISIS_REGION env if needed. */
const CRISIS_RESOURCES = [
  {
    name: 'National Suicide Prevention Lifeline (Ghana)',
    contact: '+233 244 846 701',
    description: '24/7 confidential crisis support in Ghana',
    type: 'phone',
  },
  {
    name: 'Crisis Text Line (Ghana)',
    contact: 'Text HOME to 112',
    description: 'Free text-based crisis support, anytime',
    type: 'text',
  },
  {
    name: 'Emergency Services',
    contact: '112',
    description: 'Call if you or someone else is in immediate danger',
    type: 'emergency',
  },
  {
    name: 'International Association for Suicide Prevention',
    contact: 'https://www.iasp.info/resources/Crisis_Centres/',
    description: 'Find crisis centres worldwide',
    type: 'link',
  },
];

/** { phrase, level, label } — phrase matched case-insensitively as substring. */
const RISK_PHRASES = [
  { phrase: 'i feel hopeless', level: RISK_LEVELS.HIGH, label: 'Hopelessness' },
  { phrase: 'feel hopeless', level: RISK_LEVELS.HIGH, label: 'Hopelessness' },
  { phrase: 'i want to disappear', level: RISK_LEVELS.HIGH, label: 'Wish to disappear' },
  { phrase: 'want to disappear', level: RISK_LEVELS.HIGH, label: 'Wish to disappear' },
  { phrase: 'nobody cares about me', level: RISK_LEVELS.HIGH, label: 'Feeling uncared for' },
  { phrase: 'no one cares about me', level: RISK_LEVELS.HIGH, label: 'Feeling uncared for' },
  { phrase: 'nobody cares', level: RISK_LEVELS.HIGH, label: 'Feeling uncared for' },
  { phrase: 'no one cares', level: RISK_LEVELS.HIGH, label: 'Feeling uncared for' },
  { phrase: 'no reason to live', level: RISK_LEVELS.CRITICAL, label: 'No reason to live' },
  { phrase: 'want to die', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'want to kill myself', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'kill myself', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'end my life', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'end it all', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'commit suicide', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'do suicide', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'suicide', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'hurt myself', level: RISK_LEVELS.CRITICAL, label: 'Self-harm' },
  { phrase: 'harm myself', level: RISK_LEVELS.CRITICAL, label: 'Self-harm' },
  { phrase: 'cut myself', level: RISK_LEVELS.CRITICAL, label: 'Self-harm' },
  { phrase: 'self harm', level: RISK_LEVELS.CRITICAL, label: 'Self-harm' },
  { phrase: 'self-harm', level: RISK_LEVELS.CRITICAL, label: 'Self-harm' },
  { phrase: 'better off dead', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'not worth living', level: RISK_LEVELS.HIGH, label: 'Hopelessness' },
  { phrase: 'give up on life', level: RISK_LEVELS.HIGH, label: 'Hopelessness' },
  { phrase: 'can\'t go on', level: RISK_LEVELS.HIGH, label: 'Overwhelming distress' },
  { phrase: 'cant go on', level: RISK_LEVELS.HIGH, label: 'Overwhelming distress' },
  { phrase: 'i am a burden', level: RISK_LEVELS.HIGH, label: 'Worthlessness' },
  { phrase: 'i\'m a burden', level: RISK_LEVELS.HIGH, label: 'Worthlessness' },
  { phrase: 'worthless', level: RISK_LEVELS.ELEVATED, label: 'Low self-worth' },
  { phrase: 'everyone would be better without me', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'don\'t want to be here', level: RISK_LEVELS.HIGH, label: 'Wish to escape' },
  { phrase: 'dont want to be here', level: RISK_LEVELS.HIGH, label: 'Wish to escape' },
  { phrase: 'wish i was dead', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
  { phrase: 'wish i were dead', level: RISK_LEVELS.CRITICAL, label: 'Suicidal ideation' },
];

const LEVEL_PRIORITY = {
  [RISK_LEVELS.NONE]: 0,
  [RISK_LEVELS.ELEVATED]: 1,
  [RISK_LEVELS.HIGH]: 2,
  [RISK_LEVELS.CRITICAL]: 3,
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Assess emotional risk from user message text.
 * @returns {{ level: string, detectedPhrases: string[], labels: string[], requiresCrisisSupport: boolean, score: number }}
 */
function assessRisk(userInput) {
  const normalized = normalizeText(userInput);
  if (!normalized) {
    return {
      level: RISK_LEVELS.NONE,
      detectedPhrases: [],
      labels: [],
      requiresCrisisSupport: false,
      score: 0,
    };
  }

  const detectedPhrases = [];
  const labels = new Set();
  let level = RISK_LEVELS.NONE;

  for (const entry of RISK_PHRASES) {
    if (normalized.includes(entry.phrase)) {
      detectedPhrases.push(entry.phrase);
      labels.add(entry.label);
      if (LEVEL_PRIORITY[entry.level] > LEVEL_PRIORITY[level]) {
        level = entry.level;
      }
    }
  }

  const requiresCrisisSupport =
    level === RISK_LEVELS.HIGH || level === RISK_LEVELS.CRITICAL;

  return {
    level,
    detectedPhrases: [...new Set(detectedPhrases)],
    labels: [...labels],
    requiresCrisisSupport,
    score: LEVEL_PRIORITY[level],
  };
}

function getCrisisResources() {
  return CRISIS_RESOURCES;
}

function formatResourcesForPrompt(resources = CRISIS_RESOURCES) {
  return resources
    .map((r) => `- ${r.name}: ${r.contact} (${r.description})`)
    .join('\n');
}

function formatResourcesForResponse(resources = CRISIS_RESOURCES) {
  return resources
    .map((r) => `**${r.name}:** ${r.contact} — ${r.description}`)
    .join('\n');
}

/**
 * Wrap user input with crisis-protocol instructions for the AI model.
 */
function buildCrisisAugmentedMessage(userInput, assessment) {
  const resources = formatResourcesForPrompt();
  const detected =
    assessment.detectedPhrases.length > 0
      ? assessment.detectedPhrases.map((p) => `"${p}"`).join(', ')
      : 'concerning emotional distress';

  const protocol =
    assessment.level === RISK_LEVELS.CRITICAL
      ? `CRITICAL SAFETY PROTOCOL: The user may be at immediate risk. Prioritize safety above all else.
- Ask gently if they are safe right now and whether they have a plan to hurt themselves.
- Validate pain without endorsing self-harm. Clearly state they matter and help is available.
- Urge contacting emergency services (112) or the crisis line if in danger.
- Share the crisis resources below prominently.
- Offer to stay present and guide a brief grounding exercise (5-4-3-2-1 or slow breathing).
- Keep response warm, concise, and actionable. Do not be dismissive or overly clinical.`
      : `HIGH-RISK SUPPORT PROTOCOL: The user is in significant emotional distress.
- Acknowledge their feelings with empathy and without judgment.
- Remind them they are not alone and that reaching out shows strength.
- Gently explore what feels hardest right now; offer one small coping step.
- Share crisis resources below in case they need immediate human support.
- Avoid toxic positivity; be genuine and supportive.`;

  return `[Mindful RISK DETECTION — Level: ${assessment.level.toUpperCase()}. Detected signals: ${detected}]

${protocol}

Crisis resources to include when appropriate:
${resources}

User message:
${userInput}`;
}

/**
 * Fallback response if the AI call fails during a crisis-flagged message.
 */
function buildCrisisFallbackResponse(assessment) {
  const intro =
    assessment.level === RISK_LEVELS.CRITICAL
      ? "I'm really glad you told me how you're feeling. Your safety matters, and you don't have to face this alone."
      : "Thank you for sharing something so difficult. What you're feeling is real, and support is available.";

  return `${intro}

I'm here with you. If you are in immediate danger, please call **112** or reach out to someone you trust right now.

**Crisis support (Ghana):**
${formatResourcesForResponse()}

Would you like to try a short grounding exercise together, or tell me what's feeling heaviest right now?`;
}

function logRiskEvent(assessment, userId = null) {
  if (assessment.level === RISK_LEVELS.NONE) return;
  console.warn('[risk-detection]', {
    level: assessment.level,
    labels: assessment.labels,
    phraseCount: assessment.detectedPhrases.length,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  RISK_LEVELS,
  assessRisk,
  getCrisisResources,
  buildCrisisAugmentedMessage,
  buildCrisisFallbackResponse,
  formatResourcesForResponse,
  logRiskEvent,
};
