import React, { useState } from 'react';
import { ChatEntry } from '../types';
import Icon from './Icon';

interface ChatEntryFormProps {
  onAddEntry: (entry: Omit<ChatEntry, 'id' | 'timestamp'>) => void;
}

const ChatEntryForm: React.FC<ChatEntryFormProps> = ({ onAddEntry }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onAddEntry({ title, content });
      setTitle('');
      setContent('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText) {
      setContent(droppedText);
    }
  };


  return (
    <form 
        onSubmit={handleSubmit} 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ position: 'relative' }}
    >
        <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--accent-rgb), 0.1)', border: '2px dashed var(--accent-color)',
            borderRadius: 'var(--radius-lg)', zIndex: 10, pointerEvents: 'none',
            transition: 'opacity 0.3s ease', opacity: isDraggingOver ? 1 : 0
        }}>
            <p className="text-title text-accent">Drop text to fill content</p>
        </div>
        <div className="form-group">
            <label htmlFor="title" className="form-label">
            Entry Title
            </label>
            <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Python Script for Data Analysis"
            className="form-input"
            required
            />
        </div>
        <div className="form-group">
            <label htmlFor="content" className="form-label">
            GPT Output
            </label>
            <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or drop your chat content here..."
            className="form-input"
            required
            />
        </div>
        <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={!title.trim() || !content.trim()}
        >
            <Icon name="add" />
            <span>Add to Library</span>
        </button>
    </form>
  );
};

export default ChatEntryForm;