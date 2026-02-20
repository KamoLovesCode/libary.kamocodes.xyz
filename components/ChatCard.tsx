
import React from 'react';
import { ChatEntry } from '../types';
import Icon from './Icon';

interface ChatCardProps {
  entry: ChatEntry;
  onSelect: (entry: ChatEntry) => void;
  onDelete: (id: string) => void;
}

// Generate a deterministic color based on string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const ChatCard: React.FC<ChatCardProps> = ({ entry, onSelect, onDelete }) => {
  const formattedDate = new Date(entry.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  };
  
  const accentColor = stringToColor(entry.title);

  return (
    <div
      className="card"
      onClick={() => onSelect(entry)}
      style={{cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%'}}
    >
      {/* Cover Image Placeholder */}
      <div style={{
          height: '100px', 
          background: `linear-gradient(135deg, ${accentColor}40, var(--bg-surface))`,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
      }}>
          <Icon name="library" style={{fontSize: '32px', color: accentColor}} />
      </div>

      <div className="card-body" style={{flex: 1, padding: '16px'}}>
        <h3 className="text-title truncate" style={{marginBottom: '8px', color: 'var(--text-main)'}}>{entry.title}</h3>
        <p className="text-body" style={{ 
            fontSize: '0.85rem',
            lineHeight: '1.5',
            height: '60px', 
            overflow: 'hidden', 
            display: '-webkit-box', 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: 'vertical', 
            opacity: 0.7 
        }}>
          {entry.content}
        </p>
      </div>
      
      <div className="card-footer" style={{padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <p className="text-caption" style={{fontSize: '0.75rem'}}>{formattedDate}</p>
        <div style={{display: 'flex', gap: '8px'}}>
           <button 
                onClick={(e) => { e.stopPropagation(); onSelect(entry); }} 
                className="btn-primary"
                style={{padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px', minHeight: 'unset'}}
            >
              View
            </button>
            <button 
                onClick={handleDelete} 
                className="btn-icon"
                style={{color: '#EF4444', padding: '4px'}}
                aria-label="Delete entry"
            >
              <Icon name="trash" style={{fontSize: '18px'}} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatCard;
