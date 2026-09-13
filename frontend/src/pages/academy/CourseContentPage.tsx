import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, ChevronDown, ChevronRight,
  BookOpen, FileText, Video, FileQuestion, ClipboardList,
  Award, ArrowLeft, Eye, EyeOff, Target, RotateCcw,
  Upload, X, Music, Presentation, File as FileIcon, CheckCircle2,
} from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { uploadsApi } from '../../api/uploads.api';
import { Button } from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export type ContentTab = 'content' | 'assessments' | 'submissions';

export const LESSON_TYPES = [
  { value: 'TEXT',  label: 'Text / Reading' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PDF',   label: 'PDF Document' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'SCORM', label: 'SCORM Package' },
];
export const ASSESSMENT_TYPES = [
  { value: 'QUIZ',       label: 'Quiz (auto-graded)' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'EXAM',       label: 'Exam (auto + manual)' },
  { value: 'PROJECT',    label: 'Project' },
];
export const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE',      label: 'True / False' },
  { value: 'SHORT_ANSWER',    label: 'Short Answer' },
  { value: 'ESSAY',           label: 'Essay (manual)' },
  { value: 'FILE_UPLOAD',     label: 'File Upload (manual)' },
];

export const lessonIcon = (t: string) => {
  if (t === 'VIDEO') return <Video className="w-4 h-4 text-blue-500" />;
  if (t === 'PDF')   return <FileText className="w-4 h-4 text-red-400" />;
  return <BookOpen className="w-4 h-4 text-gray-400" />;
};

