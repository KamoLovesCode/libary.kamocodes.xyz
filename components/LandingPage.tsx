import React, { useState } from 'react';

interface LandingPageProps {
  onAuth: (username: string, password: string, isSignup: boolean) => Promise<{ success: boolean; message?: string }>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [isSignup, setIsSignup]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [focused,  setFocused]    = useState<string | null>(null);
  const [pwVisible, setPwVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<{show: boolean; message: string}>({show: false, message: ''});

  const canSubmit = username.trim() && password.trim() && (!isSignup || confirm === password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isSignup && confirm !== password) { 
      setErrorModal({show: true, message: 'Passwords do not match'}); 
      return; 
    }
    setLoading(true);
    try {
      const result = await onAuth(username, password, isSignup);
      if (!result.success && result.message) {
        setErrorModal({show: true, message: result.message});
      }
    } catch (err: any) {
      setErrorModal({show: true, message: err.message || 'Authentication failed'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1c 100%)',
      fontFamily: "'Syne', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>

      {/* Minimal ambient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 50%, rgba(232,255,87,0.03) 0%, transparent 70%)',
      }} />

      {/* Main container */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #e8ff57 0%, #b8d13d 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(232,255,87,0.2)',
          }}>
            📚
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0',
          }}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#888',
            margin: 0,
          }}>
            {isSignup ? 'Start organizing your goals today' : 'Sign in to continue to your workspace'}
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px',
          backdropFilter: 'blur(10px)',
        }}>

          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
            gap: '4px',
          }}>
            {(['Sign In', 'Sign Up'] as const).map(label => {
              const active = (label === 'Sign In') === !isSignup;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsSignup(label === 'Sign Up');
                    setConfirm('');
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    background: active ? 'rgba(232,255,87,0.15)' : 'transparent',
                    color: active ? '#e8ff57' : '#666',
                    transition: 'all 200ms ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Username */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#aaa',
                marginBottom: '8px',
                letterSpacing: '0.01em',
              }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocused('user')}
                onBlur={() => setFocused(null)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.05)',
                  border: `2px solid ${focused === 'user' ? '#e8ff57' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 200ms ease',
                  boxSizing: 'border-box',
                }}
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#aaa',
                marginBottom: '8px',
                letterSpacing: '0.01em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={pwVisible ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '48px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${focused === 'pw' ? '#e8ff57' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 200ms ease',
                    boxSizing: 'border-box',
                  }}
                  required
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setPwVisible(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {pwVisible ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm password - signup only */}
            {isSignup && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#aaa',
                  marginBottom: '8px',
                  letterSpacing: '0.01em',
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${
                      confirm && confirm !== password
                        ? '#ff5252'
                        : confirm && confirm === password
                        ? '#4caf82'
                        : focused === 'confirm'
                        ? '#e8ff57'
                        : 'rgba(255,255,255,0.08)'
                    }`,
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 200ms ease',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                {confirm && (
                  <p style={{
                    fontSize: '0.8rem',
                    color: confirm === password ? '#4caf82' : '#ff5252',
                    marginTop: '8px',
                    marginBottom: 0,
                  }}>
                    {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                width: '100%',
                marginTop: '8px',
                background: canSubmit && !loading
                  ? 'linear-gradient(135deg, #e8ff57 0%, #b8d13d 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: canSubmit && !loading ? '#0a0a0b' : '#555',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 200ms ease',
                letterSpacing: '0.01em',
                boxShadow: canSubmit && !loading ? '0 4px 16px rgba(232,255,87,0.3)' : 'none',
              }}
            >
              {loading
                ? (isSignup ? 'Creating account...' : 'Signing in...')
                : (isSignup ? 'Create Account' : 'Sign In')}
            </button>

          </form>

          {/* Toggle link */}
          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            marginBottom: 0,
            fontSize: '0.9rem',
            color: '#666',
          }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignup(s => !s);
                setConfirm('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#e8ff57',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setErrorModal({ show: false, message: '' })}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1a1a1c 0%, #2a2a2c 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255,82,82,0.15)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '16px',
            }}>
              ⚠️
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 12px 0',
            }}>
              Authentication Error
            </h3>
            <p style={{
              fontSize: '0.95rem',
              color: '#aaa',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}>
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal({ show: false, message: '' })}
              style={{
                width: '100%',
                background: 'rgba(232,255,87,0.15)',
                color: '#e8ff57',
                border: '1px solid rgba(232,255,87,0.3)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap');
        
        input::placeholder {
          color: #555 !important;
        }
        
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(255,255,255,0.05) inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;