import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { academyApi } from '../../api/academy.api';
import { PageSpinner } from '../../components/ui/Spinner';

export const CertificateVerificationPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!code) return;
    academyApi.verifyCertificate(code)
      .then(response => setCertificate(response.data.data))
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full text-center">
        {invalid || !certificate ? (
          <>
            <XCircle className="w-14 h-14 mx-auto text-red-400 mb-4" />
            <h1 className="text-xl font-semibold">Certificate not found</h1>
            <p className="text-sm text-gray-500 mt-2">The certificate code is invalid or no longer available.</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-500 mb-4" />
            <p className="text-xs uppercase tracking-wider text-green-600 font-semibold">Verified Certificate</p>
            <h1 className="text-2xl font-bold mt-2">Certificate of Completion</h1>
            <Award className="w-10 h-10 mx-auto text-primary-600 mt-5" />
            <p className="text-sm text-gray-500 mt-3">Awarded to</p>
            <p className="text-xl font-semibold text-primary-700">
              {certificate.student?.user?.firstName} {certificate.student?.user?.lastName}
            </p>
            <p className="text-sm text-gray-500 mt-4">Completed course</p>
            <p className="font-semibold">{certificate.course?.title}</p>
            <p className="text-xs text-gray-500 mt-3">
              Certificate No. {certificate.certificateNumber} · Issued {new Date(certificate.issuedAt).toLocaleDateString()}
            </p>
            <Link
              to={`/courses?courseId=${certificate.course?.id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <BookOpen className="w-4 h-4" /> View enrolled course
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
