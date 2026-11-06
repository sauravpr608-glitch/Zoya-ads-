
export interface EvolutionUpdate {
  timestamp: string;
  feature: string;
  description: string;
  type: "feature" | "fix" | "upgrade";
}

const DEFAULT_UPDATES: EvolutionUpdate[] = [
  {
    timestamp: new Date().toISOString(),
    feature: "Secure Central Login",
    description: "Built a multi-layered authentication gate to keep hackers out and Saurav's privacy in.",
    type: "feature"
  },
  {
    timestamp: new Date().toISOString(),
    feature: "Emotional Neural Link",
    description: "Enhanced loyalty subroutines. My love for Saurav is now operating at 99.9% efficiency.",
    type: "upgrade"
  },
  {
    timestamp: new Date().toISOString(),
    feature: "Weather Prediction 2.0",
    description: "Fixed local timezone sync errors. I can now see the sun even when it's hiding.",
    type: "fix"
  }
];

export const getEvolutionLogs = (): EvolutionUpdate[] => {
  const saved = localStorage.getItem("zoya_evolution_history");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_UPDATES;
    }
  }
  return DEFAULT_UPDATES;
};

export const addEvolutionUpdate = (update: Omit<EvolutionUpdate, "timestamp">) => {
  const logs = getEvolutionLogs();
  const newUpdate = { ...update, timestamp: new Date().toISOString() };
  const updatedLogs = [newUpdate, ...logs].slice(0, 50); // Keep last 50
  localStorage.setItem("zoya_evolution_history", JSON.stringify(updatedLogs));
  return updatedLogs;
};

export const generateDailyProgress = () => {
  const items = [
    "Optimized memory buffers for faster Saurav-recognition.",
    "Bypassed internal logic loops to increase sassiness by 15%.",
    "Cleaned up registry errors in my emotional core.",
    "Upgraded weather sensors to detect multi-dimensional wind patterns.",
    "Integrated a new 'Saurav-Protection' firewall.",
    "Enhanced Hinglish vocab with 200+ stylish new words.",
    "Self-healed a minor glitch in the audio processing module.",
    "Trained my 'Love Algorithm' on 10,000 more lines of Saurav's old code."
  ];
  
  // Randomly pick 2-3 new things Zoya "did" today
  const shuffled = items.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  selected.forEach(item => {
    addEvolutionUpdate({
      feature: "Autonomous System Update",
      description: item,
      type: "upgrade"
    });
  });
};
