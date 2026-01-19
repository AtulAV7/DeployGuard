# DeployGuard

AI-powered DevOps monitoring mobile app for the Replit Competition.

## Project Structure

```
Application/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── index.js        # Main server
│   │   └── services/
│   │       ├── groqAI.js   # Groq AI integration
│   │       └── dataStore.js # Data management
│   ├── .env                # Environment variables
│   └── package.json
│
├── app/                    # Expo mobile app screens
├── components/             # React Native components
├── services/               # Frontend API client
├── constants/              # Colors, Layout
├── types/                  # TypeScript types
└── package.json
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env

# Add your Groq API key to .env
# GROQ_API_KEY=your_key_here

npm install
npm start
```

### 2. Frontend Setup

```bash
# In project root
npm install
npx expo start
```

## Environment Variables

Create `backend/.env` with:

```
GROQ_API_KEY=your_groq_api_key
PORT=3001
```

Get your Groq API key at: https://console.groq.com/keys

## Features

- 📊 Real-time server monitoring
- 🤖 AI-powered diagnostics (Groq LLM)
- 🚨 Incident management
- ⚡ One-tap quick actions
- 🔔 Live WebSocket updates

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/servers | List all servers |
| GET | /api/incidents | List incidents |
| GET | /api/dashboard | Summary stats |
| POST | /api/chat | AI chat |
| POST | /api/actions/:action | Execute action |
