import React, { useState, useEffect } from 'react';
import { rendererService } from '../../utils/renderer';
import { marked } from 'marked';

const HistoryView = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const all = await rendererService.getAllSessions();
      setSessions(all);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const formatDate = (ts) => new Date(ts).toLocaleString();

  if (selectedSession) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#e5e5e5' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setSelectedSession(null)}
            style={{ background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
          >
            ← Back
          </button>
          <span style={{ fontWeight: '600' }}>Session: {formatDate(selectedSession.timestamp)}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {selectedSession.conversationHistory.map((turn, i) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              {turn.transcription && (
                <div style={{ marginBottom: '8px', color: '#888', fontSize: '13px' }}>
                  <strong>Them:</strong> {turn.transcription}
                </div>
              )}
              {turn.ai_response && (
                 <div 
                   style={{ background: 'rgba(0,122,255,0.1)', padding: '10px', borderRadius: '6px' }}
                   dangerouslySetInnerHTML={{ __html: marked.parse(turn.ai_response) }}
                 />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', color: '#e5e5e5', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>History</h2>
      {sessions.length === 0 ? (
        <p style={{ color: '#666' }}>No recorded sessions yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {sessions.map(session => (
            <div 
              key={session.sessionId} 
              onClick={() => setSelectedSession(session)}
              style={{ 
                padding: '12px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '6px', 
                cursor: 'pointer',
                border: '1px solid transparent'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#007aff'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{formatDate(session.timestamp)}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                {session.conversationHistory.length} interactions
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;