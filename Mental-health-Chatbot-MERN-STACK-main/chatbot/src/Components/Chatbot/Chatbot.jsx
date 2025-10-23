import React, { useState } from 'react';
import './Chatbot.css';
import { Link } from 'react-router-dom';
import config from '../../config';

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
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${config.API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });
      const data = await response.json();
      const botMessage = data.response;
      setChatHistory([
        ...chatHistory,
        { role: 'user', message: userInput },
        { role: 'bot', message: botMessage },
      ]);
      setUserInput('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <h1>WellBot</h1>
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
            placeholder="Enter your message"
          />
          <button type="submit">Send</button>
        </form>
      </div>
      <Link to='/booking'><button>Book a Session</button></Link>
      {/* <Link to='/speech'><button>Try Speech</button></Link> */}
    </div>
  );
}

export default App;
