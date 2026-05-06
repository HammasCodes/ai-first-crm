# AI-First CRM HCP Module – Log Interaction Screen

A modern, AI-powered CRM module designed for life-science field representatives to log, manage, and analyze interactions with Healthcare Professionals (HCPs). Built with React, FastAPI, LangGraph, and Groq LLM.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![LangGraph](https://img.shields.io/badge/LangGraph-0.2-purple) ![Groq](https://img.shields.io/badge/Groq-gemma2--9b--it-orange)

---

## Overview

This project provides a single-screen CRM dashboard where field reps can:
- **Log interactions** via a structured form or natural-language AI chat
- **Summarize, edit, and review** interactions with AI assistance
- **Run compliance checks** on notes to catch risky language
- **Get next-best-action suggestions** powered by LLM reasoning
- **View HCP profiles** and interaction history

The AI backbone uses **LangGraph** for workflow orchestration and **Groq** (gemma2-9b-it) for fast LLM inference.

---

## Features

| Feature | Description |
|---------|-------------|
| **Structured Form** | Full interaction form with all CRM fields |
| **AI Chat Logger** | Natural language interaction logging via conversational AI |
| **5 LangGraph Tools** | Log, Edit, Fetch Profile, Next Action, Compliance Check |
| **Interaction Preview** | Real-time preview of extracted/entered data |
| **Saved Interactions** | Persistent table of all logged interactions |
| **Compliance Engine** | Flags non-compliant pharma language with safer rewrites |
| **Redux State** | Full state management with Redux Toolkit |
| **Seed Data** | Pre-loaded HCPs and interactions for instant demo |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| State Management | Redux Toolkit |
| Styling | Vanilla CSS + Google Inter font |
| Backend | Python FastAPI |
| AI Agent | LangGraph (StateGraph) |
| LLM Provider | Groq |
| LLM Model | gemma2-9b-it (fallback: llama-3.3-70b-versatile) |
| Database | PostgreSQL (default) / SQLite (local dev) |
| ORM | SQLAlchemy |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   Form   │  │   Chat   │  │  Preview + Tools  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │             │
│       └──────────────┴─────────────────┘             │
│                      │ Redux Toolkit                 │
│                      │ Axios                         │
└──────────────────────┼───────────────────────────────┘
                       │ HTTP
┌──────────────────────┼───────────────────────────────┐
│                 FastAPI Backend                       │
│  ┌───────────────┐  ┌────────────────────────────┐   │
│  │  CRUD Routes  │  │     Agent Routes           │   │
│  │  /interactions│  │  /agent/chat               │   │
│  └───────┬───────┘  │  /agent/tool/*             │   │
│          │          └────────────┬───────────────┘   │
│          │                      │                    │
│  ┌───────┴───────┐  ┌──────────┴────────────────┐   │
│  │  SQLAlchemy   │  │    LangGraph Agent         │   │
│  │  PostgreSQL   │  │  ┌──────────────────────┐  │   │
│  │  / SQLite     │  │  │ classify_intent      │  │   │
│  └───────────────┘  │  │      ↓               │  │   │
│                     │  │ conditional routing   │  │   │
│                     │  │      ↓               │  │   │
│                     │  │ tool execution        │  │   │
│                     │  │      ↓               │  │   │
│                     │  │ compose_response      │  │   │
│                     │  └──────────────────────┘  │   │
│                     │          ↕ Groq LLM        │   │
│                     └────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/)
- PostgreSQL (optional – SQLite works out of the box)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-first-crm-hcp-module.git
cd ai-first-crm-hcp-module
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=sqlite:///./hcp_crm.db
GROQ_API_KEY=your_actual_groq_api_key
GROQ_MODEL=gemma2-9b-it
```

> **Note:** For local development, SQLite works without any database setup. For production, use the PostgreSQL URL format: `postgresql://user:pass@localhost:5432/hcp_crm`

> **Note:** If `gemma2-9b-it` isn't available on your Groq account, change `GROQ_MODEL` to `llama-3.3-70b-versatile`.

### 4. Run the backend

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 5. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./hcp_crm.db` |
| `GROQ_API_KEY` | Your Groq API key | (required) |
| `GROQ_MODEL` | LLM model to use | `gemma2-9b-it` |

---

## API Endpoints

### Interaction CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/interactions` | Create new interaction |
| GET | `/interactions` | List all interactions |
| GET | `/interactions/{id}` | Get single interaction |
| PUT | `/interactions/{id}` | Update interaction |
| DELETE | `/interactions/{id}` | Delete interaction |

### Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agent/chat` | Main AI chat (runs full LangGraph workflow) |
| POST | `/agent/tool/log-interaction` | Direct tool: Log Interaction |
| POST | `/agent/tool/edit-interaction` | Direct tool: Edit Interaction |
| POST | `/agent/tool/fetch-hcp` | Direct tool: Fetch HCP Profile |
| POST | `/agent/tool/next-best-action` | Direct tool: Suggest Next Best Action |
| POST | `/agent/tool/compliance-check` | Direct tool: Compliance Check |

---

## LangGraph Tools

### Tool 1: Log Interaction
Extracts interaction details from natural language using the LLM. Captures HCP name, organization, products discussed, sentiment, follow-up dates, and more. Generates an AI summary and saves to the database.

### Tool 2: Edit Interaction
Modifies existing interactions based on user instructions. The LLM extracts which fields to update, then applies changes to the database.

### Tool 3: Fetch HCP Profile
Retrieves an HCP's profile and interaction history from the database. Shows past interactions, product interests, and last contact date.

### Tool 4: Suggest Next Best Action
Uses LLM reasoning over the interaction context to recommend field-rep actions like scheduling follow-ups, sending trial data, or escalating to a medical science liaison.

### Tool 5: Compliance Check
Analyzes notes for risky pharma language. Flags guaranteed cures, off-label claims, and exaggerated efficacy. Returns risk level, flagged phrases, and a compliant rewrite.

---

## Video Demo Guide

For a 10–15 minute demo, walk through:

1. **Frontend overview** – Header, tabs, layout
2. **Structured form** – Fill in fields, save interaction
3. **AI Chat** – Type a natural language interaction, see extraction
4. **Tool 1** – Log Interaction via chat
5. **Tool 2** – Edit an existing interaction
6. **Tool 3** – Fetch HCP profile
7. **Tool 4** – Get next best action suggestions
8. **Tool 5** – Run compliance check on risky notes
9. **Code walkthrough** – LangGraph graph, tools, prompts
10. **Summary** – Architecture recap

---

## Limitations

- No user authentication (out of scope for this module)
- No real-time WebSocket updates (uses polling)
- Follow-up date parsing from natural language is best-effort
- Compliance check is LLM-based, not a certified regulatory tool
- HCP profile data is limited to seed data unless manually added

---

## Future Improvements

- Add user authentication and role-based access
- WebSocket-based real-time chat streaming
- Calendar integration for follow-up scheduling
- Advanced analytics dashboard with charts
- Multi-language support
- Email notification system for follow-ups
- Integration with real EHR/CRM systems (Veeva, Salesforce Health Cloud)
- Fine-tuned compliance model for specific therapeutic areas

---

## License

This project is for educational and demonstration purposes.
