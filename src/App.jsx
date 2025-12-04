import React, { useState, useEffect, useRef } from 'react';
import AppHeader from './components/AppHeader';
import MainView from './components/views/MainView';
import AssistantView from './components/views/AssistantView';
import CustomizeView from './components/views/CustomizeView';
import AdvancedView from './components/views/AdvancedView';
import HistoryView from './components/views/HistoryView';
import HelpView from './components/views/HelpView';
import OnboardingView from './components/views/OnboardingView';
import { rendererService } from './utils/renderer';

const App = () => {
  // State
  const [currentView, setCurrentView] = useState('onboarding');
  const [statusText, setStatusText] = useState('Idle');
  const [startTime, setStartTime] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [startError, setStartError] = useState('');

  const currentViewRef = useRef(currentView);
  const apiKeyRef = useRef(apiKey);
  
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  const handleSessionStart = async () => {
    const keyToUse = apiKeyRef.current;
    
    if (!keyToUse.trim()) {
      setStartError('Please enter a valid Gemini API Key');
      return;
    }

    setIsVerifying(true);
    setStartError('');

    try {
      localStorage.setItem('apiKey', keyToUse.trim());
      
      const profile = localStorage.getItem('selectedProfile') || 'interview';
      const language = localStorage.getItem('selectedLanguage') || 'en-US';
      
      const success = await rendererService.initializeGemini(keyToUse.trim(), profile, language);
      
      if (success) {
        const interval = localStorage.getItem('selectedScreenshotInterval') || '5';
        const quality = localStorage.getItem('selectedImageQuality') || 'medium';
        
        if (interval !== 'manual') {
            await rendererService.startCapture(interval, quality);
        }
        
        setStartTime(Date.now());
        setCurrentView('assistant');
      } else {
        setStartError('Failed to verify API Key. Check connection/key.');
      }
    } catch (err) {
      console.error(err);
      setStartError(err.message || 'Unexpected error');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    window.cheddar = {
      getContentProtection: () => {
        return localStorage.getItem('contentProtection') !== 'false';
      },
      getCurrentView: () => {
        return currentViewRef.current;
      },
      getLayoutMode: () => {
        return localStorage.getItem('layoutMode') || 'normal';
      },
      handleShortcut: (key) => {
        console.log('Shortcut triggered:', key);
        const view = currentViewRef.current;

        if (view === 'main') {
          handleSessionStart();
        } else if (view === 'assistant') {
          rendererService.captureManualScreenshot();
        }
      }
    };
  }, []); 

  useEffect(() => {
    const isOnboarded = localStorage.getItem('onboardingCompleted') === 'true';
    setCurrentView(isOnboarded ? 'main' : 'onboarding');
    
    const isAdvanced = localStorage.getItem('advancedMode') === 'true';
    setAdvancedMode(isAdvanced);
  }, []);

  useEffect(() => {
    const handleStatusUpdate = (e) => {
      setStatusText(e.detail);
      if (e.detail === 'Live' && !startTime) {
        setStartTime(Date.now());
      }
    };

    window.addEventListener('status-update', handleStatusUpdate);
    return () => window.removeEventListener('status-update', handleStatusUpdate);
  }, [startTime]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setCurrentView('main');
  };

  const handleClose = async () => {
    if (window.require) {
      await window.require('electron').ipcRenderer.invoke('quit-application');
    } else {
      window.close();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'onboarding':
        return <OnboardingView onComplete={handleOnboardingComplete} />;
      case 'main':
        return (
          <MainView 
            apiKey={apiKey}
            setApiKey={setApiKey}
            onStart={handleSessionStart}
            isVerifying={isVerifying}
            error={startError}
          />
        );
      case 'assistant':
        return <AssistantView />;
      case 'customize':
        return <CustomizeView />;
      case 'advanced':
        return <AdvancedView />;
      case 'history':
        return <HistoryView />;
      case 'help':
        return <HelpView />;
      default:
        return <div style={{color: 'white', padding: 20}}>View not found: {currentView}</div>;
    }
  };

  if (currentView === 'onboarding') {
    return renderView();
  }

  return (
    <div className="window-container" style={{
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent',
      overflow: 'hidden'
    }}>
      <div className="container" style={{
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: 'var(--main-content-background, rgba(0,0,0,0.8))',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        
        <AppHeader 
          currentView={currentView}
          statusText={statusText}
          startTime={startTime}
          advancedMode={advancedMode}
          onCustomizeClick={() => setCurrentView('customize')}
          onHelpClick={() => setCurrentView('help')}
          onHistoryClick={() => setCurrentView('history')}
          onAdvancedClick={() => setCurrentView('advanced')}
          onBackClick={() => setCurrentView('main')}
          onCloseClick={handleClose}
        />
        
        <div className={`main-content ${currentView}`} style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;