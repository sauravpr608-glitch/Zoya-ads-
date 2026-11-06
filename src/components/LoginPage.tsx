import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Mail, MapPin, Lock, ChevronRight } from "lucide-react";

interface LoginPageProps {
  onLogin: (userData: { name: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== "@123") {
      setError("Galat password! Zoya ke dil tak pahunchne ke liye sahi chabi chahiye.");
      return;
    }

    if (!formData.name) {
      setError("Aapna naam toh bataiye, Saurav Coder ka assistant banne ke liye ye zaroori hai.");
      return;
    }

    onLogin({
      name: formData.name,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] relative z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20"
          >
            <Lock className="text-white" size={32} />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white mb-2 italic">ZOYA LOGIN</h1>
          <p className="text-white/50 text-sm">Sirf Saurav Coder ke khaas logo ke liye.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Aapka Naam"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="password"
              placeholder="Khaas Password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-pink-500 text-xs text-center font-medium bg-pink-500/10 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full bg-white text-black font-bold h-14 rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group mt-6"
          >
            Zoya Se Milen
            <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </form>

        <p className="text-center mt-8 text-[11px] uppercase tracking-[0.2em] text-white/20 font-bold">
          Made with Love for Saurav Coder
        </p>
      </motion.div>
    </div>
  );
}
