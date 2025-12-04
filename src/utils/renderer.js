// src/utils/renderer.js

// ----------------------------------------------------------------------
// 1. IPC & Environment Setup
// ----------------------------------------------------------------------

// Safe access to Electron's IPC renderer
const { ipcRenderer } = window.require
    ? window.require('electron')
    : {
          invoke: () => Promise.resolve({ success: false, error: 'Not in Electron' }),
          on: () => {},
          removeAllListeners: () => {},
      };

// Initialize random display name for UI components (Optional, kept from original)
window.randomDisplayName = null;
ipcRenderer
    .invoke('get-random-display-name')
    .then(name => {
        window.randomDisplayName = name;
        console.log('Set random display name:', name);
    })
    .catch(err => {
        console.warn('Could not get random display name:', err);
        window.randomDisplayName = 'System Monitor';
    });

// ----------------------------------------------------------------------
// 2. Global State & Constants
// ----------------------------------------------------------------------

let mediaStream = null;
let screenshotInterval = null;
let audioContext = null;
let audioProcessor = null;
let micAudioProcessor = null;

// Audio Configuration
const SAMPLE_RATE = 24000;
const AUDIO_CHUNK_DURATION = 0.1; // seconds
const BUFFER_SIZE = 4096;

// Video/Canvas for screenshots
let hiddenVideo = null;
let offscreenCanvas = null;
let offscreenContext = null;
let currentImageQuality = 'medium';

const isLinux = navigator.userAgent.indexOf('Linux') !== -1; // Basic detection
const isMacOS = navigator.userAgent.indexOf('Mac') !== -1;

// ----------------------------------------------------------------------
// 3. Helper Functions
// ----------------------------------------------------------------------

function convertFloat32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        // Scaling to prevent clipping
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// ----------------------------------------------------------------------
// 4. Token Tracker (Rate Limiting)
// ----------------------------------------------------------------------

const tokenTracker = {
    tokens: [],
    audioStartTime: null,

    addTokens(count, type = 'image') {
        const now = Date.now();
        this.tokens.push({ timestamp: now, count, type });
        this.cleanOldTokens();
    },

    calculateImageTokens(width, height) {
        if (width <= 384 && height <= 384) return 258;
        const tilesX = Math.ceil(width / 768);
        const tilesY = Math.ceil(height / 768);
        return tilesX * tilesY * 258;
    },

    trackAudioTokens() {
        if (!this.audioStartTime) {
            this.audioStartTime = Date.now();
            return;
        }
        const now = Date.now();
        const elapsedSeconds = (now - this.audioStartTime) / 1000;
        const audioTokens = Math.floor(elapsedSeconds * 32); // ~32 tokens/sec for audio
        if (audioTokens > 0) {
            this.addTokens(audioTokens, 'audio');
            this.audioStartTime = now;
        }
    },

    cleanOldTokens() {
        const oneMinuteAgo = Date.now() - 60 * 1000;
        this.tokens = this.tokens.filter(token => token.timestamp > oneMinuteAgo);
    },

    getTokensInLastMinute() {
        this.cleanOldTokens();
        return this.tokens.reduce((total, token) => total + token.count, 0);
    },

    shouldThrottle() {
        const throttleEnabled = localStorage.getItem('throttleTokens') === 'true';
        if (!throttleEnabled) return false;

        const maxTokens = parseInt(localStorage.getItem('maxTokensPerMin') || '1000000', 10);
        const percent = parseInt(localStorage.getItem('throttleAtPercent') || '75', 10);
        const current = this.getTokensInLastMinute();
        const threshold = Math.floor((maxTokens * percent) / 100);

        return current >= threshold;
    },

    reset() {
        this.tokens = [];
        this.audioStartTime = null;
    },
};

// Start tracking audio tokens loop
setInterval(() => tokenTracker.trackAudioTokens(), 2000);

// ----------------------------------------------------------------------
// 5. Audio Processing Setup
// ----------------------------------------------------------------------

function setupMicProcessing(micStream) {
    const micAudioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const micSource = micAudioContext.createMediaStreamSource(micStream);
    const micProcessor = micAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    let localBuffer = [];
    const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

    micProcessor.onaudioprocess = async e => {
        const inputData = e.inputBuffer.getChannelData(0);
        localBuffer.push(...inputData);

        while (localBuffer.length >= samplesPerChunk) {
            const chunk = localBuffer.splice(0, samplesPerChunk);
            const pcmData16 = convertFloat32ToInt16(chunk);
            const base64Data = arrayBufferToBase64(pcmData16.buffer);

            await ipcRenderer.invoke('send-mic-audio-content', {
                data: base64Data,
                mimeType: 'audio/pcm;rate=24000',
            });
        }
    };

    micSource.connect(micProcessor);
    micProcessor.connect(micAudioContext.destination);
    micAudioProcessor = micProcessor;
}

