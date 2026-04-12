# KickFlow - Premium Football Hub

## Overview
KickFlow is a React + TypeScript frontend application that displays **LIVE** football/soccer match scores and fixtures. Built with Vite for fast development and Tailwind CSS for styling.

## Recent Changes (January 26, 2026)
- **Connected to API-Football API** for real-time live match data
- **Real scores and match times** from actual matches worldwide
- **Club logos** fetched from the API
- **Auto-refresh** every 60 seconds for live updates
- **Express backend** to proxy API calls

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite 6
- **Backend**: Express.js (API proxy)
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **API**: API-Football (api-sports.io)

## Project Structure
```
├── App.tsx              # Main application component
├── server.js            # Express API server
├── index.tsx            # React entry point
├── index.html           # HTML template
├── types.ts             # TypeScript type definitions
├── components/          # React components
│   ├── MatchTable.tsx   # Match display component
│   ├── Logo.tsx         # Logo component
│   └── ThemeToggle.tsx  # Dark/light mode toggle
├── services/
│   └── matchService.ts  # API service for fetching live matches
├── vite.config.ts       # Vite configuration with API proxy
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Development
- **Frontend**: `npm run dev` (port 5000)
- **API Server**: `node server.js` (port 3001)
- The Vite config proxies `/api` requests to the Express backend

## Environment Variables
- `FOOTBALL_API_KEY`: Required - API key from API-Football

## Features
- Real-time live football scores
- Match filtering (All, Premier League, La Liga, Serie A, Live Now)
- Dark/Light theme toggle
- Mobile responsive design
- Auto-refresh every 60 seconds
- Club logos and team names
- Match status (Live, Upcoming, Finished)

## API
The app uses API-Football (api-sports.io) to fetch live match data:
- Endpoint: `https://v3.football.api-sports.io/fixtures`
- Data includes: scores, teams, logos, match times, status
