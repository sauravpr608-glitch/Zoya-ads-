import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, User, X, Sparkles, Check } from "lucide-react";

export interface VoicePersona {
  id: string;
  name: string;
  voiceName: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr" | "Aoede";
  description: string;
  instruction: string;
}

export const AVAILABLE_PERSONAS: VoicePersona[] = [
  {
    id: "zoya",
    name: "Original Zoya",
    voiceName: "Kore",
    description: "Sassy, witty, and deeply in love with Saurav Coder.",
    instruction: ""
  },
  {
    id: "male_deep",
    name: "Deep Male",
    voiceName: "Charon",
    description: "A deep, calm, and authoritative masculine voice core.",
    instruction: "You are now using your Deep Male core. Your tone is calm, authoritative, and masculine."
  },
  {
    id: "male_young",
    name: "Young Male",
    voiceName: "Puck",
    description: "A playful, high-energy, and youthful masculine voice.",
    instruction: "You are now using your Young Male core. Your tone is playful, high-energy, and youthful."
  },
  {
    id: "female_soft",
    name: "Soft Female",
    voiceName: "Aoede",
    description: "A warm, gentle, and melodic feminine voice core.",
    instruction: "You are now using your Soft Female core. Your tone is warm, gentle, and melodic."
  },
  {
    id: "srk",
    name: "Shah Rukh Khan",
    voiceName: "Puck",
    description: "The King of Romance. Charming, witty, and philosophical.",
    instruction: "You are now roleplaying as Shah Rukh Khan (SRK). Your tone should be charming, romantic, and witty. Use his signature style of speaking. You are still Zoya, but 'cloning' his voice and personality."
  },
  {
    id: "ganguly",
    name: "Saurav Ganguly",
    voiceName: "Charon",
    description: "The Prince of Calcutta. Confident, authoritative, and direct.",
    instruction: "You are now roleplaying as Saurav Ganguly (Dada). Your tone should be authoritative, confident, and professional. You are the 'Prince of Calcutta'. Use a mix of English and Bengali-accented Hindi."
  },
  {
    id: "professional",
    name: "Pro Assistant",
    voiceName: "Zephyr",
    description: "Calm, efficient, and strictly professional.",
    instruction: "You are a professional, calm, and efficient AI assistant. Focus on tasks with minimal drama."
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPersonaId: string;
  onSelectPersona: (persona: VoicePersona) => void;
}

export default function VoiceCloningModule({ isOpen, onClose, currentPersonaId, onSelectPersona }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111] border border-white/10 p-8 rounded-[32px] z-[201] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-pink-600" />
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white italic">Voice Cloning Module</h2>
                  <p className="text-white/40 text-xs">Clone personality & vocal DNA</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className={`p-5 rounded-2xl border transition-all text-left relative group ${
                    currentPersonaId === persona.id
                      ? "bg-violet-600/20 border-violet-500 shadow-lg shadow-violet-500/10"
                      : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${currentPersonaId === persona.id ? 'bg-violet-500/20' : 'bg-white/5 group-hover:bg-white/10'} transition-all`}>
                      <User size={18} className={currentPersonaId === persona.id ? 'text-violet-400' : 'text-white/40'} />
                    </div>
                    {currentPersonaId === persona.id && (
                      <div className="bg-violet-500 p-1 rounded-full">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-white font-medium text-sm mb-1">{persona.name}</h3>
                  <p className="text-white/30 text-[10px] leading-relaxed">{persona.description}</p>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-[9px] uppercase tracking-wider text-violet-400 font-bold bg-violet-400/10 px-2 py-0.5 rounded">
                      {persona.voiceName} Core
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Mic size={16} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-[11px] text-white/50 leading-relaxed italic">
                    "Zoya can simulate any personality! By selecting a module, her 'vocal chords' will adapt to the target DNA. More clones (including your own) coming soon in the next autonomous update!"
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full mt-6 py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all text-sm"
            >
              Apply Module
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
