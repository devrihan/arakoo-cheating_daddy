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
    };
    return titles[currentView] || 'Cheating Daddy';
  };

  const isNavView = ['customize', 'help', 'history', 'advanced'].includes(currentView);

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

  const iconButtonStyle = {
    background: 'none',
    color: 'var(--icon-button-color)',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '16px'
  };

  return (
    <div style={headerStyle}>
      <div style={{flex: 1, fontWeight: 600, WebkitAppRegion: 'drag'}}>
        {getTitle()}
      </div>
      
      <div style={{display: 'flex', gap: '12px', alignItems: 'center', WebkitAppRegion: 'no-drag'}}>
        {currentView === 'main' && (
          <>
            <button className="icon-button" onClick={onHistoryClick} style={iconButtonStyle}>H</button>
            <button className="icon-button" onClick={onCustomizeClick} style={iconButtonStyle}>S</button>
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

export default AppHeader;