# English Learning Platform

Telegram Mini App - ingliz tilini o'rganish platformasi.

## Architecture

```
English_platform/
├── frontend/     → User-facing React app (Railway Service 1 - port 3000)
├── admin/        → Admin panel React app (Railway Service 2 - port 3001)
├── server/       → Express API + Supabase (Railway Service 3 - port 4000)
├── bot/          → Telegram Bot (Railway Service 4)
└── supabase/     → Database schema
```

## Setup

### 1. Supabase
1. Create a Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Create a storage bucket named `images` (public)
4. Copy URL, anon key, and service role key

### 2. Server
```bash
cd server
cp .env.example .env  # Fill in values
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env  # Set VITE_API_URL
npm install
npm run dev
```

### 4. Admin
```bash
cd admin
cp .env.example .env  # Set VITE_API_URL
npm install
npm run dev
```

### 5. Bot
```bash
cd bot
cp .env.example .env  # Fill in values
npm install
npm run dev
```

## Railway Deployment

Each directory is deployed as a separate Railway service:

1. **frontend**: Root Directory = `frontend`, Build = `npm run build`, Start = serve `dist/`
2. **admin**: Root Directory = `admin`, Build = `npm run build`, Start = serve `dist/`
3. **server**: Root Directory = `server`, Build = `npm run build`, Start = `npm start`
4. **bot**: Root Directory = `bot`, Build = `npm run build`, Start = `npm start`

## Features

- 📚 Grammar, Reading, Writing, Listening, Speaking (6 levels each)
- 🎬 Movies & Comics with premium gating
- 🤖 AI Chat with message limits
- 📝 Grammar Checker with AI
- 💡 Tips & Advice
- 📱 Apps (web app embedding)
- 🎴 Reels vocabulary trainer
- 💰 Payment system (screenshot-based)
- 👑 Premium / Ultra subscription tiers
- 🔗 Referral link system
- 🛡️ Full admin panel

## Admin Credentials

Default password: `admin123` (change in server `.env`)
