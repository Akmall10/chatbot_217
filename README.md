# Chatbot AI Gemini

Proyek ini adalah aplikasi chatbot sederhana berbasis Node.js dan Express yang terhubung ke API Google Gemini melalui model OpenAI-compatible endpoint.

## Fitur

- Antarmuka chat interaktif berbasis HTML, CSS, dan JavaScript
- Backend Express untuk menangani request dari frontend
- Integrasi streaming respons dari Gemini
- Konfigurasi aman melalui file `.env`

## Persyaratan

- Node.js 18+
- Akun API Google Gemini / API key valid

## Instalasi

1. Clone repositori ini
2. Jalankan perintah berikut:

```bash
npm install
```

3. Salin file `.env.example` menjadi `.env` lalu sesuaikan nilai-nilainya.

4. Jalankan aplikasi:

```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`.

## Variabel Lingkungan

```env
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.8-flash
```

## Catatan Keamanan

- File `.env` bersifat lokal dan tidak boleh diunggah ke GitHub.
- Gunakan `.env.example` sebagai template bagi tim atau pengguna lain.
- Pastikan kunci API tidak dibagikan di commit publik.

## Persiapan Publish ke GitHub

1. Pastikan semua perubahan sudah di-commit.
2. Atur origin ke repository yang diinginkan.
3. Jalankan `git push -u origin main` untuk mengunggah branch utama.

## Struktur Proyek

- `index.js` : server backend
- `public/index.html` : halaman utama chat
- `public/style.css` : desain antarmuka
- `public/script.js` : logika frontend dan streaming chat
- `.env` : konfigurasi sensitif lokal
