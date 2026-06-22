# MailMind AI — Autonomous AI Email Assistant

MailMind AI is a production-ready SaaS application designed to automate inbox management. Powered by a multi-agent orchestration workflow built on **LangGraph**, it reads, classifies, summarizes, prioritizes, and drafts replies for email threads, and coordinates scheduling proposals directly with Google Calendar.

---

## 🚀 Technology Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (v4 inline theme variables)
- **Framer Motion**
- **Lucide Icons**

### Backend
- **FastAPI** (Python)
- **LangGraph** (Multi-agent orchestration state flow)
- **Gemini API** (Reasoning and structured tool outputs via Google AI Studio)
- **PostgreSQL** (Persistent storage with SQLAlchemy ORM)
- **Redis** (Transient draft replies caching & rate limiters)

---

## 📁 Repository Structure

```
ai-email-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI server lifecycle entry point
│   │   ├── config.py            # Environment configurations
│   │   ├── database.py          # SQLAlchemy PostgreSQL connection
│   │   ├── auth/                # JWT & Google OAuth callbacks
│   │   ├── models/              # Relational models (User, Email, Task, etc.)
│   │   ├── schemas/             # Pydantic validation models
│   │   ├── agents/              # LangGraph multi-agent pipeline
│   │   └── services/            # Gmail, Calendar, and People integrations
│   ├── requirements.txt         # Python dependencies
│   └── run.py                   # Dev startup script
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router (Layouts, Pages)
│   │   ├── components/          # Dashboard layout panels & drawers
│   │   ├── lib/                 # API client wrapper
│   │   └── types/               # TypeScript type models
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml           # Local dev Docker stack
└── README.md
```

---

## 💻 Running Locally

### Direct Environment Execution

#### 1. Spin up Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```
- Starts API at `http://localhost:8000`.

#### 2. Spin up Frontend
```bash
cd frontend
npm install
npm run dev
```
- Opens client at `http://localhost:3000`.

### Containerized Execution
If you have Docker installed:
```bash
docker-compose up --build
```

---

## 🛠️ Detailed Architecture Walkthrough
For a detailed look at the relational database schema design, LangGraph node transitions, and production deployment scripts, view the [walkthrough.md](file:///Users/jaswant/.gemini/antigravity-cli/brain/208d9a60-8e87-4415-af44-b29d6ddaeb30/walkthrough.md) artifact document.
