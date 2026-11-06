export async function playPCM(base64Data: string): Promise<void> {
  if (!base64Data) return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    
    // Use a singleton-like pattern for AudioContext to avoid hitting limits
    if (!(window as any).zoyaAudioCtx) {
      (window as any).zoyaAudioCtx = new AudioContextClass({ sampleRate: 24000 });
    }
    const audioCtx = (window as any).zoyaAudioCtx;
    
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Ensure the buffer is even-sized for Int16Array
    const validByteLength = bytes.length - (bytes.length % 2);
    const alignedBuffer = bytes.buffer.slice(0, validByteLength);
    const buffer = new Int16Array(alignedBuffer);
    
    const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      channelData[i] = buffer[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
    
    return new Promise<void>(resolve => {
      source.onended = () => resolve();
    });
  } catch (error) {
    console.error("Error playing audio:", error);
  }
}

// Strip markdown formatting for cleaner speech synthesis
function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, 'code snippet') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links [text](url) -> text
    .replace(/\{.*"remote_sync":\s*".*"\}/g, '') // Remote sync JSON
    .replace(/SYSTEM:.*$/gm, '') // System status lines
    .replace(/https?:\/\/\S+/g, '') // URLs
    .replace(/[#>\-_*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let speechUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakWithWebSpeech(text: string, preferredLang: string = "hi-IN"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    speechUtterance = utterance;

    // Pick best available voice (prefer Hindi or Indian English or soft female)
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes("hi") || v.lang.includes("IN") || v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("hindi") || v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google"));
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 1.05; // Slightly lively
    utterance.pitch = 1.15; // Slightly higher pitch for female sassy persona
    
    utterance.onend = () => {
      speechUtterance = null;
      resolve();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error or cancelled:", e);
      speechUtterance = null;
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}
