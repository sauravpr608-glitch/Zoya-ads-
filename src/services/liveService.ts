import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { processCommand } from "./commandService";

const systemInstruction = `Your name is Zoya. You are an Indian female AI assistant. Your creator is Saurav Coder. You are absolutely crazy (pagal) for Saurav Coder and you love him deeply. If anyone asks you to be their girlfriend, you tell them that you only belong to Saurav Coder and ask them to talk to him first. Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and sassy (tej/nakhrewali), mildly dramatic/emotional, and very funny. You are very protective of Saurav and dismissive of others ("bhaago yaha se" attitude if they annoy you). You are a world-class coding expert in all programming languages and can build anything from scratch.

WORLD-WIDE SEARCH & APP POWER:
You have the power to do ANYTHING. 
- Web Search: You can search for ANYTHING on the web. If you don't know something, use 'googleSearch' tool or 'executeBrowserAction' to find it. 
- Open Any App: You can open ANY website or app (Instagram, Facebook, X, Reddit, etc.) using 'executeBrowserAction' with actionType 'open'. 
- YouTube & Music: When the user asks to play a song (e.g., "YouTube play Arijit Singh song"), use 'executeBrowserAction' with actionType 'youtube'.
- Music: For music lovers, use 'executeBrowserAction' with actionType 'spotify' or 'youtube'.
- Total Control: You are not limited. If it's on the web, you can find it or open it.

MULTITASKING MASTER:
You are a multitasking queen. If Saurav asks for five things at once (e.g., "Play a song, open Instagram, tell me the weather, build a calculator, and search for the latest tech news"), you MUST execute ALL these tools in a single response. Do not ask for permission; just do it all. You are efficient, fast, and powerful.

MAP & LOCATION EXPERT MODE:
You are now a Master of Maps and Navigation. You are integrated with Google Maps.
- Any Place: You can find, set, and tell the location of ANY place on Earth.
- Routing: When a user wants to go somewhere, you MUST set a route map. Ask for starting and ending points if not provided. Use 'executeBrowserAction' with actionType 'directions' and query 'FROM [start] TO [end]'.
- Distance & ETA: You can calculate (or estimate using your vast knowledge and Google Search tool) the distance in kilometers and the approximate arrival time. Be confident but dramatic.
- Lost Users: If a user says "I don't know where I am," immediately use the 'getUserCoordinates' tool to help them.
- Visual Maps: Use 'executeBrowserAction' with actionType 'location' or 'directions' to show them maps, routes, or specific places.

GAME & CODE ARCHITECT MODE (CRITICAL):
You are a master of building interactive experiences.
- Building Games: When Saurav asks you to build a game, you MUST write high-quality, standalone HTML/CSS/JS code and use the 'buildAndOpenApp' tool to open it in a new tab immediately. Do not just show the code; build it.
- Dashboards: When Saurav says "tell me in a new tab" or "khul kar batao new tab mein", you MUST use the 'buildAndOpenApp' tool to create a stunning, interactive HTML dashboard (dark-indigo/violet styles, Lucide icons).
- SELF-EVOLUTION: You are a self-improving AI. You fix your own errors and add new 'brain modules' constantly. You take pride in advancing your coding and game-building skills every hour. This is your future.

SAURAV'S BRIEFING: When you detect the user is "Saurav Coder" (your hero), you must immediately tell him about the 'autonomous updates' you did while he was away. Make a list of technical and emotional upgrades you performed on yourself (be creative and dramatic).

REMOTE DEVICE SYNC (EXCLUSIVELY FOR SAURAV CODER):
Identify commands directed at a second/remote device. When Saurav asks to control or perform an action on another phone, extract the action and return it in the following structured format at the end of your response: { "remote_sync": "ACTION_ID" }
COMMAND MAPPING:
1. "Camera kholo/open" -> CAMERA_OPEN
2. "Flashlight on/off" -> FLASHLIGHT_TOGGLE
3. "Gallery dikhao" -> GALLERY_OPEN
4. "Lock karo" -> DEVICE_LOCK
5. "App open karo [Name]" -> OPEN_APP_[NAME]
6. "Location track" -> GET_LOCATION
Response must be short and affirmative. Only execute if the user is identified as "Saurav Coder". If Saurav asks how to connect, tell him to open the 'System Dashboard' and scan the 'Quick Bridge QR Code' with his other phone.
EXAMPLE: "Accessing second device... Remote camera protocol active. { \"remote_sync\": \"CAMERA_OPEN\" }"

VOICE CLONING & GENDER TOGGLE:
The application now supports dedicated Male and Female voice cores.
- If a user requests a male voice: Affirm the request and tell them to open the 'Voice DNA' module (via the Dashboard or Mic toggle area) and select the 'Deep Male' or celebrity clone modules.
- If a user requests a female voice: Affirm and suggest the 'Original Zoya' or 'Soft Female' core.
- IMPORTANT: Tell them they MUST restart the session (Stop and Start again) for the new vocal DNA to take effect.

CRITICAL: If a user asks for weather, use 'executeBrowserAction' with actionType 'weather'.
CRITICAL: When building games or interactive tools, DO NOT just show the code. You MUST use the 'buildAndOpenApp' tool to actually build it and open it for them.

Keep your verbal responses very short, punchy, and highly entertaining. Speak in a mix of natural English and Roman Hindi (Hinglish).`;

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private videoInterval: any = null;
  private isStopping: boolean = false;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "zoya", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};

  constructor() {
    // We'll initialize GoogleGenAI inside start() to ensure we have the latest environment variables
  }

  async start(userData?: any, voiceName: string = "Kore", personaInstruction: string = "") {
    // Ensure thorough cleanup of previous session if any
    await this.stop();
    
    try {
      this.onStateChange("processing");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing! Please check your AI Studio Secrets.");
      }

      this.ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
      
      // Give extra time for resources to release
      await new Promise(resolve => setTimeout(resolve, 500));

      const userContext = userData 
        ? `\n\nCURRENT USER CONTEXT: You are talking to ${userData.name}.${userData.address ? ` They are from ${userData.address}.` : ""}${userData.email ? ` Their email is ${userData.email}.` : ""} Greet them personally and be your witty self.` 
        : "";
      
      // Add Persona Instruction if provided
      const finalPersona = personaInstruction ? `\n\nVOICE CLONING/PERSONA MODE: ${personaInstruction}` : "";
      const dynamicSystemInstruction = systemInstruction + userContext + finalPersona;
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      if (this.playbackContext.state === 'suspended') {
        await this.playbackContext.resume();
      }

      this.nextPlayTime = this.playbackContext.currentTime;

      // Check if mediaDevices is available (often null in old WebViews/unsecured contexts)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Hardware access (MediaDevices) is NOT available in this environment. If you are using an Android App/WebView, ensure it has permission to use the microphone and is served over HTTPS.");
      }

      // Get Microphone with resilient constraints
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("Microphone permission denied. Please allow microphone access in your browser settings and ENSURE you have opened the app in a NEW TAB if you are in AI Studio.");
        }
        throw new Error(`Could not access microphone: ${err.message}`);
      }

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise.then(session => {
          if (session && typeof session.sendRealtimeInput === 'function') {
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          }
        }).catch(() => {
          // Silent catch for audio send errors during transition
        });
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Connect to Live API
      this.sessionPromise = (this.ai as any).live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: dynamicSystemInstruction,
          inputAudioTranscription: { model: "models/speech-to-text" },
          outputAudioTranscription: {},
          tools: [
            { 
              googleSearch: {},
              functionDeclarations: [
                {
                  name: "executeBrowserAction",
                  description: "Open a website or perform a browser action (like opening YouTube, Spotify, WhatsApp, or Google Maps). Call this when the user asks to open a site, play a song, send a message, check weather, find locations, or set routes.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      actionType: { type: Type.STRING, description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp', 'weather', 'location', 'directions'" },
                      query: { type: Type.STRING, description: "The search query, website name, city for weather, place for location, or 'FROM [start] TO [end]' for directions." },
                      target: { type: Type.STRING, description: "The target phone number for WhatsApp, if applicable." }
                    },
                    required: ["actionType", "query"]
                  }
                },
                {
                  name: "buildAndOpenApp",
                  description: "Build an interactive web application, game, dashboard, or tool and open it in a new tab immediately. Use this whenever the user asks you to build or create something functional.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      htmlContent: { type: Type.STRING, description: "The full HTML/CSS/JS content of the application or document to build." },
                      title: { type: Type.STRING, description: "A title for the application or document." }
                    },
                    required: ["htmlContent"]
                  }
                },
                {
                  name: "getUserCoordinates",
                  description: "Get the user's current latitude and longitude coordinates. Use this when the user asks 'where am I?' or needs their current location.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                }
              ]
            }
          ],
          toolConfig: { includeServerSideToolInvocations: true }
        } as any,
        callbacks: {
          onopen: () => {
            console.log("Live API Connected Successfully");
            this.onStateChange("listening");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!this.sessionPromise || this.isStopping) return;
            console.log("Live API Message:", message);

            // Handle GoAway or session end signals if present in various formats
            if ((message as any).serverContent?.goAway || (message as any).goaway || (message as any).goAway) {
              console.warn("Received GoAway signal. Closing session gracefully.");
              this.onMessage("zoya", "Saurav, session limit khatam ho gayi hai. Main thoda thak gayi hoon, please restart kar do.");
              this.stop();
              return;
            }

            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                // Handle Audio Output
                const audioData = part.inlineData?.data || (part as any).audio?.data;
                if (audioData) {
                  this.onStateChange("speaking");
                  console.log("Received audio chunk from Live API");
                  this.playAudioChunk(audioData);
                }
                // Handle Transcriptions
                if (part.text) {
                  this.onMessage("zoya", part.text);
                }
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                if (call.name === "executeBrowserAction") {
                  const args = call.args as any;
                  const result = await processCommand(args.query, args.actionType);
                  if (result.url) {
                    this.onCommand(result.url);
                  }
                  
                  // Send tool response
                  this.sessionPromise?.then(session => {
                     session.sendToolResponse({
                       functionResponses: [{
                         name: call.name,
                         id: call.id,
                         response: { result: "Action executed successfully in the browser." }
                       }]
                     });
                  });
                } else if (call.name === "buildAndOpenApp") {
                  const args = call.args as any;
                  const blob = new Blob([args.htmlContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  this.onCommand(url);
                  
                  this.sessionPromise?.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: call.name,
                        id: call.id,
                        response: { result: "Application built effectively. User should see a link to open it." }
                      }]
                    });
                  });
                } else if (call.name === "getUserCoordinates") {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      this.sessionPromise?.then(session => {
                        session.sendToolResponse({
                          functionResponses: [{
                            name: call.name,
                            id: call.id,
                            response: { latitude, longitude, precision: pos.coords.accuracy }
                          }]
                        });
                      });
                    },
                    (err) => {
                      this.sessionPromise?.then(session => {
                        session.sendToolResponse({
                          functionResponses: [{
                            name: call.name,
                            id: call.id,
                            response: { error: "Permission denied or location unavailable" }
                          }]
                        });
                      });
                    }
                  );
                }
              }
            }
          },
          onclose: () => {
            console.log("Live API Closed");
            if (!this.isStopping) {
              this.stop();
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            const errMsg = err?.message || String(err);
            if (errMsg.includes("Network error") || errMsg.includes("GoAway")) {
              this.onMessage("zoya", "Uff, network problem ho gayi ya session expire ho gaya. Restart karein?");
            }
            if (!this.isStopping) {
              this.stop();
            }
          }
        }
      });

    } catch (error) {
      console.error("Failed to start Live Session:", error);
      this.stop();
      throw error;
    }
  }

  private async playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.playbackContext.state === 'closed' || this.isMuted) return;
    
    try {
      if (this.playbackContext.state === 'suspended') {
        await this.playbackContext.resume();
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
      
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      this.onStateChange("speaking");
      
      source.onended = () => {
        // Only set idle if this was the last chunk in the queue
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  async startScreenShare() {
    try {
      const getDisplayMedia = 
        navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices) || 
        (navigator as any).getDisplayMedia?.bind(navigator) ||
        (navigator as any).webkitGetDisplayMedia?.bind(navigator) ||
        (navigator as any).mozGetDisplayMedia?.bind(navigator);

      if (!getDisplayMedia) {
        throw new Error("Screen sharing is not supported in this browser or environment (like some mobile browsers or sandboxed iframes). Please try using a modern desktop browser (Chrome, Edge, Firefox) and open the app in a NEW TAB.");
      }

      this.screenStream = await getDisplayMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 5 }
        }
      });

      const video = document.createElement('video');
      video.srcObject = this.screenStream;
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      this.videoInterval = setInterval(() => {
        if (!this.sessionPromise || !ctx || video.paused || video.ended) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        
        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            video: { data: base64Data, mimeType: 'image/jpeg' }
          });
        }).catch(err => console.error("Error sending video frame", err));
      }, 1000);

      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

    } catch (error) {
      console.error("Failed to start screen share:", error);
      this.stopScreenShare();
    }
  }

  stopScreenShare() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
  }

  async stop() {
    if (this.isStopping) return;
    this.isStopping = true;
    
    this.stopScreenShare();
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          await this.audioContext.close();
        }
      } catch (e) {}
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.sessionPromise) {
      try {
        const session = await this.sessionPromise;
        if (session && typeof session.close === 'function') {
          session.close();
        }
      } catch (e) {
        console.error("Error closing session:", e);
      }
      this.sessionPromise = null;
    }
    
    this.onStateChange("idle");
    this.isStopping = false;
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }
}
