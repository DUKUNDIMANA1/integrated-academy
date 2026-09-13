import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, Play, Trophy, AlertCircle } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { Button } from '../../components/ui/Button';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Enrollment } from '../../types';
import toast from 'react-hot-toast';

export const StudentCourses: React.FC = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);

  useEffect(() => {
    studentApi.getEnrollments()
      .then(r => setEnrollments(r.data.data || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const viewCertificate = async (enrollmentId: string) => {
    setGeneratingCertificate(enrollmentId);
    try {
      await studentApi.getCertificateForEnrollment(enrollmentId);
      navigate('/student/certificates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Certificate could not be generated');
    } finally {
      setGeneratingCertificate(null);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p className="text-sm text-gray-500">All your enrolled courses</p>
        </div>
        <Button onClick={() => navigate('/student/applications')}>Apply for Course</Button>
      </div>

      {enrollments.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No courses enrolled yet</p>
          <Button className="mt-4" onClick={() => navigate('/student/applications')}>Apply for a Course</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrollments.map(e => {
            const isLocked = e.accessStatus === 'LOCKED';
            const progress = Number(e.progressPercent || 0);
            return (
              <div key={e.id} className={`card relative overflow-hidden ${isLocked ? 'border-red-200' : ''}`}>
                {/* Type banner */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isLocked ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-primary-500'}`} />

                <div className="flex items-start justify-between gap-3 pt-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{e.course?.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{e.course?.code} · {e.course?.type}</p>
                  </div>
                  {getStatusBadge(e.accessStatus)}
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span><span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${isLocked ? 'bg-red-400' : 'bg-primary-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {e.cohort && (
                  <p className="text-xs text-gray-400 mt-3">Cohort: {e.cohort.name} · {formatDate(e.cohort.startDate)}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">Enrolled: {formatDate(e.enrolledAt)}</p>

                {/* Payment status */}
                {e.invoice && Number(e.invoice.outstandingBalance) > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-700">
                      Outstanding: {formatCurrency(e.invoice.outstandingBalance)}
                      {e.checkpointDate && ` · Checkpoint: ${formatDate(e.checkpointDate)}`}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {isLocked ? (
                    <>
                      <Button size="sm" variant="danger" className="flex-1"
                        icon={<Lock className="w-3.5 h-3.5" />}
                        onClick={() => navigate('/student/invoices')}>
                        Pay to Unlock
                      </Button>
                    </>
                  ) : progress === 100 ? (
                    <Button size="sm" variant="success" className="flex-1"
                      icon={<Trophy className="w-3.5 h-3.5" />}
                      loading={generatingCertificate === e.id}
                      onClick={() => viewCertificate(e.id)}>
                      View Certificate
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1"
                      icon={<Play className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/student/courses/${e.courseId}/learn`)}>
                      Continue Learning
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
