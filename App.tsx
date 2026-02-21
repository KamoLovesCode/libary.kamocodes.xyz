
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import { ChatEntry, User } from './types';
import Icon from './components/Icon';
import CodeBlock from './components/CodeBlock';
import VoiceSession from './components/VoiceSession';
import LandingPage from './components/LandingPage';
import SettingsModal, { ACCENT_COLORS } from './components/SettingsModal';
import Modal from './components/Modal';
import SortDropdown, { SortOption } from './components/SortDropdown';
import { api } from './api';


type ViewState = 'HOME' | 'LIBRARY' | 'PROFILE' | 'ARTICLE';

interface Notification {
    id: string;
    text: string;
    entryId: string;
}

// --- Dashboard Component ---
interface DashboardProps {
    currentUser: User;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout }) => {
  // Data State
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedEntry, setSelectedEntry] = useState<ChatEntry | null>(null);
  
  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(() => localStorage.getItem('app-accent-color') || 'neon-red');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('app-theme') as 'light' | 'dark') || 'dark');
  
  useEffect(() => { localStorage.setItem('app-accent-color', accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem('app-theme', theme); }, [theme]);
  
  // Quick Paste State
  const [quickPasteContent, setQuickPasteContent] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  
  // Summarization & AI Edit State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [showAiEditInput, setShowAiEditInput] = useState(false);

  // Manual Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Initial Data Load
  const loadData = async () => {
      setIsLoading(true);
      try {
          const entries = await api.getEntries(currentUser.username);
          setChatEntries(entries);
      } catch (err) {
          console.error("Failed to load entries", err);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => { loadData(); }, [currentUser.username]);

  // Apply Theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    const colorObj = ACCENT_COLORS.find(c => c.name === accentColor) || ACCENT_COLORS[0];
    document.documentElement.style.setProperty('--accent-color', colorObj.hex);
    document.documentElement.style.setProperty('--accent-variant', colorObj.variant);
    document.documentElement.style.setProperty('--accent-rgb', colorObj.rgb);
  }, [theme, accentColor]);

    const generateUUID = () => {
        if (typeof (window as any).crypto !== 'undefined' && typeof (window as any).crypto.randomUUID === 'function') {
            return (window as any).crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const processNoteWithAI = async (entry: ChatEntry) => {
      try {
          const prompt = `Analyze this note titled "${entry.title}". If vague/incomplete, suggest improvement in 1 sentence. Else return OK.\nContent: ${entry.content.substring(0, 1000)}`;
          const responseText = await api.generateAICompletion(prompt);
          if (responseText && !responseText.includes("OK")) {
              setNotifications(prev => [{ id: generateUUID(), text: responseText, entryId: entry.id }, ...prev]);
          }
      } catch (e) { console.error(e); }
  };

  const handleSummarize = async () => {
      if (!quickPasteContent.trim()) return;
      setIsSummarizing(true);
      try {
          const summary = await api.generateAICompletion(`Summarize briefly:\n\n${quickPasteContent}`);
          if (summary) { setSummaryContent(summary); setIsSummaryModalOpen(true); }
      } catch (error) { console.error(error); } finally { setIsSummarizing(false); }
  };

  const handleApplySummary = () => {
      if (summaryContent) {
          setQuickPasteContent(`**AI Summary:**\n${summaryContent}\n\n---\n\n${quickPasteContent}`);
          setSummaryContent(null);
          setIsSummaryModalOpen(false);
      }
  };

  const handleQuickSave = async () => {
    if (!quickPasteContent.trim()) return;
    const title = quickPasteContent.split('\n')[0].substring(0, 50) || `Note ${new Date().toLocaleDateString()}`;
    const tempEntry: ChatEntry = { id: generateUUID(), title, content: quickPasteContent, timestamp: Date.now() };
    try {
        setChatEntries(prev => [tempEntry, ...prev]);
        setQuickPasteContent('');
        const savedEntry = await api.createEntry(currentUser.username, tempEntry);
        setChatEntries(prev => prev.map(e => e.id === tempEntry.id ? savedEntry : e));
        processNoteWithAI(savedEntry);
    } catch (err) { alert("Cloud sync issue. Check connection."); }
  };

  const handleUpdateEntry = async () => {
      if (!selectedEntry || !editedContent.trim()) return;
      const updatedEntry = { ...selectedEntry, content: editedContent };
      try {
          setChatEntries(prev => prev.map(e => e.id === selectedEntry.id ? updatedEntry : e));
          setSelectedEntry(updatedEntry);
          setIsEditing(false);
          await api.updateEntry(currentUser.username, updatedEntry);
      } catch (err) { alert("Update failed."); }
  };
  
  const handleAIEdit = async () => {
      if (!aiEditPrompt.trim() || !selectedEntry) return;
      setIsAIEditing(true);
      try {
          const newText = await api.generateAICompletion(selectedEntry.content, `Edit: "${aiEditPrompt}". Return content only.`);
          if (newText) { setEditedContent(newText); setIsEditing(true); setShowAiEditInput(false); setAiEditPrompt(''); }
      } catch (e) { alert("AI Edit failed."); } finally { setIsAIEditing(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickSave(); }
  };

  const handleDeleteEntry = async (entry: ChatEntry) => {
      if(confirm("Delete permanently?")) {
          try {
              setChatEntries(chatEntries.filter(e => e.id !== entry.id));
              if (selectedEntry?.id === entry.id) { setCurrentView('LIBRARY'); setSelectedEntry(null); }
              await api.deleteEntry(currentUser.username, entry);
          } catch (err) { alert("Delete failed."); }
      }
  };

  const handleDictation = () => {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) return alert("Not supported.");
      const recognition = new SpeechRec();
      recognition.onstart = () => setIsDictating(true);
      recognition.onend = () => setIsDictating(false);
      recognition.onresult = (e: any) => setQuickPasteContent(p => p + (p ? ' ' : '') + e.results[0][0].transcript);
      recognition.start();
  };

  const handleSelectEntry = (entry: ChatEntry) => {
    setSelectedEntry(entry);
    setEditedContent(entry.content);
    setIsEditing(false);
    setCurrentView('ARTICLE');
  };
  
  const handleNav = (view: ViewState) => {
      if (currentView === 'HOME' && quickPasteContent.trim()) {
          if(confirm("Save text before leaving?")) handleQuickSave();
      }
      setCurrentView(view);
      setShowNotifications(false);
      setIsVoiceActive(false); 
      setIsEditing(false);
  };

  const renderNavbar = () => {
    if (currentView === 'ARTICLE') return null; 
    return (
      <div className="pill-navbar-container">
        {showNotifications && (
            <div className="notification-popup">
                <h4 className="text-title" style={{fontSize: '0.9rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                    AI Suggestions
                    <button onClick={() => setShowNotifications(false)} className="btn-icon"><Icon name="x" style={{fontSize: '16px'}}/></button>
                </h4>
                {notifications.length === 0 ? (
                    <p className="text-caption">No new suggestions.</p>
                ) : (
                    <ul style={{listStyle: 'none', maxHeight: '200px', overflowY: 'auto'}}>
                        {notifications.map(notif => (
                            <li key={notif.id} style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)'}}>
                                <p className="text-body" style={{fontSize: '0.8rem'}}>{notif.text}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )}
        <nav className="pill-navbar">
          <button className={`nav-pill-item ${currentView === 'HOME' ? 'active' : ''}`} onClick={() => handleNav('HOME')}>
            <Icon name="home" /> Home
          </button>
          <button className={`nav-pill-item ${currentView === 'LIBRARY' ? 'active' : ''}`} onClick={() => handleNav('LIBRARY')}>
            <Icon name="library" /> Library
          </button>
          <div style={{width: 1, height: '24px', background: 'var(--border)', margin: '0 4px'}}></div>
          <button className={`nav-pill-item nav-icon-only ${showNotifications ? 'active' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
             <Icon name={notifications.length > 0 ? "notificationsActive" : "notifications"} />
          </button>
          <button className={`nav-pill-item nav-icon-only ${currentView === 'PROFILE' ? 'active' : ''}`} onClick={() => handleNav('PROFILE')}>
             <div className="user-avatar-pill"><Icon name="person" style={{fontSize: '20px'}}/></div>
          </button>
        </nav>
      </div>
    );
  };

  const renderHome = () => {
    const sorted = [...chatEntries].sort((a, b) => b.timestamp - a.timestamp);
    
    return (
      <div className="page-container quick-paste-wrapper">
        <div style={{marginBottom: 'var(--space-4)', textAlign: 'center'}}>
          <h1 className="text-headline" style={{color: 'var(--accent-color)'}}>Workspace</h1>
          <p className="text-body">Capture and organize your notes locally.</p>
        </div>
        
        <div style={{position: 'relative', width: '100%', marginBottom: '2rem'}}>
            <textarea 
                className="quick-paste-area" 
                placeholder="Type or paste your notes here..." 
                value={quickPasteContent} 
                onChange={(e) => setQuickPasteContent(e.target.value)} 
                onKeyDown={handleKeyDown} 
                style={{ minHeight: '120px', paddingBottom: '60px' }}
            />
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                <button onClick={handleSummarize} className="btn-icon" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--accent-color)' }}>
                    <Icon name={isSummarizing ? "autorenew" : "analytics"} style={{ fontSize: '18px' }} />
                </button>
                <button onClick={handleQuickSave} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem' }} disabled={!quickPasteContent.trim()}>
                    Save Note
                </button>
            </div>
        </div>

        <div style={{ width: '100%' }}>
            <h2 className="text-title" style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Recent Notes</h2>
            {sorted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                    <Icon name="note" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                    <p>No notes yet. Start typing above to create one.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sorted.slice(0, 5).map(entry => (
                        <div key={entry.id} className="card" onClick={() => handleSelectEntry(entry)} style={{cursor: 'pointer', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 className="text-title truncate" style={{ fontSize: '1rem', margin: 0 }}>{entry.title}</h3>
                                <span className="text-caption" style={{ fontSize: '0.75rem' }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-body" style={{ fontSize: '0.85rem', opacity: 0.7, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                                {entry.content}
                            </p>
                        </div>
                    ))}
                    {sorted.length > 5 && (
                        <button onClick={() => handleNav('LIBRARY')} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', width: '100%', marginTop: '8px' }}>
                            View All in Library
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    );
  };

  const renderLibrary = () => {
    const sorted = [...chatEntries].sort((a, b) => {
      if (sortOrder === 'newest') return b.timestamp - a.timestamp;
      if (sortOrder === 'oldest') return a.timestamp - b.timestamp;
      return a.title.localeCompare(b.title);
    });
    return (
    <div className="page-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)'}}>
        <h1 className="text-headline">Library</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             {isLoading && <Icon name="autorenew" className="animate-spin"/>}
             <SortDropdown sortOrder={sortOrder} onSortChange={setSortOrder} />
        </div>
      </div>
      <div className="card-grid">
        {sorted.map(entry => (
          <div key={entry.id} className="card" onClick={() => handleSelectEntry(entry)} style={{cursor: 'pointer'}}>
            <div className="card-body" style={{padding: '20px'}}>
                <h3 className="text-title truncate">{entry.title}</h3>
                <p className="text-caption">{new Date(entry.timestamp).toLocaleDateString()}</p>
                <p className="text-body" style={{ fontSize: '0.9rem', opacity: 0.7, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{entry.content}</p>
            </div>
            <div className="card-footer" style={{padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end'}}>
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry); }} className="btn-icon" style={{color: '#EF4444'}}><Icon name="trash" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const updatedEntries = await api.importFromJson(currentUser.username, file);
          setChatEntries(updatedEntries);
          alert("Import successful!");
      } catch (err: any) {
          alert(`Import failed: ${err.message}`);
      }
      // Reset input
      e.target.value = '';
  };

  const renderProfile = () => (
    <div className="page-container" style={{alignItems: 'center', justifyContent: 'center'}}>
        <div className="card" style={{width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center'}}>
            <div style={{ width: '80px', height: '80px', background: 'var(--accent-color)', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Icon name="person" style={{fontSize: '32px'}}/>
            </div>
            <h2 className="text-headline" style={{marginBottom: '30px'}}>{currentUser.username}</h2>
            
            <button onClick={() => api.exportToJson(chatEntries)} className="nav-pill-item" style={{width: '100%', justifyContent: 'center', marginBottom: '10px', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent-color)', border: 'none'}}>
                <Icon name="download" /> Export JSON Library
            </button>

            <label className="nav-pill-item" style={{width: '100%', justifyContent: 'center', marginBottom: '10px', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent-color)', border: 'none', cursor: 'pointer'}}>
                <Icon name="upload" /> Import JSON Library
                <input type="file" accept=".json" style={{display: 'none'}} onChange={handleImportJson} />
            </label>

            <button onClick={() => setIsSettingsOpen(true)} className="nav-pill-item" style={{width: '100%', justifyContent: 'center', marginBottom: '10px', border: '1px solid var(--border)'}}>
                <Icon name="settings" /> Settings
            </button>

            <button className="nav-pill-item" style={{width: '100%', justifyContent: 'center', color: '#EF4444'}} onClick={onLogout}>
                <Icon name="logout" /> Logout
            </button>
        </div>
    </div>
  );

  const renderArticle = () => {
    if (!selectedEntry) return null;
    return (
      <div className="page-container" style={{paddingBottom: '180px'}}>
        <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between'}}>
             <button onClick={() => handleNav('LIBRARY')} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}><Icon name="arrowBack" /> Back</button>
             <div style={{display: 'flex', gap: '8px'}}>
                <button onClick={() => setShowAiEditInput(!showAiEditInput)} className="btn" style={{background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent-color)'}}><Icon name="analytics" /> AI Magic</button>
                <button onClick={() => isEditing ? handleUpdateEntry() : setIsEditing(true)} className="btn btn-primary"><Icon name={isEditing ? "check" : "settings"} /> {isEditing ? 'Save' : 'Edit'}</button>
             </div>
        </div>
        {showAiEditInput && (
            <div className="card animate-fade-in" style={{marginBottom: '20px', padding: '16px', border: '1px solid var(--accent-color)'}}>
                <input type="text" placeholder="e.g. 'Fix grammar', 'Make it shorter'" className="form-input" value={aiEditPrompt} onChange={(e) => setAiEditPrompt(e.target.value)} />
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px'}}>
                    <button onClick={() => setShowAiEditInput(false)} className="btn-icon">Cancel</button>
                    <button onClick={handleAIEdit} disabled={isAIEditing} className="btn btn-primary">{isAIEditing ? '...' : 'Apply'}</button>
                </div>
            </div>
        )}
        <article className="card" style={{padding: '40px'}}>
           <h1 className="text-headline" style={{color: 'var(--accent-color)'}}>{selectedEntry.title}</h1>
           <p className="text-caption" style={{marginBottom: '30px'}}>{new Date(selectedEntry.timestamp).toLocaleString()}</p>
           {isEditing ? <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="quick-paste-area" style={{minHeight: '400px'}} /> : (
               <div className="markdown-content">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypePrism]} components={{ pre: CodeBlock }}>{selectedEntry.content}</ReactMarkdown>
               </div>
           )}
        </article>
        {isVoiceActive ? <VoiceSession contextText={selectedEntry.content} onClose={() => setIsVoiceActive(false)} /> : (
            <div className="voice-control-bar animate-fade-in" style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                <div style={{maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px'}}>
                    <div><h4 className="text-title">Voice Analysis</h4><p className="text-caption">Talk to Gemini about this note.</p></div>
                    <button onClick={() => setIsVoiceActive(true)} className="btn btn-primary" style={{borderRadius: '30px'}}><Icon name="mic" /> Speak</button>
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-pattern-dots">
        <div key={currentView} className="animate-fade-in-scale">
            {currentView === 'HOME' && renderHome()}
            {currentView === 'LIBRARY' && renderLibrary()}
            {currentView === 'PROFILE' && renderProfile()}
            {currentView === 'ARTICLE' && renderArticle()}
        </div>
        {renderNavbar()}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentAccentColorName={accentColor} onAccentColorChange={(c) => setAccentColor(c.name)} theme={theme} onThemeChange={setTheme} />
        <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="Summary" originalContent={quickPasteContent} summarizedContent={summaryContent} isSummarizing={isSummarizing} onApplySummary={handleApplySummary} onCancelSummary={() => setIsSummaryModalOpen(false)}><p>Loading...</p></Modal>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const handleAuth = async (username: string) => {
      try {
          const user = await api.auth(username);
          setCurrentUser(user);
          return { success: true };
      } catch (e: any) { return { success: false, message: e.message }; }
  };
  const handleLogout = () => { if(confirm("Logout?")) setCurrentUser(null); };
  if (!currentUser) return <LandingPage onAuth={handleAuth} />;
  return <Dashboard key={currentUser.username} currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
