import React, { useState, useEffect } from 'react';

const CustomizeView = () => {
  const [profile, setProfile] = useState(localStorage.getItem('selectedProfile') || 'interview');
  const [language, setLanguage] = useState(localStorage.getItem('selectedLanguage') || 'en-US');
  const [customPrompt, setCustomPrompt] = useState(localStorage.getItem('customPrompt') || '');
  const [audioMode, setAudioMode] = useState(localStorage.getItem('audioMode') || 'speaker_only');
  const [googleSearch, setGoogleSearch] = useState(localStorage.getItem('googleSearchEnabled') === 'true');

  const updateSetting = (key, value, setter) => {
    localStorage.setItem(key, value);
    setter(value);
  };

  const handleGoogleSearch = (e) => {
    const val = e.target.checked;
    updateSetting('googleSearchEnabled', val.toString(), setGoogleSearch);
    if (window.require) {
        window.require('electron').ipcRenderer.invoke('update-google-search-setting', val);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#e5e5e5', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: '18px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Settings</h2>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: '#007aff', textTransform: 'uppercase' }}>AI Profile</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Profile Type</label>
          <select 
            value={profile} 
            onChange={(e) => updateSetting('selectedProfile', e.target.value, setProfile)}
            style={inputStyle}
          >
            <option value="interview">Job Interview</option>
            <option value="sales">Sales Call</option>
            <option value="meeting">Business Meeting</option>
            <option value="exam">Exam Assistant</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Custom Instructions</label>
          <textarea
            value={customPrompt}
            onChange={(e) => updateSetting('customPrompt', e.target.value, setCustomPrompt)}
            placeholder="E.g., Be concise, answer in bullet points..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: '#007aff', textTransform: 'uppercase' }}>Audio & Language</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Input Source</label>
          <select 
            value={audioMode} 
            onChange={(e) => updateSetting('audioMode', e.target.value, setAudioMode)}
            style={inputStyle}
          >
            <option value="speaker_only">System Audio Only (Them)</option>
            <option value="mic_only">Microphone Only (Me)</option>
            <option value="both">Both (Conversation)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Language</label>
          <select 
            value={language} 
            onChange={(e) => updateSetting('selectedLanguage', e.target.value, setLanguage)}
            style={inputStyle}
          >
            <option value="en-US">English (US)</option>
            <option value="es-US">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="hi-IN">Hindi</option>
          </select>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '14px', color: '#007aff', textTransform: 'uppercase' }}>Features</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
          <input 
            type="checkbox" 
            checked={googleSearch} 
            onChange={handleGoogleSearch}
            id="gsearch" 
          />
          <label htmlFor="gsearch" style={{ fontSize: '13px' }}>
            Enable Google Search
            <div style={{ fontSize: '11px', color: '#888' }}>Allow AI to fetch live data (Requires Restart)</div>
          </label>
        </div>
      </section>

    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #333',
  background: 'rgba(0,0,0,0.3)',
  color: 'white',
  fontSize: '13px'
};

export default CustomizeView;