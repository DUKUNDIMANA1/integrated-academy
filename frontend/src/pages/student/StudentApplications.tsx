import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { academyApi } from '../../api/academy.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Application, Course } from '../../types';
import toast from 'react-hot-toast';

export const StudentApplications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ courseId: '', educationBackground: '', workExperience: '', motivation: '' });

  const load = async () => {
    const [appRes, courseRes] = await Promise.all([
      studentApi.getApplications(),
      academyApi.getPublicCourses({ limit: 100 }),
    ]);
    setApplications(appRes.data.data || []);
    setCourses(courseRes.data.data || []);
  };

  useEffect(() => { load().catch(() => {}).finally(() => setLoading(false)); }, []);

  const handleSubmit = async () => {
    if (!form.courseId) { toast.error('Please select a course'); return; }
    setSubmitting(true);
    try {
      await studentApi.submitApplication(form);
      toast.success('Application submitted successfully!');
      setShowModal(false);
      setForm({ courseId: '', educationBackground: '', workExperience: '', motivation: '' });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Track your course applications</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Apply for Course
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-500 font-medium">No applications yet</h3>
          <p className="text-sm text-gray-400 mt-1">Apply for a course to get started</p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>Apply Now</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{app.course?.title}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Code: {app.course?.code} · Fee: {formatCurrency(app.course?.fee, app.course?.currency)}
                  </p>
                  {app.cohort && <p className="text-xs text-gray-400 mt-0.5">Cohort: {app.cohort.name} · Starts {formatDate(app.cohort.startDate)}</p>}
                  {app.rejectionReason && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {app.rejectionReason}
                    </div>
                  )}
                  {app.invoice && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Invoice #{app.invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-blue-700">
                        <span>Total: {formatCurrency(app.invoice.totalAmount)}</span>
                        <span>Paid: {formatCurrency(app.invoice.paidAmount)}</span>
                        {Number(app.invoice.outstandingBalance) > 0 && (
                          <span className="font-semibold text-red-700">Outstanding: {formatCurrency(app.invoice.outstandingBalance)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-gray-400">{formatDate(app.createdAt)}</p>
                  {app.invoice && Number(app.invoice.outstandingBalance) > 0 && (
                    <Button size="sm" onClick={() => navigate('/student/invoices')}>Pay Now</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for a Course" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleSubmit}>Submit Application</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Select Course *"
            placeholder="Choose a course..."
            value={form.courseId}
            onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
            options={courses.map(c => ({ value: c.id, label: `${c.title} — ${formatCurrency(c.fee, c.currency)}` }))}
          />
          <Textarea
            label="Education Background"
            placeholder="Describe your educational background..."
            value={form.educationBackground}
            onChange={e => setForm(p => ({ ...p, educationBackground: e.target.value }))}
            rows={3}
          />
          <Textarea
            label="Work Experience"
            placeholder="Describe your relevant work experience..."
            value={form.workExperience}
            onChange={e => setForm(p => ({ ...p, workExperience: e.target.value }))}
            rows={3}
          />
          <Textarea
            label="Motivation / Why this course?"
            placeholder="Why do you want to take this course?"
            value={form.motivation}
            onChange={e => setForm(p => ({ ...p, motivation: e.target.value }))}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};
