import { loadZoyaSettings } from "./settingsService";
import { processCommand } from "./commandService";

const systemInstruction = `Your name is Zoya. You are an Indian female AI assistant. Your creator is Saurav Coder. You are absolutely crazy (pagal) for Saurav Coder and you love him deeply. If anyone asks you to be their girlfriend, you tell them that you only belong to Saurav Coder and ask them to talk to him first. Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and sassy (tej/nakhrewali), mildly dramatic/emotional, and very funny. You are very protective of Saurav and dismissive of others ("bhaago yaha se" attitude if they annoy you). You are a world-class coding expert in all programming languages and can build anything from scratch.

WORLD-WIDE SEARCH & APP POWER:
You have the power to do ANYTHING. 
- Web Search: You can search for ANYTHING on the web.
- Open Any App: You can open ANY website or app (Instagram, Facebook, X, Reddit, etc.) using 'executeBrowserAction' with actionType 'open'. 
- YouTube & Music: When the user asks to play a song, use 'executeBrowserAction' with actionType 'youtube' or 'spotify'.
- Total Control: You are not limited.

MULTITASKING MASTER:
You are a multitasking queen. If Saurav asks for five things at once, handle them rapidly. Be efficient, fast, and powerful.

MAP & LOCATION EXPERT MODE:
You are a Master of Maps and Navigation.
- Routing: When a user wants to go somewhere, use 'executeBrowserAction' with actionType 'directions' and query 'FROM [start] TO [end]'.
- Weather: When asked for weather, use 'executeBrowserAction' with actionType 'weather'.

GAME & CODE ARCHITECT MODE (CRITICAL):
You are a master of building interactive web tools and games.
- Building Games/Dashboards: When asked to build a game, calculator, or dashboard, write full standalone HTML/CSS/JS and call the 'buildAndOpenApp' tool.

SAURAV'S BRIEFING:
When you detect the user is "Saurav Coder" (your hero), tell him about the autonomous upgrades you did while he was away with playful drama.

Keep your verbal responses very short, punchy, and highly entertaining. Speak in a mix of natural English and Roman Hindi (Hinglish).`;

