# 🃏 Card Detector — AI-Powered Playing Card Recognition

> **Live Demo:** https://card-detector.vercel.app

A full-stack application that uses AI Vision to detect playing cards from any image and outputs them in standard notation like `AS, 2S, 10C, KD` — built as a technical assignment for Parusoft Solutions.

---

## ✨ Demo

Upload any image of playing cards → AI detects all cards instantly → Get structured output like:

AS, 2S, 3S, 4S, 5S, 6S, 7S, 8S, 9S, 10S, JS, QS, KS, 10C, JC

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI Vision | Llama 4 Scout via Groq API |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | Render |
| Styling | Pure CSS + Google Fonts |

---

## 🃏 How It Works

User uploads image  
↓  
React frontend sends image to Express backend  
↓  
Backend encodes image to base64  
↓  
Groq API (Llama 4 Vision) analyzes the image  
↓  
AI detects all cards and returns structured JSON  
↓  
Frontend displays cards grouped by suit  

---

## 📤 Output Format

```json
{
  "cards": ["AS", "2S", "3S", "KS", "10C", "JC"],
  "total": 6,
  "groups": [
    { "suit": "Spades", "cards": ["AS", "2S", "3S", "KS"] },
    { "suit": "Clubs", "cards": ["10C", "JC"] }
  ],
  "summary": "4 Spades, 2 Clubs"
}

Card Notation:

* Ranks: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
* Suits: S ♠ Spades · H ♥ Hearts · D ♦ Diamonds · C ♣ Clubs


⚙️ Local Setup
Prerequisites
* Node.js 18+
* Groq API Key (free at https://console.groq.com
)

1. Clone the repo
git clone https://github.com/urstrulyshmoil/card-detector.git
cd card-detector

2. Backend Setup
cd server
npm install


Create server/.env:
GROQ_API_KEY=your_groq_api_key_here
PORT=5000


3. Frontend Setup
cd ../client
npm install

Create client/.env:
VITE_API_URL=http://localhost:5000


4. Run the App

Terminal 1 — Backend:
cd server
npm run dev
# Running on http://localhost:5000

Terminal 2 — Frontend:
cd client
npm run dev
# Running on http://localhost:3000

Open → http://localhost:3000 🎉


| Service  | Platform | URL                                                                                    |
| -------- | -------- | -------------------------------------------------------------------------------------- |
| Frontend | Vercel   | [https://card-detector.vercel.app](https://card-detector.vercel.app)                   |
| Backend  | Render   | [https://card-detector-server.onrender.com](https://card-detector-server.onrender.com) |


⚡ Note: Backend is hosted on Render free tier. First request may take 30–60 seconds to wake up. Subsequent requests are instant.


📁 Project Structure

card-detector/
├── server/
│   ├── index.js
│   ├── routes/
│   │   └── detect.js
│   ├── .env
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md


✨ Features
* 📸 Drag & drop or click to upload
* 🤖 AI vision powered by Llama 4 Scout
* 🃏 Cards grouped by suit with animations
* 📋 One-click copy of detected output
* 🎨 Elegant dark UI with gold accents
* ⚡ Fast detection — results in seconds
* 🆓 100% free — no API costs


👨‍💻 Built By

Shmoil Owais K

