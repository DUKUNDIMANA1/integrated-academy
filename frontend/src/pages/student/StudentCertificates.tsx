import React, { useEffect, useState } from 'react';
import { Award, Download, Shield } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { Button } from '../../components/ui/Button';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const StudentCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getCertificates()
      .then(r => setCertificates(r.data.data || []))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div><h1>My Certificates</h1><p className="text-sm text-gray-500">Certificates earned from completed courses</p></div>

      {certificates.length === 0 ? (
        <div className="card text-center py-16">
          <Award className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No certificates yet</p>
          <p className="text-sm text-gray-400 mt-1">Complete a course to earn your certificate</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="card border-2 border-primary-100 relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-16 translate-x-16 opacity-60" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  {getStatusBadge(cert.status)}
                </div>

                <h3 className="font-bold text-lg mt-3">Certificate of Completion</h3>
                <p className="text-gray-500 text-sm mt-0.5">{cert.courseTitle || 'Completed Course'}</p>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Certificate No.</p>
                    <p className="font-mono font-semibold">{cert.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Issue Date</p>
                    <p className="font-medium">{formatDate(cert.issuedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Verification Code</p>
                    <p className="font-mono text-xs text-primary-600">{cert.verificationCode}</p>
                  </div>
                  {cert.expiresAt && (
                    <div>
                      <p className="text-xs text-gray-400">Expires</p>
                      <p className="font-medium">{formatDate(cert.expiresAt)}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {cert.fileUrl && (
                    <Button size="sm" icon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => window.open(cert.fileUrl, '_blank')}>
                      Download
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" icon={<Shield className="w-3.5 h-3.5" />}
                    onClick={() => window.open(`/verify/${cert.verificationCode}`, '_blank')}>
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
