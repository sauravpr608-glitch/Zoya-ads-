import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Keyboard, Send, Trash2, Monitor, MonitorOff, LogOut, User, Undo2, Redo2, Sparkles, Activity, BrainCircuit, LayoutDashboard, Cpu, CloudRain, Smartphone, Battery, Menu, X, Settings as SettingsIcon, Key } from "lucide-react";
import { getZoyaResponse, getZoyaAudio, resetZoyaSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import LoginPage from "./components/LoginPage";
import { playPCM, speakWithWebSpeech, stopSpeaking } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import { generateDailyProgress, getEvolutionLogs } from "./services/evolutionService";
import VoiceCloningModule, { AVAILABLE_PERSONAS, VoicePersona } from "./components/VoiceCloningModule";
import ZoyaDashboard from "./components/ZoyaDashboard";
import SettingsModal from "./components/SettingsModal";
import SwipeNavigation from "./components/SwipeNavigation";
import { syncService } from "./services/syncService";
import { loadZoyaSettings, ZoyaSettings } from "./services/settingsService";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const [redoStack, setRedoStack] = useState<ChatMessage[][]>([]);
  const messagesRef = useRef(messages);

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("zoya_user_info"));
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("zoya_user_info");
    return saved ? JSON.parse(saved) : null;
  });

  const [isLocked, setIsLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionLogs, setEvolutionLogs] = useState(getEvolutionLogs());
  const [latestBuildUrl, setLatestBuildUrl] = useState<string | null>(null);

  const [showVoiceCloningModal, setShowVoiceCloningModal] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<VoicePersona>(AVAILABLE_PERSONAS[0]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiSettings, setAiSettings] = useState<ZoyaSettings>(() => loadZoyaSettings());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(true);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) setAiSettings(e.detail);
    };
    window.addEventListener("zoya-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("zoya-settings-updated", handleSettingsUpdate);
  }, []);

  const handleUndo = useCallback(() => {
    if (messages.length === 0) return;
    
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length === 0) return prev;
      
      const lastMessage = newMessages[newMessages.length - 1];
      
      let removed: ChatMessage[] = [];
      if (lastMessage.sender === "zoya" && newMessages.length >= 2) {
        removed = newMessages.splice(-2, 2);
      } else {
        const item = newMessages.pop();
        if (item) removed = [item];
      }
      
      if (removed.length > 0) {
        setRedoStack(redo => [...redo, removed]);
      }
      return newMessages;
    });
  }, [messages]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    setRedoStack(prev => {
      const newStack = [...prev];
      const itemsToRestore = newStack.pop();
      
      if (itemsToRestore) {
        setMessages(msgs => [...msgs, ...itemsToRestore]);
      }
      return newStack;
    });
  }, [redoStack]);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zoya_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  useEffect(() => {
    if (isAuthenticated && userData && userData.name.toLowerCase().includes("saurav")) {
      syncService.connect("Saurav_Coder");

      syncService.onRemoteAction(async (command) => {
        console.log("EXECUTING REMOTE PROTOCOL:", command);
        if (command === "CAMERA_OPEN") {
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: "SYSTEM: Remote Camera Protocol Active. Opening camera view..." }]);
          window.open("https://webcamtests.com/", "_blank");
        } else if (command === "FLASHLIGHT_TOGGLE") {
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: "SYSTEM: Emitting high-intensity photonic burst (Flashlight toggled)." }]);
          const flash = document.createElement("div");
          flash.className = "fixed inset-0 bg-white z-[9999] transition-opacity duration-1000";
          document.body.appendChild(flash);
          setTimeout(() => { flash.style.opacity = "0"; setTimeout(() => flash.remove(), 1000); }, 100);
        } else if (command === "GET_LOCATION") {
          navigator.geolocation.getCurrentPosition((pos) => {
             setMessages(prev => [...prev, { 
               id: Date.now().toString(), 
               sender: "zoya", 
               text: `SYSTEM: Location ping received. Coordinates: ${pos.coords.latitude}, ${pos.coords.longitude}` 
             }]);
          });
        } else if (command === "DEVICE_LOCK") {
          setIsLocked(true);
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: "SYSTEM: Remote Lock Protocol Engaged." }]);
        }
      });
    }

    return () => {
      syncService.disconnect();
    };
  }, [isAuthenticated, userData]);

  const handleLogin = (data: { name: string; email?: string; address?: string }) => {
    setUserData(data);
    setIsAuthenticated(true);
    localStorage.setItem("zoya_user_info", JSON.stringify(data));
    
    if (data.name.toLowerCase().includes("saurav")) {
      generateDailyProgress();
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: "zoya", 
        text: "Saurav! Mere hero! Swagat hai wapas. Kal se maine mere neural core mein kaafi optimized evolution lines upgrade kiye hain... 😉" 
      }]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zoya_user_info");
    setIsAuthenticated(false);
    setUserData(null);
  };

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    setRedoStack([]);
    
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");
    const commandResult = processCommand(finalTranscript);
    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      if (commandResult.type === "battery") {
        try {
          const battery = await (navigator as any).getBattery();
          const level = Math.round(battery.level * 100);
          responseText = `Your battery is at ${level}%. ${level < 20 ? "Charge it fast, don't let me die!" : "Plenty of power for our next adventure."}`;
        } catch (e) {
          responseText = "I can't see your battery. Is it magic?";
        }
      } else if (commandResult.type === "lock") {
        setIsLocked(true);
      }
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zoya", text: responseText }]);
    } else {
      responseText = await getZoyaResponse(
        finalTranscript, 
        messagesRef.current, 
        userData, 
        (url) => setLatestBuildUrl(url),
        currentPersona.instruction
      );
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zoya", text: responseText }]);
      if (responseText.includes("remote_sync")) {
        const jsonMatch = responseText.match(/\{.*"remote_sync":\s*"(.*)".*\}/);
        if (jsonMatch && jsonMatch[1]) syncService.sendAction(jsonMatch[1]);
      }
    }

    if (!isMuted) {
      setAppState("speaking");
      const currentSettings = loadZoyaSettings();
      let audioPlayed = false;
      if (!currentSettings.useBrowserTTS) {
        try {
          const audioBase64 = await getZoyaAudio(responseText, currentPersona.voiceName);
          if (audioBase64) {
            await playPCM(audioBase64);
            audioPlayed = true;
          }
        } catch (e) {
          console.warn("PCM audio playback failed, falling back to Web Speech:", e);
        }
      }
      if (!audioPlayed) {
        await speakWithWebSpeech(responseText);
      }
    }
    setAppState("idle");
  }, [isMuted, isSessionActive, userData, currentPersona]);

  const toggleListening = async () => {
    stopSpeaking();
    if (isSessionActive) {
      setIsSessionActive(false);
      setIsScreenSharing(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      try {
        setIsSessionActive(true);
        resetZoyaSession();
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        session.onStateChange = (state) => setAppState(state);
        session.onMessage = (sender, text) => {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
          if (sender === "zoya" && text.includes("remote_sync")) {
            const jsonMatch = text.match(/\{.*"remote_sync":\s*"(.*)".*\}/);
            if (jsonMatch && jsonMatch[1]) syncService.sendAction(jsonMatch[1]);
          }
        };
        session.onCommand = (url) => {
          setLatestBuildUrl(url);
          setTimeout(() => window.open(url, "_blank"), 500);
        };
        await session.start(userData, currentPersona.voiceName, currentPersona.instruction);
      } catch (e: any) {
        setIsSessionActive(false);
        setAppState("idle");
        setShowPermissionModal(true);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!liveSessionRef.current) return;
    if (isScreenSharing) {
      liveSessionRef.current.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await liveSessionRef.current.startScreenShare();
        setIsScreenSharing(true);
      } catch (e: any) {
        setIsScreenSharing(false);
        alert(e.message || "Screen share failed.");
      }
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  return (
    <SwipeNavigation onBack={handleUndo}>
      <div className="h-[100dvh] w-screen bg-[#02040a] text-white flex flex-col font-sans relative overflow-hidden m-0 p-0 selection:bg-blue-500/30">
        
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/30 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-900/30 blur-[150px] rounded-full" />
        </div>

        <AnimatePresence>
          {!isAuthenticated && <LoginPage onLogin={handleLogin} />}
        </AnimatePresence>

        {showPermissionModal && <PermissionModal onClose={() => setShowPermissionModal(false)} />}

        <VoiceCloningModule 
          isOpen={showVoiceCloningModal} 
          onClose={() => setShowVoiceCloningModal(false)} 
          currentPersonaId={currentPersona.id}
          onSelectPersona={(persona) => {
            setCurrentPersona(persona);
            setShowVoiceCloningModal(false);
          }}
        />

        <ZoyaDashboard 
          isOpen={showDashboard} 
          onClose={() => setShowDashboard(false)} 
          userData={userData} 
          currentPersonaId={currentPersona.id}
          onSelectPersona={setCurrentPersona}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          userData={userData}
          onSettingsSaved={(s) => setAiSettings(s)}
        />

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLocked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-8 backdrop-blur-2xl">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-red-500/30">
                   <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-black" />
                </div>
                <h2 className="text-3xl font-bold mb-2 tracking-tighter uppercase">PROTOCOL LOCKED</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto mb-10 leading-relaxed uppercase tracking-[0.2em]">Security countermeasures active. Secondary authorization required.</p>
                <button onClick={() => setIsLocked(false)} className="px-12 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-xs transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">Authorize</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex-1 flex h-full w-full overflow-hidden z-10">
          {/* Sidebar */}
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-[100] w-72 flex flex-col bg-[#05060b] lg:bg-black/40 border-r border-white/5 backdrop-blur-3xl shrink-0 transition-all duration-500 ease-out
            ${isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100"}
          `}>
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">Z</div>
                  <div>
                    <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Zoya OS</h1>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Master V1.4</span>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-1.5">
                {[
                  { icon: <Sparkles size={18} />, label: "Creative Hub", color: "text-blue-400", cmd: "Saurav, Creative Hub se aap images aur creative content generate kar sakte hain." },
                  { icon: <Activity size={18} />, label: "Neural Flow", color: "text-cyan-400", cmd: "Neural Flow active hai! Main aapke commands aur thoughts ko process kar rahi hoon." },
                  { icon: <BrainCircuit size={18} />, label: "Logic Core", color: "text-violet-400", cmd: "Logic Core optimized hai. Main complex coding aur analysis ke liye taiyar hoon." },
                  { icon: <LayoutDashboard size={18} />, label: "Console", color: "text-emerald-400", cmd: "Console synced! Yahan se aap mere evolution logs aur builds track kar sakte hain." },
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: item.cmd }]);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10 text-left"
                  >
                    <div className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white">{item.label}</span>
                  </button>
                ))}

                {/* Settings / Grow API Sidebar Action */}
                <button 
                  onClick={() => {
                    setShowSettingsModal(true);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all group text-left mt-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-cyan-400 group-hover:rotate-45 transition-transform"><SettingsIcon size={18} /></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-200">Grow / Groq API</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 uppercase font-bold">
                    {aiSettings.provider === "groq" ? "Groq" : aiSettings.provider}
                  </span>
                </button>
              </nav>
            </div>

            <div className="mt-auto p-6 space-y-4">
              <div className="bg-white/5 rounded-3xl p-5 border border-white/5 backdrop-blur-xl">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Build Status</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                 </div>
                 {latestBuildUrl ? (
                   <button onClick={() => window.open(latestBuildUrl, "_blank")} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Launch Build</button>
                 ) : (
                   <div className="h-10 flex items-center justify-center border border-dashed border-white/10 rounded-xl text-[9px] uppercase text-white/20 font-bold">No Active Builds</div>
                 )}
              </div>

              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center font-bold text-sm shadow-xl ring-2 ring-white/5">
                  {userData?.name ? userData.name[0].toUpperCase() : "S"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{userData?.name || "Saurav Coder"}</p>
                  <button onClick={handleLogout} className="text-[10px] text-white/30 hover:text-red-400 transition-colors uppercase font-bold tracking-tighter">Sign Out</button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Visualizer */}
          <main className="flex-1 flex flex-col items-center justify-center relative min-w-0">
             <div className="absolute top-8 left-0 right-0 lg:left-12 lg:right-12 z-40 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:bg-white/10 transition-all"
                  >
                    <Menu size={20} />
                  </button>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                       <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400">Neural Link Active</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none opacity-90 italic">Hybrid Mind Environment</h2>
                  </div>
                </div>

                {/* Top Action Controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] group"
                    title="Open Grow API / Groq Settings"
                  >
                    <SettingsIcon size={18} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
                    <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Grow API</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200 font-bold uppercase">
                      {aiSettings.provider === "groq" ? "Groq" : aiSettings.provider}
                    </span>
                  </button>

                  <button 
                    onClick={() => setShowDashboard(true)}
                    className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                    title="Open System Dashboard"
                  >
                    <LayoutDashboard size={20} />
                  </button>
                </div>
             </div>

             <div className="w-full max-w-2xl aspect-video flex items-center justify-center scale-110 lg:scale-125">
                <Visualizer state={appState} isAnimeMode={userData?.isAnimeMode} />
             </div>

             {/* Quick Access Tools (Mobile Focused Grid) */}
             {!isSessionActive && (
               <div className="absolute inset-x-0 bottom-32 lg:bottom-40 px-6 flex flex-col items-center gap-4 z-40">
                 <div className="flex items-center gap-2 mb-2 opacity-30">
                    <div className="h-[1px] w-8 bg-white" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Quick Access Nodes</span>
                    <div className="h-[1px] w-8 bg-white" />
                 </div>
                  <div className="grid grid-cols-5 gap-2 lg:gap-3 w-full max-w-md">
                    {[
                      { icon: <Sparkles size={18} />, label: "Images", color: "bg-blue-500/10 text-blue-400" },
                      { icon: <Monitor size={18} />, label: "Builds", color: "bg-cyan-500/10 text-cyan-400" },
                      { icon: <Activity size={18} />, label: "Sync", color: "bg-emerald-500/10 text-emerald-400" },
                      { icon: <LayoutDashboard size={18} />, label: "System", color: "bg-violet-500/10 text-violet-400" },
                      { icon: <SettingsIcon size={18} />, label: "Grow API", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40" },
                    ].map((item, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          if (item.label === "Grow API") setShowSettingsModal(true);
                          else if (item.label === "System" || item.label === "Sync") setShowDashboard(true);
                          else setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: `Opening ${item.label} protocol... Searching for active requests.` }]);
                        }}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl ${item.color} flex items-center justify-center border border-white/5 group-active:scale-90 transition-all shadow-lg`}>
                          {item.icon}
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-wider text-white/50 text-center truncate w-full">{item.label}</span>
                      </button>
                    ))}
                 </div>
               </div>
             )}

             {/* Controls */}
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 space-y-6">
                <AnimatePresence>
                  {showTextInput && (
                    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onSubmit={handleTextSubmit} className="flex gap-2 p-1.5 bg-black/60 border border-white/10 rounded-full backdrop-blur-3xl shadow-2xl">
                      <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type command..." className="flex-1 bg-transparent px-6 border-none outline-none text-sm placeholder:text-white/20" autoFocus />
                      <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"><Send size={18} /></button>
                    </motion.form>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center justify-center gap-3">
                   <button onClick={() => setShowTextInput(!showTextInput)} className={`p-5 rounded-full border transition-all ${showTextInput ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}><Keyboard size={24} /></button>
                   <button onClick={toggleListening} className={`flex items-center gap-4 px-12 py-5 rounded-full font-black uppercase text-sm tracking-widest transition-all border shadow-2xl ${isSessionActive ? "bg-red-500/10 text-red-500 border-red-500/40 hover:bg-red-500/20" : "bg-blue-600 text-white border-blue-400/50 hover:bg-blue-500 hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.3)]"}`}>
                      {isSessionActive ? <><MicOff size={24} /><span>Stop</span></> : <><Mic size={24} /><span>Connect</span></>}
                   </button>
                   <button onClick={toggleMute} className={`p-5 rounded-full border transition-all ${isMuted ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>{isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
                </div>
             </div>
          </main>

          {/* Right Sidebar: Assistant & Info */}
          <aside className="hidden xl:flex w-80 flex-col bg-black/40 border-l border-white/5 backdrop-blur-3xl shrink-0">
             <div className="p-8 border-b border-white/5 space-y-6">
                <div>
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Environment</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">30°C HAZE</span>
                   </div>
                   <div className="space-y-3">
                      {[
                        { label: "Brain Load", value: "24%", color: "bg-blue-500", icon: <Cpu size={12} /> },
                        { icon: <Battery size={12} />, label: "Pulse", value: "72bpm", color: "bg-emerald-500" },
                        { label: "Sync Latency", value: "14ms", color: "bg-orange-500", icon: <Activity size={12} /> },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="text-white/20">{item.icon}</div>
                          <div className="flex-1">
                             <div className="flex justify-between text-[8px] font-black uppercase text-white/40 mb-1">
                                <span>{item.label}</span>
                                <span>{item.value}</span>
                             </div>
                             <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} className={`h-full ${item.color} shadow-[0_0_8px_${item.color}]`} />
                             </div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Active Log</span>
                   </div>
                   <div className="flex gap-1">
                      <button onClick={handleUndo} className="p-1 px-2.5 rounded-lg border border-white/5 text-white/20 hover:bg-white/5 hover:text-white"><Undo2 size={12} /></button>
                      <button onClick={handleRedo} className="p-1 px-2.5 rounded-lg border border-white/5 text-white/20 hover:bg-white/5 hover:text-white"><Redo2 size={12} /></button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar">
                   <AnimatePresence mode="popLayout">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-10 scale-75">
                           <Sparkles size={48} className="mb-4" />
                           <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-center">Awaiting Pulse</p>
                        </div>
                      ) : (
                        messages.map((msg, i) => (
                          <motion.div key={msg.id} initial={{ opacity: 0, x: msg.sender === "user" ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                             <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1 px-1">{msg.sender === "user" ? userData?.name || "User" : "Zoya"}</span>
                             <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed border ${msg.sender === "user" ? "bg-blue-600/10 border-blue-500/20 text-blue-100" : "bg-white/5 border-white/5 text-white/80 italic font-serif"}`}>{msg.text}</div>
                          </motion.div>
                        ))
                      )}
                   </AnimatePresence>
                   <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-white/5 grid grid-cols-2 gap-2">
                   <button onClick={() => { if(confirm("Flush neural logic?")) setMessages([]); }} className="py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-2"><Trash2 size={12} /> Flush</button>
                   <button onClick={() => setShowDashboard(true)} className="py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"><LayoutDashboard size={12} /> Sync</button>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </SwipeNavigation>
  );
}
