// Safely access Electron's IPC renderer
const ipcRenderer = window.require
    ? window.require('electron').ipcRenderer
    : {
          invoke: () => Promise.resolve({ success: false, error: 'Not in Electron' }),
          on: () => {},
          removeAllListeners: () => {},
          send: () => {},
      };

export const electronService = {
    // Initialize the Gemini Session with the key
    initializeGemini: async (apiKey, profile = 'interview', language = 'en-US') => {
        try {
            // Send the key to the main process (src/utils/gemini.js)
            const success = await ipcRenderer.invoke('initialize-gemini', apiKey, localStorage.getItem('customPrompt') || '', profile, language);
            return success;
        } catch (error) {
            console.error('Failed to initialize Gemini:', error);
            return false;
        }
    },

    // Other necessary commands
    startCapture: (interval, quality) => ipcRenderer.invoke('start-capture', interval, quality),
    stopCapture: () => ipcRenderer.invoke('stop-capture'),
    quitApp: () => ipcRenderer.invoke('quit-application'),

    // Listeners
    onStatusUpdate: callback => {
        ipcRenderer.on('update-status', (event, status) => callback(status));
        return () => ipcRenderer.removeAllListeners('update-status');
    },
};
