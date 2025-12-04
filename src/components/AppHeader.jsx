import React, { useState, useEffect } from 'react';

const AppHeader = ({ 
  currentView, statusText, startTime, advancedMode,
  onCustomizeClick, onHelpClick, onHistoryClick, 
  onCloseClick, onBackClick, onAdvancedClick 
}) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    let interval;
    if (currentView === 'assistant' && startTime) {
      interval = setInterval(() => {
        const sec = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(`${sec}s`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentView, startTime]);

  const getTitle = () => {
    const titles = {
      main: 'Cheating Daddy',
      customize: 'Customize',
      assistant: 'Cheating Daddy',
      // Add others...
    };
    return titles[currentView] || 'Cheating Daddy';
  };

  const isNavView = ['customize', 'help', 'history', 'advanced'].includes(currentView);

  // Styles object for the header container
  const headerStyle = {
    WebkitAppRegion: 'drag',
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--header-padding)',
    border: '1px solid var(--border-color)',
    background: 'var(--header-background)',
    borderRadius: 'var(--border-radius)',
    gap: '12px'
  };

  return (
    <div style={headerStyle}>
      <div style={{flex: 1, fontWeight: 600, WebkitAppRegion: 'drag'}}>
        {getTitle()}
      </div>
      
      <div style={{display: 'flex', gap: '12px', alignItems: 'center', WebkitAppRegion: 'no-drag'}}>
        {currentView === 'assistant' && (
          <>
            <span style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)'}}>{elapsed}</span>
            <span style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)'}}>{statusText}</span>
          </>
        )}

        {currentView === 'main' && (
          <>
            <button className="icon-button" onClick={onHistoryClick} style={iconButtonStyle}>
              {/* SVG for History */}
              H
            </button>
            <button className="icon-button" onClick={onCustomizeClick} style={iconButtonStyle}>
              {/* SVG for Settings */}
              S
            </button>
          </>
        )}

        <button 
          className="icon-button" 
          onClick={isNavView ? onBackClick : onCloseClick}
          style={iconButtonStyle}
        >
          X
        </button>
      </div>
    </div>
  );
};

const iconButtonStyle = {
  background: 'none',
  color: 'var(--icon-button-color)',
  border: 'none',
  padding: '8px',
  cursor: 'pointer',
  fontSize: '16px'
};

export default AppHeader;
