import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Shield, Search, Clock, Users, BookOpen, ChevronRight, Star } from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { ORG } from '../../config/organization';

const CATEGORIES = ['All', 'Cybersecurity', 'Networking', 'Programming', 'Cloud Computing', 'AI & Data Science', 'Corporate Training'];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  ONLINE:    { label: 'Online', color: 'bg-blue-100 text-blue-700' },
  CLASSROOM: { label: 'Classroom', color: 'bg-green-100 text-green-700' },
  HYBRID:    { label: 'Hybrid', color: 'bg-purple-100 text-purple-700' },
};

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    academyApi.getPublicCourses({ limit: 100 })
      .then(r => { setCourses(r.data.data || []); setFiltered(r.data.data || []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = courses;
    const courseId = searchParams.get('courseId');
    if (courseId) result = result.filter(c => c.id === courseId);
    if (activeCategory !== 'All') result = result.filter(c => c.category === activeCategory);
    if (search.trim()) result = result.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, activeCategory, courses, searchParams]);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{ORG.logoText}</p>
              <p className="text-blue-400 text-xs">Academy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-sm text-gray-300 hover:text-white transition-colors">Sign In</button>
            <button onClick={() => navigate('/register')}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Apply Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,179,237,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">TrusterLabs Academy</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            World-Class{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Cybersecurity
            </span>
            <br />Training for Africa
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            {ORG.tagline}. Join {ORG.stats.students} students across Africa
            building careers and defending organizations.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, certifications, skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm backdrop-blur"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { label: 'Courses & Programs', value: ORG.stats.courses },
              { label: 'Students Enrolled', value: ORG.stats.students },
              { label: 'Research Publications', value: ORG.stats.research },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-gray-50 min-h-screen">
        {/* Category filters */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 text-sm">
              Showing <span className="font-semibold">{filtered.length}</span> course{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && <span className="text-blue-600"> in {activeCategory}</span>}
            </p>
          </div>

          {/* Course grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No courses found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(course => {
                const typeBadge = TYPE_BADGE[course.type] || TYPE_BADGE.ONLINE;
                return (
                  <div key={course.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
                    onClick={() => navigate('/register')}
                  >
                    {/* Thumbnail (uploaded) or fallback gradient bar */}
                    {course.thumbnail ? (
                      <div className="h-36 -mx-0 overflow-hidden">
                        <img src={course.thumbnail} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      </div>
                    ) : (
                      <div className="h-3 bg-gradient-to-r from-blue-600 to-cyan-500" />
                    )}

                    <div className="p-6">
                      {/* Category + type */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          {course.category}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                        {course.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.durationDays} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {course.capacity} seats
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {course._count?.enrollments || 0} enrolled
                        </span>
                      </div>

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-400">Course Fee</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(course.fee, course.currency)}
                          </p>
                          <p className="text-xs text-gray-400">50% partial payment available</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/register'); }}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                          Enroll <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="bg-[#0f172a] mt-16 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">Ready to Secure Your Future?</h2>
            <p className="text-gray-400 mb-8">
              Join thousands of learners across Africa building careers and strengthening organisations through cybersecurity.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                Get Started Today
              </button>
              <button onClick={() => navigate('/login')}
                className="border border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-xl transition-colors">
                Sign In
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              {ORG.email} · {ORG.phone} · {ORG.supportHours}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
