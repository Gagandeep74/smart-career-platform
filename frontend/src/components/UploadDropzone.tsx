'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { CareerAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function UploadDropzone() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [skills, setSkills] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('processing');
    
    try {
      const result = await CareerAPI.uploadResume(file);
      setSkills(result.detected_skills || []);
      setStatus('success');
      
      // Auto-jump to dashboard after 3 seconds so the user sees results
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg('NLP Engine Failed to parse PDF. Ensure local FastAPI server is running.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 3D Glassmorphic Dropzone Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-12 rounded-3xl relative overflow-hidden group border border-white/10 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          boxShadow: status === 'processing' 
            ? '0 0 50px rgba(59,130,246,0.3) inset, 0 0 40px rgba(59,130,246,0.2)' 
            : '0 0 30px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.5s ease-in-out'
        }}
      >
        {/* Glow Element */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] z-0 transition-all duration-1000 ${status === 'processing' ? 'bg-blue-600/50' : status === 'success' ? 'bg-green-500/30' : 'bg-transparent'}`} />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
          
          {status === 'idle' && (
            <>
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h3 className="font-[font-family:var(--font-syncopate)] text-2xl text-white">Upload Resume Vector</h3>
                <p className="font-[font-family:var(--font-outfit)] text-gray-400 mt-2">Drag and drop your PDF or TXT resume here to execute NLP Extraction.</p>
              </div>
              <label className="cursor-pointer bg-blue-600/20 hover:bg-blue-600/50 transition-colors px-8 py-3 rounded-full border border-blue-500/50 font-[font-family:var(--font-outfit)] text-white text-sm font-medium tracking-wide">
                Browse Files
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} />
              </label>
              
              {file && (
                <div className="mt-6 flex items-center gap-3 bg-black/40 px-6 py-3 rounded-lg border border-white/5">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 font-[font-family:var(--font-outfit)] text-sm">{file.name}</span>
                  <button onClick={handleUpload} className="ml-4 text-blue-400 hover:text-blue-300 uppercase text-xs font-bold tracking-wider underline">Execute Extraction</button>
                </div>
              )}
            </>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <h3 className="font-[font-family:var(--font-syncopate)] text-xl text-blue-400 animate-pulse">Running SpaCy & BERT...</h3>
              <p className="font-[font-family:var(--font-outfit)] text-sm text-gray-500">Vectorizing textual components and filtering master dataset noise.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <h3 className="font-[font-family:var(--font-syncopate)] text-2xl text-white">Neural Parsing Complete</h3>
              <p className="font-[font-family:var(--font-outfit)] text-green-300">{skills.length} Technical Skills Whitelisted & Extracted.</p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
                {skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-green-900/40 border border-green-500/30 rounded-full text-xs font-[font-family:var(--font-outfit)] text-green-200">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-8 italic">Routing to Intelligence Dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <h3 className="font-[font-family:var(--font-syncopate)] text-xl text-red-400">Connection Failed</h3>
              <p className="font-[font-family:var(--font-outfit)] text-sm text-gray-400">{errorMsg}</p>
              <button onClick={() => setStatus('idle')} className="text-sm underline text-red-300 hover:text-white mt-4">Retry Upload</button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
