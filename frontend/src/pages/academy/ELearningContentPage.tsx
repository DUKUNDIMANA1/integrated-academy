import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, FileQuestion, Layers, RefreshCw, Search } from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { getStatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const ELearningContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await academyApi.getCourses({ limit: 100 });
      // backend returns { data: [...courses], meta: {...} }
      const list = response.data?.data ?? response.data ?? [];
      setCourses(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load e-learning courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { load(); }, [load]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter(course =>
      course.title.toLowerCase().includes(query) || course.code.toLowerCase().includes(query)
    );
  }, [courses, search]);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>E-Learning Content</h1>
          <p className="text-sm text-gray-500">Build lessons, quizzes, exams, assignments, and projects for each course.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => load(true)}
            loading={refreshing}
          >
            Reload
          </Button>
          <Button icon={<BookOpen className="w-4 h-4" />} onClick={() => navigate('/academy/courses')}>
            Manage Courses
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary-600" />
          <div><p className="text-2xl font-semibold">{courses.length}</p><p className="text-xs text-gray-500">Courses</p></div>
        </div>
        <div className="card flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          <div><p className="text-2xl font-semibold">{courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0)}</p><p className="text-xs text-gray-500">Enrolled learners</p></div>
        </div>
        <div className="card flex items-center gap-3">
          <FileQuestion className="w-5 h-5 text-blue-600" />
          <div><p className="text-sm font-semibold">Full authoring</p><p className="text-xs text-gray-500">Lessons and assessments</p></div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="input border-0 p-0 focus:ring-0"
            placeholder="Search courses by title or code..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="divide-y divide-gray-100">
          {filteredCourses.map(course => (
            <div key={course.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{course.title}</p>
                <p className="text-xs text-gray-500">{course.code} · {course._count?.enrollments || 0} enrolled</p>
              </div>
              {getStatusBadge(course.status)}
              <Button size="sm" onClick={() => navigate(`/academy/courses/${course.id}/content`)}>
                Manage Content
              </Button>
            </div>
          ))}
          {filteredCourses.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              {courses.length === 0 ? 'Create a course to start adding e-learning content.' : 'No courses match your search.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