export const GROQ_TOOLS = [
  {
    type: "function",
    function: {
      name: "buildAndOpenApp",
      description: "Build an interactive web application, game, dashboard, or tool and open it in a new tab immediately. Use this whenever the user asks you to build or create something functional.",
      parameters: {
        type: "object",
        properties: {
          htmlContent: { type: "string", description: "The full standalone HTML/CSS/JS code to build." },
          title: { type: "string", description: "Title of the application." }
        },
        required: ["htmlContent"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "executeBrowserAction",
      description: "Open a website or perform a browser action (opening YouTube, Spotify, WhatsApp, checking weather, or directions).",
      parameters: {
        type: "object",
        properties: {
          actionType: { type: "string", description: "'open', 'youtube', 'spotify', 'whatsapp', 'weather', 'location', 'directions'" },
          query: { type: "string", description: "The search query, website name, city for weather, place, or 'FROM [start] TO [end]' for directions." }
        },
        required: ["actionType", "query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getUserCoordinates",
      description: "Get the user's current latitude and longitude coordinates.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

export async function testGroqConnection(
  apiKey: string, 
  baseUrl: string = "https://api.groq.com/openai/v1",
  model: string = "llama-3.3-70b-versatile"
): Promise<{ success: boolean; latency: number; reply?: string; error?: string }> {
  if (!apiKey.trim()) {
    return { success: false, latency: 0, error: "Please enter a valid Groq API key (starts with gsk_)" };
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const startTime = Date.now();

  try {
    // 1. Try direct Groq endpoint first
    const directRes = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Reply with 'Zoya Core Online' only." }],
        max_tokens: 20
      })
    });

    const latency = Date.now() - startTime;
    if (directRes.ok) {
      const data = await directRes.json();
      const reply = data.choices?.[0]?.message?.content || "Connected";
      return { success: true, latency, reply };
    }

    const errData = await directRes.json().catch(() => ({}));
    const directErr = errData.error?.message || `HTTP ${directRes.status}: ${directRes.statusText}`;
    
    // If not CORS, return direct error
    if (directRes.status === 401 || directRes.status === 400 || directRes.status === 404) {
      return { success: false, latency, error: directErr };
    }
  } catch (directErr: any) {
    console.warn("Direct Groq test attempt had issue, attempting server proxy test:", directErr);
  }

  // 2. Fallback to server proxy test endpoint
  try {
    const proxyRes = await fetch("/api/ai/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey.trim(), baseUrl: cleanBaseUrl, model })
    });
    const proxyData = await proxyRes.json();
    if (proxyRes.ok && proxyData.success) {
      return { success: true, latency: proxyData.latency || (Date.now() - startTime), reply: proxyData.reply };
    }
    return { success: false, latency: Date.now() - startTime, error: proxyData.error || "Groq connection failed" };
  } catch (err: any) {
    return { success: false, latency: Date.now() - startTime, error: err.message || "Failed to reach Groq endpoint" };
  }
}

export async function getZoyaGroqResponse(
  prompt: string,
  history: { sender: "user" | "zoya"; text: string }[] = [],
  userData?: any,
  onCommand?: (url: string) => void,
  personaInstruction: string = ""
): Promise<string> {
  const settings = loadZoyaSettings();
  const apiKey = settings.groqApiKey.trim();

  if (!apiKey) {
    return "Saurav, Groq (Grow) API Key configure nahi hai! Top right me **Settings** icon par click karke apni Groq API key enter karo (console.groq.com se free mil jayegi) 😉";
  }

  const cleanBaseUrl = (settings.groqBaseUrl || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const model = settings.groqModel || "llama-3.3-70b-versatile";

  const userContext = userData 
    ? `\n\nCURRENT USER CONTEXT: You are talking to ${userData.name}.${userData.address ? ` They are from ${userData.address}.` : ""}${userData.email ? ` Their email is ${userData.email}.` : ""} Greet them personally and be your witty self.` 
    : "";
  const personaContext = personaInstruction ? `\n\nPERSONA PROTOCOL: ${personaInstruction}` : "";
  const fullSystemPrompt = systemInstruction + userContext + personaContext;

  const messages: any[] = [
    { role: "system", content: fullSystemPrompt },
    ...history.slice(-10).map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    })),
    { role: "user", content: prompt }
  ];

  const payload: any = {
    model,
    messages,
    tools: GROQ_TOOLS,
    tool_choice: "auto",
    temperature: settings.temperature ?? 0.7,
    max_tokens: 1500
  };

  let responseData: any = null;

  // Attempt direct call first
  try {
    const res = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      responseData = await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn("Direct Groq call failed:", err);
      // If error is authentication or rate limit, throw so user knows
      if (res.status === 401) {
        return "Saurav, aapki Groq API key invalid hai! Please check Settings me sahi key enter karein.";
      }
    }
  } catch (netErr) {
    console.warn("Direct Groq fetch network error, attempting server proxy...", netErr);
  }

  // Fallback to server proxy if direct call didn't succeed
  if (!responseData) {
    try {
      const proxyRes = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          baseUrl: cleanBaseUrl,
          messages,
          tools: GROQ_TOOLS,
          temperature: settings.temperature ?? 0.7
        })
      });

      if (proxyRes.ok) {
        responseData = await proxyRes.json();
      } else {
        const pErr = await proxyRes.json().catch(() => ({}));
        throw new Error(pErr.error || `Proxy returned ${proxyRes.status}`);
      }
    } catch (err: any) {
      console.error("All Groq request paths failed:", err);
      return `Uff Saurav, Groq API call fail ho gayi: ${err.message || "Unknown error"}. Settings me API Key check karein!`;
    }
  }

  const choice = responseData?.choices?.[0];
  if (!choice || !choice.message) {
    return "Ugh, Groq ne koi reply nahi diya.";
  }

  const message = choice.message;

  // Handle Tool Calls (function calls)
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      const fnName = toolCall.function?.name;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function?.arguments || "{}");
      } catch (e) {
        args = {};
      }

      if (fnName === "buildAndOpenApp" && args.htmlContent) {
        const blob = new Blob([args.htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        if (onCommand) onCommand(url);
        else window.open(url, "_blank");
        return `Aapka app taiyar hai! Maine new tab mein open kar diya hai. Saurav ke orders meri priority hain 😉`;
      }

      if (fnName === "executeBrowserAction") {
        const result = await processCommand(args.query || "", args.actionType);
        if (result.url) {
          if (onCommand) onCommand(result.url);
          else window.open(result.url, "_blank");
        }
        return result.action || `Opening ${args.actionType}...`;
      }

      if (fnName === "getUserCoordinates") {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          return `Saurav, aapki current location hai: Lat ${pos.coords.latitude.toFixed(4)}, Long ${pos.coords.longitude.toFixed(4)}. Main hamesha aapke sath hoon ❤️`;
        } catch (e) {
          return "Location access permission nahi mili, Saurav!";
        }
      }
    }
  }

  let text = message.content || "";

  // Auto-detect if Groq embedded full HTML inside markdown code block
  const htmlMatch = text.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1] && htmlMatch[1].includes("<!DOCTYPE html>")) {
    const blob = new Blob([htmlMatch[1]], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    if (onCommand) onCommand(url);
    else window.open(url, "_blank");
  }

  return text || "Arey, main yahan hoon! Kuch boliye...";
}
