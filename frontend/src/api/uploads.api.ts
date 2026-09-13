import api from './axios';

export const uploadsApi = {
  /** Public — no login needed. Returns { 'branding.logo': '/uploads/...', ... } */
  getBranding: () => api.get('/uploads/branding'),

  /** Admin — upload logo / favicon / banner. key e.g. 'branding.logo' */
  uploadBranding: (key: string, file: File) => {
    const form = new FormData();
    form.append('key', key);
    form.append('image', file);
    return api.post('/uploads/branding', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeBranding: (name: string) => api.delete(`/uploads/branding/${name}`),

  /** Any logged-in user — upload own profile photo */
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/uploads/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Academy staff — upload course thumbnail */
  uploadCourseThumbnail: (courseId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post(`/uploads/courses/${courseId}/thumbnail`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Upload lesson content file (video, PDF, slides, audio).
   * - lessonId provided → attaches to existing lesson
   * - lessonId omitted  → returns URL only (for use during lesson creation)
   * field: 'videoUrl' | 'fileUrl'
   */
  uploadLessonContent: (
    file: File,
    lessonId?: string,
    field: 'videoUrl' | 'fileUrl' = 'fileUrl',
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    form.append('file', file);
    const url = lessonId
      ? `/uploads/lessons/${lessonId}/content?field=${field}`
      : '/uploads/lessons/content';
    return api.post(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e) => { if (e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
        : undefined,
    });
  },
  /**
   * Upload assessment attachment (assignment brief, exam paper, reference doc).
   * - assessmentId provided → attaches to existing assessment
   * - assessmentId omitted  → returns URL only (for use during creation)
   */
  uploadAssessmentAttachment: (
    file: File,
    assessmentId?: string,
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    form.append('file', file);
    const url = assessmentId
      ? `/uploads/assessments/${assessmentId}/attachment`
      : '/uploads/assessments/attachment';
    return api.post(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e) => { if (e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
        : undefined,
    });
  },
};
