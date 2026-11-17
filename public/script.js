
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");

let messages = [];
let isLoading = false;

// Membuat elemen pesan
function addMessage(role, content) {

    const welcome = document.getElementById("welcomeScreen");

    if (welcome) {
        welcome.remove();
    }

    const message = document.createElement("div");
    message.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "A" : "✦";

    const body = document.createElement("div");
    body.className = "message-body";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = role === "user" ? "Kamu" : "Gemini AI";

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = content;

    body.appendChild(name);
    body.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(body);

    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return text;
}

// Indikator mengetik
function showTyping() {

    if (document.getElementById("typingIndicator")) {
        return;
    }

    const typing = document.createElement("div");
    typing.className = "typing";
    typing.id = "typingIndicator";
    typing.textContent = "✦ Gemini sedang berpikir...";

    chatMessages.appendChild(typing);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {

    const typing = document.getElementById("typingIndicator");

    if (typing) {
        typing.remove();
    }
}

// Mengirim pesan
function extractStreamPayload(buffer) {
    const lines = buffer.split("\n");
    const payloads = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();

        if (!data || data === "[DONE]") continue;

        try {
            const parsed = JSON.parse(data);
            payloads.push(parsed);
        } catch (error) {
            // Abaikan chunk yang belum selesai atau tidak valid
        }
    }

    return payloads;
}

async function sendMessage(text) {

    if (!text.trim() || isLoading) return;

    isLoading = true;

    sendButton.disabled = true;
    userInput.disabled = true;

    addMessage("user", text);

    messages.push({
        role: "user",
        content: text
    });

    userInput.value = "";
    userInput.style.height = "auto";

    showTyping();

    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                messages: messages
            })

        });

        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(
                errorData.error || "Gagal menghubungi Gemini"
            );
        }

        removeTyping();

        const responseText = addMessage("assistant", "");

        let fullResponse = "";

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {

            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
                stream: true
            });

            const payloads = extractStreamPayload(buffer);
            buffer = buffer.replace(/(?:^|\n)data:.*(?:\n|$)/g, "");

            for (const json of payloads) {
                const content = json.choices?.[0]?.delta?.content;

                if (typeof content === "string") {
                    fullResponse += content;
                    responseText.textContent = fullResponse;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        }

        const finalPayloads = extractStreamPayload(buffer + decoder.decode());

        for (const json of finalPayloads) {
            const content = json.choices?.[0]?.delta?.content;

            if (typeof content === "string") {
                fullResponse += content;
            }
        }

        responseText.textContent = fullResponse ||
            "Maaf, Gemini tidak memberikan jawaban.";

        messages.push({
            role: "assistant",
            content: fullResponse
        });

    } catch (error) {

        removeTyping();

        addMessage(
            "assistant",
            "Maaf, terjadi kesalahan: " + error.message
        );

        console.error("Chat Error:", error);

        // Menghapus pesan user yang gagal agar tidak merusak riwayat
        messages.pop();

    } finally {

        isLoading = false;

        sendButton.disabled = false;
        userInput.disabled = false;

        userInput.focus();

    }
}

// Submit form
chatForm.addEventListener("submit", (event) => {

    event.preventDefault();

    sendMessage(userInput.value);

});

// Enter untuk mengirim pesan
userInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        chatForm.requestSubmit();

    }

});

// Tinggi textarea otomatis
userInput.addEventListener("input", () => {

    userInput.style.height = "auto";

    userInput.style.height =
        Math.min(userInput.scrollHeight, 130) + "px";

});

function resetConversation() {
    messages = [];

    chatMessages.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">

            <div class="welcome-icon">✦</div>

            <p class="welcome-subtitle">
                YOUR PERSONAL AI ASSISTANT
            </p>

            <h2>
                Ada yang bisa saya<br>
                bantu hari ini?
            </h2>

            <p class="welcome-description">
                Mulai percakapan dan temukan berbagai ide,
                informasi, serta solusi bersama Gemini AI.
            </p>

            <div class="suggestions">

                <button class="suggestion">
                    <span>✧</span>
                    Jelaskan tentang Artificial Intelligence
                </button>

                <button class="suggestion">
                    <span>⌘</span>
                    Bantu saya membuat program
                </button>

                <button class="suggestion">
                    <span>◈</span>
                    Berikan ide kreatif untuk saya
                </button>

            </div>

        </div>
    `;

    userInput.value = "";
    userInput.style.height = "auto";
}

// Percakapan baru
newChatButton.addEventListener("click", () => {

    if (isLoading) return;

    removeTyping();
    resetConversation();

});

// Tombol saran
chatMessages.addEventListener("click", (event) => {

    const suggestion = event.target.closest(".suggestion");

    if (!suggestion || isLoading) return;

    const text = suggestion.textContent
        .replace(/^[✧⌘◈]\s*/, "")
        .trim();

    sendMessage(text);

});
