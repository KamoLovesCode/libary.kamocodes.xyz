import React, { useState } from 'react';
import Icon from './Icon';

const CodeBlock = (props: React.ComponentPropsWithoutRef<'pre'>) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const child = React.Children.toArray(props.children)[0];
  // Fix: Use a generic type with React.isValidElement to correctly type the child element's props,
  // resolving errors where `children` and `className` were not found on an 'unknown' props type.
  const codeElement = React.isValidElement<{ children?: React.ReactNode; className?: string }>(child) ? child : null;
  const codeText = codeElement?.props?.children ? String(codeElement.props.children).trim() : '';
  const language = (codeElement?.props?.className || '').replace('language-', '');

  const handleCopy = () => {
    if (codeText) {
      navigator.clipboard.writeText(codeText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => console.error('Failed to copy text: ', err));
    }
  };

  return (
    <div style={{ position: 'relative' }} className="group">
      <div style={{
          position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          opacity: 0, transition: 'opacity 0.2s ease',
      }} className="copy-container">
        {language && <span style={{
            fontSize: 'var(--text-xs)', color: 'var(--on-surface)', background: 'var(--primary-dark)',
            padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
            userSelect: 'none'
        }}>{language}</span>}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--primary-dark)',
            color: 'var(--on-surface)', padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline)', cursor: 'pointer'
          }}
          aria-label="Copy code to clipboard"
          className='btn-icon'
        >
          {isCopied ? (
            <>
              <Icon name="check" style={{ color: '#4ade80' }} />
              <span style={{userSelect: 'none'}}>Copied!</span>
            </>
          ) : (
            <>
              <Icon name="copy" />
              <span style={{userSelect: 'none'}}>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre {...props}>{props.children}</pre>
      <style>{`
        .group:hover .copy-container {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default CodeBlock;