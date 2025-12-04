import React from 'react';

const HelpView = () => {
  return (
    <div style={{ padding: '20px', color: '#e5e5e5', overflowY: 'auto', height: '100%' }}>
      <h2>Help & Shortcuts</h2>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Keyboard Shortcuts</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px', color: '#007aff' }}>Ctrl + Enter</td>
              <td style={{ padding: '8px' }}>Start Session / Manual Capture</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px', color: '#007aff' }}>Ctrl + M</td>
              <td style={{ padding: '8px' }}>Toggle Click-Through Mode</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px', color: '#007aff' }}>Ctrl + \</td>
              <td style={{ padding: '8px' }}>Toggle Visibility</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>How it works</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.6', color: '#ccc' }}>
          <li>Enter your Gemini API key in the main screen.</li>
          <li>Select a profile (Interview, Exam, etc.) in settings.</li>
          <li>Start the session. The app will capture system audio and screen context.</li>
          <li>Use "Force Capture" or ask questions manually if the AI isn't triggering automatically.</li>
        </ol>
      </div>
    </div>
  );
};

export default HelpView;