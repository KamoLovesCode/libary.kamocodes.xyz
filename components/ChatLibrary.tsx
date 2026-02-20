import React from 'react';
import { ChatEntry } from '../types';
import ChatCard from './ChatCard';
import Icon from './Icon';

interface ChatLibraryProps {
  entries: ChatEntry[];
  onSelectEntry: (entry: ChatEntry) => void;
  onDeleteEntry: (id: string) => void;
  totalEntries: number;
  searchQuery: string;
}

const EmptyState: React.FC<{icon: 'search' | 'library', title: string, message: string}> = ({icon, title, message}) => (
    <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: 'transparent', borderStyle: 'dashed' }}>
        <Icon name={icon} style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', color: 'var(--accent-color)', opacity: 0.7 }} />
        <h2 className="text-headline" style={{marginBottom: 'var(--space-2)'}}>{title}</h2>
        <p className="text-body" style={{maxWidth: '400px', opacity: 0.7}}>{message}</p>
    </div>
);

const ChatLibrary: React.FC<ChatLibraryProps> = ({ entries, onSelectEntry, onDeleteEntry, totalEntries, searchQuery }) => {
  if (entries.length === 0) {
     if (totalEntries > 0 && searchQuery) {
      return <EmptyState icon="search" title="No Results Found" message={`Your search for "${searchQuery}" did not match any entries.`} />;
    }
    return <EmptyState icon="library" title="Your Library is Empty" message="Add a new entry using the form to start building your personal knowledge base." />;
  }

  return (
    <div className="card-grid">
      {entries.map((entry) => (
        <ChatCard
          key={entry.id}
          entry={entry}
          onSelect={onSelectEntry}
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  );
};

export default ChatLibrary;