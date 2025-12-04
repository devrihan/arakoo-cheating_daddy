import React, { useState, useEffect } from 'react';
import AppHeader from './components/AppHeader';
import MainView from './components/views/MainView';
import { electronService } from './services/electronService';
// Import other views or create placeholders
const PlaceholderView = ({ name }) => <div style={{padding: 20}}>{name} View (Coming Soon)</div>;

const App = () => {
  const [currentView, setCurrentView] = useState(
    localStorage.getItem('onboardingCompleted') ? 'main' : 'onboarding'
  );
  const [statusText, setStatusText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(localStorage.getItem('advancedMode') === 'true');

  // Electron IPC Bridge
  useEffect(() => {
    // Safety check for browser dev environment
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      
      const handleStatus = (event, status) => setStatusText(status);
      
      ipcRenderer.on('update-status', handleStatus);
      return () => {
        ipcRenderer.removeAllListeners('update-status');
      };
    }
  }, []);

  const handleStart = async () => {
    const apiKey = localStorage.getItem('apiKey');
    
    if (!apiKey) {
      alert("Please enter a valid Gemini API Key.");
      return;
    }
    
    setStatusText('Initializing...');
    
    // 1. Send API Key to Backend
    const success = await electronService.initializeGemini(
      apiKey, 
      'interview', // Default profile
      'en-US'      // Default language
    );

    if (success) {
      console.log("Gemini Initialized Successfully");
      setStartTime(Date.now());
      setCurrentView('assistant');
      
      // 2. Start Screen/Audio Capture (You might need to migrate capture logic too)
      // For this specific app, the capture logic was in renderer.js. 
      // Ensure the backend knows to start capturing if it isn't frontend-driven.
    } else {
      setStatusText('Error: Failed to connect to Gemini');
      alert("Failed to verify API Key. Please check your internet or key validity.");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'onboarding': return <PlaceholderView name="Onboarding" />;
      case 'main': return <MainView onStart={handleStart} />;
      case 'customize': return <PlaceholderView name="Customize" />;
      case 'history': return <PlaceholderView name="History" />;
      case 'assistant': return <PlaceholderView name="Assistant" />;
      case 'help': return <PlaceholderView name="Help" />;
      case 'advanced': return <PlaceholderView name="Advanced" />;
      default: return <div>Unknown View</div>;
    }
  };

  return (
    <div className="window-container" style={{
      height: '100vh', 
      borderRadius: '7px', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="container" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <AppHeader 
          currentView={currentView}
          statusText={statusText}
          startTime={startTime}
          advancedMode={advancedMode}
          onCustomizeClick={() => setCurrentView('customize')}
          onHelpClick={() => setCurrentView('help')}
          onHistoryClick={() => setCurrentView('history')}
          onAdvancedClick={() => setCurrentView('advanced')}
          onCloseClick={() => {
            if(window.require) window.require('electron').ipcRenderer.invoke('quit-application');
          }}
          onBackClick={() => setCurrentView('main')}
        />
        
        <div className={`main-content ${currentView === 'assistant' ? 'assistant-view' : 'with-border'}`} style={{
          flex: 1,
          padding: currentView === 'assistant' ? '10px' : 'var(--main-content-padding)',
          overflowY: 'auto',
          marginTop: '10px',
          background: 'var(--main-content-background)',
          borderRadius: 'var(--border-radius)',
          border: currentView !== 'assistant' ? '1px solid var(--border-color)' : 'none'
        }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;