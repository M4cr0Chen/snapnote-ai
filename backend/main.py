from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import aiofiles
import os
import time
import logging
from pathlib import Path

from config import settings
from database import get_db
from models import User, Course, Document
from schemas import (
    HealthResponse,
    UploadResponse,
    ProcessNoteResponse
)
from services.ocr_service import ocr_service
from services.llm_service import llm_service
from services.auth_service import get_current_user
from routes import user_router, courses_router, documents_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan event handler
@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    logger.info("Starting up application...")
    # Ensure upload directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info("Database ready")

    yield

    # Shutdown
    logger.info("Shutting down application...")


# Create FastAPI app
app = FastAPI(
    title="SnapNote AI API",
    description="AI-powered note processing platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router)
app.include_router(courses_router)
app.include_router(documents_router)

@app.get("/", response_model=HealthResponse)
async def root():
    """根路径 - 健康检查"""
    return HealthResponse(
        status="healthy",
        message="AI Note Processing API is running"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查端点"""
    return HealthResponse(
        status="healthy",
        message="All systems operational"
    )

@app.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片文件
    
    Args:
        file: 上传的图片文件
    
    Returns:
        UploadResponse: 上传结果
    """
    try:
        # 验证文件类型
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="只支持图片文件"
            )
        
        # 读取文件内容
        contents = await file.read()
        
        # 验证文件大小
        if len(contents) > settings.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超过限制 ({settings.max_file_size / 1024 / 1024}MB)"
            )
        
        # 生成唯一文件名
        timestamp = int(time.time() * 1000)
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, filename)
        
        # 保存文件
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        logger.info(f"文件上传成功: {filename}")
        
        return UploadResponse(
            filename=filename,
            message="文件上传成功",
            file_path=file_path
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件上传失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    """
    对上传的图片进行 OCR 识别
    
    Args:
        file: 上传的图片文件
    
    Returns:
        OCRResponse: OCR 识别结果
    """
    try:
        # 读取文件内容
        contents = await file.read()
        
        # 调用 OCR 服务
        text, confidence = ocr_service.extract_text(contents)
        
        return {
            "success": True,
            "text": text,
            "confidence": confidence,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"OCR 处理失败: {str(e)}")
        return {
            "success": False,
            "text": "",
            "confidence": 0.0,
            "error": str(e)
        }

@app.post("/process-note", response_model=ProcessNoteResponse)
async def process_note(
    file: UploadFile = File(...),
    additional_context: str = Form(None),
    course_id: str = Form(None),
    title: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete note processing pipeline: Upload -> OCR -> LLM formatting -> Save to database

    Requires authentication. Documents are automatically saved to the specified course.

    Args:
        file: Image file to process
        additional_context: Additional context for LLM (optional)
        course_id: Course ID to save the document to
        title: Document title (optional, generated from content if not provided)
        current_user: Current authenticated user (injected)
        db: Database session (injected)

    Returns:
        ProcessNoteResponse: Processing result with document ID
    """
    start_time = time.time()
    saved_file_path = None

    try:
        logger.info(f"Processing note for user {current_user.email}: {file.filename}")

        # Verify course exists and belongs to user
        if not course_id:
            raise HTTPException(status_code=400, detail="course_id is required")

        course = db.query(Course).filter(
            Course.id == course_id,
            Course.user_id == current_user.id
        ).first()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # 1. Read file
        contents = await file.read()

        # Save uploaded file
        timestamp = int(time.time() * 1000)
        filename = f"{timestamp}_{file.filename}"
        saved_file_path = os.path.join(settings.upload_dir, filename)

        async with aiofiles.open(saved_file_path, 'wb') as f:
            await f.write(contents)

        # 2. OCR recognition
        logger.info("Step 1/2: OCR processing...")
        ocr_text, confidence = ocr_service.extract_text(contents)

        if not ocr_text or len(ocr_text.strip()) < 10:
            raise Exception("OCR failed or text content too short")

        logger.info(f"OCR completed, extracted {len(ocr_text)} characters, confidence: {confidence:.2f}")

        # 3. LLM formatting
        logger.info("Step 2/2: LLM formatting...")
        formatted_note = llm_service.format_note(ocr_text, additional_context)

        # 4. Save to database
        # Generate title from formatted note if not provided
        if not title:
            # Extract first line or first 50 characters as title
            lines = formatted_note.split('\n')
            title = lines[0].strip('#').strip()[:100] if lines else "Untitled Note"

        # Create excerpt from formatted note
        excerpt = formatted_note[:200]

        # Create document
        document = Document(
            course_id=course_id,
            user_id=current_user.id,
            title=title,
            original_text=ocr_text,
            formatted_note=formatted_note,
            excerpt=excerpt,
            image_path=saved_file_path,
            processing_time=time.time() - start_time,
            doc_metadata={
                "ocr_confidence": confidence,
                "file_name": file.filename,
                "context": additional_context
            }
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        processing_time = time.time() - start_time
        logger.info(f"Processing completed in {processing_time:.2f}s, document saved: {document.id}")

        return ProcessNoteResponse(
            success=True,
            original_text=ocr_text,
            formatted_note=formatted_note,
            processing_time=processing_time,
            document_id=str(document.id),
            error=None
        )

    except HTTPException:
        # Clean up file if it was saved
        if saved_file_path and os.path.exists(saved_file_path):
            os.remove(saved_file_path)
        raise
    except Exception as e:
        # Clean up file if it was saved
        if saved_file_path and os.path.exists(saved_file_path):
            os.remove(saved_file_path)

        processing_time = time.time() - start_time
        logger.error(f"Processing failed: {str(e)}")

        return ProcessNoteResponse(
            success=False,
            original_text="",
            formatted_note="",
            processing_time=processing_time,
            document_id=None,
            error=str(e)
        )

@app.delete("/uploads/{filename}")
async def delete_upload(filename: str):
    """
    删除上传的文件
    
    Args:
        filename: 文件名
    """
    try:
        file_path = os.path.join(settings.upload_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")
        
        os.remove(file_path)
        logger.info(f"文件删除成功: {filename}")
        
        return {"message": "文件删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件删除失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # 开发模式下自动重载
    )