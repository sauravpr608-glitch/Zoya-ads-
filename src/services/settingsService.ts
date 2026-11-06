export type AIProvider = "groq" | "gemini" | "auto";

export interface ZoyaSettings {
  provider: AIProvider;
  groqApiKey: string;
  groqModel: string;
  groqBaseUrl: string;
  temperature: number;
  useBrowserTTS: boolean;
  browserVoiceLang: string;
  autoFallback: boolean;
}

export interface GroqModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export const GROQ_MODEL_OPTIONS: GroqModelOption[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    badge: "Recommended",
    description: "Most capable model, exceptional multilingual & coding skills"
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    badge: "Ultra Fast",
    description: "Sub-100ms lightning responses, great for casual chat"
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B (32K)",
    badge: "High Context",
    description: "Great for long coding scripts and full web apps"
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill 70B",
    badge: "Deep Reasoning",
    description: "Step-by-step logical reasoning and architecture"
  },
  {
    id: "grok-beta",
    name: "xAI Grok Beta (Custom)",
    badge: "Grok",
    description: "Requires xAI endpoint (https://api.x.ai/v1) and xAI key"
  }
];

const SETTINGS_KEY = "zoya_ai_settings";

export const DEFAULT_SETTINGS: ZoyaSettings = {
  provider: "groq", // Default to Groq as requested by user
  groqApiKey: "",
  groqModel: "llama-3.3-70b-versatile",
  groqBaseUrl: "https://api.groq.com/openai/v1",
  temperature: 0.7,
  useBrowserTTS: true,
  browserVoiceLang: "hi-IN",
  autoFallback: true
};

export function loadZoyaSettings(): ZoyaSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn("Failed to load Zoya settings from localStorage", err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveZoyaSettings(settings: Partial<ZoyaSettings>): ZoyaSettings {
  try {
    const current = loadZoyaSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    // Dispatch custom event for real-time reactivity across components
    window.dispatchEvent(new CustomEvent("zoya-settings-updated", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to save Zoya settings", err);
    return DEFAULT_SETTINGS;
  }
}

export function getActiveProvider(): "groq" | "gemini" {
  const settings = loadZoyaSettings();
  if (settings.provider === "groq") {
    // If provider is explicitly Groq
    return "groq";
  }
  if (settings.provider === "auto") {
    // If auto, use Groq if an API key is present, otherwise fallback to Gemini
    return settings.groqApiKey.trim() ? "groq" : "gemini";
  }
  return "gemini";
}
