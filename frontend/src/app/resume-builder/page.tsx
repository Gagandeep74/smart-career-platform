'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileCode2, History, Plus, Save, Trash2, Sparkles } from 'lucide-react';
import { CareerAPI } from '@/lib/api';

type Experience = { company: string; role: string; dates: string; bullets: string };
type Education = { school: string; degree: string; dates: string };
type Certificate = { name: string; issuer: string; date: string; url: string };

type ResumeContent = {
  name: string;
  headline: string;
  email: string;
  location: string;
  summary: string;
  skills: string;
  experience: Experience[];
  education: Education[];
  certificates: Certificate[];
};

type Template = 'modern' | 'classic' | 'minimal';

const emptyContent: ResumeContent = {
  name: '',
  headline: '',
  email: '',
  location: '',
  summary: '',
  skills: '',
  experience: [],
  education: [],
  certificates: [],
};

export default function ResumeBuilderPage() {
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [title, setTitle] = useState('My Resume');
  const [content, setContent] = useState<ResumeContent>(emptyContent);
  const [status, setStatus] = useState('Loading your workspace...');
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<Template>('modern');
  const [showLatex, setShowLatex] = useState(false);
  const [latexSource, setLatexSource] = useState('');
  const [versions, setVersions] = useState<Array<{ id: number; version_number: number; label: string; created_at: string }>>([]);
  const [importNotice, setImportNotice] = useState('');

  useEffect(() => {
    CareerAPI.listResumeDocuments()
      .then((documents) => {
        const latest = documents[0];
        if (latest) {
          setResumeId(latest.id);
          setTitle(latest.title);
          setContent({ ...emptyContent, ...latest.content });
          setTemplate((latest.template as Template) || 'modern');
        }
        setStatus('Ready to edit');
        if (latest) CareerAPI.listResumeVersions(latest.id).then(setVersions).catch(() => undefined);
      })
      .catch(() => {
        const draft = localStorage.getItem('resume_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          setTitle(parsed.title || 'My Resume');
          setContent({ ...emptyContent, ...parsed.content });
        }
        setStatus('Sign in to save your resume; edits remain available locally.');
      });
    CareerAPI.importResumeProfile().then((profile) => {
      setContent((current) => ({
        ...current,
        name: current.name || profile.name || '',
        email: current.email || profile.email || '',
        headline: current.headline || profile.headline || '',
        skills: current.skills || profile.skills || '',
        certificates: current.certificates.length ? current.certificates : (profile.certificates || []),
      }));
    }).catch(() => undefined);
    const draft = localStorage.getItem('resume_import_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setContent((current) => ({
          ...current,
          location: current.location || parsed.location || '',
          experience: current.experience.length ? current.experience : parsed.experience || [],
          education: current.education.length ? current.education : parsed.education || [],
        }));
        localStorage.removeItem('resume_import_draft');
        setImportNotice('Extracted resume sections imported. Review them before saving.');
      } catch {
        localStorage.removeItem('resume_import_draft');
      }
    }
  }, []);

  const update = <K extends keyof ResumeContent>(key: K, value: ResumeContent[K]) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { title, template, content: content as unknown as Record<string, unknown> };
      const result = resumeId
        ? await CareerAPI.updateResumeDocument(resumeId, payload)
        : await CareerAPI.createResumeDocument(payload);
      setResumeId(result.id);
      const version = await CareerAPI.createResumeVersion(result.id, `Autosave ${new Date().toLocaleString()}`);
      setVersions((current) => [version, ...current]);
      setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
    } catch {
      localStorage.setItem('resume_draft', JSON.stringify({ title, content }));
      setStatus('Saved locally. Sign in to sync this resume.');
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (versionId: number) => {
    if (!resumeId) return;
    try {
      const restored = await CareerAPI.restoreResumeVersion(resumeId, versionId);
      setContent({ ...emptyContent, ...restored.content });
      setTemplate((restored.template as Template) || 'modern');
      setStatus('Version restored');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to restore version');
    }
  };

  const addExperience = () => update('experience', [...content.experience, { company: '', role: '', dates: '', bullets: '' }]);
  const addEducation = () => update('education', [...content.education, { school: '', degree: '', dates: '' }]);
  const addCertificate = () => update('certificates', [...content.certificates, { name: '', issuer: '', date: '', url: '' }]);
  const skills = useMemo(() => content.skills.split(',').map((skill) => skill.trim()).filter(Boolean), [content.skills]);
  const completeness = useMemo(() => {
    const checks = [
      Boolean(content.name.trim()),
      Boolean(content.email.trim()),
      Boolean(content.headline.trim()),
      Boolean(content.summary.trim()),
      skills.length > 0,
      content.experience.length > 0,
      content.education.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [content, skills.length]);

  const generateLatex = () => {
    setLatexSource(toLatex(content, title, template));
    setShowLatex(true);
  };

  const downloadLatex = () => {
    const source = latexSource || toLatex(content, title, template);
    const blob = new Blob([source], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'resume'}.tex`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight">Resume Studio</h1>
            <p className="text-slate-400 mt-2">Build a structured, ATS-friendly resume with a live preview.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{status}</span>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold hover:bg-blue-500 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save resume'}
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 font-bold hover:bg-white/10">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={generateLatex} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-3 font-bold text-cyan-200 hover:bg-cyan-400/10">
              <FileCode2 className="w-4 h-4" /> LaTeX source
            </button>
          </div>
        </div>
        {importNotice && <div className="mb-6 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"><Sparkles className="h-4 w-4" /> {importNotice}</div>}
        {showLatex && (
          <section className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-bold">Overleaf-ready LaTeX</h2>
                <p className="text-xs text-slate-400 mt-1">Edit the source, download it, and upload the .tex file to Overleaf or any LaTeX compiler.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={downloadLatex} className="icon-action"><Download className="w-4 h-4" /> Download .tex</button>
                <button onClick={() => setLatexSource(toLatex(content, title, template))} className="icon-action">Regenerate</button>
              </div>
            </div>
            <textarea value={latexSource} onChange={(event) => setLatexSource(event.target.value)} className="latex-editor" spellCheck={false} />
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <section className="space-y-6">
            <EditorCard title="Document">
              <div className="mb-4 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-widest text-blue-200">Resume completeness</p><p className="mt-1 text-2xl font-black text-white">{completeness}%</p></div>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-blue-400 transition-all" style={{ width: `${completeness}%` }} /></div>
                </div>
                <p className="mt-2 text-xs text-slate-400">{completeness < 100 ? 'Add the missing core sections to improve ATS readiness.' : 'Core resume sections are complete.'}</p>
              </div>
              <Input label="Resume title" value={title} onChange={setTitle} />
              <label className="block text-xs text-slate-400 mt-4">Template
                <select value={template} onChange={(event) => setTemplate(event.target.value as Template)} className="editor-input mt-1">
                  <option value="modern">Modern · blue accent</option>
                  <option value="classic">Classic · serif headings</option>
                  <option value="minimal">Minimal · compact ATS</option>
                </select>
              </label>
            </EditorCard>
            {resumeId && (
              <EditorCard title="Version history" action={<History className="w-4 h-4 text-slate-400" />}>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2">
                      <span className="text-xs text-slate-300">v{version.version_number} · {version.label}</span>
                      <button onClick={() => restoreVersion(version.id)} className="text-xs text-cyan-300 hover:text-white">Restore</button>
                    </div>
                  ))}
                  {!versions.length && <p className="text-xs text-slate-500">Versions appear after saving.</p>}
                </div>
              </EditorCard>
            )}
            <EditorCard title="Contact and headline">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Full name" value={content.name} onChange={(value) => update('name', value)} />
                <Input label="Target headline" value={content.headline} onChange={(value) => update('headline', value)} />
                <Input label="Email" value={content.email} onChange={(value) => update('email', value)} />
                <Input label="Location" value={content.location} onChange={(value) => update('location', value)} />
              </div>
            </EditorCard>
            <EditorCard title="Professional summary">
              <textarea value={content.summary} onChange={(event) => update('summary', event.target.value)} className="editor-textarea h-32" placeholder="Write a concise, outcome-focused summary..." />
            </EditorCard>
            <EditorCard title="Skills">
              <Input label="Comma-separated skills" value={content.skills} onChange={(value) => update('skills', value)} />
            </EditorCard>
            <EditorCard title="Experience" action={<button onClick={addExperience} className="icon-action"><Plus className="w-4 h-4" /> Add</button>}>
              <div className="space-y-4">
                {content.experience.map((item, index) => (
                  <div key={index} className="rounded-xl border border-white/10 p-4 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input label="Role" value={item.role} onChange={(value) => updateItem('experience', index, { ...item, role: value })} />
                      <Input label="Company" value={item.company} onChange={(value) => updateItem('experience', index, { ...item, company: value })} />
                      <Input label="Dates" value={item.dates} onChange={(value) => updateItem('experience', index, { ...item, dates: value })} />
                    </div>
                    <textarea value={item.bullets} onChange={(event) => updateItem('experience', index, { ...item, bullets: event.target.value })} className="editor-textarea h-24" placeholder="One achievement per line. Use measurable outcomes." />
                    <button onClick={() => update('experience', content.experience.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-rose-300 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                  </div>
                ))}
              </div>
            </EditorCard>
            <EditorCard title="Education" action={<button onClick={addEducation} className="icon-action"><Plus className="w-4 h-4" /> Add</button>}>
              {content.education.map((item, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-3 mb-3">
                  <Input label="School" value={item.school} onChange={(value) => updateItem('education', index, { ...item, school: value })} />
                  <Input label="Degree" value={item.degree} onChange={(value) => updateItem('education', index, { ...item, degree: value })} />
                  <Input label="Dates" value={item.dates} onChange={(value) => updateItem('education', index, { ...item, dates: value })} />
                </div>
              ))}
            </EditorCard>
            <EditorCard title="Certificates" action={<button onClick={addCertificate} className="icon-action"><Plus className="w-4 h-4" /> Add</button>}>
              {content.certificates.map((item, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-3 mb-3">
                  <Input label="Certificate" value={item.name} onChange={(value) => updateItem('certificates', index, { ...item, name: value })} />
                  <Input label="Issuer" value={item.issuer} onChange={(value) => updateItem('certificates', index, { ...item, issuer: value })} />
                  <Input label="Issue date" value={item.date} onChange={(value) => updateItem('certificates', index, { ...item, date: value })} />
                  <Input label="Credential URL" value={item.url} onChange={(value) => updateItem('certificates', index, { ...item, url: value })} />
                </div>
              ))}
            </EditorCard>
          </section>

          <section className="xl:sticky xl:top-6 xl:self-start">
            <div className={`resume-preview template-${template} bg-white text-slate-900 rounded-xl p-8 shadow-2xl min-h-[900px] print:shadow-none`}>
              <h2 className="text-3xl font-black">{content.name || 'Your Name'}</h2>
              <p className="text-blue-700 font-semibold mt-1">{content.headline || 'Target role'}</p>
              <p className="text-xs text-slate-500 mt-2">{[content.email, content.location].filter(Boolean).join(' • ') || 'email@example.com • City, Country'}</p>
              <PreviewSection title="Summary">{content.summary || 'Add a concise summary that connects your experience to your target role.'}</PreviewSection>
              {skills.length > 0 && <PreviewSection title="Skills"><div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}</div></PreviewSection>}
              {content.experience.length > 0 && <PreviewSection title="Experience">{content.experience.map((item, index) => <div key={index} className="mb-4"><div className="flex justify-between font-bold"><span>{item.role || 'Role'} · {item.company || 'Company'}</span><span className="text-xs font-normal">{item.dates}</span></div><p className="whitespace-pre-line text-sm text-slate-600 mt-1">{item.bullets}</p></div>)}</PreviewSection>}
              {content.education.length > 0 && <PreviewSection title="Education">{content.education.map((item, index) => <p key={index} className="text-sm mb-2"><strong>{item.degree}</strong> · {item.school} <span className="text-slate-500">{item.dates}</span></p>)}</PreviewSection>}
              {content.certificates.length > 0 && <PreviewSection title="Certifications">{content.certificates.map((item, index) => <p key={index} className="text-sm mb-2"><strong>{item.name}</strong> · {item.issuer} <span className="text-slate-500">{item.date}</span></p>)}</PreviewSection>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );

  function updateItem<K extends 'experience' | 'education' | 'certificates'>(key: K, index: number, value: ResumeContent[K][number]) {
    const items = [...content[key]];
    items[index] = value;
    update(key, items as ResumeContent[K]);
  }
}

function EditorCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex justify-between items-center mb-4"><h2 className="font-bold">{title}</h2>{action}</div>{children}</div>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs text-slate-400">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="editor-input mt-1" /></label>;
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-7"><h3 className="border-b border-slate-300 pb-1 text-xs font-black uppercase tracking-widest text-slate-500">{title}</h3><div className="mt-3">{children}</div></section>;
}

function latexEscape(value: string) {
  return value.replace(/[&%$#{}_~^\\]/g, (character) => ({
    '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '{': '\\{', '}': '\\}',
    '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}', '\\': '\\textbackslash{}',
  }[character] || character));
}

function toLatex(content: ResumeContent, title: string, template: Template) {
  const accent = template === 'classic' ? 'black' : 'MidnightBlue';
  const skills = content.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  const bullets = (value: string) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => `\\item ${latexEscape(item)}`).join('\n');
  const experience = content.experience.map((item) => `\\resumeEntry{${latexEscape(item.role)}}{${latexEscape(item.company)}}{${latexEscape(item.dates)}}\n\\begin{itemize}\n${bullets(item.bullets)}\n\\end{itemize}`).join('\n');
  const education = content.education.map((item) => `\\textbf{${latexEscape(item.degree)}} -- ${latexEscape(item.school)} \\hfill ${latexEscape(item.dates)}\\\\`).join('\n');
  const certificates = content.certificates.map((item) => `\\textbf{${latexEscape(item.name)}} -- ${latexEscape(item.issuer)} (${latexEscape(item.date)})\\\\`).join('\n');
  return `% ${latexEscape(title)}\n\\documentclass[10pt,a4paper]{article}\n\\usepackage[margin=0.7in]{geometry}\n\\usepackage[dvipsnames]{xcolor}\n\\usepackage{hyperref}\n\\usepackage{enumitem}\n\\definecolor{accent}{named}{${accent}}\n\\setlist[itemize]{leftmargin=1.2em,noitemsep,topsep=2pt}\n\\newcommand{\\resumeEntry}[3]{\\textbf{#1} -- #2 \\hfill #3\\\\}\n\\begin{document}\n\\pagestyle{empty}\n{\\Huge\\textbf{${latexEscape(content.name || 'Your Name')}}}\\\\\n{\\color{accent}\\large ${latexEscape(content.headline || '')}}\\\\\n${latexEscape([content.email, content.location].filter(Boolean).join(' | '))}\n\\section*{Summary}\n${latexEscape(content.summary || '')}\n\\section*{Skills}\n${skills.map(latexEscape).join(' \\textbullet{} ')}\n${experience ? `\\section*{Experience}\n${experience}` : ''}\n${education ? `\\section*{Education}\n${education}` : ''}\n${certificates ? `\\section*{Certifications}\n${certificates}` : ''}\n\\end{document}\n`;
}
