import anthropic
from config import settings
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        """初始化 Claude 客户端"""
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-20250514"  # 使用最新的 Sonnet 4.5
    
    def format_note(self, ocr_text: str, additional_context: str = None) -> str:
        """
        将 OCR 识别的文本整理成格式化笔记
        
        Args:
            ocr_text: OCR 识别的原始文本
            additional_context: 额外的上下文（可选）
        
        Returns:
            str: 整理后的 Markdown 格式笔记
        """
        
        # 构建系统提示词
        system_prompt = """你是一个专业的课堂笔记整理助手。你的任务是将 OCR 识别的课堂笔记文本整理成清晰、结构化的笔记。

请遵循以下规则：
1. **修正 OCR 错误**：识别并修正明显的 OCR 识别错误（拼写错误、字符混淆等）
2. **结构化组织**：
   - 使用清晰的标题层级（# ## ###）
   - 将内容分成逻辑段落
   - 使用列表来组织要点
3. **保留原意**：不要添加 OCR 文本中没有的内容，但可以：
   - 补充必要的连接词使语句通顺
   - 完善不完整的句子
   - 统一术语表达
4. **格式化**：
   - 数学公式使用 LaTeX 格式：$inline$ 或 $$block$$
   - 代码使用代码块：```language```
   - 重要概念使用**粗体**
   - 示例或引用使用 > 引用块
5. **保持简洁**：去除重复内容，但保留所有关键信息

输出纯 Markdown 格式，不要添加任何解释性文字。"""

        # 构建用户提示词
        user_prompt = f"""请整理以下课堂笔记的 OCR 文本：

```
{ocr_text}
```
"""
        
        if additional_context:
            user_prompt += f"\n\n额外上下文：{additional_context}\n"
        
        user_prompt += "\n请输出整理后的笔记（Markdown 格式）："
        
        try:
            # 调用 Claude API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.3,  # 较低的温度以保持一致性
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            # 提取响应文本
            formatted_note = message.content[0].text
            
            logger.info(f"LLM 整理成功，输入 {len(ocr_text)} 字符，输出 {len(formatted_note)} 字符")
            return formatted_note
            
        except Exception as e:
            logger.error(f"LLM 处理失败: {str(e)}")
            raise Exception(f"笔记整理失败: {str(e)}")
    
    def enhance_note_with_qa(self, formatted_note: str) -> dict:
        """
        基于整理后的笔记生成复习问题（Phase 5 功能预留）
        
        Returns:
            dict: {"note": str, "questions": list[str]}
        """
        system_prompt = """你是一个教育助手。基于给定的笔记，生成 3-5 个复习问题，帮助学生巩固知识。

问题应该：
1. 覆盖笔记的主要概念
2. 有助于理解而非死记硬背
3. 难度适中

输出格式：
Q1: [问题1]
Q2: [问题2]
..."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                temperature=0.5,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": f"笔记内容：\n\n{formatted_note}\n\n请生成复习问题："}
                ]
            )
            
            qa_text = message.content[0].text
            
            # 解析问题
            questions = []
            for line in qa_text.split('\n'):
                if line.strip().startswith('Q'):
                    question = line.split(':', 1)[1].strip() if ':' in line else line
                    questions.append(question)
            
            return {
                "note": formatted_note,
                "questions": questions
            }
            
        except Exception as e:
            logger.error(f"生成问题失败: {str(e)}")
            return {
                "note": formatted_note,
                "questions": []
            }

# 创建单例
llm_service = LLMService()