export const CourseContentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course,   setCourse]  = useState<any>(null);
  const [loading,  setLoading] = useState(true);
  const [tab,      setTab]     = useState<ContentTab>('content');
  const [expanded, setExpanded] = useState<string[]>([]);

  // Module state
  const [moduleModal,   setModuleModal]   = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleForm,    setModuleForm]    = useState({ title: '', description: '', order: '1' });
  const [savingModule,  setSavingModule]  = useState(false);
  const [deletingModule,setDeletingModule]= useState<any>(null);

  // Lesson state
  const [lessonModal,    setLessonModal]    = useState(false);
  const [editingLesson,  setEditingLesson]  = useState<any>(null);
  const [lessonModuleId, setLessonModuleId] = useState('');
  const [lessonForm,     setLessonForm]     = useState({
    title: '', content: '', type: 'TEXT', fileUrl: '', videoUrl: '', duration: '', order: '1', isProtected: true,
  });
  const [savingLesson,   setSavingLesson]   = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<any>(null);

  // Assessment state
  const [assessModal,    setAssessModal]    = useState(false);
  const [editingAssess,  setEditingAssess]  = useState<any>(null);
  const [assessModuleId, setAssessModuleId] = useState('');
  const [assessForm,     setAssessForm]     = useState({
    title: '', type: 'QUIZ', description: '', totalMarks: '100', passMark: '50',
    duration: '', attempts: '1', dueDate: '', isPublished: false, attachmentUrl: '',
  });
  const [savingAssess,   setSavingAssess]   = useState(false);
  const [deletingAssess, setDeletingAssess] = useState<any>(null);

  // Assessment attachment upload state
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentProgress,  setAttachmentProgress]  = useState(0);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Question state
  const [openAssess,    setOpenAssess]    = useState<any>(null);
  const [loadingAssess, setLoadingAssess] = useState(false);
  const [qForm,         setQForm]         = useState({ text: '', type: 'MULTIPLE_CHOICE', options: '', correctAnswer: '', marks: '1' });
  const [editingQ,      setEditingQ]      = useState<any>(null);
  const [savingQ,       setSavingQ]       = useState(false);
  const [deletingQ,     setDeletingQ]     = useState<any>(null);

  // Submissions state
  const [submissions,          setSubmissions]          = useState<any[]>([]);
  const [loadingSubs,          setLoadingSubs]          = useState(false);
  const [selectedAssessForSubs,setSelectedAssessForSubs]= useState<any>(null);
  const [gradeForm,            setGradeForm]            = useState({ score: '', feedback: '' });
  const [gradingSub,           setGradingSub]           = useState<any>(null);
  const [savingGrade,          setSavingGrade]          = useState(false);

  // File upload state (lesson modal)
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile,  setUploadingFile]  = useState(false);
  const [videoProgress,  setVideoProgress]  = useState(0);
  const [fileProgress,   setFileProgress]   = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const r = await academyApi.getCourse(courseId);
      const data = r.data.data;
      setCourse(data);
      setExpanded(data.modules?.map((m: any) => m.id) || []);
    } catch { toast.error('Failed to load course'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [courseId]);

  const toggle = (id: string) =>
    setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const mf = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setModuleForm(p => ({ ...p, [f]: e.target.value }));
  const lf = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setLessonForm(p => ({ ...p, [f]: (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const af = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setAssessForm(p => ({ ...p, [f]: (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const qf = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setQForm(p => ({ ...p, [f]: e.target.value }));

  // ── Modules ────────────────────────────────────────────────────────────────

  const openNewModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', order: String((course?.modules?.length || 0) + 1) });
    setModuleModal(true);
  };
  const openEditModule = (m: any) => {
    setEditingModule(m);
    setModuleForm({ title: m.title, description: m.description || '', order: String(m.order) });
    setModuleModal(true);
  };
  const saveModule = async () => {
    if (!moduleForm.title.trim()) { toast.error('Module title is required'); return; }
    setSavingModule(true);
    try {
      const payload = { title: moduleForm.title, description: moduleForm.description, order: parseInt(moduleForm.order) || 1 };
      editingModule
        ? await academyApi.updateModule(editingModule.id, payload)
        : await academyApi.createModule(courseId!, payload);
      toast.success(editingModule ? 'Module updated' : 'Module created');
      setModuleModal(false);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingModule(false); }
  };
  const deleteModule = async () => {
    try {
      await academyApi.deleteModule(deletingModule.id);
      toast.success('Module deleted');
      setDeletingModule(null);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  // ── File upload helpers ────────────────────────────────────────────────────

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const r = await uploadsApi.uploadLessonContent(file, undefined, 'videoUrl', setVideoProgress);
      setLessonForm(p => ({ ...p, videoUrl: r.data.data.url }));
      toast.success('Video uploaded');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploadingVideo(false); setVideoProgress(0); }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    setFileProgress(0);
    try {
      const r = await uploadsApi.uploadLessonContent(file, undefined, 'fileUrl', setFileProgress);
      setLessonForm(p => ({ ...p, fileUrl: r.data.data.url }));
      toast.success('File uploaded');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploadingFile(false); setFileProgress(0); }
  };

  // ── Lessons ────────────────────────────────────────────────────────────────

  const openNewLesson = (moduleId: string, count: number) => {
    setEditingLesson(null);
    setLessonModuleId(moduleId);
    setLessonForm({ title: '', content: '', type: 'TEXT', fileUrl: '', videoUrl: '', duration: '', order: String(count + 1), isProtected: true });
    setUploadingVideo(false); setUploadingFile(false); setVideoProgress(0); setFileProgress(0);
    setLessonModal(true);
  };
  const openEditLesson = (lesson: any, moduleId: string) => {
    setEditingLesson(lesson);
    setLessonModuleId(moduleId);
    setLessonForm({
      title: lesson.title, content: lesson.content || '', type: lesson.type || 'TEXT',
      fileUrl: lesson.fileUrl || '', videoUrl: lesson.videoUrl || '',
      duration: String(lesson.duration || ''), order: String(lesson.order),
      isProtected: lesson.isProtected !== false,
    });
    setUploadingVideo(false); setUploadingFile(false); setVideoProgress(0); setFileProgress(0);
    setLessonModal(true);
  };
  const saveLesson = async () => {
    if (!lessonForm.title.trim()) { toast.error('Lesson title is required'); return; }
    setSavingLesson(true);
    try {
      const payload = {
        title: lessonForm.title, content: lessonForm.content, type: lessonForm.type,
        fileUrl: lessonForm.fileUrl || undefined, videoUrl: lessonForm.videoUrl || undefined,
        duration: lessonForm.duration ? parseInt(lessonForm.duration) : undefined,
        order: parseInt(lessonForm.order) || 1, isProtected: lessonForm.isProtected,
      };
      editingLesson
        ? await academyApi.updateLesson(editingLesson.id, payload)
        : await academyApi.createLesson(lessonModuleId, payload);
      toast.success(editingLesson ? 'Lesson updated' : 'Lesson created');
      setLessonModal(false);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingLesson(false); }
  };
  const deleteLesson = async () => {
    try {
      await academyApi.deleteLesson(deletingLesson.id);
      toast.success('Lesson deleted');
      setDeletingLesson(null);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleAttachmentUpload = async (file: File) => {
    setUploadingAttachment(true);
    setAttachmentProgress(0);
    try {
      const r = await uploadsApi.uploadAssessmentAttachment(file, undefined, setAttachmentProgress);
      setAssessForm(p => ({ ...p, attachmentUrl: r.data.data.url }));
      toast.success('Attachment uploaded');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploadingAttachment(false); setAttachmentProgress(0); }
  };

  // ── Assessments ────────────────────────────────────────────────────────────

  const openNewAssess = (moduleId: string) => {
    setEditingAssess(null);
    setAssessModuleId(moduleId);
    setAssessForm({ title: '', type: 'QUIZ', description: '', totalMarks: '100', passMark: '50', duration: '', attempts: '1', dueDate: '', isPublished: false, attachmentUrl: '' });
    setUploadingAttachment(false); setAttachmentProgress(0);
    setAssessModal(true);
  };
  const openEditAssess = (a: any, moduleId: string) => {
    setEditingAssess(a);
    setAssessModuleId(moduleId);
    setAssessForm({
      title: a.title, type: a.type, description: a.description || '',
      totalMarks: String(a.totalMarks), passMark: String(a.passMark),
      duration: String(a.duration || ''), attempts: String(a.attempts),
      dueDate: a.dueDate ? a.dueDate.split('T')[0] : '', isPublished: !!a.isPublished,
      attachmentUrl: a.attachmentUrl || '',
    });
    setUploadingAttachment(false); setAttachmentProgress(0);
    setAssessModal(true);
  };
  const saveAssess = async () => {
    if (!assessForm.title.trim()) { toast.error('Title is required'); return; }
    setSavingAssess(true);
    try {
      const payload = {
        title: assessForm.title, type: assessForm.type, description: assessForm.description,
        totalMarks: parseInt(assessForm.totalMarks) || 100, passMark: parseInt(assessForm.passMark) || 50,
        duration: assessForm.duration ? parseInt(assessForm.duration) : undefined,
        attempts: parseInt(assessForm.attempts) || 1,
        dueDate: assessForm.dueDate ? new Date(assessForm.dueDate) : undefined,
        isPublished: assessForm.isPublished,
        attachmentUrl: assessForm.attachmentUrl || undefined,
      };
      editingAssess
        ? await academyApi.updateAssessment(editingAssess.id, payload)
        : await academyApi.createAssessment(assessModuleId, payload);
      toast.success(editingAssess ? 'Assessment updated' : 'Assessment created');
      setAssessModal(false);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingAssess(false); }
  };
  const deleteAssess = async () => {
    try {
      await academyApi.deleteAssessment(deletingAssess.id);
      toast.success('Assessment deleted');
      setDeletingAssess(null);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const togglePublish = async (a: any) => {
    try {
      await academyApi.publishAssessment(a.id, !a.isPublished);
      toast.success(a.isPublished ? 'Unpublished' : 'Published — visible to students');
      await load();
    } catch { toast.error('Failed'); }
  };

  // ── Questions ──────────────────────────────────────────────────────────────

  const openQuestions = async (a: any) => {
    setLoadingAssess(true);
    try {
      const r = await academyApi.getAssessment(a.id);
      setOpenAssess(r.data.data);
      setQForm({ text: '', type: 'MULTIPLE_CHOICE', options: '', correctAnswer: '', marks: '1' });
      setEditingQ(null);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoadingAssess(false); }
  };
  const saveQuestion = async () => {
    if (!qForm.text.trim()) { toast.error('Question text is required'); return; }
    if (qForm.type === 'MULTIPLE_CHOICE' && !qForm.options.trim()) { toast.error('Add options (one per line)'); return; }
    if (['MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER'].includes(qForm.type) && !qForm.correctAnswer.trim()) {
      toast.error('Provide the correct answer for auto-grading'); return;
    }
    setSavingQ(true);
    try {
      const options =
        qForm.type === 'MULTIPLE_CHOICE' ? qForm.options.split('\n').map(s => s.trim()).filter(Boolean) :
        qForm.type === 'TRUE_FALSE'       ? ['True', 'False'] : undefined;
      const payload = { text: qForm.text, type: qForm.type, options, correctAnswer: qForm.correctAnswer || undefined, marks: parseInt(qForm.marks) || 1 };
      editingQ
        ? await academyApi.updateQuestion(editingQ.id, payload)
        : await academyApi.createQuestion(openAssess.id, payload);
      toast.success(editingQ ? 'Question updated' : 'Question added');
      setEditingQ(null);
      setQForm({ text: '', type: 'MULTIPLE_CHOICE', options: '', correctAnswer: '', marks: '1' });
      const r = await academyApi.getAssessment(openAssess.id);
      setOpenAssess(r.data.data);
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingQ(false); }
  };
  const startEditQ = (q: any) => {
    setEditingQ(q);
    setQForm({ text: q.text, type: q.type, options: Array.isArray(q.options) ? q.options.join('\n') : '', correctAnswer: q.correctAnswer || '', marks: String(q.marks) });
  };
  const deleteQ = async () => {
    try {
      await academyApi.deleteQuestion(deletingQ.id);
      toast.success('Question deleted');
      setDeletingQ(null);
      const r = await academyApi.getAssessment(openAssess.id);
      setOpenAssess(r.data.data);
      await load();
    } catch { toast.error('Failed'); }
  };

  // ── Submissions / Grading ──────────────────────────────────────────────────

  const loadSubmissions = async (a: any) => {
    setSelectedAssessForSubs(a);
    setLoadingSubs(true);
    try {
      const r = await academyApi.getSubmissions(a.id);
      setSubmissions(r.data.data || []);
    } catch { toast.error('Failed to load submissions'); }
    finally { setLoadingSubs(false); }
  };
  const openGrade = (s: any) => {
    setGradingSub(s);
    setGradeForm({ score: s.score != null ? String(s.score) : '', feedback: s.feedback || '' });
  };
  const saveGrade = async () => {
    if (!gradeForm.score) { toast.error('Enter a score'); return; }
    setSavingGrade(true);
    try {
      await academyApi.gradeSubmission(gradingSub.id, { score: parseFloat(gradeForm.score), feedback: gradeForm.feedback });
      toast.success('Submission graded');
      setGradingSub(null);
      if (selectedAssessForSubs) {
        const r = await academyApi.getSubmissions(selectedAssessForSubs.id);
        setSubmissions(r.data.data || []);
      }
    } catch { toast.error('Failed to grade'); }
    finally { setSavingGrade(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const allAssessments: any[] = course?.modules?.flatMap((m: any) =>
    (m.assessments || []).map((a: any) => ({ ...a, moduleTitle: m.title, moduleId: m.id }))
  ) || [];

  if (loading) return <PageSpinner />;
  if (!course)  return <div className="card text-center py-16 text-gray-400">Course not found</div>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/academy/courses')}>
          Courses
        </Button>
        <div className="flex-1">
          <h1 className="text-xl">{course.title}</h1>
          <p className="text-sm text-gray-500">{course.code} · {course.modules?.length || 0} modules · {allAssessments.length} assessments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          ['content',     'Course Content',        BookOpen],
          ['assessments', 'Assessments & Exams',   FileQuestion],
          ['submissions', 'Submissions & Grading', Award],
        ] as [ContentTab, string, any][]).map(([v, label, Icon]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── CONTENT TAB ─────────────────────────────────────────────────────── */}
      {tab === 'content' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openNewModule}>Add Module</Button>
          </div>

          {course.modules?.length === 0 && (
            <div className="card text-center py-14">
              <BookOpen className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="font-medium text-gray-700">No modules yet</p>
              <p className="text-sm text-gray-400 mb-4">Organise your course into modules, then add lessons.</p>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openNewModule}>Create first module</Button>
            </div>
          )}

          {course.modules?.map((m: any, mi: number) => (
            <div key={m.id} className="card p-0 overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/70 border-b border-gray-100">
                <button onClick={() => toggle(m.id)} className="text-gray-400">
                  {expanded.includes(m.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Module {mi + 1}: {m.title}</p>
                  <p className="text-xs text-gray-400">{m.lessons?.length || 0} lessons · {m.assessments?.length || 0} assessments</p>
                </div>
                <Button size="sm" variant="ghost" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openNewLesson(m.id, m.lessons?.length || 0)}>Lesson</Button>
                <Button size="sm" variant="ghost" icon={<FileQuestion className="w-3.5 h-3.5" />} onClick={() => openNewAssess(m.id)}>Quiz / Exam</Button>
                <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEditModule(m)} />
                <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeletingModule(m)} />
              </div>

              {/* Module body */}
              {expanded.includes(m.id) && (
                <div className="divide-y divide-gray-50">
                  {(m.lessons || []).map((l: any) => (
                    <div key={l.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                      {lessonIcon(l.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.order}. {l.title}</p>
                        <p className="text-xs text-gray-400">{l.type}{l.duration ? ` · ${l.duration} min` : ''}{l.isProtected ? ' · protected' : ' · preview'}</p>
                      </div>
                      <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEditLesson(l, m.id)} />
                      <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeletingLesson(l)} />
                    </div>
                  ))}
                  {(m.assessments || []).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 px-6 py-3 bg-amber-50/50">
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-gray-400">
                          {a.type} · {a.totalMarks} marks · {a.isPublished ? 'published' : 'draft'}
                          {a.attachmentUrl && <span className="ml-1 text-amber-600">· 📎 attachment</span>}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openQuestions(a)}>Questions</Button>
                      <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEditAssess(a, m.id)} />
                      <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeletingAssess(a)} />
                    </div>
                  ))}
                  {(m.lessons || []).length === 0 && (m.assessments || []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No content yet — add a lesson or quiz above.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ASSESSMENTS TAB ─────────────────────────────────────────────────── */}
      {tab === 'assessments' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold">All Assessments · Quizzes · Exams</h3>
            <p className="text-xs text-gray-400 mt-0.5">MCQ / True-False auto-graded. Essays need manual grading.</p>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Title</th><th>Module</th><th>Type</th><th>Marks</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {allAssessments.map(a => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.title}</td>
                    <td className="text-sm text-gray-500">{a.moduleTitle}</td>
                    <td><span className="badge badge-blue text-xs">{a.type}</span></td>
                    <td>{a.totalMarks}</td>
                    <td>{a.isPublished ? <Badge variant="green">Published</Badge> : <Badge variant="gray">Draft</Badge>}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openQuestions(a)}>Questions</Button>
                        <Button size="sm" variant="ghost" icon={a.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} onClick={() => togglePublish(a)} />
                        <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEditAssess(a, a.moduleId)} />
                        <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeletingAssess(a)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {allAssessments.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">No assessments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUBMISSIONS TAB ──────────────────────────────────────────────────── */}
      {tab === 'submissions' && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Assessment picker */}
          <div className="card p-0 overflow-hidden h-fit">
            <div className="px-5 py-3 border-b border-gray-100 font-semibold text-sm">Select assessment</div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {allAssessments.map(a => (
                <button key={a.id} onClick={() => loadSubmissions(a)}
                  className={`w-full text-left px-5 py-3 text-sm hover:bg-gray-50 ${selectedAssessForSubs?.id === a.id ? 'bg-primary-50' : ''}`}>
                  <p className="font-medium truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.type}</p>
                </button>
              ))}
              {allAssessments.length === 0 && (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No assessments</p>
              )}
            </div>
          </div>

          {/* Submissions list */}
          <div className="lg:col-span-2 card p-0 overflow-hidden h-fit">
            <div className="px-5 py-3 border-b border-gray-100 font-semibold text-sm">
              {selectedAssessForSubs ? `Submissions — ${selectedAssessForSubs.title}` : 'Submissions'}
            </div>
            {!selectedAssessForSubs ? (
              <p className="px-5 py-10 text-sm text-gray-400 text-center">Pick an assessment.</p>
            ) : loadingSubs ? (
              <p className="px-5 py-10 text-sm text-gray-400 text-center">Loading…</p>
            ) : submissions.length === 0 ? (
              <p className="px-5 py-10 text-sm text-gray-400 text-center">No submissions yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Attempt</th><th>Score</th><th>Status</th><th>Submitted</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {submissions.map((s: any) => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.studentId.slice(0, 8)}…</td>
                        <td>#{s.attemptNumber}</td>
                        <td className="font-semibold">{s.score != null ? Number(s.score) : '—'}</td>
                        <td><Badge variant={s.status === 'GRADED' ? 'green' : 'yellow'}>{s.status}</Badge></td>
                        <td className="text-xs text-gray-400">{new Date(s.submittedAt).toLocaleString()}</td>
                        <td><Button size="sm" variant="secondary" onClick={() => openGrade(s)}>Grade</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}

      {/* Module modal */}
      <Modal isOpen={moduleModal} onClose={() => setModuleModal(false)}
        title={editingModule ? 'Edit Module' : 'New Module'} size="md"
        footer={<><Button variant="secondary" onClick={() => setModuleModal(false)}>Cancel</Button><Button loading={savingModule} onClick={saveModule}>{editingModule ? 'Update' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Module Title *" value={moduleForm.title} onChange={mf('title')} />
          <Textarea label="Description" value={moduleForm.description} onChange={mf('description')} />
          <Input label="Order" type="number" value={moduleForm.order} onChange={mf('order')} />
        </div>
      </Modal>

      {/* Lesson modal */}
      <Modal isOpen={lessonModal} onClose={() => setLessonModal(false)}
        title={editingLesson ? 'Edit Lesson' : 'New Lesson'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setLessonModal(false)}>Cancel</Button><Button loading={savingLesson} onClick={saveLesson}>{editingLesson ? 'Update' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Lesson Title *" value={lessonForm.title} onChange={lf('title')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Content Type" value={lessonForm.type} onChange={lf('type')} options={LESSON_TYPES} />
            <Input label="Order" type="number" value={lessonForm.order} onChange={lf('order')} />
          </div>

          {/* Text content — shown for TEXT type */}
          {lessonForm.type === 'TEXT' && (
            <Textarea label="Text Content" value={lessonForm.content} onChange={lf('content')} rows={5} />
          )}

          {/* Video upload — shown for VIDEO type */}
          {lessonForm.type === 'VIDEO' && (
            <div className="space-y-2">
              <label className="label">Video File</label>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/avi,video/x-msvideo"
                className="hidden" onChange={e => { if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]); }} />
              {lessonForm.videoUrl ? (
                <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{lessonForm.videoUrl.split('/').pop()}</p>
                    <p className="text-xs text-green-600">Video ready</p>
                  </div>
                  <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => setLessonForm(p => ({ ...p, videoUrl: '' }))} />
                </div>
              ) : uploadingVideo ? (
                <div className="border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-blue-500 animate-pulse" />
                    <span className="text-sm text-blue-700">Uploading… {videoProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button onClick={() => videoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-300" />
                  <span className="text-sm font-medium text-gray-500">Click to upload video</span>
                  <span className="text-xs text-gray-400">MP4, MOV, WebM, AVI — max 500 MB</span>
                </button>
              )}
              <p className="text-xs text-gray-400">Or paste a URL instead:</p>
              <Input placeholder="https://..." value={lessonForm.videoUrl} onChange={lf('videoUrl')} />
            </div>
          )}

          {/* PDF upload — shown for PDF type */}
          {lessonForm.type === 'PDF' && (
            <div className="space-y-2">
              <label className="label">PDF File</label>
              <input ref={fileInputRef} type="file" accept="application/pdf"
                className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              {lessonForm.fileUrl ? (
                <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{lessonForm.fileUrl.split('/').pop()}</p>
                    <p className="text-xs text-green-600">PDF ready</p>
                  </div>
                  <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => setLessonForm(p => ({ ...p, fileUrl: '' }))} />
                </div>
              ) : uploadingFile ? (
                <div className="border border-red-100 bg-red-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-red-400 animate-pulse" />
                    <span className="text-sm text-red-700">Uploading… {fileProgress}%</span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full transition-all" style={{ width: `${fileProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-red-400 hover:bg-red-50/50 transition-colors">
                  <FileText className="w-8 h-8 text-gray-300" />
                  <span className="text-sm font-medium text-gray-500">Click to upload PDF</span>
                  <span className="text-xs text-gray-400">PDF — max 500 MB</span>
                </button>
              )}
              <p className="text-xs text-gray-400">Or paste a URL instead:</p>
              <Input placeholder="https://..." value={lessonForm.fileUrl} onChange={lf('fileUrl')} />
            </div>
          )}

          {/* SCORM / Slides upload — shown for SCORM type */}
          {lessonForm.type === 'SCORM' && (
            <div className="space-y-2">
              <label className="label">Presentation / Slides File</label>
              <input ref={fileInputRef} type="file"
                accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              {lessonForm.fileUrl ? (
                <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{lessonForm.fileUrl.split('/').pop()}</p>
                    <p className="text-xs text-green-600">Slides ready</p>
                  </div>
                  <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => setLessonForm(p => ({ ...p, fileUrl: '' }))} />
                </div>
              ) : uploadingFile ? (
                <div className="border border-orange-100 bg-orange-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <FileIcon className="w-5 h-5 text-orange-400 animate-pulse" />
                    <span className="text-sm text-orange-700">Uploading… {fileProgress}%</span>
                  </div>
                  <div className="w-full bg-orange-100 rounded-full h-1.5">
                    <div className="bg-orange-400 h-1.5 rounded-full transition-all" style={{ width: `${fileProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                  <FileIcon className="w-8 h-8 text-gray-300" />
                  <span className="text-sm font-medium text-gray-500">Click to upload Slides</span>
                  <span className="text-xs text-gray-400">PPT, PPTX — max 500 MB</span>
                </button>
              )}
              <p className="text-xs text-gray-400">Or paste a URL instead:</p>
              <Input placeholder="https://..." value={lessonForm.fileUrl} onChange={lf('fileUrl')} />
            </div>
          )}

          {/* Audio upload — shown for AUDIO type */}
          {lessonForm.type === 'AUDIO' && (
            <div className="space-y-2">
              <label className="label">Audio File</label>
              <input ref={fileInputRef} type="file" accept="audio/mpeg,audio/ogg,audio/wav,audio/aac,audio/mp4,audio/x-m4a"
                className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              {lessonForm.fileUrl ? (
                <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{lessonForm.fileUrl.split('/').pop()}</p>
                    <p className="text-xs text-green-600">Audio ready</p>
                  </div>
                  <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5 text-red-500" />}
                    onClick={() => setLessonForm(p => ({ ...p, fileUrl: '' }))} />
                </div>
              ) : uploadingFile ? (
                <div className="border border-purple-100 bg-purple-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Music className="w-5 h-5 text-purple-400 animate-pulse" />
                    <span className="text-sm text-purple-700">Uploading… {fileProgress}%</span>
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-1.5">
                    <div className="bg-purple-400 h-1.5 rounded-full transition-all" style={{ width: `${fileProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                  <Music className="w-8 h-8 text-gray-300" />
                  <span className="text-sm font-medium text-gray-500">Click to upload Audio</span>
                  <span className="text-xs text-gray-400">MP3, WAV, OGG, AAC, M4A — max 500 MB</span>
                </button>
              )}
              <p className="text-xs text-gray-400">Or paste a URL instead:</p>
              <Input placeholder="https://..." value={lessonForm.fileUrl} onChange={lf('fileUrl')} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (min)" type="number" value={lessonForm.duration} onChange={lf('duration')} />
            <label className="flex items-center gap-2 text-sm self-end pb-1">
              <input type="checkbox" checked={lessonForm.isProtected} onChange={lf('isProtected')} className="w-4 h-4 accent-blue-600" />
              Protected (enrolled students only)
            </label>
          </div>
        </div>
      </Modal>

      {/* Assessment modal */}
      <Modal isOpen={assessModal} onClose={() => setAssessModal(false)}
        title={editingAssess ? 'Edit Assessment' : 'New Quiz / Exam'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setAssessModal(false)}>Cancel</Button><Button loading={savingAssess} onClick={saveAssess}>{editingAssess ? 'Update' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Title *" value={assessForm.title} onChange={af('title')} />
          <Textarea label="Instructions" value={assessForm.description} onChange={af('description')} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={assessForm.type} onChange={af('type')} options={ASSESSMENT_TYPES} />
            <Input label="Due Date" type="date" value={assessForm.dueDate} onChange={af('dueDate')} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input label="Total marks" type="number" value={assessForm.totalMarks} onChange={af('totalMarks')} />
            <Input label="Pass mark"   type="number" value={assessForm.passMark}   onChange={af('passMark')} />
            <Input label="Time (min)"  type="number" value={assessForm.duration}   onChange={af('duration')} />
            <Input label="Attempts"    type="number" value={assessForm.attempts}   onChange={af('attempts')} />
          </div>

          {/* Attachment upload — assignment brief, exam paper, reference doc */}
          <div className="space-y-2">
            <label className="label">Attachment <span className="text-gray-400 font-normal">(optional — assignment brief, exam paper, reading)</span></label>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.mp4,.mov,.mp3,.wav"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleAttachmentUpload(e.target.files[0]); }}
            />
            {assessForm.attachmentUrl ? (
              <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 truncate">
                    {assessForm.attachmentUrl.split('/').pop()}
                  </p>
                  <a href={assessForm.attachmentUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-green-600 hover:underline">Preview / Download</a>
                </div>
                <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5 text-red-500" />}
                  onClick={() => setAssessForm(p => ({ ...p, attachmentUrl: '' }))} />
              </div>
            ) : uploadingAttachment ? (
              <div className="border border-amber-100 bg-amber-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <Upload className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-sm text-amber-700">Uploading… {attachmentProgress}%</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${attachmentProgress}%` }} />
                </div>
              </div>
            ) : (
              <button
                onClick={() => attachmentInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
              >
                <Upload className="w-7 h-7 text-gray-300" />
                <span className="text-sm font-medium text-gray-500">Click to attach a file</span>
                <span className="text-xs text-gray-400">PDF, Word, PPT, Excel, ZIP, video, audio — max 200 MB</span>
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={assessForm.isPublished} onChange={af('isPublished')} className="w-4 h-4 accent-blue-600" />
            Publish immediately
          </label>
        </div>
      </Modal>

      {/* Questions modal */}
      <Modal isOpen={!!openAssess} onClose={() => setOpenAssess(null)}
        title={openAssess ? `Questions — ${openAssess.title}` : ''} size="xl">
        {loadingAssess ? <p className="text-sm text-gray-400">Loading…</p> : openAssess && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="badge badge-blue">{openAssess.type}</span>
              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {openAssess.totalMarks} marks</span>
              <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> {openAssess.attempts} tries</span>
              {openAssess.isPublished ? <Badge variant="green">Published</Badge> : <Badge variant="gray">Draft</Badge>}
            </div>

            {/* Question list */}
            <div className="space-y-2">
              {(openAssess.questions || []).map((q: any, i: number) => (
                <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{q.type} · {q.marks} mark(s)</p>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {q.options.map((o: string, oi: number) => (
                            <li key={oi} className={`text-xs px-2 py-0.5 rounded ${o === q.correctAnswer ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                              {o === q.correctAnswer ? '✓ ' : ''}{o}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => startEditQ(q)} />
                      <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeletingQ(q)} />
                    </div>
                  </div>
                </div>
              ))}
              {(openAssess.questions || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6 border border-dashed rounded-xl">No questions yet.</p>
              )}
            </div>

            {/* Add / edit question form */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-sm">{editingQ ? 'Edit Question' : 'Add Question'}</h4>
              <Textarea label="Question *" value={qForm.text} onChange={qf('text')} rows={2} />
              <div className="grid grid-cols-3 gap-3">
                <Select label="Type" value={qForm.type} onChange={qf('type')} options={QUESTION_TYPES} />
                <Input label="Marks" type="number" value={qForm.marks} onChange={qf('marks')} />
                <Input label="Correct Answer" value={qForm.correctAnswer} onChange={qf('correctAnswer')} />
              </div>
              {qForm.type === 'MULTIPLE_CHOICE' && (
                <Textarea label="Options (one per line)" value={qForm.options} onChange={qf('options')} rows={3} />
              )}
              <div className="flex justify-end gap-2">
                {editingQ && (
                  <Button size="sm" variant="secondary" onClick={() => { setEditingQ(null); setQForm({ text: '', type: 'MULTIPLE_CHOICE', options: '', correctAnswer: '', marks: '1' }); }}>
                    Cancel
                  </Button>
                )}
                <Button size="sm" loading={savingQ} icon={<Plus className="w-4 h-4" />} onClick={saveQuestion}>
                  {editingQ ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Grade submission modal */}
      <Modal isOpen={!!gradingSub} onClose={() => setGradingSub(null)}
        title="Grade Submission" size="md"
        footer={<><Button variant="secondary" onClick={() => setGradingSub(null)}>Cancel</Button><Button loading={savingGrade} onClick={saveGrade}>Save Grade</Button></>}>
        <div className="space-y-4">
          {gradingSub && (
            <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-auto max-h-48">
              {JSON.stringify(gradingSub.answers, null, 2)}
            </pre>
          )}
          <Input label="Score *" type="number" value={gradeForm.score} onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))} />
          <Textarea label="Feedback" value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} rows={3} />
        </div>
      </Modal>

      {/* Confirm dialogs */}
      <ConfirmDialog isOpen={!!deletingModule} onClose={() => setDeletingModule(null)} onConfirm={deleteModule} title="Delete Module"     message="Delete this module and all its content?" />
      <ConfirmDialog isOpen={!!deletingLesson} onClose={() => setDeletingLesson(null)} onConfirm={deleteLesson} title="Delete Lesson"     message="Delete this lesson?" />
      <ConfirmDialog isOpen={!!deletingAssess} onClose={() => setDeletingAssess(null)} onConfirm={deleteAssess} title="Delete Assessment" message="Delete this assessment and all its questions?" />
      <ConfirmDialog isOpen={!!deletingQ}      onClose={() => setDeletingQ(null)}      onConfirm={deleteQ}      title="Delete Question"   message="Delete this question?" />
    </div>
  );
};
