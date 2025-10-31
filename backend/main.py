from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import aiofiles
import os
import time
import logging
from pathlib import Path

from config import settings
from models.schemas import (
    HealthResponse, 
    UploadResponse, 
    ProcessNoteResponse,
    ProcessNoteRequest
)
from services.ocr_service import ocr_service
from services.llm_service import llm_service

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(
    title="AI Note Processing API",
    description="智能课堂笔记整理平台 API",
    version="0.1.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 确保上传目录存在
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

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
    additional_context: str = Form(None)
):
    """
    完整的笔记处理流程：上传 -> OCR -> LLM 整理
    
    Args:
        file: 上传的图片文件
        additional_context: 额外的上下文信息（可选）
    
    Returns:
        ProcessNoteResponse: 处理结果
    """
    start_time = time.time()
    
    try:
        logger.info(f"开始处理笔记: {file.filename}")
        
        # 1. 读取文件
        contents = await file.read()
        
        # 2. OCR 识别
        logger.info("步骤 1/2: OCR 识别中...")
        ocr_text, confidence = ocr_service.extract_text(contents)
        
        if not ocr_text or len(ocr_text.strip()) < 10:
            raise Exception("OCR 识别失败或文本内容过少")
        
        logger.info(f"OCR 完成，识别到 {len(ocr_text)} 个字符，置信度: {confidence:.2f}")
        
        # 3. LLM 整理
        logger.info("步骤 2/2: LLM 整理中...")
        formatted_note = llm_service.format_note(ocr_text, additional_context)
        
        processing_time = time.time() - start_time
        logger.info(f"处理完成，耗时 {processing_time:.2f} 秒")
        
        return ProcessNoteResponse(
            success=True,
            original_text=ocr_text,
            formatted_note=formatted_note,
            processing_time=processing_time,
            error=None
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"处理失败: {str(e)}")
        
        return ProcessNoteResponse(
            success=False,
            original_text="",
            formatted_note="",
            processing_time=processing_time,
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