import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 秒超时（OCR + LLM 可能需要时间）
});

/**
 * 健康检查
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * 处理笔记 - 完整流程
 * @param {File} file - 图片文件
 * @param {string} additionalContext - 额外上下文
 * @param {function} onProgress - 进度回调
 */
export const processNote = async (file, additionalContext = '', onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalContext) {
      formData.append('additional_context', additionalContext);
    }

    const response = await api.post('/process-note', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Process note failed:', error);
    throw error;
  }
};

/**
 * 仅 OCR 识别
 */
export const ocrOnly = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('OCR failed:', error);
    throw error;
  }
};

/**
 * 上传文件
 */
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

export default api;