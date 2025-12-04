import React from 'react';

const MainView = ({ apiKey, setApiKey, onStart, isVerifying, error }) => {
  
  return (
    <div className="main-view-container" style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1>Cheating Daddy</h1>
        <p style={{ color: '#888' }}>Your Stealth AI Copilot</p>
      </div>

      <div className="input-group" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Gemini API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your API key here..."
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #333',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            marginBottom: '20px',
            outline: 'none'
          }}
        />
        
        {error && <div style={{ color: '#ff4444', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

        <button
          onClick={onStart}
          disabled={isVerifying}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            background: isVerifying ? '#333' : '#007aff',
            color: 'white',
            fontWeight: '600',
            cursor: isVerifying ? 'default' : 'pointer',
            opacity: isVerifying ? 0.7 : 1
          }}
        >
          {isVerifying ? 'Verifying...' : 'Start Session'}
        </button>

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Don't have a key? <a href="#" onClick={() => window.open('https://aistudio.google.com/app/apikey')} style={{ color: '#007aff' }}>Get one from Google AI Studio</a>
        </p>
      </div>
    </div>
  );
};

export default MainView;