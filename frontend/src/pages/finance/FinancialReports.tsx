import React, { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { financeApi } from '../../api/finance.api';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

export const FinancialReports: React.FC = () => {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [sumRes, incRes, expRes] = await Promise.all([
        financeApi.getFinancialSummary({ startDate, endDate }),
        financeApi.getIncomeReport({ startDate, endDate }),
        financeApi.getExpenseReport({ startDate, endDate }),
      ]);
      setReport(sumRes.data.data);
      setIncomeData(incRes.data.data);
      setExpenseData(expRes.data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReport(); }, []);

  const incomeByCat = incomeData?.byCategory?.map((i: any) => ({ name: i.category.replace(/_/g,' '), amount: Number(i._sum?.amount || 0) })) || [];
  const expenseByCat = expenseData?.byCategory?.map((e: any) => ({ name: e.category.replace(/_/g,' '), amount: Number(e._sum?.amount || 0) })) || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>Financial Reports</h1><p className="text-sm text-gray-500">Income, expenses and balance summary</p></div>
      </div>

      {/* Date range */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="From" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-44" />
          <Input label="To" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-44" />
          <Button onClick={loadReport} loading={loading} icon={<BarChart3 className="w-4 h-4" />}>Generate Report</Button>
        </div>
      </div>

      {loading ? <PageSpinner /> : report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: formatCurrency(report.totalIncome), color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Total Expenses', value: formatCurrency(report.totalExpenses), color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Net Result', value: formatCurrency(report.netResult), color: Number(report.netResult) >= 0 ? 'text-green-700' : 'text-red-700', bg: 'bg-gray-50' },
              { label: 'Outstanding', value: formatCurrency(report.totalOutstanding), color: 'text-orange-700', bg: 'bg-orange-50' },
            ].map(item => (
              <div key={item.label} className={`card ${item.bg}`}>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(startDate)} — {formatDate(endDate)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income by category */}
            <div className="card">
              <h3 className="font-semibold mb-4">Income by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incomeByCat} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expenses by category */}
            <div className="card">
              <h3 className="font-semibold mb-4">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expenseByCat} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income transactions */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold">Income Transactions</h3></div>
            <div className="table-container max-h-80 overflow-y-auto">
              <table>
                <thead><tr><th>Date</th><th>Category</th><th>Source</th><th>Amount</th><th>Account</th></tr></thead>
                <tbody>
                  {incomeData?.transactions?.map((t: any) => (
                    <tr key={t.id}>
                      <td className="text-xs">{formatDate(t.date)}</td>
                      <td><span className="text-xs">{t.category.replace(/_/g,' ')}</span></td>
                      <td>{t.source || '—'}</td>
                      <td className="font-medium text-green-700">{formatCurrency(t.amount)}</td>
                      <td>{t.account?.name}</td>
                    </tr>
                  ))}
                  {(!incomeData?.transactions || incomeData.transactions.length === 0) && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-6">No transactions in period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
