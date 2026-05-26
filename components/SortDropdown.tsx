import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

export type SortOption = 'newest' | 'oldest' | 'title';

interface SortDropdownProps {
  sortOrder: SortOption;
  onSortChange: (option: SortOption) => void;
}

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Date: Newest First' },
  { key: 'oldest', label: 'Date: Oldest First' },
  { key: 'title', label: 'Title: A-Z' },
];

const SortDropdown: React.FC<SortDropdownProps> = ({ sortOrder, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  const currentLabel = sortOptions.find(opt => opt.key === sortOrder)?.label || 'Sort By';

  return (
    <div style={{position: 'relative', flexShrink: 0}} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '200px' }}
      >
        <span className="text-caption">{currentLabel}</span>
        <Icon name="chevronDown" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div className="card animate-fade-in-fast" style={{position: 'absolute', right: 0, marginTop: 'var(--space-2)', width: '200px', zIndex: 20}}>
          <ul style={{listStyle: 'none'}}>
            {sortOptions.map((option) => (
              <li key={option.key}>
                <button
                  onClick={() => handleSelect(option.key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--text-sm)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: 'none', background: 'transparent', cursor: 'pointer'
                  }}
                  className="btn-icon"
                >
                  {option.label}
                  {sortOrder === option.key && <Icon name="check" className="text-accent" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;