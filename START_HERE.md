# 🚀 ContentGenie - Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- Groq API Key

## 🔧 Setup (First Time Only)

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
Edit `backend/.env` and add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## ▶️ Running the Application

### Option 1: Using Start Scripts (Recommended)

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend (Port 5001):**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## ✨ Features

1. **Text Summarization** - Paste text and get 5-10 line summaries
2. **Image OCR** - Upload images to extract text
3. **Video/Audio Transcription** - Upload media files for transcription
4. **URL Content Extraction** - Paste URLs to extract and summarize content
5. **SamAI Chat Assistant** - Ask questions about summarized content

## 🔑 Supported File Formats

- **Images**: JPEG, PNG, GIF, WebP
- **Audio**: MP3, WAV, M4A, MPEG
- **Video**: MP4, MOV, WebM
- **Text**: TXT, PDF
- **URLs**: Most article/blog websites

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5001 is available
- Verify GROQ_API_KEY is set in backend/.env
- Ensure all dependencies are installed

### Frontend won't start
- Check if port 5173 is available
- Run `npm install` in frontend directory
- Clear node_modules and reinstall if needed

### Chat feature error: "proxies parameter"
If you see: `__init__() got an unexpected keyword argument 'proxies'`
```bash
cd backend
./upgrade_groq.sh
./start-backend.sh
```
This upgrades the Groq SDK to fix compatibility issues.

### Features not working
- Restart both backend and frontend
- Check backend console for errors
- Verify Groq API key is valid
- Try upgrading Groq SDK: `cd backend && ./upgrade_groq.sh`

## 📝 Notes

- Backend runs on **Port 5001** (Port 5000 is used by macOS AirPlay)
- Frontend runs on **Port 5173**
- Both must be running for the app to work
- Keep both terminal windows open while using the app

## 🎯 Quick Test

1. Open http://localhost:5173
2. Sign up / Log in
3. Go to Creator → Summarize tab
4. Paste some text and click "Summarize"
5. Chat with SamAI about the summary

Enjoy using ContentGenie! 🎉
