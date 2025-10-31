import io
from PIL import Image
from google.cloud import vision
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        """初始化 OCR 客户端"""
        self.client = vision.ImageAnnotatorClient()
    
    def preprocess_image(self, image_bytes: bytes) -> bytes:
        """
        预处理图片以提高 OCR 准确性
        - 调整大小
        - 增强对比度
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # 如果图片太大，调整大小
            max_size = 2048
            if max(img.size) > max_size:
                ratio = max_size / max(img.size)
                new_size = tuple(int(dim * ratio) for dim in img.size)
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # 转换为 RGB（如果是 RGBA）
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # 保存到 bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=95)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"图片预处理失败: {str(e)}")
            return image_bytes  # 返回原始图片
    
    def extract_text(self, image_bytes: bytes) -> Tuple[str, float]:
        """
        从图片中提取文字
        
        Returns:
            Tuple[str, float]: (提取的文本, 平均置信度)
        """
        try:
            # 预处理图片
            processed_image = self.preprocess_image(image_bytes)
            
            # 创建 Vision API 图片对象
            image = vision.Image(content=processed_image)
            
            # 调用文本检测
            response = self.client.document_text_detection(image=image)
            
            # 检查错误
            if response.error.message:
                raise Exception(response.error.message)
            
            # 提取文本
            text = response.full_text_annotation.text
            
            # 计算平均置信度
            confidence = 0.0
            if response.text_annotations:
                confidences = [
                    annotation.confidence 
                    for annotation in response.text_annotations[1:]  # 跳过第一个（全文）
                    if hasattr(annotation, 'confidence')
                ]
                if confidences:
                    confidence = sum(confidences) / len(confidences)
            
            logger.info(f"OCR 成功，提取 {len(text)} 个字符，置信度: {confidence:.2f}")
            return text, confidence
            
        except Exception as e:
            logger.error(f"OCR 失败: {str(e)}")
            raise Exception(f"OCR 处理失败: {str(e)}")
    
    def extract_text_with_structure(self, image_bytes: bytes) -> dict:
        """
        提取文本并保留结构信息（段落、位置等）
        用于未来的高级功能
        """
        try:
            processed_image = self.preprocess_image(image_bytes)
            image = vision.Image(content=processed_image)
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(response.error.message)
            
            # 提取结构化信息
            pages = response.full_text_annotation.pages
            blocks = []
            
            for page in pages:
                for block in page.blocks:
                    block_text = ""
                    for paragraph in block.paragraphs:
                        para_text = ""
                        for word in paragraph.words:
                            word_text = "".join([
                                symbol.text for symbol in word.symbols
                            ])
                            para_text += word_text + " "
                        block_text += para_text.strip() + "\n"
                    
                    blocks.append({
                        "text": block_text.strip(),
                        "confidence": block.confidence
                    })
            
            return {
                "full_text": response.full_text_annotation.text,
                "blocks": blocks
            }
            
        except Exception as e:
            logger.error(f"结构化 OCR 失败: {str(e)}")
            raise Exception(f"结构化 OCR 处理失败: {str(e)}")

# 创建单例
ocr_service = OCRService()