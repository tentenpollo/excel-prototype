# Agent Genius - Property Management CRM

A modern React-based CRM application for property management companies to track prospects, manage portfolios, and visualize territories.

## Features

- 🗺️ **Territory Mapping** - Interactive map with building locations and company headquarters
- 📊 **Dashboard** - Real-time analytics and activity feed
- 👥 **Prospect Management** - Track and manage property management companies
- 🏢 **Portfolio Tracking** - View and manage building portfolios
- 📝 **Custom Lists** - Create and organize prospect lists
- 🔍 **Advanced Search & Filters** - Find prospects quickly

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Maps**: MapLibre GL, Leaflet
- **Routing**: React Router v7
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd prototype
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations

See `migrations/001_create_tables.sql` and run in your Supabase SQL editor.

5. Start development server
```bash
npm run dev
```

## Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for step-by-step deployment instructions.

## Database Schema

- `prospects` - Property management companies
- `assets` - Buildings managed by prospects

## License

Private - All rights reserved
