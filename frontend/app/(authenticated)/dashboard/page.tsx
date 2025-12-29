'use client';

import { useState } from 'react';
import { Plus, Search, MoreVertical, Menu } from 'lucide-react';
import Link from 'next/link';
import { getActiveCourses } from '@/lib/mockData';
import { Course, colorClasses, formatDate } from '@/lib/types';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const courses = getActiveCourses();

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-semibold">Courses</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              <span>New Course</span>
            </button>
          </div>
        </div>
      </header>

      {/* Course Grid */}
      <div className="p-6">
        {filteredCourses.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CourseCard({ course }: { course: Course }) {
  const [showMenu, setShowMenu] = useState(false);
  const colorClass = colorClasses[course.color] || colorClasses.blue;

  return (
    <Link
      href={`/course/${course.id}`}
      className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${colorClass} border flex items-center justify-center text-2xl`}>
          {course.icon}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-opacity"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <h3 className="font-semibold mb-2 text-gray-900">{course.name}</h3>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
          {course.documentCount} {course.documentCount === 1 ? 'note' : 'notes'}
        </span>
        <span>Updated {formatDate(course.updatedAt)}</span>
      </div>

      {showMenu && (
        <div className="absolute top-16 right-6 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-10">
          <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
            Edit Course
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600">
            Delete Course
          </button>
        </div>
      )}
    </Link>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  if (searchQuery) {
    return (
      <div className="text-center py-16">
        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-gray-900">No results for "{searchQuery}"</h3>
        <p className="text-gray-500">Try searching with different keywords</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus className="w-10 h-10 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">No courses yet</h3>
      <p className="text-gray-500 mb-6">Create your first course to organize your notes</p>
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Create First Course
      </button>
    </div>
  );
}
