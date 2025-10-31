import os
from typing import List
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    """应用配置"""
    
    # API 配置
    app_name: str = "AI Note Processing API"
    debug: bool = True
    
    # CORS 配置
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # 文件上传配置
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # Google Cloud Vision API 配置
    google_application_credentials: str = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", 
        ""
    )
    
    # Anthropic API 配置
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# 创建全局配置实例
settings = Settings()

# 设置 Google Cloud 凭证环境变量
if settings.google_application_credentials:
    # 如果是相对路径，转换为绝对路径
    credentials_path = Path(settings.google_application_credentials)
    if not credentials_path.is_absolute():
        # 相对于 backend 目录
        credentials_path = Path(__file__).parent / credentials_path
    
    # 设置环境变量
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials_path.absolute())