# SnapNote AI

An AI-powered note processing platform that transforms classroom photos into clean, formatted Markdown notes.

## Overview

SnapNote converts photos of handwritten notes, blackboard writings, or PowerPoint slides into structured, searchable digital notes. The system uses Google Cloud Vision for OCR and Anthropic's Claude for intelligent formatting.

### Key Features

- **Smart OCR**: Extract text from handwritten notes, whiteboards, and slides
- **AI Formatting**: Transform raw OCR output into clean Markdown with proper structure
- **Math Support**: LaTeX formatting for mathematical equations
- **Course Organization**: Organize notes by courses with a dashboard interface
- **Semantic Search**: Find notes by meaning using vector embeddings (RAG)
- **Multi-Agent Processing**: Specialized AI agents for optimal note processing

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   External APIs │
│   (Next.js)     │     │   (FastAPI)     │     │                 │
└─────────────────┘     └─────────────────┘     │ - Claude (LLM)  │
                               │                │ - Cloud Vision  │
                               ▼                │ - Auth0         │
                        ┌─────────────────┐     └─────────────────┘
                        │   PostgreSQL    │
                        │   + pgvector    │
                        └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.12, SQLAlchemy, Alembic |
| Database | PostgreSQL 14+ with pgvector extension |
| Auth | Auth0 (JWT validation) |
| AI/ML | Anthropic Claude, Google Cloud Vision, Sentence Transformers |
| Orchestration | LangGraph, LangChain |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Google Cloud account (for Vision API)
- Anthropic API key
- Auth0 account

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start the server
python main.py
```

The backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start development server
npm run dev
```

The frontend runs on `http://localhost:3000`

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/snapnote

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=credentials/service-account.json

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-audience
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience
```

## Project Structure

```
snapnote-ai/
├── frontend/                 # Next.js frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── lib/                  # API client & utilities
│   └── docs/                 # Frontend design docs
│
├── backend/                  # FastAPI backend
│   ├── services/             # Business logic
│   │   ├── ocr_service.py    # Google Vision OCR
│   │   ├── llm_service.py    # Claude integration
│   │   ├── embedding_service.py  # Vector embeddings
│   │   └── vector_store.py   # Similarity search
│   ├── agents/               # Multi-agent system (LangGraph)
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic schemas
│   ├── routes/               # API endpoints
│   ├── alembic/              # Database migrations
│   └── docs/                 # Backend design docs
│
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload image file |
| POST | `/ocr` | OCR-only processing |
| POST | `/process-note` | Full pipeline (OCR + LLM formatting) |
| GET | `/courses` | List user's courses |
| POST | `/courses` | Create a new course |
| GET | `/documents` | List documents in a course |
| POST | `/documents` | Create a new document |

## How It Works

### Processing Pipeline

1. **Upload**: User uploads a photo of their notes
2. **OCR**: Google Cloud Vision extracts text from the image
3. **Formatting**: Claude transforms raw text into structured Markdown
4. **Embedding**: Sentence Transformers generate a 384-dim vector
5. **Storage**: Note and embedding saved to PostgreSQL

### RAG System

The system uses Retrieval-Augmented Generation for intelligent context:

- **Embedding Model**: `paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions)
- **Vector Store**: PostgreSQL with pgvector extension
- **Similarity**: Cosine distance for semantic search
- **Course Isolation**: Search scoped to user's courses

### Multi-Agent System

LangGraph orchestrates specialized agents:

| Agent | Role |
|-------|------|
| OCR Agent | Extract and clean text |
| Structure Agent | Identify document organization |
| Content Agent | Enhance and format content |
| QA Agent | Generate review questions |
| Integration Agent | Combine into final output |

## Development

### Running Tests

```bash
# Backend
cd backend
python test_api.py

# Frontend
cd frontend
npm run lint
```

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Design Documents

- [`frontend/docs/DESIGN_DOC_DASHBOARD.md`](frontend/docs/DESIGN_DOC_DASHBOARD.md) - Dashboard UI design
- [`frontend/docs/COMPONENT_SPECS.md`](frontend/docs/COMPONENT_SPECS.md) - Component specifications
- [`frontend/docs/MOCKUPS.md`](frontend/docs/MOCKUPS.md) - Visual wireframes
- [`backend/docs/DESIGN_DOC_DATA_PERSISTENCE.md`](backend/docs/DESIGN_DOC_DATA_PERSISTENCE.md) - Database design

## License

MIT
