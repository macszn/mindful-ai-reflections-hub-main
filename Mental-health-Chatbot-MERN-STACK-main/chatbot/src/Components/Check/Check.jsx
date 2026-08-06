import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Check.css';
// import video from './new.mp4';
// import newvideo from './newvid.mp4';
import list from './micro.png'
import stop from './stop.png'
import cross from './cross_btn.svg'
import { toast } from 'react-hot-toast';


import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

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

function Check() {
  const GUEST_CHAT_LIMIT = 5;
  const [userInput, setUserInput] = useState('');
  const [showReset, setShowReset] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem('auth-token')), []);
  const isGuestLimitReached = !isLoggedIn && guestQuestionCount >= GUEST_CHAT_LIMIT;
  const { transcript, resetTranscript, browserSupportsSpeechRecognition, isListening } = useSpeechRecognition();

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    const chatContainer = document.querySelector('.chat-history');
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  
  const handleChange = (event) => {
    setUserInput(event.target.value);
  };

  const startListening = () => {
    
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
      setShowReset(true);
  };

  const stopListening = () => {
      SpeechRecognition.stopListening();
  };


  const handleResetClick = () => {
    resetTranscript();
    setShowReset(false);

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

      const response = await fetch('http://localhost:4000/chat', {
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
      chatHistory.scrollTop = chatHistory.scrollHeight;

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      const botMessage = data.response;

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
    //  chatHistory.scrollTop = chatHistory.scrollHeight,

  };

  const handleVoiceSubmit = () => {
    if (transcript.trim() !== '') {
      setUserInput(transcript);
      resetTranscript(); 
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (isListening) {
      stopListening();
    }
    if (transcript.trim() !== '') {
      handleVoiceSubmit();
    } else {
      handleSubmit(event);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Voice recognition not supported</div>;
  }

  return (
    <div className="App">

      <div className="chat-container">
        <h1>WellBot</h1>
        {!isLoggedIn ? (
          <p style={{ margin: '0 0 12px 0' }}>
            Free chats left: {Math.max(GUEST_CHAT_LIMIT - guestQuestionCount, 0)}/{GUEST_CHAT_LIMIT}
          </p>
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
        <form onSubmit={handleFormSubmit} className="chat-form">
          <input
            type="text"
            value={userInput}
            onChange={handleChange}
            placeholder={isGuestLimitReached ? 'Create an account to continue chatting' : 'Enter your message'}
            disabled={isGuestLimitReached}
          />
          <img
            src={list}
            className='microphone-btn'
            alt=""
            onClick={() => !isGuestLimitReached && startListening()}
            style={{ opacity: isGuestLimitReached ? 0.5 : 1, pointerEvents: isGuestLimitReached ? 'none' : 'auto' }}
          />
         
          <img src={stop} className='stop-btn' alt="" onClick={stopListening} />
          <button className='submit-btn' type="submit" disabled={isGuestLimitReached}>Send</button>
        </form>
        <div className="transcript">{transcript}
        </div>
        <div className='cross-btn'>{transcript!==""?<img  src={cross} onClick={handleResetClick} alt="" />:<></>}
</div>
      </div>
      {isGuestLimitReached ? (
        <Link to='/login'><button>Create Account</button></Link>
      ) : null}
    </div>
  );
}

export default Check;


