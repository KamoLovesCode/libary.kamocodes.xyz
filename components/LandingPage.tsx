
import React, { useState } from 'react';
import Icon from './Icon';

interface LandingPageProps {
  onAuth: (username: string, password: string, isSignup: boolean) => Promise<{ success: boolean; message?: string }>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
        const result = await onAuth(username, password, isSignup);
        if (!result.success && result.message) {
            alert(result.message);
        }
    } catch (err: any) {
        alert(err.message || 'Authentication failed');
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
            <h1 className="text-headline" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{isSignup ? 'Sign Up' : 'Welcome Back'}</h1>
            <p className="text-caption" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {isSignup ? 'Create an account to get started.' : 'Sign in to access your workspace.'}
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

            <div className="material-input-group" style={{ marginBottom: 0 }}>
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ padding: '14px 16px', fontSize: '1rem' }}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', width: '100%', borderRadius: 'var(--radius-lg)' }} disabled={loading || !username.trim() || !password.trim()}>
                {loading ? (isSignup ? 'Creating Account...' : 'Signing In...') : (isSignup ? 'Sign Up' : 'Sign In')}
            </button>
            
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="btn" style={{ padding: '14px', fontSize: '0.9rem', width: '100%', borderRadius: 'var(--radius-lg)' }}>
                {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;

