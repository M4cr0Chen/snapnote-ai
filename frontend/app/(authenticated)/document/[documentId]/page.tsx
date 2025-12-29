'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Menu,
  Edit,
  Download,
  Share2,
  Trash2,
  FileText,
  Eye,
  Sparkles,
  Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getDocumentById, getCourseById } from '@/lib/mockData';
import { Flashcard, KnowledgeCard, KeyConcept } from '@/lib/types';

export default function DocumentView() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const document = getDocumentById(documentId);
  const course = document ? getCourseById(document.courseId) : null;

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

  const toggleCard = (id: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlippedCards(newFlipped);
  };

  const handleDownload = () => {
    const blob = new Blob([document.formattedNote], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <span className="text-gray-900">{document.title}</span>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{document.title}</h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/document/${documentId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {/* Note Content */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('formatted')}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === 'formatted'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Formatted Note</span>
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === 'raw'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Original Text</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'formatted' ? (
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
                  {document.formattedNote}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="font-mono text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-6 rounded-lg">
                {document.originalText}
              </div>
            )}
          </div>
        </div>

        {/* Study Materials */}
        {document.studyMaterials && (
          <div className="space-y-6">
            {/* Flashcards */}
            {document.studyMaterials.flashcards.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Q&A Flashcards</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {document.studyMaterials.flashcards.map((card) => (
                    <FlashcardComponent
                      key={card.id}
                      card={card}
                      isFlipped={flippedCards.has(card.id)}
                      onFlip={() => toggleCard(card.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Knowledge Cards */}
            {document.studyMaterials.knowledgeCards.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Knowledge Cards</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {document.studyMaterials.knowledgeCards.map((card) => (
                    <KnowledgeCardComponent key={card.id} card={card} />
                  ))}
                </div>
              </section>
            )}

            {/* Key Concepts */}
            {document.studyMaterials.keyConcepts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Key Concepts</h2>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="space-y-3">
                    {document.studyMaterials.keyConcepts.map((concept) => (
                      <KeyConceptComponent key={concept.id} concept={concept} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Related Notes */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Related Notes</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="space-y-3">
                  <Link
                    href="/document/doc2"
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Linear Algebra - Matrix Operations</p>
                      <p className="text-sm text-gray-500">Mathematics</p>
                    </div>
                    <span className="text-sm text-blue-600">92% similar</span>
                  </Link>
                  <Link
                    href="/document/doc3"
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Data Structures - Binary Trees</p>
                      <p className="text-sm text-gray-500">Computer Science</p>
                    </div>
                    <span className="text-sm text-blue-600">78% similar</span>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

function FlashcardComponent({
  card,
  isFlipped,
  onFlip
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      onClick={onFlip}
      className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all min-h-[160px] flex items-center justify-center"
    >
      <div className="text-center">
        {isFlipped ? (
          <>
            <p className="text-sm text-gray-500 mb-2">Answer</p>
            <p className="text-gray-900">{card.answer}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">Question</p>
            <p className="text-gray-900">{card.question}</p>
          </>
        )}
        <p className="text-xs text-gray-400 mt-4">Click to flip</p>
      </div>
    </div>
  );
}

function KnowledgeCardComponent({ card }: { card: KnowledgeCard }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold mb-2 text-gray-900">{card.term}</h3>
      <p className="text-gray-600 text-sm mb-3">{card.definition}</p>
      <div className="flex gap-2 flex-wrap">
        {card.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function KeyConceptComponent({ concept }: { concept: KeyConcept }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-gray-900">{concept.concept}</span>
      <div className="flex items-center gap-3">
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${concept.importance}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 w-12 text-right">
          {concept.importance}%
        </span>
      </div>
    </div>
  );
}