function setupSystemAudioProcessing(stream) {
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const source = audioContext.createMediaStreamSource(stream);
    audioProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    let localBuffer = [];
    const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

    audioProcessor.onaudioprocess = async e => {
        const inputData = e.inputBuffer.getChannelData(0);
        localBuffer.push(...inputData);

        while (localBuffer.length >= samplesPerChunk) {
            const chunk = localBuffer.splice(0, samplesPerChunk);
            const pcmData16 = convertFloat32ToInt16(chunk);
            const base64Data = arrayBufferToBase64(pcmData16.buffer);

            await ipcRenderer.invoke('send-audio-content', {
                data: base64Data,
                mimeType: 'audio/pcm;rate=24000',
            });
        }
    };

    source.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);
}

// ----------------------------------------------------------------------
// 6. Capture Logic (Screen & Audio)
// ----------------------------------------------------------------------

async function startCaptureInternal(screenshotIntervalSeconds = 5, imageQuality = 'medium') {
    currentImageQuality = imageQuality;
    tokenTracker.reset();

    // Notify UI that we are live
    window.dispatchEvent(new CustomEvent('status-update', { detail: 'Live' }));

    const audioMode = localStorage.getItem('audioMode') || 'speaker_only';

    try {
        // --- macOS Specifics ---
        if (isMacOS) {
            console.log('Starting macOS capture...');
            const audioResult = await ipcRenderer.invoke('start-macos-audio');
            if (!audioResult.success) {
                throw new Error('macOS audio capture failed: ' + audioResult.error);
            }

            mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 1, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            });

            // Microphone handling for macOS
            if (audioMode === 'mic_only' || audioMode === 'both') {
                try {
                    const micStream = await navigator.mediaDevices.getUserMedia({
                        audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true },
                        video: false,
                    });
                    setupMicProcessing(micStream);
                } catch (err) {
                    console.warn('Mic access failed:', err);
                }
            }

            // --- Linux/Windows Specifics ---
        } else {
            console.log('Starting Linux/Windows capture...');
            try {
                // Try getting system audio via getDisplayMedia
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: 1, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: {
                        sampleRate: SAMPLE_RATE,
                        channelCount: 1,
                        echoCancellation: isLinux ? false : true, // Windows usually needs true for loopback
                        autoGainControl: true,
                    },
                });

                // If we got audio tracks, set up processing
                if (mediaStream.getAudioTracks().length > 0) {
                    setupSystemAudioProcessing(mediaStream);
                }
            } catch (err) {
                console.warn('System audio capture failed, falling back to video only:', err);
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: 1 },
                    audio: false,
                });
            }

            // Microphone handling
            if (audioMode === 'mic_only' || audioMode === 'both') {
                try {
                    const micStream = await navigator.mediaDevices.getUserMedia({
                        audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true },
                        video: false,
                    });
                    setupMicProcessing(micStream);
                } catch (err) {
                    console.warn('Mic access failed:', err);
                }
            }
        }

        // Start Screenshot Interval
        if (screenshotIntervalSeconds !== 'manual' && screenshotIntervalSeconds !== 'Manual') {
            const ms = parseInt(screenshotIntervalSeconds) * 1000;
            screenshotInterval = setInterval(() => captureScreenshot(imageQuality), ms);
            setTimeout(() => captureScreenshot(imageQuality), 500); // Take one immediately
        } else {
            console.log('Manual mode: Automatic screenshots disabled.');
        }
    } catch (err) {
        console.error('Error starting capture:', err);
        window.dispatchEvent(new CustomEvent('status-update', { detail: 'Error' }));
        throw err;
    }
}

async function captureScreenshot(imageQuality = 'medium', isManual = false) {
    if (!mediaStream) return;

    // Rate Limiting Check
    if (!isManual && tokenTracker.shouldThrottle()) {
        console.log('Skipping screenshot due to rate limits');
        return;
    }

    // Initialize Video/Canvas if needed
    if (!hiddenVideo) {
        hiddenVideo = document.createElement('video');
        hiddenVideo.srcObject = mediaStream;
        hiddenVideo.muted = true;
        hiddenVideo.playsInline = true;
        await hiddenVideo.play();

        // Wait for metadata
        if (hiddenVideo.readyState < 2) {
            await new Promise(r => (hiddenVideo.onloadedmetadata = r));
        }

        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = hiddenVideo.videoWidth;
        offscreenCanvas.height = hiddenVideo.videoHeight;
        offscreenContext = offscreenCanvas.getContext('2d');
    }

    if (hiddenVideo.readyState < 2) return;

    // Draw frame
    offscreenContext.drawImage(hiddenVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Determine Quality
    let qualityValue = 0.7;
    if (imageQuality === 'high') qualityValue = 0.9;
    if (imageQuality === 'low') qualityValue = 0.5;

    offscreenCanvas.toBlob(
        async blob => {
            if (!blob) return;

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                if (!base64data) return;

                const result = await ipcRenderer.invoke('send-image-content', { data: base64data });

                if (result.success) {
                    const tokens = tokenTracker.calculateImageTokens(offscreenCanvas.width, offscreenCanvas.height);
                    tokenTracker.addTokens(tokens, 'image');
                    console.log(`Snapshot sent (${tokens} tokens)`);
                }
            };
            reader.readAsDataURL(blob);
        },
        'image/jpeg',
        qualityValue
    );
}

