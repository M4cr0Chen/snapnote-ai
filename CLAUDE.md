# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnapNote is an AI-powered note processing platform that converts classroom photos (handwritten notes, blackboard writings, or PPT screenshots) into formatted Markdown notes. The system uses Google Cloud Vision for OCR and Anthropic's Claude for intelligent note formatting.

**Architecture**: Full-stack application with separate frontend and backend
- **Frontend**: Next.js 16 (React 19) with Tailwind CSS 4
- **Backend**: FastAPI (Python) with Google Cloud Vision and Anthropic Claude APIs

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

# Configure environment (optional)
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000

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
