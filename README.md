# ContentGenie – Create. Personalize. Distribute. Instantly.

An AI-powered creative and content intelligence platform for digital content creation, management, and distribution.

## Features

- 🎨 **Content Generation**: Create articles, captions, scripts, headlines, and creatives
- 🔄 **Content Transformation**: Summarize, rewrite, and adapt content across formats
- 📱 **Social Media Management**: Planning, scheduling, and performance optimization
- 🎯 **Personalization**: Audience-based content customization
- 📊 **Analytics**: Content performance analysis and recommendations
- 📸 **Instagram Analytics** (NEW): Track performance, detect underperforming posts, get AI suggestions, and compare with competitors
- 🏷️ **Organization**: Smart tagging and categorization

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Python Flask
- **AI Integration**: Content generation and optimization

## Setup Instructions

### Prerequisites

1. Install Node.js (v18+): https://nodejs.org
2. Install Python (v3.8+)
3. Install Xcode Command Line Tools: `xcode-select --install`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Instagram Analytics Setup (Optional)

To enable Instagram Analytics features:

1. **Install ngrok** (required for local development):
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 5001
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

3. **Configure environment variables** in `backend/.env`:
   ```bash
   INSTAGRAM_APP_ID=your-app-id
   INSTAGRAM_APP_SECRET=your-app-secret
   INSTAGRAM_REDIRECT_URI=https://YOUR_NGROK_URL.ngrok-free.app/api/instagram/callback
   INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages
   INSTAGRAM_FRONTEND_URL=http://localhost:5173
   ```

4. **Update Meta App Dashboard**:
   - Go to https://developers.facebook.com/apps/
   - Add redirect URI: `https://YOUR_NGROK_URL.ngrok-free.app/api/instagram/callback`

5. **Run migration**:
   ```bash
   python backend/migrate_instagram_tables.py
   ```

6. **Detailed setup guide**: [INSTAGRAM_NGROK_SETUP.md](./INSTAGRAM_NGROK_SETUP.md)

## Project Structure

```
ContentGenie/
├── frontend/          # React + Vite frontend
├── backend/           # Flask API backend
├── INSTAGRAM_SETUP.md # Instagram Analytics setup guide
└── README.md
```