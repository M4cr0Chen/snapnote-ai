'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Menu,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  FunctionSquare,
  Save,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getDocumentById, getCourseById } from '@/lib/mockData';
import toast from 'react-hot-toast';

export default function DocumentEditor() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const document = getDocumentById(documentId);
  const course = document ? getCourseById(document.courseId) : null;

  useEffect(() => {
    if (document) {
      setContent(document.formattedNote);
      setTitle(document.title);
    }
  }, [document]);

  if (!document || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    setLastSaved(new Date());
    setHasChanges(false);
    toast.success('Document saved!');
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/document/${documentId}`);
      }
    } else {
      router.push(`/document/${documentId}`);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = window.document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newContent);
    setHasChanges(true);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', action: () => insertText('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertText('*', '*') },
    { icon: Heading1, label: 'Heading 1', action: () => insertText('\n# ', '\n') },
    { icon: Heading2, label: 'Heading 2', action: () => insertText('\n## ', '\n') },
    { icon: List, label: 'Bullet List', action: () => insertText('\n- ', '\n') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertText('\n1. ', '\n') },
    { icon: Code, label: 'Code', action: () => insertText('`', '`') },
    { icon: FunctionSquare, label: 'Math', action: () => insertText('$', '$') },
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg -ml-2"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="hover:text-gray-900">
              Courses
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/course/${course.id}`} className="hover:text-gray-900">
              {course.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/document/${documentId}`} className="hover:text-gray-900">
              {document.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Edit</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasChanges(true);
                }}
                className="text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0"
                placeholder="Document title"
              />
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasChanges && (
                <span className="text-sm text-orange-600">Unsaved changes</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                title={button.label}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <button.icon className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="flex-1 p-6 font-mono text-sm resize-none outline-none bg-gray-50"
            placeholder="Start writing your note in Markdown..."
          />
        </div>

        {/* Preview Panel */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              Preview
            </h3>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className;
                    return isInline ? (
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {content || '*Start typing to see preview...*'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
