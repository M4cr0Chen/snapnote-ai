'use client';

import React, { useState } from 'react';
import { BookOpen, Sparkles, Camera } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import ImageUploader from '@/components/ImageUploader';
import NoteDisplay from '@/components/NoteDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { processNote } from '@/lib/api';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error('请先上传图片');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    const loadingToast = toast.loading('正在处理笔记...');

    try {
      // 调用 API
      const response = await processNote(
        selectedFile,
        context,
        (uploadProgress) => {
          setProgress(uploadProgress);
        }
      );

      if (response.success) {
        setResult(response);
        toast.success('笔记整理完成！', { id: loadingToast });
      } else {
        throw new Error(response.error || '处理失败');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error.message || '处理失败，请重试', { id: loadingToast });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setContext('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SnapNote</h1>
              <p className="text-sm text-gray-600">AI 驱动的智能笔记整理平台</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!result ? (
          <div className="space-y-6">
            {/* 介绍卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    如何使用？
                  </h2>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-600 mr-2">1.</span>
                      <span>上传课堂笔记、黑板板书或 PPT 截图</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-600 mr-2">2.</span>
                      <span>（可选）添加课程上下文信息，帮助 AI 更好地理解</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-600 mr-2">3.</span>
                      <span>点击处理，等待 AI 识别并整理笔记</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-600 mr-2">4.</span>
                      <span>复制或下载整理好的 Markdown 格式笔记</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* 上传区域 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                上传笔记图片
              </h2>
              
              <ImageUploader
                onImageSelect={setSelectedFile}
                disabled={isProcessing}
              />
            </div>

            {/* 上下文输入 */}
            {selectedFile && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  额外上下文（可选）
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="例如：这是机器学习课程的第三讲，主要讲解神经网络..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* 处理按钮 */}
            {selectedFile && (
              <div className="flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {isProcessing ? '处理中...' : '开始处理笔记'}
                </button>
              </div>
            )}

            {/* 加载状态 */}
            {isProcessing && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <LoadingSpinner
                  message="AI 正在识别和整理笔记，请稍候..."
                  progress={progress}
                />
              </div>
            )}
          </div>
        ) : (
          /* 结果展示 */
          <div className="space-y-6">
            <NoteDisplay
              originalText={result.original_text}
              formattedNote={result.formatted_note}
              processingTime={result.processing_time}
            />

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                处理新笔记
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 mt-12 text-center text-sm text-gray-500">
        <p>Powered by Claude AI & Google Vision</p>
      </footer>
    </div>
  );
}