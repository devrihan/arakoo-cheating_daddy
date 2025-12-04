import React, { useState, useEffect } from 'react';
import { rendererService } from '../../utils/renderer';

const AdvancedView = () => {
  const [contentProtection, setContentProtection] = useState(true);
  const [throttleTokens, setThrottleTokens] = useState(true);
  const [maxTokens, setMaxTokens] = useState(1000000);

  useEffect(() => {
    setContentProtection(rendererService.getContentProtection());
    setThrottleTokens(localStorage.getItem('throttleTokens') !== 'false');
    const savedMax = localStorage.getItem('maxTokensPerMin');
    if (savedMax) setMaxTokens(parseInt(savedMax));
  }, []);

  const handleProtectionChange = async (e) => {
    const val = e.target.checked;
    setContentProtection(val);
    localStorage.setItem('contentProtection', val);
    
    if (window.require) {
        await window.require('electron').ipcRenderer.invoke('update-content-protection', val);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure? This will delete all settings and history.')) {
      localStorage.clear();
      // indexedDB clearing would happen in rendererService if exposed, or reload
      if (window.require) {
         window.require('electron').ipcRenderer.send('clear-sensitive-data');
      }
    }
  };

  return (
    <div style={{ padding: '20px', color: '#e5e5e5' }}>
      <h2 style={{ fontSize: '18px', borderBottom: '1px solid #333', paddingBottom: '10px', color: '#ef4444' }}>Advanced Settings</h2>

      {/* Content Protection */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
           <span style={{ fontSize: '18px' }}>🛡️</span>
           <span style={{ fontWeight: '600' }}>Stealth Mode</span>
        </div>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
           When enabled, this window is invisible to screen sharing and recording software.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            checked={contentProtection} 
            onChange={handleProtectionChange} 
          />
          <label>Enable Content Protection</label>
        </div>
      </div>

      {/* Data Management */}
      <div style={{ ...cardStyle, borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
           <span style={{ fontSize: '18px' }}>🗑️</span>
           <span style={{ fontWeight: '600', color: '#ef4444' }}>Danger Zone</span>
        </div>
        <button 
          onClick={handleClearData}
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            color: '#ef4444', 
            padding: '8px 12px', 
            borderRadius: '4px',
            cursor: 'pointer' 
          }}
        >
          Clear All Local Data & Reset
        </button>
      </div>
    </div>
  );
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px'
};

export default AdvancedView;