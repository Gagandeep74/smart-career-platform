'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { CareerAPI } from '@/lib/api';

type Application = {
  id: number;
  external_job_id: string;
  title: string;
  company: string;
  apply_url: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  notes: string;
  follow_up_date?: string;
};

const statuses: Application['status'][] = ['saved', 'applied', 'interview', 'offer', 'rejected'];

export default function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [message, setMessage] = useState('Loading application tracker...');
  const [filter, setFilter] = useState<'all' | Application['status']>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    CareerAPI.listApplications().then((result) => {
      setItems(result);
      setMessage(result.length ? 'Keep your pipeline moving.' : 'Save a job from recommendations to start tracking it.');
    }).catch(() => setMessage('Sign in to view your application tracker.'));
  }, []);

  async function update(item: Application, status: Application['status']) {
    try {
      const updated = await CareerAPI.updateApplication(item.id, { ...item, status });
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update application');
    }
  }

  async function updateDetails(item: Application, patch: Partial<Application>) {
    try {
      const updated = await CareerAPI.updateApplication(item.id, { ...item, ...patch });
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save application details');
    }
  }

  const filteredItems = items.filter((item) =>
      (filter === 'all' || item.status === filter) &&
      `${item.title} ${item.company}`.toLowerCase().includes(query.toLowerCase())
  );
  const stats = statuses.map((status) => ({ status, count: items.filter((item) => item.status === status).length }));

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/job-recommendations" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Job recommendations</Link>
        <h1 className="text-4xl font-black">Application Tracker</h1>
        <p className="text-slate-400 mt-2 mb-8">{message}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {stats.map((item) => <button key={item.status} onClick={() => setFilter(item.status)} className={`rounded-xl border p-3 text-left ${filter === item.status ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-white/[0.03]'}`}><span className="block text-xs text-slate-500 capitalize">{item.status}</span><strong className="text-xl">{item.count}</strong></button>)}
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or company" className="editor-input max-w-sm" />
          <button onClick={() => setFilter('all')} className="rounded-xl border border-white/10 px-4 text-sm text-slate-300 hover:bg-white/10">All applications</button>
        </div>
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-wrap items-center gap-5">
              <div className="flex-1 min-w-[220px]">
                <h2 className="font-bold text-lg">{item.title}</h2>
                <p className="text-slate-400 text-sm">{item.company}</p>
                {item.follow_up_date && <p className="text-xs text-amber-300 mt-2">Follow up: {item.follow_up_date}</p>}
                <textarea value={item.notes || ''} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, notes: event.target.value } : entry))} onBlur={(event) => updateDetails(item, { notes: event.target.value })} placeholder="Add notes..." className="editor-textarea mt-3 h-16 max-w-xl text-xs" />
              </div>
              <select value={item.status} onChange={(event) => update(item, event.target.value as Application['status'])} className="editor-input max-w-[150px]">
                {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
              </select>
              <input type="date" value={item.follow_up_date || ''} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, follow_up_date: event.target.value } : entry))} onBlur={(event) => updateDetails(item, { follow_up_date: event.target.value })} className="editor-input max-w-[160px] text-xs" title="Follow-up date" />
              {item.apply_url && <a href={item.apply_url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-white"><ExternalLink className="w-4 h-4" /></a>}
              <button onClick={async () => { try { await CareerAPI.deleteApplication(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to remove saved job'); } }} className="text-slate-500 hover:text-rose-300" aria-label={`Remove ${item.title}`}><Trash2 className="w-4 h-4" /></button>
            </article>
          ))}
          {!filteredItems.length && <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-slate-500">No matching applications.</div>}
        </div>
      </div>
    </main>
  );
}
