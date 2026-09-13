import React, { useEffect, useState } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { getStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getGrades()
      .then(r => setGrades(r.data.data || []))
      .catch(() => toast.error('Failed to load grades'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const average = grades.length > 0
    ? grades.reduce((sum, g) => sum + Number(g.score || 0), 0) / grades.length
    : 0;

  const passed = grades.filter(g => Number(g.score) >= (g.assessment?.passMark || 50)).length;

  return (
    <div className="space-y-6">
      <div><h1>Grades & Results</h1><p className="text-sm text-gray-500">Your assessment scores and performance</p></div>

      {/* Summary */}
      {grades.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-500">Average Score</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">{average.toFixed(1)}%</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Assessments Graded</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{grades.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Passed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{passed} / {grades.length}</p>
          </div>
        </div>
      )}

      {grades.length === 0 ? (
        <div className="card text-center py-16">
          <Award className="w-14 h-14 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No graded assessments yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Assessment</th><th>Type</th><th>Score</th><th>Pass Mark</th><th>Result</th><th>Graded</th></tr>
              </thead>
              <tbody>
                {grades.map((g: any) => {
                  const passed = Number(g.score) >= Number(g.assessment?.passMark || 50);
                  return (
                    <tr key={g.id}>
                      <td className="font-medium">{g.assessment?.title}</td>
                      <td><span className="badge badge-blue text-xs">{g.assessment?.type}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                            <div className={`h-full rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, Number(g.score))}%` }} />
                          </div>
                          <span className={`font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                            {Number(g.score).toFixed(1)} / {g.assessment?.totalMarks}
                          </span>
                        </div>
                      </td>
                      <td>{g.assessment?.passMark} / {g.assessment?.totalMarks}</td>
                      <td>
                        <span className={`badge ${passed ? 'badge-green' : 'badge-red'}`}>
                          {passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-400">{formatDate(g.gradedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
