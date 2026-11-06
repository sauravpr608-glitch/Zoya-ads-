import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;
  app.use(express.json({ limit: "10mb" }));

  // Real-time Device Bridge Logic
  io.on("connection", (socket) => {
    console.log("Device connected:", socket.id);

    // Join a room based on user identity (Saurav Coder)
    socket.on("join-bridge", (userId) => {
      console.log(`User ${userId} joining bridge room`);
      socket.join(userId);
      // Notify other devices in the room
      socket.to(userId).emit("device-joined", { id: socket.id });
    });

    // Send command to remote device
    socket.on("send-remote-command", ({ userId, command }) => {
      console.log(`Relaying command to ${userId}:`, command);
      socket.to(userId).emit("remote-action", command);
    });

    socket.on("disconnect", () => {
      console.log("Device disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", sockets: io.engine.clientsCount });
  });

  // Proxy endpoint for Groq / OpenAI compatible chat completions
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { apiKey, model, baseUrl, messages, tools, temperature } = req.body;
      const key = apiKey || process.env.GROQ_API_KEY || "";
      if (!key) {
        return res.status(400).json({ error: "Groq API key not provided" });
      }

      const targetUrl = (baseUrl || "https://api.groq.com/openai/v1").replace(/\/+$/, "") + "/chat/completions";
      const payload: any = {
        model: model || "llama-3.3-70b-versatile",
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: 1500,
      };
      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = "auto";
      }

      const apiRes = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await apiRes.json();
      if (!apiRes.ok) {
        return res.status(apiRes.status).json(data);
      }
      return res.json(data);
    } catch (err: any) {
      console.error("AI Proxy Error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Quick connection test for Groq API Key
  app.post("/api/ai/test", async (req, res) => {
    try {
      const { apiKey, baseUrl, model } = req.body;
      const key = apiKey || process.env.GROQ_API_KEY || "";
      if (!key) {
        return res.status(400).json({ success: false, error: "API key is empty" });
      }

      const targetUrl = (baseUrl || "https://api.groq.com/openai/v1").replace(/\/+$/, "") + "/chat/completions";
      const startTime = Date.now();
      const apiRes = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Reply with 'Zoya Core Online' only." }],
          max_tokens: 20
        })
      });

      const latency = Date.now() - startTime;
      const data = await apiRes.json();
      if (!apiRes.ok) {
        return res.status(apiRes.status).json({
          success: false,
          error: data.error?.message || "Verification failed",
          latency
        });
      }

      const reply = data.choices?.[0]?.message?.content || "Connected";
      return res.json({ success: true, latency, reply, model: data.model });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Zoya Server running on http://localhost:${PORT}`);
  });
}

startServer();
