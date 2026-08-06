import React, { useMemo, useState } from 'react';
import './Chatbot.css';
import { Link } from 'react-router-dom';
import config from '../../config';
import { toast } from 'react-hot-toast';

// Markdown renderer component
const MarkdownRenderer = ({ content }) => {
  const parseMarkdown = (text) => {
    // Split into lines to handle list items properly
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
      // Handle list items (bullet points)
      if (line.match(/^\s*\* /)) {
        const listContent = line.replace(/^\s*\* /, '');
        return `<li>${parseInlineMarkdown(listContent)}</li>`;
      }
      
      // Handle numbered lists
      if (line.match(/^\s*\d+\. /)) {
        const listContent = line.replace(/^\s*\d+\. /, '');
        return `<li>${parseInlineMarkdown(listContent)}</li>`;
      }
      
      // Handle headers
      if (line.match(/^### /)) {
        const headerContent = line.replace(/^### /, '');
        return `<h3>${parseInlineMarkdown(headerContent)}</h3>`;
      }
      
      if (line.match(/^## /)) {
        const headerContent = line.replace(/^## /, '');
        return `<h2>${parseInlineMarkdown(headerContent)}</h2>`;
      }
      
      if (line.match(/^# /)) {
        const headerContent = line.replace(/^# /, '');
        return `<h1>${parseInlineMarkdown(headerContent)}</h1>`;
      }
      
      // Regular paragraph
      return `<p>${parseInlineMarkdown(line)}</p>`;
    });
    
    return processedLines.join('');
  };

  const parseInlineMarkdown = (text) => {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert `code` to <code>
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    // Convert *italic* to <em> (but not if it's at start of line with space after)
    text = text.replace(/(?<!^)\*(.*?)\*(?!\s)/g, '<em>$1</em>');
    return text;
  };

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      style={{ whiteSpace: 'pre-wrap' }}
    />
  );
};
// import SpeechToText from '../SpeechToText/SpeechToText';

function App() {
  const GUEST_CHAT_LIMIT = 5;
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeRisk, setActiveRisk] = useState(null);
  const [crisisBannerDismissed, setCrisisBannerDismissed] = useState(false);
  const [memoryActive, setMemoryActive] = useState(false);
  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem('auth-token')), []);
  const isGuestLimitReached = !isLoggedIn && guestQuestionCount >= GUEST_CHAT_LIMIT;

  const handleChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanInput = userInput.trim();
    if (!cleanInput) return;

    if (isGuestLimitReached) {
      toast.error('You reached the 5-chat free limit. Create an account to keep chatting.');
      return;
    }

    try {
      const conversationHistory = chatHistory.slice(-12).map((item) => ({
        sender: item.role === 'user' ? 'user' : 'ai',
        content: item.message,
      }));

      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: cleanInput,
          userId: localStorage.getItem('userId') || undefined,
          conversationHistory,
        }),
      });
      const data = await response.json();
      const botMessage = data.response;
      if (data.memoryActive) {
        setMemoryActive(true);
      }
      if (data.risk?.requiresCrisisSupport) {
        setActiveRisk(data.risk);
        setCrisisBannerDismissed(false);
      }
      setChatHistory([
        ...chatHistory,
        { role: 'user', message: cleanInput },
        { role: 'bot', message: botMessage },
      ]);
      if (!isLoggedIn) {
        setGuestQuestionCount((prevCount) => {
          const nextCount = prevCount + 1;
          if (nextCount >= GUEST_CHAT_LIMIT) {
            toast.error('You reached the 5-chat free limit. Create an account to keep chatting.');
          }
          return nextCount;
        });
      }
      setUserInput('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <h1>WellBot</h1>
        {isLoggedIn ? (
          <p className="memory-hint">Ask for practical guidance on relationships, stress, or any challenge you're facing.</p>
        ) : null}
        {!isLoggedIn ? (
          <p style={{ margin: '0 0 12px 0' }}>
            Free chats left: {Math.max(GUEST_CHAT_LIMIT - guestQuestionCount, 0)}/{GUEST_CHAT_LIMIT}
          </p>
        ) : null}
        {activeRisk?.requiresCrisisSupport && !crisisBannerDismissed ? (
          <div className="crisis-support-banner" role="alert">
            <strong>
              {activeRisk.level === 'critical'
                ? 'Immediate support recommended'
                : 'We noticed you may be struggling'}
            </strong>
            <p>
              You are not alone. If you are in danger, call <a href="tel:112">112</a> or the crisis line{' '}
              <a href="tel:+233244846701">+233 244 846 701</a>. Text HOME to 112 for crisis text support.
            </p>
            <ul>
              {(activeRisk.crisisResources || []).map((resource) => (
                <li key={resource.name}>
                  <span>{resource.name}: </span>
                  <strong>{resource.contact}</strong>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setCrisisBannerDismissed(true)}>
              Dismiss
            </button>
          </div>
        ) : null}
        <div className="chat-history">
          {chatHistory.map((item, index) => (
            <div key={index} className={`message ${item.role}`}>
              {item.role === 'bot' ? (
                <MarkdownRenderer content={item.message} />
              ) : (
                item.message
              )}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={userInput}
            onChange={handleChange}
            placeholder={isGuestLimitReached ? 'Create an account to continue chatting' : 'Enter your message'}
            disabled={isGuestLimitReached}
          />
          <button type="submit" disabled={isGuestLimitReached}>Send</button>
        </form>
      </div>
      {isGuestLimitReached ? (
        <Link to='/login'><button>Create Account</button></Link>
      ) : null}
      {/* <Link to='/speech'><button>Try Speech</button></Link> */}
    </div>
  );
}

export default App;
