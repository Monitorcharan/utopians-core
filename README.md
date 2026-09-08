# Utopians Core

> The Intelligent Infrastructure Platform for Autonomous Agents and Neural Compute.

Utopians Core is an enterprise-grade, high-throughput decentralized platform built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🌟 Key Features

- **Decentralized Neural Mesh**: Virtualized tensor compute pipes for multi-agent autonomous swarms.
- **Microsecond Consensus**: Deterministic DAG Byzantine Fault Tolerant state execution.
- **Quantum-Resistant Vault**: Post-quantum cryptographic security utilizing lattice-based primitives.
- **Real-Time Telemetry**: Live network diagnostic monitors, throughput stats, and cluster health streaming.
- **Layered Architecture Explorer**: Decoupled Application, Consensus, Data, and Network stack breakdown.

---

## 📂 Project Structure

```
utopians-core/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── favicon.ico           # Favicon icon
│   │   ├── globals.css           # Tailwind CSS v4, custom cyber grid & glass tokens
│   │   ├── layout.tsx            # Root layout with site metadata, Navbar & Footer
│   │   ├── page.tsx              # Utopians Core landing and telemetry dashboard
│   │   ├── loading.tsx           # Suspense skeleton fallback
│   │   ├── not-found.tsx         # Custom 404 state vector handler
│   │   └── error.tsx             # Resilient client error boundary
│   ├── components/
│   │   ├── ui/                   # Reusable atomic UI elements
│   │   │   ├── button.tsx        # Styled polymorphic button (primary, glass, ghost)
│   │   │   ├── card.tsx          # Glassmorphic card with gradient borders
│   │   │   └── badge.tsx         # Status & category badges with live pulse
│   │   ├── layout/               # Global layout components
│   │   │   ├── navbar.tsx        # Sticky frosted-glass header with status indicators
│   │   │   └── footer.tsx        # Modern footer with ecosystem links & live status
│   │   └── features/             # Domain-specific feature modules
│   │       ├── hero-section.tsx       # Hero with live badge, headline, and CTA
│   │       ├── system-status.tsx      # Real-time node metrics & telemetry showcase
│   │       ├── modules-grid.tsx       # Core subsystems (Neural, Compute, Security)
│   │       └── architecture-view.tsx  # Interactive layered architecture explorer
│   ├── hooks/                    # Reusable React hooks
│   │   └── use-mounted.ts        # React 19 useSyncExternalStore hydration hook
│   ├── lib/                      # Utilities and configuration
│   │   ├── constants.ts          # Nav links, telemetry stats, site config
│   │   └── utils.ts              # Class merging utility (clsx + tailwind-merge)
│   └── types/                    # Shared TypeScript interfaces
│       └── index.ts              # Core system, navigation, and telemetry types
├── package.json
├── tsconfig.json
└── tailwind.config / postcss.config.mjs
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Lint & Type-Check

```bash
npm run lint
```

### 4. Build for Production

```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3 (Turbopack, App Router)
- **Runtime & UI**: React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, PostCSS
- **Icons & Styling Utilities**: Lucide React, `clsx`, `tailwind-merge`
