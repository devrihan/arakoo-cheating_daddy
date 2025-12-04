import React, { useEffect, useState, useRef } from 'react';
import { rendererService } from '../../utils/renderer';
import { marked } from 'marked'; 

const AssistantView = () => {
  const [responses, setResponses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleNewResponse = (e) => {
      const response = e.detail;
      setResponses(prev => {
        const newResponses = [...prev, response];
        setCurrentIndex(newResponses.length - 1); 
        return newResponses;
      });
    };

    window.addEventListener('new-response', handleNewResponse);
    return () => window.removeEventListener('new-response', handleNewResponse);
  }, []);

  useEffect(() => {
    if (currentIndex === responses.length - 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responses, currentIndex]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    await rendererService.sendTextMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentContent = responses[currentIndex] || "Waiting for context... (Speak or show content)";

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#e5e5e5' }}>
      
      <div className="response-container" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div 
          className="markdown-content"
          style={{ lineHeight: '1.6', fontSize: '16px' }}
          dangerouslySetInnerHTML={{ __html: marked.parse(currentContent) }} 
        />
        <div ref={bottomRef} />
      </div>

      <div className="input-area" style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
           <div style={{ display: 'flex', gap: '8px' }}>
             <button 
                onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                disabled={currentIndex <= 0}
                className="nav-btn"
             >
               ← Prev
             </button>
             <span style={{ fontSize: '12px', opacity: 0.7, alignSelf: 'center' }}>
               {responses.length > 0 ? `${currentIndex + 1}/${responses.length}` : '0/0'}
             </span>
             <button 
                onClick={() => setCurrentIndex(c => Math.min(responses.length - 1, c + 1))}
                disabled={currentIndex >= responses.length - 1}
                className="nav-btn"
             >
               Next →
             </button>
           </div>
           
           <button 
             onClick={() => rendererService.captureManualScreenshot()}
             style={{ background: 'transparent', border: '1px solid #007aff', color: '#007aff', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
           >
             📸 Force Capture
           </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a specific question..."
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', padding: '8px', borderRadius: '4px' }}
          />
          <button onClick={handleSend} style={{ background: '#007aff', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px' }}>
            Send
          </button>
        </div>
      </div>

      <style>{`
        .nav-btn { background: rgba(255,255,255,0.1); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
        .nav-btn:disabled { opacity: 0.3; cursor: default; }
      `}</style>
    </div>
  );
};

export default AssistantView;