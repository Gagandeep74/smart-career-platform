'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CareerAPI } from '@/lib/api';
import { ArrowLeft, Sparkles, Mail, Target, Mic, Bell, Globe, BriefcaseBusiness, BarChart3, Zap } from 'lucide-react';

const cards = [
  ['AI Resume Improvement', 'Rewrite your summary, surface job keywords, and compare ATS readiness.', Sparkles],
  ['Cover Letter Generator', 'Create a role-focused letter from your profile and job description.', Mail],
  ['Job Description Matcher', 'See matched and missing keywords before you apply.', Target],
  ['Interview Practice', 'Generate questions and receive structured answer feedback.', Mic],
  ['Application Reminders', 'Keep follow-ups and interviews on schedule.', Bell],
  ['Portfolio Builder', 'Create a public project portfolio from your career profile.', Globe],
  ['LinkedIn Optimizer', 'Generate a stronger headline and About section.', BriefcaseBusiness],
  ['Career Analytics', 'Track applications, interviews, offers, and progress.', BarChart3],
  ['Job Alerts', 'Save a role and skill search for future opportunities.', Zap],
];

export default function CareerToolkitPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [role, setRole] = useState('');
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');
  const run = async (action: string) => {
    setMessage('');
    try {
      if (action === 'resume') setOutput(await CareerAPI.improveResume({ job_description: jobDescription }));
      if (action === 'match') setOutput(await CareerAPI.matchJob({ job_description: jobDescription }));
      if (action === 'cover') setOutput(await CareerAPI.createCoverLetter({ job_description: jobDescription, title: `${role || 'Target'} Cover Letter` }));
      if (action === 'interview') setOutput(await CareerAPI.createInterview(role || 'your target role'));
      if (action === 'reminder') setOutput(await CareerAPI.createReminder({ title: `Follow up: ${role || 'job search'}`, due_at: new Date(Date.now() + 86400000).toISOString() }));
      if (action === 'portfolio') setOutput(await CareerAPI.savePortfolio({ slug: (role || 'my-career').toLowerCase().replace(/[^a-z0-9]+/g, '-'), headline: role || 'Career Professional', bio: `Explore ${role || 'my'} work and career journey.`, is_public: false }));
      if (action === 'linkedin') setOutput(await CareerAPI.optimizeLinkedIn());
      if (action === 'analytics') setOutput(await CareerAPI.getCareerAnalytics());
      if (action === 'alert') setOutput(await CareerAPI.createJobAlert({ name: `${role || 'Career'} opportunities`, role, skills: [] }));
      setMessage('Feature completed successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete this action.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200 md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        <h1 className="text-4xl font-black text-white">Career Toolkit</h1>
        <p className="mt-2 max-w-2xl text-slate-400">Everything you need to improve your resume, prepare for interviews, build your professional presence, and manage your job search.</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([title, description, Icon]) => (
            <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <Icon className="h-6 w-6 text-blue-400" />
              <h2 className="mt-4 font-bold text-white">{title as string}</h2>
              <p className="mt-2 text-sm text-slate-400">{description as string}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-blue-500/20 bg-slate-900/70 p-6">
          <h2 className="text-xl font-bold text-white">Run a career action</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Target role (e.g. Data Analyst)" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400" />
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste a job description for resume improvement, ATS matching, or cover letter generation" className="min-h-28 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400 md:row-span-2" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run('resume')} className="rounded-xl bg-blue-600 px-4 py-2 font-bold hover:bg-blue-500">Improve Resume</button>
              <button onClick={() => run('match')} className="rounded-xl bg-indigo-600 px-4 py-2 font-bold hover:bg-indigo-500">Match Job</button>
              <button onClick={() => run('cover')} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-500">Create Letter</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run('interview')} className="rounded-xl border border-white/10 px-4 py-2 font-bold hover:bg-white/10">Interview Practice</button>
              <button onClick={() => run('reminder')} className="rounded-xl border border-white/10 px-4 py-2 font-bold hover:bg-white/10">Add Reminder</button>
              <button onClick={() => run('portfolio')} className="rounded-xl border border-white/10 px-4 py-2 font-bold hover:bg-white/10">Save Portfolio</button>
              <button onClick={() => run('linkedin')} className="rounded-xl border border-white/10 px-4 py-2 font-bold hover:bg-white/10">Optimize LinkedIn</button>
              <button onClick={() => run('alert')} className="rounded-xl border border-white/10 px-4 py-2 font-bold hover:bg-white/10">Create Job Alert</button>
              <button onClick={() => run('analytics')} className="rounded-xl border border-white/10 px-4 py-2 font-bold hover:bg-white/10">View Analytics</button>
            </div>
          </div>
          {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
          {output && <pre className="mt-5 max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">{JSON.stringify(output, null, 2)}</pre>}
        </section>
      </div>
    </main>
  );
}
