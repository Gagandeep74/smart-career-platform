'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, FileText, Lightbulb, Save, Sparkles, Target } from 'lucide-react';
import { CareerAPI } from '@/lib/api';

type ResumeContent = Record<string, unknown> & {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string | string[];
  experience?: Array<Record<string, unknown>>;
};

type Improvement = {
  id: number;
  original_content: ResumeContent;
  improved_content: ResumeContent;
  suggestions: string[];
  ats_before: number;
  ats_after: number;
};

function contentText(content: ResumeContent) {
  return Object.values(content).map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' ');
}

export default function ResumeImprovementPage() {
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [title, setTitle] = useState('My Resume');
  const [template, setTemplate] = useState('modern');
  const [original, setOriginal] = useState<ResumeContent>({});
  const [improved, setImproved] = useState<ResumeContent>({});
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<Improvement | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    CareerAPI.listResumeDocuments()
      .then((documents) => {
        const latest = documents[0];
        if (latest) {
          setResumeId(latest.id);
          setTitle(latest.title);
          setTemplate(latest.template || 'modern');
          const resumeContent = latest.content as ResumeContent;
          setOriginal(resumeContent);
          setImproved(resumeContent);
        } else {
          setMessage('Create a resume in Resume Studio first, then return here to improve it.');
        }
      })
      .catch(() => setMessage('Sign in and save a resume before using improvement tools.'))
      .finally(() => setLoading(false));
  }, []);

  const originalSkills = useMemo(() => {
    const skills = original.skills;
    return Array.isArray(skills) ? skills : String(skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  }, [original.skills]);
  const improvedSkills = useMemo(() => {
    const skills = improved.skills;
    return Array.isArray(skills) ? skills : String(skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  }, [improved.skills]);

  const runImprovement = async () => {
    if (!resumeId) {
      setMessage('Save a resume in Resume Studio before running an improvement.');
      return;
    }
    setRunning(true);
    setMessage('');
    try {
      const result = await CareerAPI.improveResume({ resume_id: resumeId, job_description: jobDescription });
      setAnalysis(result);
      setImproved(result.improved_content || original);
      setMessage('Improvement suggestions are ready. Review the changes before saving.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to improve resume.');
    } finally {
      setRunning(false);
    }
  };

  const updateImproved = (key: string, value: unknown) => setImproved((current) => ({ ...current, [key]: value }));

  const saveImproved = async () => {
    if (!resumeId) return;
    setSaving(true);
    try {
      await CareerAPI.updateResumeDocument(resumeId, { title, template, content: improved });
      await CareerAPI.createResumeVersion(resumeId, 'AI improved version');
      setOriginal(improved);
      setMessage('Improved resume saved as a new version. You can restore it from Resume Studio history.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save improved resume.');
    } finally {
      setSaving(false);
    }
  };

  const changed = contentText(original) !== contentText(improved);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200 md:px-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400"><Sparkles className="h-4 w-4" /> AI Resume Improvement</p>
            <h1 className="mt-3 text-4xl font-black text-white">Make your resume job-ready</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Compare your current resume with an improved, role-focused version and save the result as a new version.</p>
          </div>
          <Link href="/resume-builder" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 font-bold hover:bg-white/10"><FileText className="h-4 w-4" /> Open Resume Studio</Link>
        </div>

        <section className="mt-8 rounded-3xl border border-blue-500/20 bg-slate-900/70 p-6">
          <label className="flex items-center gap-2 text-sm font-bold text-white"><Target className="h-4 w-4 text-blue-400" /> Target job description <span className="font-normal text-slate-500">(recommended for keyword matching)</span></label>
          <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description here to identify missing keywords and tailor your resume..." className="mt-3 min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm outline-none focus:border-blue-400" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={runImprovement} disabled={loading || running} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold hover:bg-blue-500 disabled:opacity-50"><Sparkles className="h-4 w-4" /> {running ? 'Analyzing...' : 'Improve Resume'}</button>
            {analysis && <span className="text-sm text-slate-400">Analysis complete for <strong className="text-white">{title}</strong></span>}
          </div>
          {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
        </section>

        {analysis && (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-widest text-slate-500">ATS score before</p><p className="mt-2 text-3xl font-black text-white">{analysis.ats_before}%</p></div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><p className="text-xs uppercase tracking-widest text-emerald-400">ATS score after</p><p className="mt-2 text-3xl font-black text-emerald-300">{analysis.ats_after}%</p></div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-xs uppercase tracking-widest text-amber-400">Improvement</p><p className="mt-2 text-3xl font-black text-amber-300">+{Math.max(0, analysis.ats_after - analysis.ats_before).toFixed(1)}%</p></div>
          </section>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ResumePanel title="Current resume" content={original} skills={originalSkills} muted />
          <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Check className="h-5 w-5 text-emerald-400" /> Improved version</h2>{changed && <button onClick={saveImproved} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save new version'}</button>}</div>
            <EditableResume content={improved} skills={improvedSkills} update={updateImproved} />
          </div>
        </section>

        {analysis?.suggestions?.length ? <section className="mt-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Lightbulb className="h-5 w-5 text-amber-300" /> Suggestions</h2><ul className="mt-4 grid gap-3 md:grid-cols-2">{analysis.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2 text-sm text-slate-300"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{suggestion}</li>)}</ul></section> : null}
      </div>
    </main>
  );
}

function ResumePanel({ title, content, skills, muted }: { title: string; content: ResumeContent; skills: string[]; muted?: boolean }) {
  return <div className={`rounded-3xl border p-6 ${muted ? 'border-white/10 bg-white/[0.03]' : 'border-emerald-500/20 bg-slate-900/70'}`}><h2 className="text-xl font-bold text-white">{title}</h2><div className="mt-5 space-y-4"><div><p className="text-xs uppercase tracking-widest text-slate-500">Summary</p><p className="mt-2 text-sm leading-6 text-slate-300">{String(content.summary || 'No summary yet')}</p></div><div><p className="text-xs uppercase tracking-widest text-slate-500">Skills</p><div className="mt-2 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">{skill}</span>)}</div></div></div></div>;
}

function EditableResume({ content, skills, update }: { content: ResumeContent; skills: string[]; update: (key: string, value: unknown) => void }) {
  return <div className="mt-5 space-y-4"><label className="block text-xs uppercase tracking-widest text-slate-500">Summary<textarea value={String(content.summary || '')} onChange={(event) => update('summary', event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-emerald-400" /></label><label className="block text-xs uppercase tracking-widest text-slate-500">Skills<textarea value={skills.join(', ')} onChange={(event) => update('skills', event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-emerald-400" /></label><p className="text-xs text-slate-500">Edit the improved content before saving. Existing experience and education remain unchanged.</p></div>;
}
