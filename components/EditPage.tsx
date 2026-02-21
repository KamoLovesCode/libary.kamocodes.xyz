import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface EditPageProps {
  title: string;
  content: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  steps: Array<{ text: string; completed: boolean }>;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onDueDateChange: (date: string) => void;
  onPriorityChange: (priority: 'low' | 'medium' | 'high') => void;
  onStepsChange: (steps: Array<{ text: string; completed: boolean }>) => void;
  onSave: () => Promise<void>;
  onBack: () => void;
  onEnhance: () => Promise<void>;
  onAddStep: () => void;
  isLoading?: boolean;
  isEnhancing?: boolean;
}

const EditPage: React.FC<EditPageProps> = ({
  title,
  content,
  dueDate,
  priority,
  steps,
  onTitleChange,
  onContentChange,
  onDueDateChange,
  onPriorityChange,
  onStepsChange,
  onSave,
  onBack,
  onEnhance,
  onAddStep,
  isLoading = false,
  isEnhancing = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(content.length);

  // Calculate steps progress
  const stepsProgress = useMemo(() => {
    if (steps.length === 0) return null;
    const completed = steps.filter(s => s.completed).length;
    const total = steps.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  }, [steps]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onContentChange(newContent);
    setCharCount(newContent.length);
  };

  const toggleStep = (idx: number) => {
    const updated = [...steps];
    updated[idx].completed = !updated[idx].completed;
    onStepsChange(updated);
  };

  const deleteStep = (idx: number) => {
    onStepsChange(steps.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '680px', margin: '0 auto', padding: '20px 16px 100px' }}>
      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s',
            fontFamily: 'Syne, system-ui, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
        >
          <Icon name="arrowBack" style={{ fontSize: '18px' }} /> Back
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '9px 16px',
            fontFamily: 'Syne, system-ui, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            opacity: isSaving ? 0.7 : 1,
            boxShadow: `0 0 16px rgba(var(--accent-rgb), 0.3)`,
            whiteSpace: 'nowrap',
          }}
        >
          <Icon name={isSaving ? 'autorenew' : 'check'} style={{ fontSize: '16px' }} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Main Card */}
      <article style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gradient border top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.4), transparent)',
        }} />

        {/* Section: Title + Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
          <div>
            <label style={{
              fontFamily: 'Syne, system-ui, sans-serif',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '8px',
            }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Note title…"
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent-color)';
                (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.1)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Row: Due Date + Priority */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{
                fontFamily: 'Syne, system-ui, sans-serif',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '8px',
              }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent-color)';
                  (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.1)';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{
                fontFamily: 'Syne, system-ui, sans-serif',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '8px',
              }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value as 'low' | 'medium' | 'high')}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23aaaaaa'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor = 'var(--accent-color)';
                  (e.currentTarget as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.1)';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLSelectElement).style.boxShadow = 'none';
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'var(--border)',
          margin: '8px 0 22px',
        }} />

        {/* Section: Action Steps */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <label style={{
              fontFamily: 'Syne, system-ui, sans-serif',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 0,
            }}>
              Action Steps
            </label>
            <button
              onClick={onAddStep}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontFamily: 'Syne, system-ui, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-input)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              }}
            >
              <Icon name="add" style={{ fontSize: '14px' }} /> Add Step
            </button>
          </div>

          {/* Progress Bar */}
          {stepsProgress && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'Syne, system-ui, sans-serif',
                  fontWeight: 600,
                }}>
                  {stepsProgress.completed} of {stepsProgress.total} complete
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'Syne, system-ui, sans-serif',
                  fontWeight: 600,
                }}>
                  {Math.round(stepsProgress.percentage)}%
                </span>
              </div>
              <div style={{
                height: '4px',
                background: 'var(--border)',
                borderRadius: '100px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: `linear-gradient(90deg, var(--accent-color), #10b981)`,
                  borderRadius: '100px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: `${stepsProgress.percentage}%`,
                }} />
              </div>
            </div>
          )}

          {/* Steps List */}
          {steps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: step.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                    border: `1.5px solid ${step.completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleStep(idx)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${step.completed ? '#10b981' : 'var(--border)'}`,
                      background: step.completed ? '#10b981' : 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      marginTop: '2px',
                    }}
                  >
                    {step.completed && (
                      <Icon name="check" style={{
                        fontSize: '12px',
                        color: '#fff',
                      }} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      lineHeight: 1.4,
                      textDecoration: step.completed ? 'line-through' : 'none',
                      opacity: step.completed ? 0.7 : 1,
                      wordBreak: 'break-word',
                    }}>
                      {step.text}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '5px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'Syne, system-ui, sans-serif',
                      }}>
                        Step {idx + 1}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'Syne, system-ui, sans-serif',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        textTransform: 'uppercase',
                        background: step.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(var(--accent-rgb), 0.1)',
                        color: step.completed ? '#10b981' : 'var(--accent-color)',
                      }}>
                        {step.completed ? 'Done' : 'To do'}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteStep(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248, 113, 113, 0.1)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'none';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Icon name="x" style={{ fontSize: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              lineHeight: 1.6,
            }}>
              No steps yet — click <strong>Add Step</strong> above,<br />
              or use the <strong>AI button</strong> below to generate them.
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'var(--border)',
          margin: '8px 0 22px',
        }} />

        {/* Section: Notes Textarea */}
        <div style={{ position: 'relative', marginTop: '4px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <label style={{
              fontFamily: 'Syne, system-ui, sans-serif',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Icon name="notes" style={{ fontSize: '14px' }} />
              Notes & Details
            </label>
            <span style={{
              fontFamily: 'Syne, system-ui, sans-serif',
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
            }}>
              {charCount} character{charCount === 1 ? '' : 's'}
            </span>
          </div>
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Add any extra context, links, thoughts, or details here…"
            style={{
              width: '100%',
              minHeight: '220px',
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              paddingBottom: '56px',
              fontSize: '0.88rem',
              lineHeight: 1.7,
              color: 'var(--text-main)',
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontWeight: 300,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--accent-color)';
              (e.currentTarget as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.1)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'none';
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <button
              onClick={onEnhance}
              disabled={isEnhancing}
              style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isEnhancing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isEnhancing ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isEnhancing) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--accent-rgb), 0.1)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-color)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              }}
              title="Enhance with AI"
            >
              <Icon name={isEnhancing ? 'autorenew' : 'autoAwesome'} style={{ fontSize: '18px' }} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default EditPage;
