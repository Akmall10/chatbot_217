
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

// Halaman utama
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// API Chatbot Gemini
app.post("/api/chat", async (req, res) => {
    try {
        const messages = req.body.messages;

        const apiKey = process.env.LLM_API_KEY;
        const baseUrl = process.env.LLM_BASE_URL;
        const model = process.env.LLM_MODEL;

        // Validasi konfigurasi
        if (!apiKey || !baseUrl || !model) {
            return res.status(500).json({
                error: "Konfigurasi API pada file .env belum lengkap"
            });
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Messages harus berupa array dan tidak boleh kosong"
            });
        }

        console.log("Menghubungkan ke Google Gemini...");
        console.log("Model:", model);

        // Request ke Gemini
        const response = await fetch(
            `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1500,
                    stream: true
                })
            }
        );

        // Pemeriksaan respons API
        if (!response.ok) {
            const errorData = await response.text();

            console.error("Gemini API Error:", errorData);

            return res.status(response.status).json({
                error: errorData
            });
        }

        // Header streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        // Meneruskan streaming Gemini ke frontend
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

// Menjalankan server
app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log(" CHATBOT AI BERHASIL DIJALANKAN");
    console.log("--------------------------------");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("Provider: Google Gemini");
    console.log(`Model: ${process.env.LLM_MODEL}`);
});
