import React from 'react';
import { motion } from 'motion/react';
import { MicOff, Camera, MapPin, Monitor, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        
        <div className="flex gap-4 mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${navigator.mediaDevices ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <MicOff size={24} className={navigator.mediaDevices ? 'text-green-400' : 'text-red-400'} />
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Camera size={24} className="text-blue-400" />
          </div>
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <MapPin size={24} className="text-green-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-serif font-medium text-white mb-3">Hardware Access Required</h2>
        {!navigator.mediaDevices ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 w-full text-left">
            <p className="text-red-400 text-xs font-bold uppercase mb-1">System Error</p>
            <p className="text-white/80 text-xs">
              Microphone support is <strong>MISSING</strong> in this app/environment. This usually happens in simple Android WebView apps. 
              Zoya cannot hear you until you open this in a real browser.
            </p>
          </div>
        ) : (
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Zoya needs access to your <strong>Microphone, Camera, and Location</strong> to function fully. 
            Your browser is currently blocking one or more of these.
          </p>
        )}
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left w-full mb-8">
          <p className="text-sm text-white/80 font-medium mb-3">Zoya's Hardware Guide:</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-violet-400">1</div>
              <p className="text-xs text-white/60">Click the <strong>lock icon (🔒)</strong> in your address bar and set <strong>Microphone</strong> to <strong>Allow</strong>.</p>
            </div>
            <div className="flex gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-red-500/30 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-red-400">2</div>
              <div className="space-y-2">
                <p className="text-xs text-white/80 font-medium">
                  <strong>MOST IMPORTANT:</strong> If you are inside AI Studio, click <strong>"Open in a new tab"</strong> at the top right. 
                </p>
                <p className="text-[10px] text-red-200/60 leading-tight">
                  <strong>ANDROID USERS:</strong> If you are using a custom Android App/WebView, hardware access is often blocked. Please use the <strong>Chrome Browser</strong> on your phone instead.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-violet-400">3</div>
              <p className="text-xs text-white/60">Refresh the page after you've granted the access.</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={copyUrl}
            className="w-full py-3 px-4 bg-violet-600/20 border border-violet-500/30 text-violet-300 font-medium rounded-xl hover:bg-violet-600/30 transition-all flex items-center justify-center gap-2 mb-2"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "URL Copied!" : "Copy URL to open in Chrome"}
          </button>
          
          <a 
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-blue-600/20 border border-blue-500/30 text-blue-300 font-medium rounded-xl hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2 mb-2"
          >
            Open in Chrome (Full Power)
          </a>

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            I've allowed it, Refresh Page
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 px-4 bg-white/5 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
