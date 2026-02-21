
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
import ChatCard from './components/ChatCard';
import EditPage from './components/EditPage';
import { api } from './api';
import { modelOrchestrator, OrchestratedResponse } from './services/modelOrchestrator';


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
  const [quickCaptureDueDate, setQuickCaptureDueDate] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  
  // Create Note Modal State
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDueDate, setNewNoteDueDate] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Summarization & AI Edit State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [showAiEditInput, setShowAiEditInput] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhancingModal, setIsEnhancingModal] = useState(false);
  const [isEnhancingEdit, setIsEnhancingEdit] = useState(false);

  // Manual Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDueDate, setEditedDueDate] = useState('');
  const [editedPriority, setEditedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editedSteps, setEditedSteps] = useState<Array<{text: string; completed: boolean}>>([]);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [stepsInput, setStepsInput] = useState('');
  
  // Elaboration Modal
  const [showElaborateModal, setShowElaborateModal] = useState(false);
  const [elaborationInput, setElaborationInput] = useState('');
  const [isElaborating, setIsElaborating] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Confirmation Modals
  const [showDueDateReminder, setShowDueDateReminder] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ChatEntry | null>(null);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  
  // AI Refine Conversation
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineMessages, setRefineMessages] = useState<Array<{role: 'user' | 'ai', text: string}>>([]);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  // Custom Alert/Error Modals
  const [alertModal, setAlertModal] = useState<{show: boolean, title: string, message: string, type: 'info' | 'error' | 'success'}>({show: false, title: '', message: '', type: 'info'});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // Set default due date when create modal opens
  useEffect(() => {
    if (isCreateNoteModalOpen && !newNoteDueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setNewNoteDueDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [isCreateNoteModalOpen]);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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

  const enhanceTextWithAI = async (text: string, setLoading: (val: boolean) => void, updateText: (text: string) => void) => {
    if (!text.trim()) return;
    setLoading(true);
    
    try {
      // Determine task type based on context
      const taskType = text.length < 100 ? 'elaborate' : 'enhance';
      
      const response = await modelOrchestrator.getBestResponse(
        `Enhance this content to be clearer and more detailed: "${text}"`,
        { taskType }
      );
      
      if (response.finalContent.trim()) {
        updateText(response.finalContent);
        
        // Show a subtle notification about which models were used
        console.log(`AI Enhancement used: ${response.usedModels.join(', ')} (confidence: ${response.confidence}%)`);
      } else {
        throw new Error('No content received');
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      setAlertModal({
        show: true, 
        title: 'Enhancement Failed', 
        message: `${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, 
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceWithAI = async () => {
      await enhanceTextWithAI(quickPasteContent, setIsEnhancing, setQuickPasteContent);
  };

  const handleEnhanceModalNote = async () => {
      await enhanceTextWithAI(newNoteContent, setIsEnhancingModal, setNewNoteContent);
  };

  const handleEnhanceEditNote = async () => {
      if (!selectedEntry) return;
      setIsEnhancingEdit(true);
      try {
          const HF_TOKEN = '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';
          const prompt = `Based on this goal: "${selectedEntry.title}"\n\nDescription: ${editedContent}\n\nGenerate 3-5 clear, actionable steps to accomplish this goal. Return ONLY the steps, one per line, starting each with a dash (-). Be specific and practical.`;
          
          const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
              method: 'POST',
              headers: {
                  Authorization: `Bearer ${HF_TOKEN}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  model: 'HuggingFaceTB/SmolLM3-3B:hf-inference',
                  messages: [{ role: 'user', content: prompt }],
                  stream: false,
              }),
          });
          
          if (!response.ok) throw new Error(`API Error: ${response.status}`);
          
          const data = await response.json();
          const stepsText = data.choices[0]?.message?.content || '';
          
          // Parse steps from response
          const steps = stepsText
              .split('\n')
              .filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d+\./)) 
              .map((line: string) => ({
                  text: line.replace(/^[-\d+\.)]\s*/, '').trim(),
                  completed: false
              }))
              .filter((step: any) => step.text.length > 0);
          
          if (steps.length > 0) {
              setEditedSteps(steps);
              setAlertModal({show: true, title: 'Steps Generated', message: `Generated ${steps.length} actionable steps for your goal.`, type: 'success'});
          } else {
              setAlertModal({show: true, title: 'No Steps', message: 'Could not generate steps. Please try again.', type: 'error'});
          }
      } catch (error) {
          console.error('Step generation failed:', error);
          setAlertModal({show: true, title: 'Generation Failed', message: 'Failed to generate steps. Please try again.', type: 'error'});
      } finally {
          setIsEnhancingEdit(false);
      }
  };

  const handleElaborateGoal = async () => {
    if (!selectedEntry || !elaborationInput.trim()) return;
    setIsElaborating(true);
    try {
      const response = await modelOrchestrator.getBestResponse(
        `Based on this goal and the user's elaboration, provide a refined, detailed description:

Goal Title: "${selectedEntry.title}"
Current Description: ${selectedEntry.content}
User's Additional Context: "${elaborationInput}"

Provide a refined description that incorporates all this information.`,
        { goal: selectedEntry.title, taskType: 'elaborate' }
      );

      if (response.finalContent.trim()) {
        const updatedEntry = {
          ...selectedEntry,
          content: response.finalContent
        };
        
        setChatEntries(prev => prev.map(e => e.id === selectedEntry.id ? updatedEntry : e));
        setSelectedEntry(updatedEntry);
        setEditedContent(response.finalContent);
        
        await api.updateEntry(currentUser.username, updatedEntry);
        
        setShowElaborateModal(false);
        setElaborationInput('');
        setAlertModal({
          show: true, 
          title: 'Goal Refined!', 
          message: `Your goal has been enhanced using ${response.usedModels.length} AI model(s).`, 
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Goal elaboration failed:', error);
      setAlertModal({
        show: true, 
        title: 'Refinement Failed', 
        message: 'Failed to refine goal. Please try again.', 
        type: 'error'
      });
    } finally {
      setIsElaborating(false);
    }
  };

  const handleSummarize = async () => {
    if (!quickPasteContent.trim()) return;
    setIsSummarizing(true);
    try {
      const response = await modelOrchestrator.getBestResponse(
        `Summarize this content briefly and clearly:\n\n${quickPasteContent}`,
        { taskType: 'summarize' }
      );
      
      if (response.finalContent) {
        setSummaryContent(response.finalContent);
        setIsSummaryModalOpen(true);
      }
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleApplySummary = () => {
      if (summaryContent) {
          setQuickPasteContent(`**AI Summary:**\n${summaryContent}\n\n---\n\n${quickPasteContent}`);
          setSummaryContent(null);
          setIsSummaryModalOpen(false);
      }
  };
  
  // Validate content is meaningful (not gibberish)
  const isValidContent = (text: string): boolean => {
      const trimmed = text.trim();
      if (trimmed.length < 10) return false; // Too short
      
      // Check for repeated characters (gibberish pattern)
      const repeatedPattern = /(.)\1{4,}/g;
      if (repeatedPattern.test(trimmed)) return false;
      
      // Check for meaningful words (at least 3 characters)
      const words = trimmed.split(/\s+/).filter(w => w.length >= 3);
      if (words.length < 2) return false; // Need at least 2 meaningful words
      
      // Check if it has some vowels (basic language check)
      const vowelCount = (trimmed.match(/[aeiouAEIOU]/g) || []).length;
      if (vowelCount < trimmed.length * 0.15) return false; // Less than 15% vowels is suspicious
      
      return true;
  };

  const handleQuickSave = async () => {
    if (!quickPasteContent.trim()) return;
    // Show due date reminder first
    setShowDueDateReminder(true);
  };
  
  const enhanceGoalWithMultipleModels = async (entry: ChatEntry) => {
    try {
      const prompt = `
Goal: "${entry.title}"
Initial thoughts: ${entry.content}

Please help by:
1. Expanding the goal description to be clearer and more actionable
2. Generating 4-7 specific, measurable steps to accomplish this goal
3. Suggesting any missing details or considerations

Format the response with:
- Expanded description (2-3 paragraphs)
- Action steps (each starting with "- ")
`;

      const response = await modelOrchestrator.getBestResponse(prompt, { 
        goal: entry.title,
        taskType: 'generate-steps'
      });

      // Parse the response
      const lines = response.finalContent.split('\n');
      let expandedContent = '';
      const steps: Array<{text: string; completed: boolean}> = [];
      
      let inSteps = false;
      for (const line of lines) {
        if (line.trim().startsWith('-')) {
          inSteps = true;
          steps.push({
            text: line.replace(/^-\s*/, '').trim(),
            completed: false
          });
        } else if (inSteps && line.trim() === '') {
          inSteps = false;
        } else if (!inSteps) {
          expandedContent += line + '\n';
        }
      }

      // Update the entry
      const enhancedEntry: ChatEntry = {
        ...entry,
        content: expandedContent.trim() || response.finalContent,
        steps: steps.length > 0 ? steps : entry.steps
      };

      setChatEntries(prev => prev.map(e => e.id === entry.id ? enhancedEntry : e));
      await api.updateEntry(currentUser.username, enhancedEntry);

      setAlertModal({
        show: true, 
        title: 'Goal Enhanced!', 
        message: `AI enhanced your goal using ${response.usedModels.length} model(s) with ${response.confidence}% confidence.`, 
        type: 'success'
      });

    } catch (error) {
      console.error('AI enhancement failed:', error);
      setAlertModal({
        show: true, 
        title: 'AI Processing', 
        message: 'Could not enhance your goal. The original version has been saved.', 
        type: 'info'
      });
    }
  };
  
  const confirmQuickSave = async () => {
    // Validate content is meaningful
    if (!isValidContent(quickPasteContent)) {
      setAlertModal({show: true, title: 'Invalid Content', message: 'Please enter meaningful content. The text appears to be too short or contains gibberish.', type: 'error'});
      setShowDueDateReminder(false);
      return;
    }
    
    const title = quickPasteContent.split('\n')[0].substring(0, 50) || `Note ${new Date().toLocaleDateString()}`;
    // Use custom due date if set, otherwise default to 7 days from now
    let dueDate;
    if (quickCaptureDueDate) {
      dueDate = quickCaptureDueDate;
    } else {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      dueDate = defaultDueDate.toISOString().split('T')[0];
    }
    
    const tempEntry: ChatEntry = { 
      id: generateUUID(), 
      title, 
      content: quickPasteContent, 
      timestamp: Date.now(),
      dueDate: dueDate,
      priority: 'medium',
      steps: []
    };
    
    try {
        setChatEntries(prev => [tempEntry, ...prev]);
        setQuickPasteContent('');
        setQuickCaptureDueDate('');
        setShowDueDateReminder(false);
        
        // Save to backend first
        const savedEntry = await api.createEntry(currentUser.username, tempEntry);
        setChatEntries(prev => prev.map(e => e.id === tempEntry.id ? savedEntry : e));
        
        // Show processing notification
        setAlertModal({show: true, title: 'AI Processing', message: 'Expanding your goal and generating action steps...', type: 'info'});
        
        // Process with AI to enhance and generate steps
        await enhanceGoalWithMultipleModels(savedEntry);
        
    } catch (err) { 
        setAlertModal({show: true, title: 'Sync Error', message: 'Cloud sync issue. Check connection.', type: 'error'}); 
    }
  };
  
  const handleCreateNote = async () => {
    // Validation checks with error messages
    if (!newNoteContent.trim()) {
      setAlertModal({show: true, title: 'Missing Content', message: 'Please enter a description for your goal.', type: 'error'});
      return;
    }
    
    if (!newNoteDueDate) {
      setAlertModal({show: true, title: 'Missing Due Date', message: 'Please set a due date for your goal.', type: 'error'});
      return;
    }
    
    // Validate content is meaningful
    if (!isValidContent(newNoteContent)) {
      setAlertModal({show: true, title: 'Invalid Content', message: 'Please enter meaningful content. The text appears to be too short or contains gibberish.', type: 'error'});
      return;
    }
    
    const title = newNoteTitle.trim() || newNoteContent.split('\n')[0].substring(0, 50) || `Note ${new Date().toLocaleDateString()}`;
    const tempEntry: ChatEntry = { 
      id: generateUUID(), 
      title, 
      content: newNoteContent, 
      timestamp: Date.now(),
      dueDate: newNoteDueDate,
      priority: newNotePriority
    };
    try {
        setChatEntries(prev => [tempEntry, ...prev]);
        setNewNoteTitle('');
        setNewNoteContent('');
        setNewNoteDueDate('');
        setNewNotePriority('medium');
        setIsCreateNoteModalOpen(false);
        const savedEntry = await api.createEntry(currentUser.username, tempEntry);
        setChatEntries(prev => prev.map(e => e.id === tempEntry.id ? savedEntry : e));
        processNoteWithAI(savedEntry);
    } catch (err) { setAlertModal({show: true, title: 'Sync Error', message: 'Cloud sync issue. Check connection.', type: 'error'}); }
  };

  const handleUpdateEntry = async () => {
      // Validation checks with error messages
      if (!selectedEntry) {
          setAlertModal({show: true, title: 'Error', message: 'No note selected. Please try again.', type: 'error'});
          return;
      }
      
      if (!editedTitle.trim()) {
          setAlertModal({show: true, title: 'Missing Title', message: 'Please enter a title for your goal.', type: 'error'});
          return;
      }
      
      if (!editedContent.trim()) {
          setAlertModal({show: true, title: 'Missing Content', message: 'Please enter a description for your goal.', type: 'error'});
          return;
      }
      
      if (!editedDueDate) {
          setAlertModal({show: true, title: 'Missing Due Date', message: 'Please set a due date for your goal.', type: 'error'});
          return;
      }
      
      const updatedEntry = { 
        ...selectedEntry, 
        title: editedTitle,
        content: editedContent,
        dueDate: editedDueDate,
        priority: editedPriority,
        steps: editedSteps
      };
      try {
          setChatEntries(prev => prev.map(e => e.id === selectedEntry.id ? updatedEntry : e));
          setSelectedEntry(updatedEntry);
          setIsEditing(false);
          await api.updateEntry(currentUser.username, updatedEntry);
          setAlertModal({show: true, title: 'Success', message: 'Your changes have been saved.', type: 'success'});
      } catch (err) { 
          setAlertModal({show: true, title: 'Update Failed', message: 'Failed to update note. Please try again.', type: 'error'}); 
          // Revert UI to previously saved state
          setIsEditing(true);
      }
  };
  
  const handleAIEdit = async () => {
      if (!aiEditPrompt.trim() || !selectedEntry) return;
      setIsAIEditing(true);
      try {
          const newText = await api.generateAICompletion(selectedEntry.content, `Edit: "${aiEditPrompt}". Return content only.`);
          if (newText) { setEditedContent(newText); setIsEditing(true); setShowAiEditInput(false); setAiEditPrompt(''); }
      } catch (e) { setAlertModal({show: true, title: 'AI Edit Failed', message: 'Failed to process AI edit. Please try again.', type: 'error'}); } finally { setIsAIEditing(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickSave(); }
  };

  const handleDeleteEntry = async (entry: ChatEntry) => {
      setEntryToDelete(entry);
      setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
      if (!entryToDelete) return;
      try {
          setChatEntries(chatEntries.filter(e => e.id !== entryToDelete.id));
          if (selectedEntry?.id === entryToDelete.id) { setCurrentView('LIBRARY'); setSelectedEntry(null); }
          await api.deleteEntry(currentUser.username, entryToDelete);
          setShowDeleteConfirm(false);
          setEntryToDelete(null);
      } catch (err) { 
          setAlertModal({show: true, title: 'Delete Failed', message: 'Failed to delete note. Please try again.', type: 'error'}); 
          setShowDeleteConfirm(false);
      }
  };

  const handleMarkDone = async () => {
    if (!selectedEntry) return;
    setShowDoneConfirm(true);
  };

  const confirmMarkDone = async () => {
    if (!selectedEntry) return;
    try {
      // Mark all steps as completed
      const completedSteps = selectedEntry.steps?.map(step => ({...step, completed: true})) || [];
      const updatedEntry = {
        ...selectedEntry,
        steps: completedSteps
      };
      setChatEntries(prev => prev.map(e => e.id === selectedEntry.id ? updatedEntry : e));
      setSelectedEntry(updatedEntry);
      setEditedSteps(completedSteps);
      await api.updateEntry(currentUser.username, updatedEntry);
      setShowDoneConfirm(false);
      setAlertModal({show: true, title: 'Congratulations!', message: '🎉 Goal marked as complete! All steps have been checked off.', type: 'success'});
    } catch (err) {
      setAlertModal({show: true, title: 'Update Failed', message: 'Failed to mark as done. Please try again.', type: 'error'});
      setShowDoneConfirm(false);
    }
  };

  const handleRefineMessage = async () => {
    if (!refineInput.trim() || !selectedEntry) return;
    
    const userMessage = refineInput;
    setRefineMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setRefineInput('');
    setIsRefining(true);
    
    try {
      const conversationHistory = refineMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`
      ).join('\n');

      const prompt = `
You are helping someone accomplish their goal: "${selectedEntry.title}"

Goal details: ${selectedEntry.content}

Conversation so far:
${conversationHistory}
User: ${userMessage}

Provide a helpful, concise response that helps clarify the goal and suggests actionable steps. Be conversational but focused.
`;

      let aiResponse = '';
      
      await modelOrchestrator.streamBestResponse(
        prompt,
        (chunk) => {
          aiResponse += chunk;
          setRefineMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'ai' && lastMsg.text === '') {
              updated[updated.length - 1] = { role: 'ai', text: aiResponse };
            } else {
              updated.push({ role: 'ai', text: aiResponse });
            }
            return updated;
          });
        },
        { goal: selectedEntry.title, taskType: 'refine' }
      );

    } catch (error) {
      console.error('Refine conversation failed:', error);
      setRefineMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsRefining(false);
    }
  };
  
  const handleApplyRefinements = () => {
      if (!selectedEntry) return;
      
      // Analyze conversation to extract structured information
      const allMessages = refineMessages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      
      // Extract user's inputs for the note fields
      const userInputs = refineMessages.filter(m => m.role === 'user').map(m => m.text).join(' ');
      
      // Try to intelligently update fields based on conversation
      // For now, compile all user responses as additional details
      const additionalInfo = refineMessages
          .filter(m => m.role === 'user')
          .map(m => m.text)
          .join('\n\n');
      
      if (additionalInfo) {
          // Append to content with clear separator
          const refinedContent = selectedEntry.content + '\n\n---\n\n**Additional Details from AI Conversation:**\n' + additionalInfo;
          setEditedContent(refinedContent);
          setIsEditing(true);
          setShowRefineModal(false);
          setRefineMessages([]);
      }
  };

  const handleDictation = () => {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) {
          setAlertModal({show: true, title: 'Not Supported', message: 'Speech recognition is not supported in your browser.', type: 'error'});
          return;
      }
      const recognition = new SpeechRec();
      recognition.onstart = () => setIsDictating(true);
      recognition.onend = () => setIsDictating(false);
      recognition.onresult = (e: any) => setQuickPasteContent(p => p + (p ? ' ' : '') + e.results[0][0].transcript);
      recognition.start();
  };

  const handleSelectEntry = (entry: ChatEntry) => {
    setSelectedEntry(entry);
    setEditedTitle(entry.title);
    setEditedContent(entry.content);
    setEditedDueDate(entry.dueDate || '');
    setEditedPriority(entry.priority || 'medium');
    setEditedSteps(entry.steps || []);
    setIsEditing(false);
    setCurrentView('ARTICLE');
  };
  
  const handleNav = (view: ViewState) => {
      if (currentView === 'HOME' && quickPasteContent.trim()) {
          // Show modal to confirm save before navigation
          setShowDueDateReminder(true);
          return; // Don't navigate yet
      }
      setCurrentView(view);
      setShowNotifications(false);
      setIsVoiceActive(false); 
      setIsEditing(false);
  };

  const renderNavbar = () => {
    return (
      <div className="pill-navbar-container">
        <nav className="pill-navbar">
          <button className={`nav-pill-item ${currentView === 'HOME' ? 'active' : ''}`} onClick={() => handleNav('HOME')}>
            <Icon name="home" /> Home
          </button>
          <button className={`nav-pill-item ${currentView === 'LIBRARY' ? 'active' : ''}`} onClick={() => handleNav('LIBRARY')}>
            <Icon name="library" /> Library
          </button>
          <div style={{width: 1, height: '20px', background: 'var(--border)', margin: '0 3px'}}></div>
          <button className="nav-pill-item nav-icon-only" onClick={() => setIsCreateNoteModalOpen(true)} style={{background: 'var(--accent-color)', color: '#fff'}} title="Create detailed note">
             <Icon name="add" />
          </button>
          <button className={`nav-pill-item nav-icon-only ${currentView === 'PROFILE' ? 'active' : ''}`} onClick={() => handleNav('PROFILE')} title="Profile">
             <div className="user-avatar-pill"><Icon name="person" style={{fontSize: '18px'}}/></div>
          </button>
        </nav>
      </div>
    );
  };

  const renderHome = () => {
    const sorted = [...chatEntries].sort((a, b) => b.timestamp - a.timestamp);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    return (
      <div className="page-container quick-paste-wrapper">
        {/* Welcome Header */}
        <div className="welcome-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: 'var(--space-6)',
          padding: '20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div className="avatar" style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: 'var(--accent-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }}>
            <Icon name="person" style={{ fontSize: '28px' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="text-title" style={{ margin: 0, marginBottom: '4px', fontSize: '1.25rem' }}>
              {greeting}, {currentUser.username}!
            </h2>
            <p className="text-caption" style={{ margin: 0, opacity: 0.7 }}>
              What's on your mind today?
            </p>
          </div>
        </div>

        <div style={{marginBottom: 'var(--space-3)', textAlign: 'left'}}>
          <h2 className="text-title" style={{color: 'var(--accent-color)', marginBottom: '6px', fontSize: '1.05rem'}}>Quick Capture</h2>
          <p className="text-caption" style={{opacity: 0.8, fontSize: '0.85rem'}}>Quickly jot down your goal and set a target date.</p>
        </div>
        
        <div className="quick-capture-wrapper" style={{width: '100%', marginBottom: '2rem'}}>
            <textarea 
                className="quick-paste-area quick-capture-textarea" 
                placeholder="What's your goal? Type it here..." 
                value={quickPasteContent} 
                onChange={(e) => setQuickPasteContent(e.target.value)} 
                onKeyDown={handleKeyDown} 
                style={{ minHeight: '120px', padding: '16px', width: '100%', marginBottom: '12px' }}
            />
            
            {/* Due Date Button */}
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                <button 
                    onClick={() => {
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.min = new Date().toISOString().split('T')[0];
                        if (quickCaptureDueDate) dateInput.value = quickCaptureDueDate;
                        dateInput.style.position = 'absolute';
                        dateInput.style.opacity = '0';
                        document.body.appendChild(dateInput);
                        dateInput.onchange = () => {
                            if (dateInput.value) {
                                setQuickCaptureDueDate(dateInput.value);
                            }
                            document.body.removeChild(dateInput);
                        };
                        dateInput.showPicker();
                    }}
                    className="btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        background: quickCaptureDueDate ? 'var(--accent-color)' : 'var(--bg-surface)',
                        color: quickCaptureDueDate ? '#fff' : 'var(--text-primary)',
                        border: quickCaptureDueDate ? 'none' : '1px solid var(--border)',
                    }}
                >
                    <Icon name="event" style={{fontSize: '16px'}} />
                    {quickCaptureDueDate 
                        ? new Date(quickCaptureDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Set Target Date'
                    }
                </button>
                {quickCaptureDueDate && (
                    <button 
                        onClick={() => setQuickCaptureDueDate('')}
                        className="btn-icon"
                        style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                        }}
                        title="Clear date"
                    >
                        <Icon name="x" style={{fontSize: '14px'}} />
                    </button>
                )}
            </div>
            
            <div className="quick-capture-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isEnhancing && <span className="text-caption" style={{ color: 'var(--accent-color)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Enhancing...</span>}
                <button 
                    onClick={handleEnhanceWithAI} 
                    className="btn-icon" 
                    style={{ background: isEnhancing ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--bg-surface)', border: '1px solid var(--border)', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--accent-color)', flexShrink: 0 }}
                    disabled={!quickPasteContent.trim() || isEnhancing}
                    title="Enhance with AI"
                >
                    <Icon name={isEnhancing ? "autorenew" : "analytics"} className={isEnhancing ? "spin" : ""} style={{ fontSize: '18px' }} />
                </button>
                <button onClick={handleSummarize} className="btn-icon" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--text-secondary)', flexShrink: 0 }} disabled={!quickPasteContent.trim() || isSummarizing} title="Summarize">
                    <Icon name={isSummarizing ? "autorenew" : "copy"} style={{ fontSize: '18px' }} />
                </button>
                <button onClick={handleQuickSave} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem', whiteSpace: 'nowrap', marginLeft: 'auto' }} disabled={!quickPasteContent.trim()}>
                    Quick Save
                </button>
            </div>
        </div>

        <div style={{ width: '100%' }}>
            <h2 className="text-title" style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Recent Notes</h2>
            {sorted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                    <Icon name="bookOpen" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                    <p>No notes yet. Start typing above to create one.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sorted.slice(0, 5).map(entry => (
                        <ChatCard 
                            key={entry.id} 
                            entry={entry} 
                            onSelect={handleSelectEntry}
                            onDelete={(id) => handleDeleteEntry(entry)}
                        />
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
      if (sortOrder === 'dueDate') {
        // Items with no due date go to the end
        if (!a.dueDate && !b.dueDate) return b.timestamp - a.timestamp;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortOrder === 'dueDateDesc') {
        if (!a.dueDate && !b.dueDate) return b.timestamp - a.timestamp;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      return a.title.localeCompare(b.title);
    });
    return (
    <div className="page-container">
      <div className="library-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)'}}>
        <h1 className="text-headline library-title" style={{fontSize: '1.75rem', margin: 0}}>Library</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             {isLoading && <Icon name="autorenew" className="animate-spin"/>}
             <SortDropdown sortOrder={sortOrder} onSortChange={setSortOrder} />
        </div>
      </div>
      <div className="card-grid">
        {sorted.map(entry => (
          <ChatCard 
            key={entry.id} 
            entry={entry} 
            onSelect={handleSelectEntry}
            onDelete={(id) => handleDeleteEntry(entry)}
          />
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
          setAlertModal({show: true, title: 'Import Successful', message: 'Your notes have been imported successfully!', type: 'success'});
      } catch (err: any) {
          setAlertModal({show: true, title: 'Import Failed', message: err.message || 'Failed to import notes.', type: 'error'});
      }
      // Reset input
      e.target.value = '';
  };

  const renderProfile = () => (
    <div className="page-container" style={{alignItems: 'center', justifyContent: 'center'}}>
        <div className="card profile-card" style={{width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center'}}>
            <div className="avatar-large" style={{ width: '80px', height: '80px', background: 'var(--accent-color)', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
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

            <button className="nav-pill-item" style={{width: '100%', justifyContent: 'center', color: '#EF4444'}} onClick={() => setShowLogoutConfirm(true)}>
                <Icon name="logout" /> Logout
            </button>
        </div>
    </div>
  );

  const renderArticle = () => {
    if (!selectedEntry) return null;

    if (isEditing) {
      return (
        <EditPage
          title={editedTitle}
          content={editedContent}
          dueDate={editedDueDate}
          priority={editedPriority}
          steps={editedSteps}
          onTitleChange={setEditedTitle}
          onContentChange={setEditedContent}
          onDueDateChange={setEditedDueDate}
          onPriorityChange={setEditedPriority}
          onStepsChange={setEditedSteps}
          onSave={handleUpdateEntry}
          onBack={() => setIsEditing(false)}
          onEnhance={handleEnhanceEditNote}
          onAddStep={() => setShowStepsModal(true)}
          isEnhancing={isEnhancingEdit}
        />
      );
    }

    // View mode
    return (
      <div className="page-container" style={{paddingBottom: '100px'}}>
        <div className="article-nav" style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>
             <button className="article-nav-back" onClick={() => handleNav('LIBRARY')} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', fontFamily: 'Syne, system-ui, sans-serif'}}>
               <Icon name="arrowBack" /> Back
             </button>
             <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{whiteSpace: 'nowrap'}}>
               <Icon name="settings" /> Edit
             </button>
        </div>
        <article className="card edit-card" style={{padding: '40px'}}>
           <div>
             {/* Image Placeholder */}
             <div className="article-image-placeholder" style={{
               width: '100%',
               height: '200px',
               background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.1) 0%, rgba(var(--accent-rgb), 0.05) 100%)',
               borderRadius: 'var(--radius-lg)',
               marginBottom: '24px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               border: '1px solid var(--border)',
               position: 'relative',
               overflow: 'hidden'
             }}>
               <Icon name="image" style={{ fontSize: '48px', color: 'var(--text-secondary)', opacity: 0.3 }} />
             </div>
             
             <h1 className="text-headline" style={{color: 'var(--accent-color)'}}>{selectedEntry.title}</h1>
             <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap'}}>
               <p className="text-caption">{new Date(selectedEntry.timestamp).toLocaleString()}</p>
               {selectedEntry.priority && (
                 <span className={`meta-tag ${selectedEntry.priority === 'high' ? 's-blocked' : selectedEntry.priority === 'low' ? 's-review' : 's-active'}`} style={{
                   display: 'inline-flex',
                   alignItems: 'center',
                   gap: '4px',
                   fontSize: '0.6875rem',
                   fontWeight: 500,
                   borderRadius: '6px',
                   padding: '4px 8px',
                   fontFamily: 'Geist Mono, monospace'
                 }}>
                   <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></span>
                   {selectedEntry.priority.charAt(0).toUpperCase() + selectedEntry.priority.slice(1)}
                 </span>
               )}
             </div>
             
             {/* Progress Bar */}
             {selectedEntry.dueDate && (() => {
               const now = new Date().getTime();
               const created = new Date(selectedEntry.timestamp).getTime();
               const due = new Date(selectedEntry.dueDate).getTime();
               const total = due - created;
               const elapsed = now - created;
               const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
               const isOverdue = now > due;
               const progressColor = progress < 50 ? '#10b981' : progress < 75 ? '#f59e0b' : progress < 100 ? '#f97316' : '#ef4444';
               
               return (
                 <div style={{
                   padding: '16px',
                   background: 'var(--bg-surface)',
                   borderRadius: 'var(--radius-md)',
                   border: '1px solid var(--border)',
                   marginBottom: '24px'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                     <span style={{ fontSize: '0.75rem', fontFamily: 'Geist Mono, monospace', color: isOverdue ? '#ff7043' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Icon name="history" style={{ fontSize: '14px' }} />
                       {isOverdue ? 'Overdue' : `Due ${new Date(selectedEntry.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                     </span>
                     <span style={{ fontSize: '0.875rem', fontFamily: 'Geist Mono, monospace', color: progressColor, fontWeight: 600 }}>
                       {Math.round(progress)}%
                     </span>
                   </div>
                   <div style={{ 
                     width: '100%', 
                     height: '8px', 
                     background: 'var(--bg-app)', 
                     borderRadius: '4px',
                     overflow: 'hidden'
                   }}>
                     <div style={{ 
                       width: `${progress}%`, 
                       height: '100%', 
                       background: progressColor,
                       transition: 'width 0.3s ease',
                       borderRadius: '4px'
                     }} />
                   </div>
                 </div>
               );
             })()}

             <div className="markdown-content">
               <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypePrism]} components={{ pre: CodeBlock }}>{selectedEntry.content}</ReactMarkdown>
             </div>
             
             {/* Action Steps Display */}
             {selectedEntry.steps && selectedEntry.steps.length > 0 && (
               <div style={{
                 marginTop: '30px',
                 padding: '20px',
                 background: 'var(--bg-surface)',
                 borderRadius: 'var(--radius-lg)',
                 border: '1px solid var(--border)'
               }}>
                 <h3 className="text-title" style={{
                   fontSize: '1rem',
                   marginBottom: '16px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px'
                 }}>
                   <Icon name="list" style={{fontSize: '18px', color: 'var(--accent-color)'}} />
                   Action Steps
                   <span className="text-caption" style={{
                     marginLeft: 'auto',
                     opacity: 0.7,
                     fontSize: '0.8rem'
                   }}>
                     {selectedEntry.steps.filter(s => s.completed).length} / {selectedEntry.steps.length} completed
                   </span>
                 </h3>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                   {selectedEntry.steps.map((step, idx) => (
                     <div 
                       key={idx} 
                       onClick={async () => {
                         // Toggle step completion
                         const updatedSteps = [...selectedEntry.steps];
                         updatedSteps[idx].completed = !updatedSteps[idx].completed;
                         const updated = {...selectedEntry, steps: updatedSteps};
                         setChatEntries(prev => prev.map(e => e.id === selectedEntry.id ? updated : e));
                         setSelectedEntry(updated);
                         setEditedSteps(updatedSteps);
                         await api.updateEntry(currentUser.username, updated);
                       }}
                       style={{
                         display: 'flex',
                         alignItems: 'flex-start',
                         gap: '12px',
                         padding: '12px',
                         background: step.completed ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg-app)',
                         borderRadius: 'var(--radius-md)',
                         border: '1px solid var(--border)',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease',
                         opacity: 0.9
                       }}
                       onMouseEnter={(e) => {
                         (e.currentTarget as HTMLElement).style.background = step.completed ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--bg-surface)';
                         (e.currentTarget as HTMLElement).style.opacity = '1';
                       }}
                       onMouseLeave={(e) => {
                         (e.currentTarget as HTMLElement).style.background = step.completed ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg-app)';
                         (e.currentTarget as HTMLElement).style.opacity = '0.9';
                       }}
                     >
                       <Icon 
                         name={step.completed ? "checkCircle" : "radioButtonUnchecked"} 
                         style={{
                           fontSize: '20px',
                           color: step.completed ? 'var(--accent-color)' : 'var(--text-secondary)',
                           marginTop: '2px',
                           flexShrink: 0,
                           transition: 'color 0.2s ease'
                         }}
                       />
                       <span style={{
                         flex: 1,
                         textDecoration: step.completed ? 'line-through' : 'none',
                         opacity: step.completed ? 0.7 : 1,
                         fontSize: '0.95rem',
                         lineHeight: 1.5,
                         transition: 'all 0.2s ease'
                       }}>
                         {step.text}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
             
             {/* Action Buttons & Mark as Done Button */}
             <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
               <button 
                 onClick={() => setShowElaborateModal(true)}
                 className="btn btn-primary"
                 style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}
               >
                 <Icon name="lightbulb" /> Elaborate Goal
               </button>
               {selectedEntry.steps && selectedEntry.steps.length > 0 && selectedEntry.steps.some(s => !s.completed) && (
                 <button 
                   onClick={handleMarkDone}
                   className="btn"
                   style={{
                     display: 'inline-flex', 
                     alignItems: 'center', 
                     gap: '8px',
                     background: 'rgba(16, 185, 129, 0.1)',
                     color: '#10b981',
                     border: '1px solid #10b981',
                     marginLeft: 'auto'
                   }}
                 >
                   <Icon name="check" /> Mark as Done
                 </button>
               )}
             </div>
           </div>
        </article>
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
        
        {showNotifications && (
            <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', maxHeight: '80vh'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">AI Suggestions</h2>
                        <button onClick={() => setShowNotifications(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                        {notifications.length === 0 ? (
                            <p className="text-body" style={{textAlign: 'center', padding: '2rem', opacity: 0.6}}>No new suggestions.</p>
                        ) : (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                                {notifications.map(notif => (
                                    <div key={notif.id} className="card" style={{padding: '16px'}}>
                                        <p className="text-body">{notif.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {showAiEditInput && (
            <div className="modal-overlay" onClick={() => setShowAiEditInput(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">AI Magic Edit</h2>
                        <button onClick={() => setShowAiEditInput(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <p className="text-body" style={{marginBottom: '1rem', opacity: 0.8}}>Tell AI how to transform your content:</p>
                        <input 
                            type="text" 
                            placeholder="e.g. 'Fix grammar', 'Make it shorter', 'Add more details'" 
                            className="form-input" 
                            value={aiEditPrompt} 
                            onChange={(e) => setAiEditPrompt(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && !isAIEditing && aiEditPrompt.trim() && handleAIEdit()}
                        />
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowAiEditInput(false)} className="btn">Cancel</button>
                        <button onClick={handleAIEdit} disabled={isAIEditing || !aiEditPrompt.trim()} className="btn btn-primary">
                            {isAIEditing ? 'Processing...' : 'Apply AI Edit'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Create Note Modal */}
        {isCreateNoteModalOpen && (
            <div className="modal-overlay" onClick={() => setIsCreateNoteModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">Create Note</h2>
                        <button onClick={() => setIsCreateNoteModalOpen(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                            <div className="material-input-group" style={{marginBottom: 0}}>
                                <label className="form-label">Title</label>
                                <input 
                                    type="text"
                                    className="form-input" 
                                    placeholder="Enter note title..." 
                                    value={newNoteTitle} 
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                />
                            </div>
                            
                            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                                <div className="material-input-group" style={{marginBottom: 0, flex: '1 1 200px'}}>
                                    <label className="form-label">Due Date *</label>
                                    <input 
                                        type="date"
                                        className="form-input" 
                                        value={newNoteDueDate} 
                                        onChange={(e) => setNewNoteDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className="material-input-group" style={{marginBottom: 0, flex: '1 1 150px'}}>
                                    <label className="form-label">Priority</label>
                                    <select 
                                        className="form-input" 
                                        value={newNotePriority} 
                                        onChange={(e) => setNewNotePriority(e.target.value as 'low' | 'medium' | 'high')}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="material-input-group" style={{marginBottom: 0, position: 'relative'}}>
                                <label className="form-label">Content</label>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Enter your note content..." 
                                    value={newNoteContent} 
                                    onChange={(e) => setNewNoteContent(e.target.value)} 
                                    style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'inherit', paddingBottom: '50px' }}
                                />
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isEnhancingModal && <span className="text-caption" style={{ color: 'var(--accent-color)', fontSize: '0.8rem' }}>Enhancing...</span>}
                                    <button 
                                        onClick={handleEnhanceModalNote}
                                        className="btn-icon"
                                        disabled={!newNoteContent.trim() || isEnhancingModal}
                                        style={{
                                            background: isEnhancingModal ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--bg-surface)',
                                            border: '1px solid var(--border)',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            color: 'var(--accent-color)'
                                        }}
                                        title="Enhance with AI"
                                    >
                                        <Icon name={isEnhancingModal ? "autorenew" : "analytics"} className={isEnhancingModal ? "spin" : ""} style={{ fontSize: '16px' }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setIsCreateNoteModalOpen(false)} className="btn">Cancel</button>
                        <button onClick={handleCreateNote} disabled={!newNoteContent.trim() || !newNoteDueDate} className="btn btn-primary">
                            <Icon name="check" /> Save Note
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentAccentColorName={accentColor} onAccentColorChange={(c) => setAccentColor(c.name)} theme={theme} onThemeChange={setTheme} />
        <Modal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="Summary" originalContent={quickPasteContent} summarizedContent={summaryContent} isSummarizing={isSummarizing} onApplySummary={handleApplySummary} onCancelSummary={() => setIsSummaryModalOpen(false)}><p>Loading...</p></Modal>
        
        {/* Due Date Reminder Modal */}
        {showDueDateReminder && (() => {
            const displayDate = quickCaptureDueDate 
                ? new Date(quickCaptureDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : (() => {
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + 7);
                    return defaultDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })();
            
            return (
            <div className="modal-overlay" onClick={() => setShowDueDateReminder(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">Quick Save</h2>
                        <button onClick={() => setShowDueDateReminder(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <div style={{textAlign: 'center', padding: '1rem 0'}}>
                            <Icon name="event" style={{fontSize: '48px', color: 'var(--accent-color)', marginBottom: '12px'}} />
                            <p className="text-body" style={{marginBottom: '8px', fontSize: '1rem'}}>Your goal will be saved with:</p>
                            <p className="text-caption" style={{opacity: 0.8, fontWeight: 600}}>Due date: {displayDate}</p>
                            <p className="text-caption" style={{opacity: 0.8}}>Priority: Medium</p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowDueDateReminder(false)} className="btn">Cancel</button>
                        <button onClick={confirmQuickSave} className="btn btn-primary">Save Goal</button>
                    </div>
                </div>
            </div>
            );
        })()}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && entryToDelete && (
            <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">Delete Note</h2>
                        <button onClick={() => setShowDeleteConfirm(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <div style={{textAlign: 'center', padding: '1rem 0'}}>
                            <Icon name="delete" style={{fontSize: '48px', color: '#EF4444', marginBottom: '12px'}} />
                            <p className="text-body" style={{marginBottom: '8px', fontSize: '1rem'}}>Are you sure you want to delete this note?</p>
                            <p className="text-caption" style={{opacity: 0.8, fontWeight: 600, marginBottom: '4px'}}>{entryToDelete.title}</p>
                            <p className="text-caption" style={{opacity: 0.6}}>This action cannot be undone.</p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowDeleteConfirm(false)} className="btn">Cancel</button>
                        <button onClick={confirmDelete} className="btn" style={{background: '#EF4444', color: '#fff'}}>Delete</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* AI Refine Conversation Modal */}
        {showRefineModal && selectedEntry && (
            <div className="modal-overlay" onClick={() => setShowRefineModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px', maxHeight: '80vh'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">Refine: {selectedEntry.title}</h2>
                        <button onClick={() => setShowRefineModal(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body" style={{maxHeight: '50vh', overflowY: 'auto', padding: '20px'}}>
                        {/* Conversation Thread */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                            {refineMessages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div 
                                        style={{
                                            maxWidth: '80%',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: msg.role === 'user' 
                                                ? 'var(--accent-color)' 
                                                : 'var(--bg-surface)',
                                            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                            border: msg.role === 'ai' ? '1px solid var(--border)' : 'none'
                                        }}
                                    >
                                        <p className="text-body" style={{margin: 0, fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>
                                            {msg.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isRefining && (
                                <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <p className="text-body" style={{margin: 0, color: 'var(--accent-color)'}}>
                                            <Icon name="autorenew" className="spin" style={{fontSize: '16px', verticalAlign: 'middle'}} /> Thinking...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer" style={{flexDirection: 'column', gap: '12px'}}>
                        {/* Input Area */}
                        <div style={{width: '100%', display: 'flex', gap: '8px', alignItems: 'center'}}>
                            <input 
                                type="text"
                                className="form-input"
                                placeholder="Type your answer..."
                                value={refineInput}
                                onChange={(e) => setRefineInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isRefining && refineInput.trim() && handleRefineMessage()}
                                style={{flex: 1, marginBottom: 0}}
                                autoFocus
                            />
                            <button 
                                onClick={() => {
                                    const dateInput = document.createElement('input');
                                    dateInput.type = 'date';
                                    dateInput.min = new Date().toISOString().split('T')[0];
                                    dateInput.style.position = 'absolute';
                                    dateInput.style.opacity = '0';
                                    document.body.appendChild(dateInput);
                                    dateInput.onchange = () => {
                                        if (dateInput.value) {
                                            setRefineInput(new Date(dateInput.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
                                        }
                                        document.body.removeChild(dateInput);
                                    };
                                    dateInput.showPicker();
                                }}
                                disabled={isRefining}
                                className="btn-icon"
                                title="Set Date"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%'
                                }}
                            >
                                <Icon name="event" style={{fontSize: '18px'}} />
                            </button>
                            <button 
                                onClick={handleRefineMessage}
                                disabled={isRefining || !refineInput.trim()}
                                className="btn-icon"
                                style={{
                                    background: 'var(--accent-color)',
                                    color: '#fff',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%'
                                }}
                            >
                                <Icon name="send" style={{fontSize: '18px'}} />
                            </button>
                        </div>
                        {/* Action Buttons */}
                        <div style={{width: '100%', display: 'flex', gap: '8px', justifyContent: 'space-between'}}>
                            <button onClick={() => {
                                setShowRefineModal(false);
                                setRefineMessages([]);
                            }} className="btn">Close</button>
                            <button 
                                onClick={handleApplyRefinements}
                                className="btn btn-primary"
                                disabled={refineMessages.filter(m => m.role === 'user').length === 0}
                                style={{display: 'flex', alignItems: 'center', gap: '6px'}}
                            >
                                <Icon name="check" /> Apply to Note
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Custom Alert Modal */}
        {alertModal.show && (
            <div className="modal-overlay" onClick={() => setAlertModal({...alertModal, show: false})}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">{alertModal.title}</h2>
                        <button onClick={() => setAlertModal({...alertModal, show: false})} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <div style={{textAlign: 'center', padding: '1rem 0'}}>
                            <Icon 
                                name={alertModal.type === 'error' ? 'warning' : alertModal.type === 'success' ? 'check' : 'cloudOff'} 
                                style={{
                                    fontSize: '48px', 
                                    color: alertModal.type === 'error' ? '#EF4444' : alertModal.type === 'success' ? '#10b981' : 'var(--accent-color)', 
                                    marginBottom: '12px'
                                }} 
                            />
                            <p className="text-body" style={{fontSize: '0.95rem', lineHeight: 1.5}}>{alertModal.message}</p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setAlertModal({...alertModal, show: false})} className="btn btn-primary" style={{width: '100%'}}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
            <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">Logout</h2>
                        <button onClick={() => setShowLogoutConfirm(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <div style={{textAlign: 'center', padding: '1rem 0'}}>
                            <Icon name="logout" style={{fontSize: '48px', color: 'var(--accent-color)', marginBottom: '12px'}} />
                            <p className="text-body" style={{fontSize: '1rem'}}>Are you sure you want to logout?</p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowLogoutConfirm(false)} className="btn">Cancel</button>
                        <button onClick={() => {
                            onLogout();
                            setShowLogoutConfirm(false);
                        }} className="btn btn-primary">Logout</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Add Step Modal */}
        {showStepsModal && (
            <div className="modal-overlay" onClick={() => setShowStepsModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
                    <div className="modal-header">
                        <h2 className="text-headline">Add Action Step</h2>
                        <button onClick={() => setShowStepsModal(false)} className="btn-icon"><Icon name="x" /></button>
                    </div>
                    <div className="modal-body">
                        <div className="material-input-group">
                            <label className="form-label">Step Description</label>
                            <textarea 
                                className="form-input"
                                placeholder="e.g., Research top 3 competitors in the market"
                                value={stepsInput}
                                onChange={(e) => setStepsInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && stepsInput.trim()) {
                                        e.preventDefault();
                                        setEditedSteps([...editedSteps, { text: stepsInput.trim(), completed: false }]);
                                        setStepsInput('');
                                    }
                                }}
                                rows={3}
                                autoFocus
                                style={{resize: 'vertical'}}
                            />
                            <p className="text-caption" style={{marginTop: '6px', opacity: 0.7, fontSize: '0.8rem'}}>
                                Press Enter to add, Shift+Enter for new line
                            </p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => {
                            setShowStepsModal(false);
                            setStepsInput('');
                        }} className="btn">Cancel</button>
                        <button 
                            onClick={() => {
                                if (stepsInput.trim()) {
                                    setEditedSteps([...editedSteps, { text: stepsInput.trim(), completed: false }]);
                                    setStepsInput('');
                                    setShowStepsModal(false);
                                }
                            }}
                            className="btn btn-primary"
                            disabled={!stepsInput.trim()}
                        >
                            <Icon name="add" /> Add Step
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('libary-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('libary-current-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('libary-current-user');
    }
  }, [currentUser]);

  const handleAuth = async (username: string, password: string, isSignup: boolean) => {
      try {
          const user = await api.auth(username, password, isSignup);
          setCurrentUser(user);
          return { success: true };
      } catch (e: any) { return { success: false, message: e.message }; }
  };
  
  const handleLogout = () => { 
    setCurrentUser(null);
    localStorage.removeItem('libary-current-user');
  };
  
  if (!currentUser) return <LandingPage onAuth={handleAuth} />;
  return <Dashboard key={currentUser.username} currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
