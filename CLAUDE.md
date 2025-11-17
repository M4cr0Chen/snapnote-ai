# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnapNote is an AI-powered note processing platform that converts classroom photos (handwritten notes, blackboard writings, or PPT screenshots) into formatted Markdown notes. The system uses Google Cloud Vision for OCR and Anthropic's Claude for intelligent note formatting.

**Architecture**: Full-stack application with separate frontend and backend
- **Frontend**: Next.js 16 (React 19) with Tailwind CSS 4, TypeScript, Zustand, Auth0
- **Backend**: FastAPI (Python) with PostgreSQL, Auth0, Google Cloud Vision, and Anthropic Claude APIs

## Design Documents

**Important**: Before implementing new features, review these design documents:

### Frontend Design

- **`frontend/docs/DESIGN_DOC_DASHBOARD.md`**: Comprehensive design specification for the dashboard UI with course-based organization. Includes:
  - Course-based information architecture (Dashboard → Courses → Documents)
  - Multi-page dashboard with sidebar navigation
  - Course grid view and document list view
  - User authentication and profiles
  - Complete component breakdown and data models
  - API endpoints specification
  - 7-phase implementation timeline

- **`frontend/docs/COMPONENT_SPECS.md`**: Detailed component specifications with HTML structure, TypeScript interfaces, styling guidelines, and interaction patterns. Includes CourseGrid, CourseCard, CreateCourseModal, DocumentList, and all UI components.

- **`frontend/docs/MOCKUPS.md`**: Visual ASCII wireframes showing desktop/mobile layouts, component states, empty states, loading states, and color palette.

### Backend Design

- **`backend/docs/DESIGN_DOC_DATA_PERSISTENCE.md`**: Complete PostgreSQL database design and implementation plan. Includes:
  - Entity relationship diagram (Users → Courses → Documents)
  - Complete database schema with indexes and constraints
  - SQLAlchemy models and relationships
  - Authentication with Auth0 JWT validation
  - API endpoint implementations
  - Database migrations with Alembic
  - Backup, security, and performance optimization strategies

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand ✓
- **Authentication**: Auth0 ✓
- **Data Fetching**: React Query (recommended)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL 14+
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: Auth0 JWT Validation ✓
- **OCR**: Google Cloud Vision
- **LLM**: Anthropic Claude

### Key Dependencies

**Frontend:**
```bash
npm install zustand @auth0/auth0-react @tanstack/react-query
```

**Backend:**
```bash
pip install fastapi sqlalchemy alembic psycopg2-binary python-jose[cryptography] requests
```

## Development Commands

### Backend (FastAPI)

```bash
cd backend

# Setup virtual environment (first time)
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# venv\Scripts\activate   # On Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create .env file with:
# GOOGLE_APPLICATION_CREDENTIALS=credentials/your-key.json
# ANTHROPIC_API_KEY=your-key-here
# AUTH0_DOMAIN=your-domain.auth0.com
# AUTH0_AUDIENCE=your-api-audience
# DATABASE_URL=postgresql://user:password@localhost:5432/snapnote

# Run development server
python main.py
# Or: uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test the API
python test_api.py
```

**Backend runs on**: `http://localhost:8000`

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
# NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
# NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

**Frontend runs on**: `http://localhost:3000`

## Architecture Details

### Request Flow

1. **User uploads image** → Frontend (ImageUploader component)
2. **POST /process-note** → Backend API endpoint
3. **OCR Processing** → Google Cloud Vision API extracts text
4. **LLM Formatting** → Claude API formats the extracted text
5. **Response** → Frontend displays original + formatted note

### Backend Structure

- **main.py**: FastAPI application with CORS, endpoints for health, upload, OCR, and note processing
- **config.py**: Pydantic settings management, loads credentials from .env
- **services/ocr_service.py**: Google Cloud Vision integration with image preprocessing
- **services/llm_service.py**: Anthropic Claude integration (model: claude-sonnet-4-20250514)
- **models/schemas.py**: Pydantic models for API request/response validation

**Key Services**:
- `ocr_service`: Singleton that handles OCR with Google Vision API (includes image preprocessing: resize, format conversion)
- `llm_service`: Singleton that formats OCR text using Claude with structured prompts for note organization

**API Endpoints**:
- `GET /` or `GET /health`: Health check
- `POST /upload`: Upload image file (validates type, size limit 10MB)
- `POST /ocr`: OCR-only processing
- `POST /process-note`: Full pipeline (OCR + LLM formatting)
- `DELETE /uploads/{filename}`: Delete uploaded file

### Frontend Structure

- **app/page.js**: Main application UI with upload, context input, and result display
- **components/ImageUploader.js**: Drag-and-drop image upload with preview
- **components/NoteDisplay.js**: Displays OCR text + formatted Markdown side-by-side
- **components/LoadingSpinner.js**: Processing state indicator
- **lib/api.js**: Axios-based API client for backend communication

**State Management**: Uses React hooks (useState) for local component state

**Styling**: Tailwind CSS 4 with custom gradients and component-specific styles

### Critical Dependencies

**Backend**:
- `anthropic>=0.40.0`: Claude API client
- `google-cloud-vision==3.4.5`: OCR service
- `fastapi==0.104.1`: Web framework
- `uvicorn[standard]==0.24.0`: ASGI server

**Frontend**:
- `next@16.0.1`: React framework
- `react@19.2.0`: UI library
- `axios@^1.13.1`: HTTP client
- `react-markdown@^10.1.0`: Markdown rendering
- `lucide-react@^0.552.0`: Icon library

## Configuration Requirements

### Backend Environment Variables (.env)

```
GOOGLE_APPLICATION_CREDENTIALS=credentials/your-service-account-key.json
ANTHROPIC_API_KEY=sk-ant-...
```

**Note**: The `credentials/` directory should contain your Google Cloud service account JSON key file.

### Frontend Environment Variables (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Default is `http://localhost:8000` if not specified.

## Common Development Patterns

### Adding a New API Endpoint

1. Define Pydantic schemas in `backend/models/schemas.py`
2. Add endpoint in `backend/main.py` with appropriate decorators
3. Create or update service methods in `backend/services/`
4. Add API client function in `frontend/lib/api.js`
5. Integrate into UI components

### Modifying LLM Prompts

The system prompt for note formatting is in `backend/services/llm_service.py:26-45`. It defines:
- OCR error correction rules
- Markdown structure requirements (headers, lists, code blocks)
- LaTeX math formatting (`$inline$` or `$$block$$`)
- Content preservation vs. enhancement guidelines

**Temperature**: Set to 0.3 for consistent formatting (lower = more deterministic)

### Image Processing Pipeline

OCR service includes preprocessing (`ocr_service.py:14-41`):
1. Resize if > 2048px (maintains aspect ratio)
2. Convert RGBA → RGB
3. Save as JPEG at 95% quality

This improves OCR accuracy and reduces API payload size.

## Important Notes

- **CORS**: Backend allows origins on ports 3000 and 5173 (configured in `config.py:14-19`)
- **File uploads**: Saved to `backend/uploads/` with timestamp prefix
- **Error handling**: All endpoints return structured responses with success/error fields
- **Logging**: Uses Python's logging module with INFO level for tracking processing steps
- **API timeout**: Frontend sets 60s timeout for OCR + LLM processing
- **Model**: Uses `claude-sonnet-4-20250514` for note formatting

## Future Extensibility

The codebase includes stubs for Phase 5 features:
- `llm_service.enhance_note_with_qa()`: Generates review questions from notes
- `ocr_service.extract_text_with_structure()`: Preserves block/paragraph structure

These are implemented but not integrated into the main processing flow.
