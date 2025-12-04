import React, { useState, useEffect } from 'react';
import AppHeader from './components/AppHeader';
import MainView from './components/views/MainView';
import AssistantView from './components/views/AssistantView';
import CustomizeView from './components/views/CustomizeView';
import AdvancedView from './components/views/AdvancedView';
import HistoryView from './components/views/HistoryView';
import HelpView from './components/views/HelpView';
import OnboardingView from './components/views/OnboardingView';

const App = () => {
  // State
  const [currentView, setCurrentView] = useState('onboarding');
  const [statusText, setStatusText] = useState('Idle');
  const [startTime, setStartTime] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Initialize state from local storage
  useEffect(() => {
    const isOnboarded = localStorage.getItem('onboardingCompleted') === 'true';
    setCurrentView(isOnboarded ? 'main' : 'onboarding');
    
    const isAdvanced = localStorage.getItem('advancedMode') === 'true';
    setAdvancedMode(isAdvanced);
  }, []);

  // Listen for Global Status Updates from Renderer
  useEffect(() => {
    const handleStatusUpdate = (e) => {
      setStatusText(e.detail);
      
      // If we go live, set the start time for the timer
      if (e.detail === 'Live' && !startTime) {
        setStartTime(Date.now());
      }
    };

    window.addEventListener('status-update', handleStatusUpdate);
    return () => window.removeEventListener('status-update', handleStatusUpdate);
  }, [startTime]);

  // Handler: Start Session
  // This is passed to MainView to trigger the transition
  const handleSessionStart = () => {
    setStartTime(Date.now());
    setCurrentView('assistant');
  };

  // Handler: Onboarding Complete
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setCurrentView('main');
  };

  // Handler: Quit App
  const handleClose = async () => {
    if (window.require) {
      await window.require('electron').ipcRenderer.invoke('quit-application');
    } else {
      window.close();
    }
  };

  // View Routing Logic
  const renderView = () => {
    switch (currentView) {
      case 'onboarding':
        return <OnboardingView onComplete={handleOnboardingComplete} />;
      case 'main':
        return <MainView onStart={handleSessionStart} />;
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

  // Special case: Onboarding takes over the whole screen (no header)
  if (currentView === 'onboarding') {
    return renderView();
  }

  // Common Layout
  return (
    <div className="window-container" style={{
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent', // Let specific views handle background or use global CSS
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
          // Navigation Props
          onCustomizeClick={() => setCurrentView('customize')}
          onHelpClick={() => setCurrentView('help')}
          onHistoryClick={() => setCurrentView('history')}
          onAdvancedClick={() => setCurrentView('advanced')} // Only if advanced mode is true
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