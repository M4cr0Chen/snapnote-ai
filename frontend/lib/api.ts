import axios, { AxiosProgressEvent } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Type definitions for API responses
export interface HealthResponse {
  status: string;
  message: string;
}

export interface ProcessNoteResponse {
  success: boolean;
  original_text: string;
  formatted_note: string;
  processing_time: number;
  error: string | null;
}

export interface OCRResponse {
  success: boolean;
  text: string;
  confidence: number;
  error: string | null;
}

export interface UploadResponse {
  filename: string;
  message: string;
  file_path: string;
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout (OCR + LLM may take time)
});

/**
 * Health check
 */
export const healthCheck = async (): Promise<HealthResponse> => {
  try {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Process note - complete pipeline
 * @param file - Image file
 * @param additionalContext - Additional context
 * @param onProgress - Progress callback
 */
export const processNote = async (
  file: File,
  additionalContext: string = '',
  onProgress: ((progress: number) => void) | null = null
): Promise<ProcessNoteResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalContext) {
      formData.append('additional_context', additionalContext);
    }

    const response = await api.post<ProcessNoteResponse>('/process-note', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
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
 * OCR only
 */
export const ocrOnly = async (file: File): Promise<OCRResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<OCRResponse>('/ocr', formData, {
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
 * Upload file
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload', formData, {
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
