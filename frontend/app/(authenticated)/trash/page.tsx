'use client';

import { useState } from 'react';
import { Menu, Trash2, RotateCcw, XCircle } from 'lucide-react';
import { getTrashedItems } from '@/lib/mockData';
import { Course, Document, formatDate } from '@/lib/types';
import toast from 'react-hot-toast';

interface TrashItem {
  id: string;
  name: string;
  type: 'course' | 'document';
  deletedAt: Date;
  icon?: string;
}

export default function TrashPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Get trashed items from mock data
  const { courses: trashedCourses, documents: trashedDocuments } = getTrashedItems();

  // Convert to unified TrashItem format
  const [trashItems, setTrashItems] = useState<TrashItem[]>([
    ...trashedCourses.map((course: Course) => ({
      id: course.id,
      name: course.name,
      type: 'course' as const,
      deletedAt: course.deletedAt || new Date(),
      icon: course.icon,
    })),
    ...trashedDocuments.map((doc: Document) => ({
      id: doc.id,
      name: doc.title,
      type: 'document' as const,
      deletedAt: doc.deletedAt || new Date(),
    })),
  ]);

  const handleRestore = (id: string) => {
    setTrashItems(items => items.filter(item => item.id !== id));
    toast.success('Item restored successfully');
  };

  const handleDeleteForever = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setTrashItems(items => items.filter(item => item.id !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
      toast.success('Item permanently deleted');
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-gray-600" />
              <h1 className="text-2xl font-semibold">Trash</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-5xl mx-auto">
        {trashItems.length === 0 ? (
          <EmptyTrash />
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Items in trash will be permanently deleted after 30 days
            </div>
            <div className="space-y-3">
              {trashItems.map((item) => (
                <TrashItemCard
                  key={item.id}
                  item={item}
                  daysAgo={formatDate(item.deletedAt)}
                  onRestore={() => handleRestore(item.id)}
                  onDelete={() => handleDeleteForever(item.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Delete Forever?</h3>
                <p className="text-gray-600">
                  This item will be permanently deleted and cannot be recovered. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TrashItemCard({
  item,
  daysAgo,
  onRestore,
  onDelete
}: {
  item: TrashItem;
  daysAgo: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        {item.type === 'course' && item.icon && (
          <div className="text-3xl">{item.icon}</div>
        )}
        {item.type === 'document' && (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {item.type}
            </span>
          </div>
          <p className="text-sm text-gray-500">Deleted {daysAgo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRestore}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restore</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <XCircle className="w-4 h-4" />
          <span>Delete Forever</span>
        </button>
      </div>
    </div>
  );
}

function EmptyTrash() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trash2 className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">Trash is empty</h3>
      <p className="text-gray-500">Deleted items will appear here</p>
    </div>
  );
}
