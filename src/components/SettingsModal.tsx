import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Settings as SettingsIcon, 
  Key, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  RotateCcw, 
  Sparkles,
  Volume2,
  Sliders,
  Terminal,
  Activity,
  Layers
} from "lucide-react";
import { 
  loadZoyaSettings, 
  saveZoyaSettings, 
  ZoyaSettings, 
  GROQ_MODEL_OPTIONS, 
  AIProvider 
} from "../services/settingsService";
import { testGroqConnection } from "../services/groqService";
import { speakWithWebSpeech, stopSpeaking } from "../utils/audioUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userData?: any;
  onSettingsSaved?: (newSettings: ZoyaSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, userData, onSettingsSaved }: Props) {
  const [settings, setSettings] = useState<ZoyaSettings>(loadZoyaSettings());
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"api" | "voice" | "system">("api");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency?: number;
    reply?: string;
    error?: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      const current = loadZoyaSettings();
      setSettings(current);
      setTestResult(null);
      setSaveSuccess(false);
      // Check if current model is custom
      const isPreset = GROQ_MODEL_OPTIONS.some(m => m.id === current.groqModel);
      if (!isPreset && current.groqModel) {
        setCustomModelInput(current.groqModel);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalModel = customModelInput.trim() || settings.groqModel;
    const updated = saveZoyaSettings({
      ...settings,
      groqModel: finalModel
    });
    setSaveSuccess(true);
    if (onSettingsSaved) onSettingsSaved(updated);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const modelToTest = customModelInput.trim() || settings.groqModel;
    const res = await testGroqConnection(settings.groqApiKey, settings.groqBaseUrl, modelToTest);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleTestVoice = async () => {
    stopSpeaking();
    await speakWithWebSpeech("Saurav! Groq API test successful hai. Main ab aur bhi fast reply karungi!");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[92vh] bg-[#07090e] border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col z-10 text-white"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />

          {/* Modal Header */}
          <div className="p-6 md:p-7 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-violet-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <SettingsIcon size={22} className="animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                    Settings & API Config
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 tracking-wider uppercase">
                    Grow / Groq Core
                  </span>
                </div>
                <p className="text-xs text-white/40 tracking-wide mt-0.5">
                  Configure Groq API (Grow API), models, voice, and system behavior
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all border border-white/5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 px-6 gap-2 bg-black/40">
            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "api"
                  ? "border-cyan-400 text-cyan-400 bg-cyan-400/5"
                  : "border-transparent text-white/40 hover:text-white/80"
              }`}
            >
              <Key size={14} />
              <span>Groq / Grow API</span>
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "voice"
                  ? "border-violet-400 text-violet-400 bg-violet-400/5"
                  : "border-transparent text-white/40 hover:text-white/80"
              }`}
            >
              <Volume2 size={14} />
              <span>Voice & Audio</span>
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "system"
                  ? "border-pink-400 text-pink-400 bg-pink-400/5"
                  : "border-transparent text-white/40 hover:text-white/80"
              }`}
            >
              <Cpu size={14} />
              <span>System & Identity</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
            {activeTab === "api" && (
              <div className="space-y-6">
                {/* Provider Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-2.5">
                    Select AI Engine Provider
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "groq",
                        name: "Groq (Grow API)",
                        badge: "Ultra-Fast",
                        sub: "Llama 3.3 / Mixtral (Sub-100ms)",
                        color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                      },
                      {
                        id: "gemini",
                        name: "Gemini AI",
                        badge: "Google",
                        sub: "Gemini 3 Flash & Multimodal",
                        color: "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      },
                      {
                        id: "auto",
                        name: "Auto Hybrid",
                        badge: "Smart",
                        sub: "Groq primary, Gemini fallback",
                        color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      }
                    ].map((p) => {
                      const isSelected = settings.provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, provider: p.id as AIProvider })}
                          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                            isSelected
                              ? `${p.color} ring-1 ring-white/20 shadow-lg`
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/60"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 uppercase">
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 leading-snug">{p.sub}</p>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Groq API Key Input Card */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-cyan-400" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Groq API Key (Grow Key)
                        </h4>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        Apni free Groq Cloud key yahan paste karein (starts with{" "}
                        <code className="text-cyan-300 font-mono text-[10px]">gsk_</code>)
                      </p>
                    </div>

                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/30 w-fit"
                    >
                      <span>Get Free Groq Key</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={settings.groqApiKey}
                      onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                      placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-cyan-200 placeholder:text-white/20 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 transition-colors"
                      title={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Test Connection Button & Result */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTesting || !settings.groqApiKey.trim()}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        !settings.groqApiKey.trim()
                          ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                          : "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/40 hover:scale-[1.02]"
                      }`}
                    >
                      {isTesting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>Testing Ping...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>Test Groq Connection</span>
                        </>
                      )}
                    </button>

                    {testResult && (
                      <div
                        className={`text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 border ${
                          testResult.success
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/10 border-red-500/30 text-red-300"
                        }`}
                      >
                        {testResult.success ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span>
                              Connected! Latency: <b>{testResult.latency}ms</b> ({testResult.reply})
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} className="text-red-400" />
                            <span className="truncate max-w-xs">{testResult.error}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Groq Model Selector */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                      Groq Model Selection
                    </label>
                    <span className="text-[10px] text-cyan-400/80 font-mono">
                      Active: {customModelInput.trim() || settings.groqModel}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {GROQ_MODEL_OPTIONS.map((m) => {
                      const isSelected = settings.groqModel === m.id && !customModelInput.trim();
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setCustomModelInput("");
                            setSettings({ ...settings, groqModel: m.id });
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-cyan-500/10 border-cyan-500/40 text-white"
                              : "bg-white/[0.02] border-white/5 hover:border-white/15 text-white/70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? "border-cyan-400 bg-cyan-400" : "border-white/30"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{m.name}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 uppercase text-white/60">
                                  {m.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40">{m.description}</p>
                            </div>
                          </div>

                          <code className="hidden sm:block text-[10px] font-mono text-white/30">
                            {m.id}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
                  >
                    <Sliders size={14} />
                    <span>{showAdvanced ? "Hide Advanced Config" : "Show Advanced Config (Grok / Custom Base URL)"}</span>
                  </button>

                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                          Custom Model Name (Overrides preset if typed)
                        </label>
                        <input
                          type="text"
                          value={customModelInput}
                          onChange={(e) => setCustomModelInput(e.target.value)}
                          placeholder="e.g. grok-beta, llama-3.3-70b-versatile, etc."
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                          API Base URL (Default: https://api.groq.com/openai/v1)
                        </label>
                        <input
                          type="text"
                          value={settings.groqBaseUrl}
                          onChange={(e) => setSettings({ ...settings, groqBaseUrl: e.target.value })}
                          placeholder="https://api.groq.com/openai/v1"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-500/50"
                        />
                        <p className="text-[9px] text-white/30 mt-1">
                          Tip: Use <code className="text-cyan-400">https://api.x.ai/v1</code> with a Grok key to use xAI Grok!
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-xs font-bold text-white">Auto-Fallback to Gemini</p>
                          <p className="text-[10px] text-white/40">If Groq rate-limits or fails, use Gemini</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, autoFallback: !settings.autoFallback })}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${
                            settings.autoFallback ? "bg-cyan-500" : "bg-white/10"
                          }`}
                        >
                          <motion.div
                            animate={{ x: settings.autoFallback ? 20 : 0 }}
                            className="w-4 h-4 bg-white rounded-full shadow"
                          />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="space-y-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Speech Synthesis Engine
                      </h4>
                      <p className="text-xs text-white/40 mt-0.5">
                        Enable browser speech so Zoya speaks even with Groq (Grow) API
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, useBrowserTTS: !settings.useBrowserTTS })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                        settings.useBrowserTTS ? "bg-violet-600" : "bg-white/10"
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.useBrowserTTS ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow"
                      />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestVoice}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <Volume2 size={14} />
                      <span>Test Speech Output</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                  <p className="text-xs text-violet-300 leading-relaxed font-sans">
                    💡 <b>Tip:</b> Groq Cloud is lightning fast for text generation. With Browser Speech enabled, Zoya reads her response aloud in Hindi/English instantly without waiting for audio generation!
                  </p>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    User Profile & Authority
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center font-bold text-xl text-white">
                      {userData?.name ? userData.name[0].toUpperCase() : "S"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{userData?.name || "Saurav Coder"}</p>
                      <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                        Master Administrator & Creator
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Memory & Reset
                  </h4>
                  <p className="text-xs text-white/40">
                    Clear local chat conversation history to start a fresh Zoya session
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Reset chat history?")) {
                        localStorage.removeItem("zoya_chat_history");
                        window.location.reload();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <RotateCcw size={14} />
                    <span>Flush Conversation History</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-white/5 bg-black/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              {saveSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-bounce">
                  <Check size={16} /> Saved & Active!
                </span>
              ) : (
                <span className="text-white/40 text-[11px]">
                  Engine: <b className="text-cyan-400 uppercase">{settings.provider}</b> | Model:{" "}
                  <b className="text-white/70">{customModelInput || settings.groqModel}</b>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 flex items-center gap-2"
              >
                <Check size={14} />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
