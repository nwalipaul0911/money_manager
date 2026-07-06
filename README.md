# Money Manager

Personal and network finance app with dual-pillar spending (Needs vs Wants), wishlist buffer, and sponsor–dependant relationships backed by a FastAPI server.

## Features

- **Email/password authentication** — each user has their own account
- **Budget onboarding** — income, fixed expenses, wants %
- **Sponsor–dependant networks** — invite others by email; many-to-many links with relationship types
- **Scoped visibility** — users see their own dashboard and dashboards of dependants they sponsor
- **Approval workflow** — only dependants need sponsor approval for expenses and wishlist items; sponsors manage their own wishlist freely
- **72-hour wishlist cooling-off** after approval
- **Real-time updates** via WebSocket — sponsors and dependants see new requests and approvals without reloading

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

API runs at [http://127.0.0.1:8000](http://127.0.0.1:8000) — docs at `/docs`.

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the backend.

## Typical Flow

1. **Register** two accounts (e.g. parent and child emails)
2. Parent completes onboarding, goes to **Settings → Invite to Network**
3. Child registers, accepts the pending invitation in **Settings**
4. Child logs expenses/wishlist (pending); parent reviews on the **Review** tab
5. Parent can switch to child's dashboard (read-only) via the profile switcher

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend:** FastAPI, SQLAlchemy, SQLite, JWT auth

## Build

```bash
npm run build
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Frontend API base URL |
| `SECRET_KEY` | dev default | JWT signing key (set in production) |
| `DATABASE_URL` | `sqlite:///./money_manager.db` | SQLAlchemy database URL |
