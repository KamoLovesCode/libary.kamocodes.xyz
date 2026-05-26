
import React, { useState } from 'react';
import Icon from './Icon';

interface LandingPageProps {
  onAuth: (username: string) => Promise<{ success: boolean; message?: string }>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!username.trim()) return;

    setLoading(true);
    try {
        await onAuth(username);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-pattern-dots" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      textAlign: 'center', 
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="card animate-fade-in-scale" style={{
          zIndex: 1, 
          width: '100%', 
          maxWidth: '400px', 
          padding: '2rem', 
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-floating)'
      }}>
        <div style={{marginBottom: '2rem'}}>
            <Icon name="library" style={{ fontSize: '3.5rem', color: 'var(--accent-color)', marginBottom: '1rem' }} />
            <h1 className="text-headline" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome</h1>
            <p className="text-caption" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Enter a username to access your local workspace.
            </p>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div className="material-input-group" style={{ marginBottom: 0 }}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="form-input"
                    style={{ padding: '14px 16px', fontSize: '1rem' }}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', width: '100%', borderRadius: 'var(--radius-lg)' }} disabled={loading || !username.trim()}>
                {loading ? 'Entering...' : 'Enter Workspace'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;