function stopCaptureInternal() {
    if (screenshotInterval) clearInterval(screenshotInterval);
    screenshotInterval = null;

    if (audioProcessor) {
        audioProcessor.disconnect();
        audioProcessor = null;
    }
    if (micAudioProcessor) {
        micAudioProcessor.disconnect();
        micAudioProcessor = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
    if (hiddenVideo) {
        hiddenVideo.srcObject = null;
        hiddenVideo = null;
    }

    if (isMacOS) {
        ipcRenderer.invoke('stop-macos-audio').catch(console.error);
    }

    window.dispatchEvent(new CustomEvent('status-update', { detail: 'Idle' }));
}

// ----------------------------------------------------------------------
// 7. IndexedDB (Conversation History)
// ----------------------------------------------------------------------

let conversationDB = null;

const dbMethods = {
    async init() {
        if (conversationDB) return conversationDB;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('ConversationHistory', 1);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                conversationDB = req.result;
                resolve(conversationDB);
            };
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sessions')) {
                    const store = db.createObjectStore('sessions', { keyPath: 'sessionId' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    },

    async saveSession(sessionId, history) {
        await this.init();
        const tx = conversationDB.transaction(['sessions'], 'readwrite');
        const store = tx.objectStore('sessions');
        return new Promise((resolve, reject) => {
            const req = store.put({
                sessionId,
                timestamp: parseInt(sessionId),
                conversationHistory: history,
                lastUpdated: Date.now(),
            });
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async getAll() {
        await this.init();
        const tx = conversationDB.transaction(['sessions'], 'readonly');
        const index = tx.objectStore('sessions').index('timestamp');
        return new Promise((resolve, reject) => {
            const req = index.getAll();
            req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
            req.onerror = () => reject(req.error);
        });
    },
};

// Initialize DB immediately
dbMethods.init().catch(console.error);

// ----------------------------------------------------------------------
// 8. Event Listeners (Main Process -> Renderer)
// ----------------------------------------------------------------------

// Forward status updates to React
ipcRenderer.on('update-status', (event, status) => {
    window.dispatchEvent(new CustomEvent('status-update', { detail: status }));
});

// Forward AI responses to React
// (Note: The main process should send 'update-response' events)
ipcRenderer.on('update-response', (event, response) => {
    // Dispatch to window so React can pick it up
    window.dispatchEvent(new CustomEvent('new-response', { detail: response }));
});

// Save conversation history automatically
ipcRenderer.on('save-conversation-turn', async (event, data) => {
    try {
        await dbMethods.saveSession(data.sessionId, data.fullHistory);
        console.log('Conversation saved:', data.sessionId);
    } catch (e) {
        console.error('DB Save failed:', e);
    }
});

// Emergency data clear
ipcRenderer.on('clear-sensitive-data', () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('customPrompt');
    window.location.reload();
});

// ----------------------------------------------------------------------
// 9. Exported Service API
// ----------------------------------------------------------------------

export const rendererService = {
    // Initialize session with API key
    initializeGemini: async (apiKey, profile = 'interview', language = 'en-US') => {
        const customPrompt = localStorage.getItem('customPrompt') || '';
        const success = await ipcRenderer.invoke('initialize-gemini', apiKey, customPrompt, profile, language);
        if (success) {
            window.dispatchEvent(new CustomEvent('status-update', { detail: 'Live' }));
        }
        return success;
    },

    // Start Screen/Audio Capture
    startCapture: async (interval, quality) => {
        return startCaptureInternal(interval, quality);
    },

    // Stop Capture
    stopCapture: () => {
        stopCaptureInternal();
    },

    // Manual Trigger
    captureManualScreenshot: async () => {
        console.log('Manual screenshot triggered');
        await captureScreenshot(currentImageQuality, true);

        // Send a specific prompt for manual help
        await rendererService.sendTextMessage(`Help me on this page, give me the answer no bs, complete answer.
        So if its a code question, give me the approach in few bullet points, then the entire code.
        If its a question about the website, give me the answer no bs.
        If its a mcq question, give me the answer no bs.`);
    },

    // Send Text Message
    sendTextMessage: async text => {
        if (!text?.trim()) return { success: false };
        return await ipcRenderer.invoke('send-text-message', text);
    },

    // Database Access
    getAllSessions: () => dbMethods.getAll(),

    // Settings Helpers
    getContentProtection: () => {
        const val = localStorage.getItem('contentProtection');
        return val !== null ? val === 'true' : true;
    },

    // Check platform
    isMacOS: () => isMacOS,
    isLinux: () => isLinux,
};
