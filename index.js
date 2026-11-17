
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

function getGeminiConfig() {
    return {
        apiKey: process.env.LLM_API_KEY,
        baseUrl: process.env.LLM_BASE_URL,
        model: process.env.LLM_MODEL,
    };
}

// Halaman utama
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/health", (req, res) => {
    const { apiKey, baseUrl, model } = getGeminiConfig();

    res.json({
        status: "ok",
        provider: "Google Gemini",
        model: model || "belum dikonfigurasi",
        configured: Boolean(apiKey && baseUrl && model),
    });
});

// API Chatbot Gemini
app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body || {};
        const { apiKey, baseUrl, model } = getGeminiConfig();

        if (!apiKey || !baseUrl || !model) {
            return res.status(500).json({
                error: "Konfigurasi API pada file .env belum lengkap. Silakan isi LLM_API_KEY, LLM_BASE_URL, dan LLM_MODEL."
            });
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Messages harus berupa array dan tidak boleh kosong."
            });
        }

        const sanitizedMessages = messages
            .filter((msg) => msg && typeof msg === "object")
            .map((msg) => ({
                role: msg.role || "user",
                content: String(msg.content || "").trim()
            }))
            .filter((msg) => msg.content);

        if (sanitizedMessages.length === 0) {
            return res.status(400).json({
                error: "Pesan yang dikirim tidak valid."
            });
        }

        console.log("Menghubungkan ke Google Gemini...");
        console.log("Model:", model);

        const response = await fetch(
            `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: sanitizedMessages,
                    temperature: 0.7,
                    max_tokens: 1500,
                    stream: true
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Gemini API Error:", errorData);

            return res.status(response.status).json({
                error: errorData
            });
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        if (!response.body) {
            throw new Error("Response body tidak tersedia");
        }

        const reader = response.body.getReader();

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            if (res.destroyed) {
                await reader.cancel();
                break;
            }

            res.write(value);
        }

        res.end();
        console.log("Jawaban Gemini berhasil dikirim.");
    } catch (error) {
        console.error("Server Error:", error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Terjadi kesalahan server: " + error.message
            });
        } else {
            res.end();
        }
    }
});

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log(" CHATBOT AI BERHASIL DIJALANKAN");
    console.log("--------------------------------");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("Provider: Google Gemini");
    console.log(`Model: ${process.env.LLM_MODEL}`);
});
