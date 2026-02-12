# AI Flowchart Builder

A Lovable-style webapp for generating beautiful flowcharts, roadmaps, and diagrams using AI. Describe what you need in plain English and get an interactive diagram instantly.

## Features

- **AI-Powered Generation** — Describe what you need, AI creates the diagram
- **Tree-Style Layouts** — Perfect for roadmaps, org charts, process flows
- **Multiple Diagram Types** — Roadmaps, org charts, process flows, mind maps
- **Export as PNG** — Download your diagrams for presentations and docs
- **Multi-AI Fallback** — NVIDIA NIM (GLM 4.7) primary, Kimi K2 fallback, local generation safety net

## Tech Stack

- **Next.js 16** — React framework with App Router
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **React Flow** — Interactive node-based diagrams
- **html-to-image** — PNG export

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
NVIDIA_NIM_API_KEY=your_nvidia_nim_api_key_here
KIMI_API_KEY=your_kimi_api_key_here  # optional
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI Architecture

The app uses a multi-tier fallback strategy:

1. **NVIDIA NIM — GLM 4.7** (primary) — Reasoning model that generates high-quality structured flowcharts
2. **NVIDIA NIM — Kimi K2** (fallback) — Kimi K2 Instruct via NVIDIA NIM
3. **Kimi direct API** (fallback) — Moonshot API if you have a valid key
4. **Local generation** (safety net) — Simple rule-based parser for basic diagrams

All AI providers receive the same structured system prompt requesting JSON output with nodes and edges. Responses are validated and sanitized before rendering.

## Usage

1. **Choose Diagram Type** — Select from roadmap, org chart, process flow, or mind map
2. **Describe Your Needs** — Enter a natural language prompt
3. **Generate** — AI creates the diagram structure
4. **Edit** — Drag nodes, add connections interactively
5. **Export** — Download as PNG

### Example Prompts

- "Roadmap for launching a SaaS product from MVP to $1M ARR"
- "Org chart for a 20-person tech startup with Engineering, Product, and Sales teams"
- "Customer onboarding process for a fintech app with KYC verification"
- "Order processing flow with stock checking and payment validation"

## Project Structure

```
ai-flowchart-builder/
├── app/
│   ├── api/
│   │   └── generate/      # AI generation API endpoint
│   ├── builder/           # Main diagram builder UI
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── .env.example           # Environment variables template
├── next.config.ts         # Next.js config
└── package.json           # Dependencies
```

## Deployment

### Build for Production

```bash
npm run build
```

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard.

## License

MIT
