import React from 'react';
import { render } from '@testing-library/react';
import MarkdownRenderer from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('should render bold text correctly', () => {
    const { container } = render(
      <MarkdownRenderer content="This is **bold** text" />
    );
    
    const strongElement = container.querySelector('strong');
    expect(strongElement).toBeInTheDocument();
    expect(strongElement?.textContent).toBe('bold');
  });

  it('should render italic text correctly', () => {
    const { container } = render(
      <MarkdownRenderer content="This is *italic* text" />
    );
    
    const emElement = container.querySelector('em');
    expect(emElement).toBeInTheDocument();
    expect(emElement?.textContent).toBe('italic');
  });

  it('should render code text correctly', () => {
    const { container } = render(
      <MarkdownRenderer content="This is `code` text" />
    );
    
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toBe('code');
  });

  it('should handle mixed formatting', () => {
    const { container } = render(
      <MarkdownRenderer content="This is **bold** and *italic* and `code` text" />
    );
    
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('em')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('should handle text without formatting', () => {
    const { container } = render(
      <MarkdownRenderer content="Plain text without formatting" />
    );
    
    expect(container.textContent).toBe('Plain text without formatting');
  });
});

