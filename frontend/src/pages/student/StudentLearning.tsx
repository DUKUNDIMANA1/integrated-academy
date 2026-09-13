import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, FileText, Video, BookOpen, CreditCard, ChevronDown, ChevronRight, Music, Presentation } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export const StudentLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    studentApi.getCourseContent(courseId)
      .then(r => {
        const data = r.data.data;
        setCourse(data);
        if (data.modules?.[0]?.lessons?.[0]) {
          setActiveLesson(data.modules[0].lessons[0]);
          setExpandedModules([data.modules[0].id]);
        }
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggleModule = (id: string) =>
    setExpandedModules(p => p.includes(id) ? p.filter(m => m !== id) : [...p, id]);

  const handleComplete = async (lessonId: string) => {
    setCompleting(true);
    try {
      const completion = await studentApi.markLessonComplete(lessonId);
      toast.success(completion.data.data?.completed
        ? 'All course lessons completed. Pass the final examination to earn your certificate.'
        : 'Lesson completed!');
      // Refresh
      const r = await studentApi.getCourseContent(courseId!);
      setCourse(r.data.data);
    } catch { toast.error('Failed to mark lesson'); }
    finally { setCompleting(false); }
  };

  const getLessonIcon = (type: string) => {
    if (type === 'VIDEO') return <Video className="w-4 h-4" />;
    if (type === 'PDF') return <FileText className="w-4 h-4" />;
    if (type === 'AUDIO') return <Music className="w-4 h-4" />;
    if (type === 'SCORM') return <Presentation className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  if (loading) return <PageSpinner />;

  const isLocked = course?.accessStatus === 'LOCKED';

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{course?.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{course?.code} · {course?.type}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/student/courses')}>← Back</Button>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-lg">Course Access Locked</h3>
              <p className="text-sm text-red-700 mt-1">
                Your access has been temporarily suspended due to an unpaid balance.
                Pay the outstanding amount to continue learning immediately — no admin approval needed.
              </p>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-lg font-bold text-red-800">
                  Outstanding: {formatCurrency(course?.outstandingBalance || 0)}
                </span>
                <Button variant="danger" icon={<CreditCard className="w-4 h-4" />}
                  onClick={() => navigate('/student/invoices')}>
                  Pay Now — Unlock Instantly
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Content Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-700">Course Content</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {course?.modules?.map((mod: any) => {
              const isExpanded = expandedModules.includes(mod.id);
              return (
                <div key={mod.id} className="border-b border-gray-50 last:border-0">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    <span>{mod.title}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isExpanded && (
                    <div className="bg-gray-50/50">
                      {mod.lessons?.map((lesson: any) => {
                        const completed = course?.progress?.find((p: any) => p.lessonId === lesson.id)?.isCompleted;
                        const locked = isLocked && lesson.isProtected;
                        return (
                          <button
                            key={lesson.id}
                            disabled={locked}
                            onClick={() => !locked && setActiveLesson(lesson)}
                            className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm border-b border-gray-100 last:border-0 transition-colors
                              ${activeLesson?.id === lesson.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}
                              ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className={`w-5 h-5 flex-shrink-0 ${completed ? 'text-green-500' : 'text-gray-400'}`}>
                              {locked ? <Lock className="w-4 h-4" /> : completed ? <CheckCircle className="w-4 h-4" /> : getLessonIcon(lesson.type)}
                            </span>
                            <span className="text-left truncate">{lesson.title}</span>
                          </button>
                        );
                      })}
                      {(mod.assessments || []).map((a: any) => (
                        <button
                          key={a.id}
                          disabled={isLocked}
                          onClick={() => !isLocked && navigate(`/student/assessments/${a.id}`)}
                          className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm border-b border-amber-100 last:border-0 bg-amber-50/60 transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-50'} text-gray-700`}
                        >
                          <span className="w-5 h-5 flex-shrink-0 text-amber-600"><FileText className="w-4 h-4" /></span>
                          <span className="text-left truncate flex-1">{a.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{a.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="lg:col-span-2">
          {activeLesson ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{activeLesson.title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{activeLesson.type?.toLowerCase()}</p>
                  </div>
                  {!isLocked && (
                    <Button
                      size="sm" variant="success"
                      loading={completing}
                      onClick={() => handleComplete(activeLesson.id)}
                      icon={<CheckCircle className="w-4 h-4" />}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {activeLesson.videoUrl && !isLocked && (
                  <div className="mb-4 bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                    <video src={activeLesson.videoUrl} controls className="w-full h-full" />
                  </div>
                )}
                {activeLesson.type === 'PDF' && activeLesson.fileUrl && !isLocked && (
                  <a href={activeLesson.fileUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100">
                    <FileText className="w-5 h-5" /> Open PDF lesson
                  </a>
                )}
                {activeLesson.type === 'AUDIO' && activeLesson.fileUrl && !isLocked && (
                  <audio src={activeLesson.fileUrl} controls className="w-full mb-4" />
                )}
                {activeLesson.type === 'SCORM' && activeLesson.fileUrl && !isLocked && (
                  <a href={activeLesson.fileUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100">
                    <Presentation className="w-5 h-5" /> Open course presentation
                  </a>
                )}
                {activeLesson.content && (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p>{activeLesson.content}</p>
                  </div>
                )}
                {!activeLesson.content && !activeLesson.videoUrl && !activeLesson.fileUrl && (
                  <p className="text-gray-400 text-sm">No content available for this lesson.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-16">
              <BookOpen className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">Select a lesson to start learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
