import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  LayoutDashboard, 
  Activity, 
  ShieldCheck, 
  Smartphone, 
  Zap,
  Globe,
  Cpu,
  Fingerprint,
  QrCode,
  Sparkles,
  User,
  Check,
  Mic,
  Settings as SettingsIcon,
  Key
} from "lucide-react";

import { syncService } from "../services/syncService";
import { AVAILABLE_PERSONAS, VoicePersona } from "./VoiceCloningModule";
import { loadZoyaSettings, ZoyaSettings } from "../services/settingsService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  currentPersonaId: string;
  onSelectPersona: (persona: VoicePersona) => void;
  onOpenSettings?: () => void;
}

export default function ZoyaDashboard({ isOpen, onClose, userData, currentPersonaId, onSelectPersona, onOpenSettings }: Props) {
  const [isSynced, setIsSynced] = React.useState(false);
  const [aiSettings, setAiSettings] = React.useState<ZoyaSettings>(loadZoyaSettings());

  React.useEffect(() => {
    if (isOpen) {
      setAiSettings(loadZoyaSettings());
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const checkSync = () => {
       // We'll consider it "synced" if we get a ping back or if the service says it's healthy
       // For a simple UI, we'll check if the socket is connected and user is Saurav
       setIsSynced(syncService.isConnected());
    };

    checkSync();
    const interval = setInterval(checkSync, 2000);
    
    syncService.onDeviceJoined(() => {
      setIsSynced(true);
    });

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[32px] z-[301] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-violet-900/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center border border-violet-500/20">
                  <LayoutDashboard className="text-violet-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white tracking-tight">System Dashboard</h2>
                  <p className="text-white/40 text-xs">Core Intelligence & Remote Sync Node</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onOpenSettings && (
                  <button 
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    title="Open API & Engine Settings"
                    className="p-3 hover:bg-white/10 rounded-full text-cyan-400 hover:text-cyan-300 transition-all ring-1 ring-cyan-500/20 bg-cyan-500/5 flex items-center gap-2 text-xs font-bold"
                  >
                    <SettingsIcon size={18} />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all ring-1 ring-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {/* Groq / Grow API Status Card */}
              <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-violet-950/30 to-black/60 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Zap size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                        AI Engine: {aiSettings.provider === "groq" ? "Groq (Grow API)" : aiSettings.provider === "gemini" ? "Gemini AI" : "Auto Mode"}
                      </h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${aiSettings.groqApiKey ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                        {aiSettings.groqApiKey ? "Groq Active" : "Key Needed"}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">
                      Model: <span className="text-cyan-300 font-mono text-[11px]">{aiSettings.groqModel || "llama-3.3-70b-versatile"}</span>
                      {aiSettings.groqApiKey ? " • API Key Verified" : " • Tap to enter your Groq API key"}
                    </p>
                  </div>
                </div>

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 w-fit shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  >
                    <SettingsIcon size={14} />
                    <span>Configure Grow API</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Stats Card 1 */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-violet-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                      <Zap className="text-cyan-400" size={20} />
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-400/10 px-2 py-1 rounded">ACTIVE</span>
                  </div>
                  <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Neural Latency</h4>
                  <p className="text-3xl font-serif font-bold text-white">24ms</p>
                  <div className="mt-4 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      className="h-full bg-cyan-500"
                    />
                  </div>
                </div>

                {/* Stats Card 2 */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-violet-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-pink-500/10 rounded-xl">
                      <Cpu className="text-pink-400" size={20} />
                    </div>
                    <span className="text-[10px] text-pink-400 font-bold bg-pink-400/10 px-2 py-1 rounded">SYNCED</span>
                  </div>
                  <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Cores Engaged</h4>
                  <p className="text-3xl font-serif font-bold text-white">128</p>
                  <div className="mt-4 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "88%" }}
                      className="h-full bg-pink-500"
                    />
                  </div>
                </div>

                {/* Stats Card 3 */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-violet-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-violet-500/10 rounded-xl">
                      <ShieldCheck className="text-violet-400" size={20} />
                    </div>
                    <span className="text-[10px] text-violet-400 font-bold bg-violet-400/10 px-2 py-1 rounded text-center">GENDER CORE</span>
                  </div>
                  <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Active DNA</h4>
                  <p className="text-3xl font-serif font-bold text-white">Hybrid</p>
                  <div className="mt-4 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className="h-full bg-violet-500"
                    />
                  </div>
                </div>

              </div>

              {/* Main Section */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Voice Persona Management */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <Mic className="text-violet-400" size={20} />
                    <h3 className="text-xl font-serif font-bold text-white">Neural Voice Modules</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {AVAILABLE_PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => onSelectPersona(persona)}
                        className={`p-4 rounded-2xl border transition-all text-left relative group ${
                          currentPersonaId === persona.id
                            ? "bg-violet-600/20 border-violet-500 shadow-lg shadow-violet-500/10"
                            : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={`p-1.5 rounded-lg ${currentPersonaId === persona.id ? 'bg-violet-500/20' : 'bg-white/5 group-hover:bg-white/10'} transition-all`}>
                            <User size={14} className={currentPersonaId === persona.id ? 'text-violet-400' : 'text-white/40'} />
                          </div>
                          {currentPersonaId === persona.id && (
                            <div className="bg-violet-500 p-1 rounded-full">
                              <Check size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-[11px] mb-1">{persona.name}</h3>
                        <p className="text-white/30 text-[9px] leading-tight mb-2 line-clamp-2">{persona.description}</p>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-[8px] uppercase tracking-wider text-violet-400 font-black bg-violet-400/10 px-2 py-0.5 rounded">
                            {persona.voiceName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={14} className="text-violet-400" />
                    </div>
                    <p className="text-[10px] text-white/40 italic leading-tight">
                      "Har module ke saath meri personality bilkul badal jati hai. Choose your favorite version!"
                    </p>
                  </div>
                </div>

                {/* Remote Device Management */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Smartphone className="text-cyan-400" size={20} />
                    <h3 className="text-xl font-serif font-bold text-white">Remote Node Status</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                          <Globe size={18} className="text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Primary Control</p>
                          <p className="text-[10px] text-white/30 text-emerald-400">Main Dashboard - Online</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">ACTIVE</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSynced ? 'bg-green-500/20' : 'bg-white/5'}`}>
                          <Smartphone size={18} className={isSynced ? 'text-green-400' : 'text-white/20'} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold italic ${isSynced ? 'text-green-400' : 'text-white/40'}`}>
                            {isSynced ? "Protocol Active" : "Secondary Node"}
                          </p>
                          <p className="text-[10px] text-white/20 uppercase tracking-widest">
                            {isSynced ? "Remote Link Stable" : "Awaiting Remote Ping"}
                          </p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'animate-pulse bg-yellow-500'}`} />
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <QrCode className="text-violet-400" size={16} />
                      <h5 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Quick Bridge (QR Mode)</h5>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="bg-white p-3 rounded-2xl shadow-xl shadow-violet-500/10">
                        <QRCodeSVG 
                          value={window.location.href} 
                          size={120}
                          level="H"
                          includeMargin={false}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-white/70 font-bold mb-2 uppercase tracking-tight">Step-by-Step (Hindi):</p>
                        <ol className="text-[10px] text-white/50 space-y-2 list-decimal pl-4 leading-relaxed">
                          <li>Apne <span className="text-cyan-400">doosre phone</span> ka camera open karein.</li>
                          <li>Is <span className="text-violet-400">QR Code</span> ko scan karein.</li>
                          <li>Same ID se login karein (Saurav Coder).</li>
                          <li>Zoya automatically dono devices ko bridge kar legi!</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Identity */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Fingerprint className="text-pink-400" size={20} />
                      <h3 className="text-xl font-serif font-bold text-white">Master Identity</h3>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                       <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl ring-4 ring-white/5">
                        {userData?.name ? userData.name[0].toUpperCase() : "S"}
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-white">{userData?.name || "Saurav Coder"}</p>
                        <p className="text-xs text-white/40 mb-2">Master Administrator</p>
                        <div className="flex gap-2">
                           <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/60">LVL 99</span>
                           <span className="text-[9px] bg-violet-500/20 px-2 py-0.5 rounded text-violet-400">CREATOR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/30">System Integrity</span>
                      <span className="text-cyan-400 font-bold tracking-tighter">99.9%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "99.9%" }}
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        transition={{ delay: 0.5, duration: 2 }}
                       />
                    </div>
                    
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Sparkles size={14} className={userData?.isAnimeMode ? "text-pink-400" : "text-white/20"} />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Anime Protocol</span>
                      </div>
                      <button 
                        onClick={() => {
                          const newUser = { ...userData, isAnimeMode: !userData?.isAnimeMode };
                          localStorage.setItem("zoya_user_info", JSON.stringify(newUser));
                          window.location.reload(); // Quickest way to sync state globally for now
                        }}
                        className={`w-10 h-5 rounded-full p-1 relative transition-colors ${userData?.isAnimeMode ? 'bg-pink-500' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: userData?.isAnimeMode ? 20 : 0 }}
                          className="w-3 h-3 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-black/40">
               <button 
                onClick={onClose}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
               >
                 Close Terminal
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
