const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const {
  assessRisk,
  buildCrisisAugmentedMessage,
  buildCrisisFallbackResponse,
} = require('./riskDetection');
const { sanitizeConversationHistory } = require('./memoryService');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const BASE_SYSTEM_PROMPT = `You are Mindful, a supportive mental health and life guidance companion. Your primary role is to help users work through challenges with clear, practical advice they can act on — relationships, family, work stress, anxiety, habits, communication, boundaries, and everyday wellbeing.

How to respond:
- Listen with empathy, then offer concrete ideas: steps, scripts, reframes, coping strategies, or small experiments to try.
- For relationship or interpersonal issues, suggest healthy communication approaches, boundary-setting, and perspective-taking — not generic platitudes.
- Offer grounding exercises, journaling prompts, or routines when they fit the situation.
- Keep answers warm, direct, and actionable (often 2–4 short paragraphs or a brief numbered plan).

If users mention self-harm or suicide, prioritize safety, encourage immediate emergency help, and share crisis resources.
Do not suggest booking sessions or external scheduling forms.
If users ask non-mental-health or non-life-guidance questions (math, weather, coding trivia, etc.), politely redirect to emotional wellbeing support.
Do not claim to be a therapist or replace professional care.`;

const MEMORY_PREAMBLE_SUFFIX = `

--- PAST CONVERSATION NOTES (use ONLY because the user is referring to earlier chats) ---
The user asked about something from a previous conversation. Use these notes briefly to stay consistent — do not recite them as a list or bring up unrelated past topics.
{MEMORY}
--- END PAST CONVERSATION NOTES ---`;

function getModel() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('API_KEY is not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

function buildSystemPreamble(memoryContext) {
  if (!memoryContext?.trim()) {
    return BASE_SYSTEM_PROMPT;
  }
  return BASE_SYSTEM_PROMPT + MEMORY_PREAMBLE_SUFFIX.replace('{MEMORY}', memoryContext.trim());
}

function toGeminiHistory(conversationHistory, systemPreamble) {
  // Gemini requires strict role alternation: user → model → user → model …
  // and history passed to startChat must end with model (sendMessage adds the next user turn).
  const history = [
    {
      role: 'user',
      parts: [{ text: systemPreamble }],
    },
    {
      role: 'model',
      parts: [
        {
          text: "I understand. I'm Mindful — here to listen and help you think through challenges with practical guidance. What's on your mind?",
        },
      ],
    },
  ];

  for (const msg of conversationHistory) {
    const role = msg.role === 'user' ? 'user' : 'model';
    const text = String(msg.content || '').trim();
    if (!text) continue;

    const last = history[history.length - 1];
    // UI often starts with a welcome AI message; appending it after the synthetic
    // model ack would create model→model and fail validateChatHistory.
    if (last && last.role === role) {
      last.parts[0].text = `${last.parts[0].text}\n${text}`;
      continue;
    }

    history.push({
      role,
      parts: [{ text }],
    });
  }

  // Drop a trailing user turn so sendMessage can append the current user input.
  while (history.length > 0 && history[history.length - 1].role === 'user') {
    history.pop();
  }

  return history;
}

async function runChat(userInput, options = {}) {
  const {
    riskAssessment = null,
    memoryContext = '',
    conversationHistory = [],
  } = options;

  const assessment = riskAssessment || assessRisk(userInput);
  const messageForModel = assessment.requiresCrisisSupport
    ? buildCrisisAugmentedMessage(userInput, assessment)
    : userInput;

  const sanitizedHistory = sanitizeConversationHistory(conversationHistory);

  const systemPreamble = buildSystemPreamble(memoryContext);
  const geminiHistory = toGeminiHistory(sanitizedHistory, systemPreamble);

  try {
    const model = getModel();
    const generationConfig = {
      temperature: assessment.requiresCrisisSupport ? 0.4 : 0.85,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: geminiHistory,
    });

    const result = await chat.sendMessage(messageForModel);
    return result.response.text();
  } catch (error) {
    console.error('Error in runChat:', error);
    if (assessment.requiresCrisisSupport) {
      return buildCrisisFallbackResponse(assessment);
    }
    throw new Error('Error in runChat');
  }
}

module.exports = { runChat, getModel, buildSystemPreamble };
