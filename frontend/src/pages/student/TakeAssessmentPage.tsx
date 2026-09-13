import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, RotateCcw, CheckCircle } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const TakeAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assess, setAssess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!id) return;
    studentApi.getAssessmentForAttempt(id)
      .then(r => { const d = r.data.data; setAssess(d); if (d.duration) setSecondsLeft(d.duration * 60); })
      .catch((e: any) => toast.error(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    if (secondsLeft == null || secondsLeft <= 0 || result) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(value => {
        if (value == null || value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, result]);
  const handleSubmit = async () => {
    if (!assess || result) return;
    setSubmitting(true);
    try {
      const r = await studentApi.submitAssessment({ assessmentId: assess.id, answers });
      setResult(r.data.data); toast.success('Submitted');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Submit failed'); }
    finally { setSubmitting(false); }
  };
  if (loading) return <PageSpinner />;
  if (!assess) return <div className="card text-center py-16 text-gray-400">Not found</div>;
  if (result) return (<div className="max-w-2xl mx-auto"><div className="card text-center py-12">
    <h2 className="text-xl font-bold">Submitted!</h2>
    <p className="text-sm text-gray-500 mt-1">{result.needsManualGrading ? 'Awaiting instructor review.' : `Score: ${result.autoScore} marks`}</p>
    {result.certificate && (
      <div className="mt-5 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
        Final examination passed. Your certificate has been generated.
        {result.certificate.fileUrl && (
          <button className="block mx-auto mt-2 font-semibold underline" onClick={() => window.open(result.certificate.fileUrl, '_blank')}>
            Download certificate
          </button>
        )}
      </div>
    )}
    <div className="flex justify-center gap-3 mt-6"><Button variant="secondary" onClick={() => navigate(-1)}>Back</Button><Button onClick={() => navigate('/student/grades')}>Grades</Button></div>
  </div></div>);
  return (<div className="max-w-3xl mx-auto space-y-5">
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>Back</Button>
      <div className="flex-1"><h1 className="text-lg">{assess.title}</h1><p className="text-xs text-gray-500">{assess.type}</p></div>
      {secondsLeft != null && (<span className={`text-sm font-mono ${secondsLeft < 60 ? 'text-red-600 font-bold' : ''}`}>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>)}
    </div>
    {(assess.questions || []).map((q: any, i: number) => (
      <div key={q.id} className="card">
        <p className="font-medium text-sm">Q{i + 1}. {q.text} <span className="text-gray-400">({q.marks})</span></p>
        <div className="mt-3">
          {q.type === 'MULTIPLE_CHOICE' && (<div className="space-y-2">{(q.options || []).map((o: string, oi: number) => (
            <label key={oi} className="flex items-center gap-3 border rounded-xl px-4 py-2.5 text-sm cursor-pointer"><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers(p => ({ ...p, [q.id]: o }))} className="accent-blue-600" />{o}</label>))}</div>)}
          {q.type === 'TRUE_FALSE' && (<div className="flex gap-2">{['True', 'False'].map(v => (
            <button key={v} onClick={() => setAnswers(p => ({ ...p, [q.id]: v }))} className={`flex-1 border rounded-xl py-2.5 text-sm ${answers[q.id] === v ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>{v}</button>))}</div>)}
          {(q.type === 'SHORT_ANSWER' || q.type === 'ESSAY' || q.type === 'FILE_UPLOAD') && (
            <textarea value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} rows={3} placeholder="Your answer…" className="input resize-none" />)}
        </div>
      </div>
    ))}
    <Button size="lg" className="w-full" loading={submitting} disabled={secondsLeft === 0} onClick={handleSubmit}>
      {secondsLeft === 0 ? 'Time expired' : 'Submit Answers'}
    </Button>
  </div>);
};
