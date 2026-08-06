export type ChatMessagePayload = {
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
};

/**
 * Loads all saved chat messages for a user from localStorage (same keys as ChatPage).
 */
export function collectUserChatMessages(userId: string): ChatMessagePayload[] {
  if (!userId) return [];

  try {
    const listRaw = localStorage.getItem(`chats_list_${userId}`);
    if (!listRaw) return [];

    const chatsList: Array<{ id: string; timestamp?: string }> = JSON.parse(listRaw);
    const combined: Array<ChatMessagePayload & { sortTime: number }> = [];

    for (const chat of chatsList) {
      if (!chat?.id) continue;
      const msgsRaw = localStorage.getItem(`chat_${userId}_${chat.id}`);
      if (!msgsRaw) continue;

      const messages: Array<{ sender?: string; content?: string; timestamp?: string }> = JSON.parse(msgsRaw);
      for (const msg of messages) {
        if (!msg?.content?.trim()) continue;
        const sender = msg.sender === 'user' ? 'user' : 'ai';
        const sortTime = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
        combined.push({
          sender,
          content: msg.content.trim(),
          timestamp: msg.timestamp,
          sortTime: Number.isFinite(sortTime) ? sortTime : 0,
        });
      }
    }

    return combined
      .sort((a, b) => a.sortTime - b.sortTime)
      .slice(-80)
      .map(({ sender, content, timestamp }) => ({ sender, content, timestamp }));
  } catch (error) {
    console.error('Failed to collect chat messages for insights:', error);
    return [];
  }
}
