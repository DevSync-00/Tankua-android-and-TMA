# Tankua Web Platform

This directory contains the web applications for Tankua — a complete ecosystem for travel and destination booking in Ethiopia.

## 🏗️ Structure

```
web/
├── apps/
│   ├── marketing/     # Marketing website (tankua.et) - Port 3000
│   ├── admin/         # Admin Dashboard (admin.tankua.et) - Port 3001
│   └── provider/      # Provider Portal (provider.tankua.et) - Port 3002
├── packages/
│   └── ui/            # Shared UI components
├── package.json       # Root package.json with workspaces
└── turbo.json         # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm (v10+)

### Installation

```bash
# Navigate to web directory
cd web

# Install all dependencies
npm install

# Start all apps in development mode
npm run dev

# Or start individual apps:
npm run dev:marketing    # Marketing site on port 3000
npm run dev:admin        # Admin dashboard on port 3001
npm run dev:provider     # Provider portal on port 3002
```

### Access URLs (Development)

| App | URL |
|-----|-----|
| Marketing Website | http://localhost:3000 |
| Admin Dashboard | http://localhost:3001 |
| Provider Portal | http://localhost:3002 |

## 🎨 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library (@tankua/ui)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Database:** Supabase
- **Authentication:** Supabase Auth
- **Build System:** Turborepo
- **Hosting:** Vercel

## 📦 Shared UI Package

The `@tankua/ui` package provides:

- **Components:** Button, Card, Input, Badge, Avatar, StatCard
- **Utilities:** cn(), formatCurrency(), formatDate(), etc.
- **Styles:** Consistent theming with CSS variables

### Usage

```tsx
import { Button, Card, formatCurrency } from "@tankua/ui";

export function MyComponent() {
  return (
    <Card hoverable>
      <h2>Total: {formatCurrency(1500)}</h2>
      <Button variant="primary" size="lg">
        Book Now
      </Button>
    </Card>
  );
}
```

## 🎯 Apps Overview

### Marketing Website (apps/marketing)

Public-facing website for:
- Landing page with hero, features, testimonials
- Destination discovery and search
- Provider registration CTA
- App download links
- SEO-optimized content

### Admin Dashboard (apps/admin)

Platform management for Tankua team:
- User management
- Provider approval and management
- Booking oversight
- Financial reports
- Support tickets
- Platform settings

### Provider Portal (apps/provider)

Self-service dashboard for travel companies:
- Company registration (multi-step)
- Booking management
- Trip creation and scheduling
- Driver and vehicle management
- Earnings and payout tracking
- Review management

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` in each app:

```bash
cp .env.example apps/marketing/.env.local
cp .env.example apps/admin/.env.local
cp .env.example apps/provider/.env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🏗️ Building for Production

```bash
# Build all apps
npm run build

# Build specific app
cd apps/marketing && npm run build
```

## 🌐 Deployment

Recommended deployment on Vercel:

1. Connect repository to Vercel
2. Set up three projects for each app
3. Configure root directory for each:
   - Marketing: `web/apps/marketing`
   - Admin: `web/apps/admin`
   - Provider: `web/apps/provider`
4. Set environment variables
5. Deploy!

### Custom Domains

- `tankua.et` → Marketing
- `admin.tankua.et` → Admin Dashboard
- `provider.tankua.et` → Provider Portal

## 📖 Documentation

- [Platform Roadmap](../doc/ROADMAP.md)
- [Database Schema](../database/)
- [API Documentation](../doc/API.md) (coming soon)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test all apps: `npm run dev`
4. Submit PR

## 📄 License

© 2024 Tankua. All rights reserved.

