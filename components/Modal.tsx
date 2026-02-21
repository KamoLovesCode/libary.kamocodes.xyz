
import React, { useEffect } from 'react';
import Icon from './Icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import CodeBlock from './CodeBlock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // New props for AI summarization
  originalContent?: string;
  summarizedContent?: string | null;
  isSummarizing?: boolean;
  onSummarize?: () => Promise<void>;
  onApplySummary?: () => void;
  onCancelSummary?: () => void;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  originalContent,
  summarizedContent,
  isSummarizing,
  onSummarize,
  onApplySummary,
  onCancelSummary
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const showSummaryView = summarizedContent !== null && summarizedContent !== undefined;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-headline">{title}</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{showSummaryView ? (
              <div>
                <h3 className="text-title" style={{marginBottom: 'var(--space-4)'}}>AI Generated Summary</h3>
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypePrism]}
                    components={{
                      pre: CodeBlock,
                    }}
                  >
                    {summarizedContent || ''}
                  </ReactMarkdown>
                </div>
                
                <h3 className="text-title mt-8" style={{marginBottom: 'var(--space-4)', borderBottom: 'none'}}>Original Content</h3>
                <div className="markdown-content card" style={{ maxHeight: '200px', overflowY: 'auto', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypePrism]}
                    components={{
                      pre: CodeBlock,
                    }}
                  >
                    {originalContent || ''}
                  </ReactMarkdown>
                </div>
                
                <div className="modal-footer" style={{ marginTop: 'var(--space-4)' }}>
                  <button onClick={onCancelSummary} className="btn" aria-label="Cancel summary">
                    <span>Cancel</span>
                  </button>
                  <button onClick={onApplySummary} className="btn btn-primary" aria-label="Apply summary">
                    <Icon name="check" />
                    <span>Apply Summary</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {children}
                {onSummarize && (
                  <button 
                    onClick={onSummarize} 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 'var(--space-6)' }}
                    disabled={isSummarizing}
                    aria-label="Summarize content with AI"
                  >
                    <Icon name="autorenew" />
                    <span>{isSummarizing ? 'Summarizing...' : 'Summarize with AI'}</span>
                  </button>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
