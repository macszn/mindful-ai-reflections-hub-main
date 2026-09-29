const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function getModel() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY is not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

function sanitizeChatMessages(chatMessages) {
  if (!Array.isArray(chatMessages)) return [];
  return chatMessages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant',
      content: m.content.trim().slice(0, 1200),
      timestamp: m.timestamp || null,
    }))
    .slice(-80);
}

function formatJournalForPrompt(entries) {
  return entries.map((entry) => ({
    date: moment(entry.date).format('YYYY-MM-DD'),
    mood: entry.mood,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    content: String(entry.content || '').trim().slice(0, 600),
  }));
}

function parseRecommendationsResponse(text) {
  const raw = String(text || '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : raw;
  const parsed = JSON.parse(jsonStr);
  const list = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  return list
    .map((item) => ({
      title: String(item.title || '').trim().slice(0, 120),
      description: String(item.description || '').trim().slice(0, 220),
      content: String(item.content || '').trim().slice(0, 800),
    }))
    .filter((item) => item.title && item.content)
    .slice(0, 6);
}

/**
 * Generate personalized insight recommendations from journals + chat using Gemini.
 */
async function generateAIRecommendations({ journalEntries = [], chatMessages = [], memoryContext = '' }) {
  const journals = formatJournalForPrompt(journalEntries);
  const chats = sanitizeChatMessages(chatMessages);

  if (journals.length === 0 && chats.length === 0 && !memoryContext.trim()) {
    return {
      recommendations: [],
      empty: true,
    };
  }

  const model = getModel();

  const prompt = `You are Mindful, a supportive mental wellbeing assistant. Analyze the user's mood journal entries and chatbot conversations below. Produce personalized, actionable recommendations grounded ONLY in what appears in this data.

Return ONLY valid JSON (no markdown fences) in this exact shape:
{
  "recommendations": [
    {
      "title": "Short actionable title",
      "description": "One line citing what you noticed (e.g. Based on your chats about work stress)",
      "content": "2-3 sentences with specific, practical steps the user can try this week."
    }
  ]
}

Rules:
- Provide 4 to 6 recommendations.
- Each recommendation must clearly relate to themes in the journals and/or chats.
- Be warm, empathetic, and non-clinical. Do not diagnose disorders.
- Do not invent events, people, or topics that are not supported by the data.
- If data is limited, give fewer but still specific recommendations and note the limited context in description.
- Never mention being an AI model.
- Avoid generic filler; prefer concrete coping skills, routines, social steps, or reflection prompts.

MOOD JOURNAL ENTRIES (most recent first):
${JSON.stringify(journals, null, 2)}

CHATBOT CONVERSATIONS (chronological, user and assistant):
${JSON.stringify(chats, null, 2)}${
    memoryContext.trim()
      ? `

LONG-TERM USER MEMORY (triggers, goals, past discussions, emotional trends from journals):
${memoryContext}`
      : ''
  }`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  if (!responseText) {
    throw new Error('Empty response from AI model');
  }

  const recommendations = parseRecommendationsResponse(responseText);
  if (recommendations.length === 0) {
    throw new Error('Could not parse recommendations from AI response');
  }

  return { recommendations, empty: false };
}

module.exports = {
  generateAIRecommendations,
  sanitizeChatMessages,
};
