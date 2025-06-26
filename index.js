const express = require("express");
const cors = require("cors");
const mongoCheck = require("./mongoDB");  // renamed from mongoCheck
const Chat = require("./model");

const app = express();
app.use(cors());
app.use(express.json());
const OPENROUTER_API_KEY = "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"; // 🔐 Keep this secret!

mongoCheck(); // Just connects DB, doesn't return data

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));


// POST endpoint to handle chat
app.post("/ask", async (req, res) => {
  const userMessage = req.body.message;
  console.log(userMessage);
  const userId = req.body.userId || "defaultUser";

  try {
     const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    await Chat.deleteMany({ userId, timestamp: { $lt: oneWeekAgo } });
    // Fetch last 6 chats from DB
    const previousMessages = await Chat.find({ userId }).sort({ timestamp: 1 }).limit(6);
    const history = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Save current user message
    await Chat.create({
      role: "user",
      content: userMessage,
      userId,
      timestamp: new Date()
    });

    // Fetch business context
    const businessContextData = await mongoCheck(); // Now this should return actual context
    const businessContext = JSON.stringify(businessContextData, null, 2);

    // Make request to OpenRouter
    const fetchResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://kalpai-frontend-2v9do28j7-pandeyvipuls-projects.vercel.app",
        "X-Title": "Kalp AI Assistant",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small-3.2-24b-instruct:free",
        messages: [
          { role: "system", content: businessContext },
          ...history,
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await fetchResponse.json();

    // Handle OpenRouter errors
    if (data.error) {
      console.error("OpenRouter Error:", data.error);
      return res.status(500).json({ error: data.error.message || "AI provider error" });
    }

    const reply = data.choices?.[0]?.message?.content || "No response received.";

    // Save assistant's reply
    await Chat.create({
      role: "assistant",
      content: reply,
      userId,
      timestamp: new Date()
    });

    res.json({ response: reply });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Something went wrong with the AI request." });
  }
});

app.post("/ping", async (req, res) => {
  console.log("Ping received!");
  res.sendStatus(200);
})
app.listen(5000, () => {
  console.log("✅ Server is running on http://localhost:5000");
});
