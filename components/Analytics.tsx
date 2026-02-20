import React, { useMemo } from 'react';
import { ChatEntry } from '../types';
import Icon from './Icon';

interface AnalyticsProps {
  entries: ChatEntry[];
}

const StatCard: React.FC<{label: string; value: string | number;}> = ({label, value}) => (
    <div className="stat-card">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
    </div>
);

const Analytics: React.FC<AnalyticsProps> = ({ entries }) => {
  const totalEntries = entries.length;

  const wordCount = useMemo(() => {
    return entries.reduce((acc, entry) => acc + entry.content.split(/\s+/).filter(Boolean).length, 0);
  }, [entries]);

  const avgWordCount = totalEntries > 0 ? Math.round(wordCount / totalEntries) : 0;
  
  const charCount = useMemo(() => {
    return entries.reduce((acc, entry) => acc + entry.content.length, 0);
  }, [entries]);
    
  const avgCharCount = totalEntries > 0 ? Math.round(charCount / totalEntries) : 0;
  
  const oldestEntryDate = useMemo(() => {
      if (entries.length < 1) return null;
      const sorted = [...entries].sort((a,b) => a.timestamp - b.timestamp);
      return new Date(sorted[0].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [entries]);

  if (totalEntries === 0) {
      return (
        <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: 'transparent', borderStyle: 'dashed' }}>
            <Icon name="analytics" style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', color: 'var(--accent-color)', opacity: 0.7 }} />
            <h2 className="text-headline" style={{marginBottom: 'var(--space-2)'}}>No Data to Analyze</h2>
            <p className="text-body" style={{maxWidth: '400px', opacity: 0.7}}>Add some entries to your library to see analytics here.</p>
        </div>
      );
  }

  return (
    <div className="animate-fade-in-scale" style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-6)'}}>
       <div className="card">
        <div className="card-header">
            <h2 className="text-title">Overview</h2>
        </div>
        <div className="card-body">
            <div className="stats-grid">
                <StatCard label="Total Entries" value={totalEntries} />
                <StatCard label="Total Words" value={wordCount.toLocaleString()} />
                <StatCard label="Avg. Words" value={avgWordCount.toLocaleString()} />
                {oldestEntryDate && <StatCard label="Oldest Entry" value={oldestEntryDate} />}
            </div>
        </div>
      </div>

      <div className="card">
          <div className="card-header"><h2 className="text-title">Traffic Sources</h2></div>
          <div className="card-body">
            <div className="chart-placeholder">
              <span>Traffic Chart Visualization</span>
            </div>
          </div>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="text-title">Recent Activity</h2></div>
        <div className="card-body" style={{padding: '0 var(--space-4)'}}>
            <ul className="activity-list">
                <li className="activity-item">
                    <div className="activity-icon">
                        <Icon name="trending_up" />
                    </div>
                    <div className="activity-content">
                        <div className="activity-title">Library growth detected</div>
                        <div className="activity-meta">New entries increasing • 2 hours ago</div>
                    </div>
                </li>
                <li className="activity-item">
                    <div className="activity-icon">
                        <Icon name="add" />
                    </div>
                    <div className="activity-content">
                        <div className="activity-title">New long-form content</div>
                        <div className="activity-meta">+12% words from yesterday • 5 hours ago</div>
                    </div>
                </li>
                <li className="activity-item">
                    <div className="activity-icon">
                        <Icon name="warning" />
                    </div>
                    <div className="activity-content">
                        <div className="activity-title">Duplicate content alert</div>
                        <div className="activity-meta">A similar entry was found • Yesterday</div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
    </div>
  );
};

export default Analytics;