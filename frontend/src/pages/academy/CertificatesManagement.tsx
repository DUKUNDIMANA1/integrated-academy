import React, { useEffect, useState } from 'react';
import { Award, Search, XCircle, Plus, Download } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { academyApi } from '../../api/academy.api';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REVOKED', label: 'Revoked' },
  { value: 'EXPIRED', label: 'Expired' },
];

const CAN_MANAGE = ['SUPER_ADMIN', 'GENERAL_MANAGER', 'ACADEMY_MANAGER', 'ELEARNING_MANAGER'];

export const CertificatesManagement: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const canManage = CAN_MANAGE.includes(user?.role || '');
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [revoking, setRevoking] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [savingRevoke, setSavingRevoke] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ studentId: '', courseId: '', enrollmentId: '' });
  const [issuingSaving, setIssuingSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await academyApi.getCertificates({ status: statusFilter || undefined });
      setCerts(r.data.data || []);
    } catch { toast.error('Failed to load certificates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = certs.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${c.student?.user?.firstName ?? ''} ${c.student?.user?.lastName ?? ''}`.toLowerCase();
    return (
      c.certificateNumber?.toLowerCase().includes(s) ||
      c.verificationCode?.toLowerCase().includes(s) ||
      name.includes(s)
    );
  });

  const handleRevoke = async () => {
    if (!revokeReason.trim()) { toast.error('Provide a reason'); return; }
    setSavingRevoke(true);
    try {
      await academyApi.revokeCertificate(revoking.id, revokeReason);
      toast.success('Certificate revoked');
      setRevoking(null);
      setRevokeReason('');
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSavingRevoke(false); }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) { toast.error('Enter a verification code'); return; }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const r = await academyApi.verifyCertificate(verifyCode.trim());
      setVerifyResult(r.data.data);
    } catch { setVerifyResult(null); toast.error('Certificate not found or invalid'); }
    finally { setVerifying(false); }
  };

  const handleIssue = async () => {
    const { studentId, courseId, enrollmentId } = issueForm;
    if (!studentId || !courseId || !enrollmentId) { toast.error('All fields are required'); return; }
    setIssuingSaving(true);
    try {
      await academyApi.issueCertificate({ studentId, courseId, enrollmentId });
      toast.success('Certificate issued');
      setIssueModal(false);
      setIssueForm({ studentId: '', courseId: '', enrollmentId: '' });
      await load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to issue'); }
    finally { setIssuingSaving(false); }
  };

  const statusBadge = (status: string) => {
    if (status === 'ACTIVE')  return <Badge variant="green">Active</Badge>;
    if (status === 'REVOKED') return <Badge variant="red">Revoked</Badge>;
    return <Badge variant="gray">Expired</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Certificates</h1>
          <p className="text-sm text-gray-500">
            {canManage ? 'Issue, verify and revoke student certificates' : 'View all issued student certificates'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Search className="w-4 h-4" />} onClick={() => setVerifyModal(true)}>
            Verify Code
          </Button>
          {canManage && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIssueModal(true)}>
              Issue Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name, cert number, or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Certificate #</th>
                  <th>Student</th>
                  <th>Course ID</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Verification Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs font-medium">{c.certificateNumber}</td>
                    <td>
                      <p className="font-medium">
                        {c.student?.user?.firstName} {c.student?.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{c.student?.user?.email}</p>
                    </td>
                    <td className="font-mono text-xs text-gray-500">{c.courseId?.slice(0, 8)}…</td>
                    <td className="text-sm">{new Date(c.issuedAt).toLocaleDateString()}</td>
                    <td className="text-sm text-gray-400">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td>{statusBadge(c.status)}</td>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {c.verificationCode}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {c.fileUrl && (
                          <a href={c.fileUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost" icon={<Download className="w-3.5 h-3.5" />} />
                          </a>
                        )}
                        {canManage && c.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<XCircle className="w-3.5 h-3.5 text-red-500" />}
                            onClick={() => { setRevoking(c); setRevokeReason(''); }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-12">
                      <Award className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                      No certificates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal — managers only */}
      {canManage && (
      <Modal
        isOpen={issueModal}
        onClose={() => setIssueModal(false)}
        title="Issue Certificate"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIssueModal(false)}>Cancel</Button>
            <Button loading={issuingSaving} onClick={handleIssue}>Issue</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Paste the IDs from the student, course, and enrollment records.
          </p>
          <Input
            label="Student ID *"
            placeholder="UUID"
            value={issueForm.studentId}
            onChange={e => setIssueForm(p => ({ ...p, studentId: e.target.value }))}
          />
          <Input
            label="Course ID *"
            placeholder="UUID"
            value={issueForm.courseId}
            onChange={e => setIssueForm(p => ({ ...p, courseId: e.target.value }))}
          />
          <Input
            label="Enrollment ID *"
            placeholder="UUID"
            value={issueForm.enrollmentId}
            onChange={e => setIssueForm(p => ({ ...p, enrollmentId: e.target.value }))}
          />
        </div>
      </Modal>
      )}

      {/* Revoke Confirm Modal — managers only */}
      {canManage && (
      <Modal
        isOpen={!!revoking}
        onClose={() => setRevoking(null)}
        title="Revoke Certificate"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevoking(null)}>Cancel</Button>
            <Button variant="danger" loading={savingRevoke} onClick={handleRevoke}>Revoke</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently revoke certificate <strong>{revoking?.certificateNumber}</strong>. The student will no longer be able to verify it.
          </p>
          <Input
            label="Reason *"
            placeholder="e.g. Academic misconduct, duplicate issuance…"
            value={revokeReason}
            onChange={e => setRevokeReason(e.target.value)}
          />
        </div>
      </Modal>
      )}

      {/* Verify Code Modal */}
      <Modal
        isOpen={verifyModal}
        onClose={() => { setVerifyModal(false); setVerifyResult(null); setVerifyCode(''); }}
        title="Verify Certificate"
        size="md"
        footer={
          <Button loading={verifying} icon={<Search className="w-4 h-4" />} onClick={handleVerify}>
            Verify
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="Verification Code"
            placeholder="Enter the code from the certificate"
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value)}
          />
          {verifyResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <Award className="w-4 h-4" /> Certificate Valid
              </div>
              <p className="text-sm">
                <strong>{verifyResult.student?.user?.firstName} {verifyResult.student?.user?.lastName}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Issued: {new Date(verifyResult.issuedAt).toLocaleDateString()}
                {verifyResult.expiresAt && ` · Expires: ${new Date(verifyResult.expiresAt).toLocaleDateString()}`}
              </p>
              <p className="text-xs font-mono text-gray-500">{verifyResult.certificateNumber}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
