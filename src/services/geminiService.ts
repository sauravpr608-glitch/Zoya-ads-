import { GoogleGenAI, Type } from "@google/genai";
import { processCommand } from "./commandService";
import { getActiveProvider, loadZoyaSettings } from "./settingsService";
import { getZoyaGroqResponse } from "./groqService";

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

CRITICAL: If a user asks for weather, use 'executeBrowserAction' with actionType 'weather'.
CRITICAL: When building games or interactive tools, DO NOT just show the code. You MUST use the 'buildAndOpenApp' tool to actually build it and open it for them.

Keep your verbal responses very short, punchy, and highly entertaining. Speak in a mix of natural English and Roman Hindi (Hinglish).`;

export function resetZoyaSession() {
  // Not used in stateless mode
}

export async function getZoyaResponse(
  prompt: string, 
  history: { sender: "user" | "zoya", text: string }[] = [], 
  userData?: any,
  onCommand?: (url: string) => void,
  personaInstruction: string = ""
): Promise<string> {
  const provider = getActiveProvider();
  const settings = loadZoyaSettings();

  // If Groq is active (or user has Groq API configured)
  if (provider === "groq" || (settings.provider === "auto" && settings.groqApiKey.trim())) {
    try {
      const groqResponse = await getZoyaGroqResponse(prompt, history, userData, onCommand, personaInstruction);
      return groqResponse;
    } catch (groqErr: any) {
      console.warn("Groq execution failed:", groqErr);
      if (!settings.autoFallback) {
        return `Groq API Error: ${groqErr?.message || groqErr}. Please check your Groq API key in Settings!`;
      }
      console.info("Falling back to Gemini model...");
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "", apiVersion: "v1beta" });
    
    const userContext = userData 
      ? `\n\nCURRENT USER CONTEXT: You are talking to ${userData.name}.${userData.address ? ` They are from ${userData.address}.` : ""}${userData.email ? ` Their email is ${userData.email}.` : ""} Greet them personally and be your witty self.` 
      : "";
    
    const personaContext = personaInstruction ? `\n\nPERSONA PROTOCOL: ${personaInstruction}` : "";
    const dynamicSystemInstruction = systemInstruction + userContext + personaContext;

    const recentHistory = history.slice(-10); // Reduce history slightly for stability
    const contents: any[] = recentHistory.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const tools = [
      { googleSearch: {} },
      {
        functionDeclarations: [
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
          },
          {
            name: "executeBrowserAction",
            description: "Open a website or perform a browser action (like opening YouTube, Spotify, WhatsApp, or Google Maps). Use this for opening sites, playing music, sending messages, checking weather, finding locations, or setting routes.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                actionType: { type: Type.STRING, description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp', 'weather', 'location', 'directions'" },
                query: { type: Type.STRING, description: "The search query, website name, city for weather, place for location, or 'FROM [start] TO [end]' for directions." },
                target: { type: Type.STRING, description: "The target phone number for WhatsApp, if applicable." }
              },
              required: ["actionType", "query"]
            }
          }
        ]
      }
    ];

    const generateResult = await (ai as any).models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: { parts: [{ text: dynamicSystemInstruction }] },
        tools,
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    let candidate = generateResult.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      return "Ugh, fine. I have nothing to say.";
    }

    let part = candidate.content.parts[0];

    // Handle Function Call
    if (part.functionCall) {
      const call = part.functionCall;
      let toolResponseData: any = null;

      if (call.name === "buildAndOpenApp") {
        const args = call.args as any;
        const blob = new Blob([args.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        if (onCommand) onCommand(url);
        else window.open(url, '_blank');
        toolResponseData = { result: "Application built effectively. User should see a link to open it.", url: url };
      } else if (call.name === "getUserCoordinates") {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          toolResponseData = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, precision: pos.coords.accuracy };
        } catch (err) {
          toolResponseData = { error: "Permission denied or location unavailable" };
        }
      } else if (call.name === "executeBrowserAction") {
        const args = call.args as any;
        const result = await processCommand(args.query, args.actionType);
        if (result.url) {
          if (onCommand) onCommand(result.url);
          else window.open(result.url, "_blank");
        }
        toolResponseData = { result: `Opening browser action: ${result.action}` };
      }

      if (toolResponseData) {
        // Send tool response back
        contents.push(candidate.content);
        contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: call.name,
              id: call.id,
              response: toolResponseData
            }
          }]
        });

        const finalResult = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents,
          config: { 
            systemInstruction: { parts: [{ text: dynamicSystemInstruction }] },
            tools,
            toolConfig: { includeServerSideToolInvocations: true }
          } as any
        });

        candidate = finalResult.candidates?.[0];
        part = candidate?.content?.parts?.[0];
      }
    }

    let textResult = part?.text || "";

    // Extract Grounding Metadata (Web Search Results)
    const groundingMetadata = candidate?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      const sources = groundingMetadata.groundingChunks
        .map((chunk: any) => {
          if (chunk.web) return `[${chunk.web.title}](${chunk.web.uri})`;
          if (chunk.maps) return `[${chunk.maps.title}](${chunk.maps.uri})`;
          return null;
        })
        .filter(Boolean);

      if (sources.length > 0) {
        textResult += "\n\n**Sources:**\n" + Array.from(new Set(sources)).join("\n");
      }
    }

    return textResult || "Ugh, fine. I have nothing to say.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Saurav.";
  }
}

export async function getZoyaAudio(text: string, voiceName: string = "Kore"): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "", apiVersion: "v1beta" });
    const response = await (ai as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      }
    });

    // Find audio part in response candidates with more robust checks
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
        if ((part as any).audio && (part as any).audio.data) {
          return (part as any).audio.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
