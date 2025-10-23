import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const parseMarkdown = (text: string): React.ReactNode[] => {
    // Split text into lines to handle list items properly
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      // Check for list items first (at start of line)
      if (line.match(/^\s*\* /)) {
        const listContent = line.replace(/^\s*\* /, '');
        elements.push(
          <li key={`list-${lineIndex}`} className="ml-4 mb-1">
            {parseInlineMarkdown(listContent)}
          </li>
        );
        return;
      }

      if (line.match(/^\s*- /)) {
        const listContent = line.replace(/^\s*- /, '');
        elements.push(
          <li key={`list-${lineIndex}`} className="ml-4 mb-1">
            {parseInlineMarkdown(listContent)}
          </li>
        );
        return;
      }

      if (line.match(/^\s*\d+\. /)) {
        const listContent = line.replace(/^\s*\d+\. /, '');
        elements.push(
          <li key={`numbered-${lineIndex}`} className="ml-4 mb-1">
            {parseInlineMarkdown(listContent)}
          </li>
        );
        return;
      }

      // Check for headers
      if (line.match(/^### /)) {
        const headerContent = line.replace(/^### /, '');
        elements.push(
          <h3 key={`h3-${lineIndex}`} className="text-lg font-bold mb-1">
            {parseInlineMarkdown(headerContent)}
          </h3>
        );
        return;
      }

      if (line.match(/^## /)) {
        const headerContent = line.replace(/^## /, '');
        elements.push(
          <h2 key={`h2-${lineIndex}`} className="text-xl font-bold mb-2">
            {parseInlineMarkdown(headerContent)}
          </h2>
        );
        return;
      }

      if (line.match(/^# /)) {
        const headerContent = line.replace(/^# /, '');
        elements.push(
          <h1 key={`h1-${lineIndex}`} className="text-2xl font-bold mb-2">
            {parseInlineMarkdown(headerContent)}
          </h1>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${lineIndex}`} className="mb-2">
          {parseInlineMarkdown(line)}
        </p>
      );
    });

    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Patterns for inline formatting (order matters)
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
      { regex: /`(.*?)`/g, type: 'code' },
      { regex: /\*(.*?)\*/g, type: 'italic' },
    ];

    const matches: Array<{
      start: number;
      end: number;
      content: string;
      type: string;
    }> = [];

    patterns.forEach(({ regex, type }) => {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      while ((match = regexCopy.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          type,
        });
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches
    const filteredMatches = matches.filter((match, index) => {
      return !matches.slice(0, index).some(prevMatch => 
        match.start < prevMatch.end && match.end > prevMatch.start
      );
    });

    filteredMatches.forEach((match, index) => {
      // Add text before the match
      if (match.start > currentIndex) {
        const beforeText = text.slice(currentIndex, match.start);
        if (beforeText) {
          elements.push(
            <span key={`text-${index}`}>
              {beforeText}
            </span>
          );
        }
      }

      // Add the formatted match
      elements.push(createFormattedElement(match.type, match.content, index));
      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText) {
        elements.push(
          <span key={`text-end`}>
            {remainingText}
          </span>
        );
      }
    }

    return elements.length > 0 ? elements : [text];
  };

  const createFormattedElement = (type: string, content: React.ReactNode, key: number): React.ReactNode => {
    switch (type) {
      case 'bold':
        return <strong key={`bold-${key}`} className="font-semibold">{content}</strong>;
      case 'italic':
        return <em key={`italic-${key}`} className="italic">{content}</em>;
      case 'code':
        return (
          <code key={`code-${key}`} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
            {content}
          </code>
        );
      default:
        return <span key={`default-${key}`}>{content}</span>;
    }
  };

  return (
    <div className={`markdown-content ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
