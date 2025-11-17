"""Common schemas for existing endpoints"""
from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    message: str


class UploadResponse(BaseModel):
    filename: str
    message: str
    file_path: str


class OCRResponse(BaseModel):
    success: bool
    text: str
    confidence: Optional[float] = None
    error: Optional[str] = None


class ProcessNoteRequest(BaseModel):
    # Can be extended with course_id
    course_id: Optional[str] = None
    additional_context: Optional[str] = None


class ProcessNoteResponse(BaseModel):
    success: bool
    original_text: str  # OCR extracted text
    formatted_note: str  # LLM formatted note
    processing_time: float
    document_id: Optional[str] = None  # ID if saved to database
    error: Optional[str] = None
