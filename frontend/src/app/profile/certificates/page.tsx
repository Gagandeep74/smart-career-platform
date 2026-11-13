'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Trash2 } from 'lucide-react';
import { CareerAPI } from '@/lib/api';

type Certificate = {
  id: number;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  skills: string[];
};

const initialForm = { name: '', issuer: '', issue_date: '', expiry_date: '', credential_id: '', credential_url: '', skills: '' };

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('Loading certificates...');

  const load = () => CareerAPI.listCertificates()
    .then((items) => { setCertificates(items); setMessage(items.length ? 'Certificates synced' : 'Add your first credential'); })
    .catch(() => setMessage('Sign in to manage certificates.'));

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await CareerAPI.addCertificate({
        ...form,
        skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      });
      setForm(initialForm);
      setMessage('Certificate added');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save certificate');
    }
  }

  async function remove(id: number) {
    try {
      await CareerAPI.deleteCertificate(id);
      setCertificates((items) => items.filter((item) => item.id !== id));
      setMessage('Certificate removed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove certificate');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-2xl bg-amber-400/10 p-4 text-amber-300"><Award /></div>
          <div><h1 className="text-4xl font-black">Certificates</h1><p className="text-slate-400 mt-1">Credentials strengthen ATS matching and your resume.</p></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h2 className="font-bold">Add certificate</h2>
            {([
              ['name', 'Certificate name', true], ['issuer', 'Issuing organization', true], ['issue_date', 'Issue date', true],
              ['expiry_date', 'Expiry date', false], ['credential_id', 'Credential ID', false], ['credential_url', 'Credential URL', false], ['skills', 'Related skills (comma separated)', false],
            ] as const).map(([key, label, required]) => (
              <label key={key} className="block text-xs text-slate-400">{label}
                <input required={required} type={key.includes('date') ? 'date' : 'text'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="editor-input mt-1" />
              </label>
            ))}
            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold hover:bg-blue-500">Save certificate</button>
            <p className="text-xs text-slate-500">{message}</p>
          </form>
          <section className="space-y-3">
            {certificates.map((certificate) => (
              <article key={certificate.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex justify-between gap-4">
                <div>
                  <h2 className="font-bold text-lg">{certificate.name}</h2>
                  <p className="text-slate-400">{certificate.issuer} · Issued {certificate.issue_date || 'date not set'}</p>
                  {certificate.expiry_date && <p className="text-xs text-amber-300 mt-2">Expires {certificate.expiry_date}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">{certificate.skills.map((skill) => <span key={skill} className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-200">{skill}</span>)}</div>
                  {certificate.credential_url && <a href={certificate.credential_url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-cyan-300 mt-3 hover:underline">View credential</a>}
                </div>
                <button onClick={() => remove(certificate.id)} aria-label={`Remove ${certificate.name}`} className="text-slate-500 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
              </article>
            ))}
            {!certificates.length && <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-500">No certificates added yet.</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
