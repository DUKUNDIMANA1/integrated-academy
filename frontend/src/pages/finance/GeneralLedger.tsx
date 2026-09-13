import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ledgerApi } from '../../api/ledger.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const COA_TYPES = ['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'];

export const GeneralLedger: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'ASSET', category: '', description: '' });
  const [journalLines, setJournalLines] = useState([{ accountId: '', description: '', debit: '', credit: '' }]);
  const [journalDesc, setJournalDesc] = useState('');
  const [activeView, setActiveView] = useState<'coa' | 'ledger' | 'journal' | 'trial'>('coa');

  useEffect(() => {
    ledgerApi.getChartOfAccounts()
      .then(r => setAccounts(r.data.data || []))
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  const loadLedger = async () => {
    if (!selectedAccount) return;
    const r = await ledgerApi.getGeneralLedger(selectedAccount);
    setLedgerData(r.data.data);
    setActiveView('ledger');
  };

  const handleCreateAccount = async () => {
    if (!accountForm.code || !accountForm.name) { toast.error('Code and name required'); return; }
    setSaving(true);
    try {
      await ledgerApi.createAccount({ ...accountForm, type: accountForm.type as any });
      toast.success('Account created');
      setShowAccountModal(false);
      setAccountForm({ code: '', name: '', type: 'ASSET', category: '', description: '' });
      const r = await ledgerApi.getChartOfAccounts();
      setAccounts(r.data.data || []);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const addJournalLine = () => setJournalLines(p => [...p, { accountId: '', description: '', debit: '', credit: '' }]);
  const removeJournalLine = (i: number) => setJournalLines(p => p.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: string) =>
    setJournalLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const totalDebits = journalLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredits = journalLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleCreateJournal = async () => {
    if (!isBalanced) { toast.error('Journal entry must be balanced (debits = credits)'); return; }
    setSaving(true);
    try {
      await ledgerApi.createJournalEntry({
        description: journalDesc,
        lines: journalLines.filter(l => l.accountId).map(l => ({
          accountId: l.accountId,
          description: l.description,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      });
      toast.success('Journal entry posted');
      setShowJournalModal(false);
      setJournalLines([{ accountId: '', description: '', debit: '', credit: '' }]);
      setJournalDesc('');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const groupedAccounts = COA_TYPES.reduce((acc, type) => {
    acc[type] = accounts.filter(a => a.type === type && !a.parentId);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1>General Ledger</h1><p className="text-sm text-gray-500">Chart of accounts, journal entries and ledger</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowJournalModal(true)}>+ Journal Entry</Button>
          <Button size="sm" onClick={() => setShowAccountModal(true)}>+ Account</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[{ key: 'coa', label: 'Chart of Accounts' }, { key: 'ledger', label: 'General Ledger' }, { key: 'journal', label: 'Journal Entries' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key as any)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeView === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart of Accounts */}
      {activeView === 'coa' && (
        <div className="space-y-4">
          {COA_TYPES.map(type => (
            groupedAccounts[type]?.length > 0 && (
              <div key={type} className="card p-0 overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">{type}</h3>
                </div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Code</th><th>Account Name</th><th>Category</th><th>Status</th></tr></thead>
                    <tbody>
                      {groupedAccounts[type].map((acc: any) => (
                        <tr key={acc.id} className="cursor-pointer"
                          onClick={() => { setSelectedAccount(acc.id); loadLedger(); }}>
                          <td className="font-mono text-sm">{acc.code}</td>
                          <td className="font-medium">{acc.name}</td>
                          <td className="text-gray-500">{acc.category || '—'}</td>
                          <td>{acc.isActive ? <span className="badge-green badge">Active</span> : <span className="badge-red badge">Inactive</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ))}
          {accounts.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              No accounts found. Create your first account to get started.
            </div>
          )}
        </div>
      )}

      {/* General Ledger */}
      {activeView === 'ledger' && (
        <div className="space-y-4">
          <div className="card p-4 flex gap-3">
            <Select className="flex-1" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
              placeholder="Select account..." options={accounts.map(a => ({ value: a.id, label: `${a.code} — ${a.name}` }))} />
            <Button onClick={loadLedger}>Load Ledger</Button>
          </div>
          {ledgerData && (
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{ledgerData.account?.name}</h3>
                  <p className="text-xs text-gray-400">Code: {ledgerData.account?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Closing Balance</p>
                  <p className="font-bold text-lg">{formatCurrency(ledgerData.closingBalance)}</p>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                  <tbody>
                    {ledgerData.entries?.map((entry: any) => (
                      <tr key={entry.id}>
                        <td className="text-xs">{formatDate(entry.journal?.date)}</td>
                        <td className="font-mono text-xs">{entry.journal?.reference}</td>
                        <td className="text-gray-600">{entry.description || entry.journal?.description}</td>
                        <td className="text-right">{Number(entry.debit) > 0 ? formatCurrency(entry.debit) : '—'}</td>
                        <td className="text-right">{Number(entry.credit) > 0 ? formatCurrency(entry.credit) : '—'}</td>
                        <td className={`text-right font-semibold ${entry.runningBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(Math.abs(entry.runningBalance))}{entry.runningBalance < 0 ? ' Cr' : ' Dr'}
                        </td>
                      </tr>
                    ))}
                    {ledgerData.entries?.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-gray-400 py-6">No transactions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Account Modal */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title="New Account" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowAccountModal(false)}>Cancel</Button><Button loading={saving} onClick={handleCreateAccount}>Create</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Account Code *" placeholder="e.g. 1100" value={accountForm.code}
              onChange={e => setAccountForm(p => ({ ...p, code: e.target.value }))} />
            <Select label="Type *" value={accountForm.type} onChange={e => setAccountForm(p => ({ ...p, type: e.target.value }))}
              options={COA_TYPES.map(t => ({ value: t, label: t }))} />
          </div>
          <Input label="Account Name *" value={accountForm.name} onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Category" placeholder="e.g. Current Asset" value={accountForm.category}
            onChange={e => setAccountForm(p => ({ ...p, category: e.target.value }))} />
          <Input label="Description" value={accountForm.description} onChange={e => setAccountForm(p => ({ ...p, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Journal Entry Modal */}
      <Modal isOpen={showJournalModal} onClose={() => setShowJournalModal(false)} title="New Journal Entry" size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowJournalModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleCreateJournal} disabled={!isBalanced}>Post Entry</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Description" value={journalDesc} onChange={e => setJournalDesc(e.target.value)} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Lines</label>
              <Button size="sm" variant="ghost" onClick={addJournalLine}>+ Add Line</Button>
            </div>
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
              <div className="col-span-4">Account</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
              <div className="col-span-1" />
            </div>
            {journalLines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                <div className="col-span-4">
                  <Select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}
                    placeholder="Select account" options={accounts.map(a => ({ value: a.id, label: `${a.code} ${a.name}` }))} />
                </div>
                <div className="col-span-3">
                  <Input placeholder="Description" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Input placeholder="0" type="number" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} className="text-right" />
                </div>
                <div className="col-span-2">
                  <Input placeholder="0" type="number" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} className="text-right" />
                </div>
                <div className="col-span-1 text-center">
                  {journalLines.length > 2 && (
                    <button onClick={() => removeJournalLine(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="flex justify-end gap-6 text-sm font-semibold border-t pt-3">
            <span>Total Debits: {formatCurrency(totalDebits)}</span>
            <span>Total Credits: {formatCurrency(totalCredits)}</span>
            <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
              {isBalanced ? '✓ Balanced' : `Difference: ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
