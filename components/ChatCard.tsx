
import React from 'react';
import { ChatEntry } from '../types';
import Icon from './Icon';

interface ChatCardProps {
  entry: ChatEntry;
  onSelect: (entry: ChatEntry) => void;
  onDelete: (id: string) => void;
}

const ChatCard: React.FC<ChatCardProps> = ({ entry, onSelect, onDelete }) => {
  const formattedDate = new Date(entry.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  };

  const stripClass = entry.priority === 'high' ? 'strip-high' 
    : entry.priority === 'low' ? 'strip-low' 
    : entry.priority === 'medium' ? 'strip-medium' 
    : 'strip-default';

  const metaClass = entry.priority === 'high' ? 's-blocked' 
    : entry.priority === 'low' ? 's-review' 
    : entry.priority === 'medium' ? 's-active' 
    : 's-done';

  const priorityLabel = entry.priority 
    ? entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1) 
    : 'Normal';

  const isOverdue = entry.dueDate && new Date(entry.dueDate) < new Date();
  
  // Word count
  const wordCount = entry.content.trim().split(/\\s+/).length;

  // Progress bar calculation for due date
  const calculateProgress = () => {
    if (!entry.dueDate) return null;
    const now = new Date().getTime();
    const created = new Date(entry.timestamp).getTime();
    const due = new Date(entry.dueDate).getTime();
    const total = due - created;
    const elapsed = now - created;
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    return progress;
  };

  const progress = calculateProgress();
  const progressColor = progress === null ? 'var(--accent-color)' 
    : progress < 50 ? '#10b981' 
    : progress < 75 ? '#f59e0b' 
    : progress < 100 ? '#f97316' 
    : '#ef4444';

  // Steps progress calculation
  const calculateStepsProgress = () => {
    if (!entry.steps || entry.steps.length === 0) return null;
    const completedSteps = entry.steps.filter(step => step.completed).length;
    const totalSteps = entry.steps.length;
    const stepsProgress = (completedSteps / totalSteps) * 100;
    return { 
      progress: stepsProgress, 
      completed: completedSteps, 
      total: totalSteps 
    };
  };

  const stepsData = calculateStepsProgress();
  const stepsColor = stepsData 
    ? stepsData.progress === 100 ? '#10b981' 
    : stepsData.progress >= 50 ? '#7eb8ff' 
    : '#f59e0b'
    : 'var(--accent-color)';

  return (
    <div className="card" onClick={() => onSelect(entry)}>
      <div className={`card-strip ${stripClass}`}></div>
      
      {/* Top section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: 'var(--text-main)', 
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
              fontFamily: 'Syne, system-ui, sans-serif'
            }}>
              {entry.title}
            </div>
            <div style={{ 
              fontSize: '0.6375rem', 
              color: 'var(--text-secondary)', 
              fontFamily: 'Geist Mono, monospace',
              marginTop: '2px',
              opacity: 0.5
            }}>
              #{entry.id.slice(0, 8)}
            </div>
          </div>
        </div>
        <button 
          onClick={handleDelete}
          style={{
            width: '26px',
            height: '26px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            transition: 'all 200ms',
            flexShrink: 0,
            opacity: 1
          }}
          className="card-delete"
          title="Delete note"
        >
          <Icon name="trash" style={{ fontSize: '12px' }} />
        </button>
      </div>

      {/* Body */}
      <p style={{ 
        fontSize: '0.7875rem', 
        color: 'var(--text-secondary)', 
        lineHeight: 1.55,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        marginBottom: '13px',
        flex: 1,
        fontFamily: 'Syne, system-ui, sans-serif'
      }}>
        {entry.content}
      </p>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '13px' }}>
        <span className={`meta-tag ${metaClass}`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.6375rem',
          fontWeight: 500,
          borderRadius: '6px',
          padding: '3px 7px',
          fontFamily: 'Geist Mono, monospace'
        }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></span>
          {priorityLabel}
        </span>
        <span style={{ width: '1px', height: '11px', background: 'var(--border)' }}></span>
        <span style={{ fontSize: '0.6375rem', color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace', opacity: 0.6 }}>
          {formattedDate}
        </span>
        <span style={{ width: '1px', height: '11px', background: 'var(--border)' }}></span>
        <span style={{ fontSize: '0.6375rem', color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
          <Icon name="bookOpen" style={{ fontSize: '10px' }} />
          {wordCount} words
        </span>
      </div>

      {/* Footer with Progress Bars */}
      {(entry.dueDate || stepsData) && (
        <div style={{ 
          marginTop: '12px',
          paddingTop: '11px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Time-based Progress Bar */}
          {entry.dueDate && progress !== null && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6375rem', fontFamily: 'Geist Mono, monospace', color: isOverdue ? '#ff7043' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Icon name="history" style={{ fontSize: '10px' }} />
                  {isOverdue ? 'Overdue' : `Due ${new Date(entry.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </span>
                <span style={{ fontSize: '0.6375rem', fontFamily: 'Geist Mono, monospace', color: progressColor, fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: 'var(--bg-surface)', 
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: `inset 0 1px 2px rgba(0,0,0,0.1)`
              }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: progressColor,
                  transition: 'width 0.3s ease',
                  borderRadius: '4px',
                  boxShadow: `0 0 8px ${progressColor}40`
                }} />
              </div>
            </div>
          )}

          {/* Steps-based Progress Bar */}
          {stepsData && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6375rem', fontFamily: 'Geist Mono, monospace', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Icon name="checkCircle" style={{ fontSize: '10px' }} />
                  Steps Completed
                </span>
                <span style={{ fontSize: '0.6375rem', fontFamily: 'Geist Mono, monospace', color: stepsColor, fontWeight: 600 }}>
                  {stepsData.completed}/{stepsData.total}
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: 'var(--bg-surface)', 
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: `inset 0 1px 2px rgba(0,0,0,0.1)`
              }}>
                <div style={{ 
                  width: `${stepsData.progress}%`, 
                  height: '100%', 
                  background: stepsColor,
                  transition: 'width 0.3s ease',
                  borderRadius: '4px',
                  boxShadow: `0 0 8px ${stepsColor}40`
                }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatCard;
