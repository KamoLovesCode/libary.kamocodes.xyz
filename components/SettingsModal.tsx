
import React from 'react';
import Modal from './Modal';
import Icon from './Icon';

export interface AccentColor {
  name: string;
  hex: string;
  rgb: string;
  variant: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: 'neon-red', hex: '#FF1F1F', rgb: '255, 31, 31', variant: '#CC0000' },
  { name: 'electric-blue', hex: '#00D4FF', rgb: '0, 212, 255', variant: '#00B8E6' },
  { name: 'emerald', hex: '#00FFAA', rgb: '0, 255, 170', variant: '#00DB92' },
  { name: 'violet', hex: '#AA00FF', rgb: '170, 0, 255', variant: '#8C00D1' },
  { name: 'amber', hex: '#FFAA00', rgb: '255, 170, 0', variant: '#DB9200' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccentColorName: string;
  onAccentColorChange: (color: AccentColor) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentAccentColorName,
  onAccentColorChange,
  theme,
  onThemeChange
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      
      <div className="material-input-group" style={{marginBottom: 'var(--space-6)'}}>
        <label className="form-label">Appearance</label>
        <div style={{display: 'flex', gap: 'var(--space-4)', marginTop: '4px'}}>
            <button 
                onClick={() => onThemeChange('light')}
                className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
                style={{
                    flex: 1,
                    boxShadow: theme === 'light' ? 'var(--shadow-md)' : 'none'
                }}
            >
                <Icon name="sun" /> Light Mode
            </button>
            <button 
                onClick={() => onThemeChange('dark')}
                className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
                style={{
                    flex: 1,
                    boxShadow: theme === 'dark' ? 'var(--shadow-md)' : 'none'
                }}
            >
                <Icon name="moon" /> Dark Mode
            </button>
        </div>
      </div>

      <div className="material-input-group" style={{marginBottom: 'var(--space-6)'}}>
        <label className="form-label">App Theme Color</label>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: '4px' }}>
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => onAccentColorChange(color)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: color.hex,
                border: `2px solid ${color.name === currentAccentColorName ? 'var(--bg-surface)' : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                transform: color.name === currentAccentColorName ? 'scale(1.1)' : 'scale(1)',
                boxShadow: color.name === currentAccentColorName ? '0 0 0 2px var(--accent-color)' : 'none',
              }}
              aria-label={`Set theme to ${color.name}`}
            >
              {color.name === currentAccentColorName && (
                <Icon name="check" style={{ color: 'white' }} />
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{padding: 'var(--space-4)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', opacity: 0.7}}>
          <p className="text-caption">
              <Icon name="cloudOff" style={{verticalAlign: 'text-bottom', marginRight: '4px'}}/>
              This application is running in <strong>Local Mode</strong>. All data is saved securely in your browser's storage.
          </p>
      </div>

    </Modal>
  );
};

export default SettingsModal;
