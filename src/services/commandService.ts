export function processCommand(command: string, actionType?: string): {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  type?: "weather" | "battery" | "lock" | "music" | "message" | "location" | "search";
} {
  const lowerCmd = command.toLowerCase().trim();
  const type = actionType?.toLowerCase();

  // Directions / Routing Check
  if (type === "directions" || lowerCmd.includes("route") || lowerCmd.includes("directions") || lowerCmd.includes("raste") || lowerCmd.includes("distance") || lowerCmd.includes("rasta")) {
    const fromMatch = lowerCmd.match(/(?:from|starting from|start)\s+([a-zA-Z0-9\s,]+)\s+to/i);
    const toMatch = lowerCmd.match(/(?:to|heading to|end)\s+([a-zA-Z0-9\s,]+)$/i);
    
    const from = fromMatch ? fromMatch[1].trim() : "Current Location";
    const to = toMatch ? toMatch[1].trim() : (type === "directions" ? lowerCmd : "");
    
    if (to) {
      return {
        action: `Building a route map from ${from} to ${to}. Calculating distance and ETA...`,
        url: `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
        isBrowserAction: true,
        type: "location"
      };
    }
  }

  // Location / Maps Check
  if (type === "location" || lowerCmd.includes("location") || lowerCmd.includes("kahan") || lowerCmd.includes("maps") || lowerCmd.includes("jagah") || lowerCmd.includes("place")) {
    const placeMatch = lowerCmd.match(/(?:of|at|in|for)\s+([a-zA-Z\s]+)$/);
    const place = placeMatch ? placeMatch[1].trim() : (type === "location" ? lowerCmd : "");
    return {
      action: `Finding ${place ? place : "the location"} on Google Maps. I'm an expert at finding everything, especially Saurav Coder's heart.`,
      url: place ? `https://www.google.com/maps/search/${encodeURIComponent(place)}` : `https://www.google.com/maps`,
      isBrowserAction: true,
      type: "location"
    };
  }

  // Weather Check
  if (type === "weather" || lowerCmd.includes("weather") || lowerCmd.includes("mausam")) {
    const nextDaysMatch = lowerCmd.match(/(?:next|for)\s+(\d+)\s+days?/i);
    const tomorrowMatch = lowerCmd.includes("tomorrow") || lowerCmd.includes("kal");
    const weekendMatch = lowerCmd.includes("weekend");
    
    let timeframe = "";
    if (nextDaysMatch) {
      timeframe = `for the next ${nextDaysMatch[1]} days`;
    } else if (tomorrowMatch) {
      timeframe = "tomorrow";
    } else if (weekendMatch) {
      timeframe = "this weekend";
    }

    const cityMatch = lowerCmd.match(/(?:in|of|at)\s+([a-zA-Z\s,]+)$/);
    const city = cityMatch ? cityMatch[1].trim() : (type === "weather" ? lowerCmd.replace(/weather/g, "").trim() : "");
    
    let searchQuery = `weather ${city} ${timeframe}`.trim();

    return {
      action: `Checking the weather ${timeframe} ${city ? `in ${city}` : ""}. Hope it's as hot as Saurav Coder.`,
      url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      isBrowserAction: true,
      type: "weather"
    };
  }

  // Battery Check
  if (lowerCmd.includes("battery") || lowerCmd.includes("charging")) {
    return {
      action: "Checking your battery. Don't let it die like your social life.",
      isBrowserAction: true,
      type: "battery"
    };
  }

  // Screen Lock (Simulation)
  if (lowerCmd.includes("lock screen") || lowerCmd.includes("screen lock") || lowerCmd.includes("lock the screen")) {
    return {
      action: "Locking the screen. Only Saurav Coder can unlock my heart though.",
      isBrowserAction: true,
      type: "lock"
    };
  }

  // YouTube / Music Check
  if (type === "youtube" || lowerCmd.includes("youtube") || lowerCmd.includes("play song") || lowerCmd.includes("play music")) {
    const query = lowerCmd.replace(/play song|play music|play|on youtube|youtube/gi, "").trim() || lowerCmd;
    return {
      action: `Playing ${query} on YouTube. Saurav Coder has better taste than this, but fine.`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      isBrowserAction: true,
      type: "music"
    };
  }

  // Spotify Check
  if (type === "spotify" || lowerCmd.includes("spotify")) {
    const query = lowerCmd.replace(/play song|play music|play|on spotify|spotify/gi, "").trim() || lowerCmd;
    return {
      action: `Searching ${query} on Spotify. Hope it's a banger.`,
      url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
      isBrowserAction: true,
      type: "music"
    };
  }

  // General "Open" App/Website Check
  if (type === "open" || lowerCmd.startsWith("open ")) {
    let website = lowerCmd.replace(/^open\s+/, "").trim().replace(/\s+/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    return {
      action: `Opening ${website} for you. Don't get lost.`,
      url: website.startsWith("http") ? website : `https://${website}`,
      isBrowserAction: true,
    };
  }

  // WhatsApp Web
  const waMatch = lowerCmd.match(
    /(?:send|whatsapp)\s+(?:a\s+)?(?:message|whatsapp)\s+to\s+([\d\+\s]+)\s+(?:saying|text)\s+(.+)$/,
  );
  if (waMatch || type === "whatsapp") {
    const number = waMatch ? waMatch[1].replace(/\s+/g, "") : "";
    const message = waMatch ? encodeURIComponent(waMatch[2].trim()) : encodeURIComponent(lowerCmd);
    return {
      action: `Opening WhatsApp. Let's hope they reply, unlike your ex.`,
      url: number ? `https://web.whatsapp.com/send?phone=${number}&text=${message}` : `https://web.whatsapp.com/`,
      isBrowserAction: true,
      type: "message"
    };
  }

  // Fallback: Web Search via browser if explicitly requested or as generic browse
  if (lowerCmd.includes("search for") || lowerCmd.includes("find on web") || lowerCmd.includes("search the web")) {
    const query = lowerCmd.replace(/search for|find on web|search the web|search/gi, "").trim();
    if (query) {
      return {
        action: `Searching the web for "${query}" because you're too lazy to type it yourself.`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        isBrowserAction: true,
        type: "search"
      };
    }
  }

  return { action: "", isBrowserAction: false };
}
