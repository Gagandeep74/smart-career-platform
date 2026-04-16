'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, FileText, Cpu, CheckCircle } from 'lucide-react';
import { Tilt } from 'react-tilt';
import { CareerAPI } from '@/lib/api';

export default function V2UploadPage() {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const defaultOptions = {
    reverse: false,  // reverse the tilt direction
    max: 15,         // max tilt rotation (degrees)
    perspective: 1000, // Transform perspective, the lower the more extreme the tilt gets.
    scale: 1.05,     // 2 = 200%, 1.5 = 150%, etc..
    speed: 1000,     // Speed of the enter/exit transition
    transition: true, // Set a transition on enter/exit.
    axis: null,      // What axis should be disabled. Can be X or Y.
    reset: true,     // If the tilt effect has to be reset on exit.
    easing: "cubic-bezier(.03,.98,.52,.99)", // Easing on enter/exit.
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const executeNeuralScan = async () => {
    if (!file) return;
    setIsScanning(true);
    
    try {
      const res = await CareerAPI.uploadResume(file);
      if (typeof window !== 'undefined') {
        localStorage.setItem('recent_skills', JSON.stringify(res.detected_skills));
        localStorage.setItem('skill_scores', JSON.stringify(res.skill_scores || {}));
      }
      setTimeout(() => router.push('/dashboard'), 2500);
    } catch (e) {
      console.error(e);
      setTimeout(() => router.push('/dashboard'), 2500);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Dynamic Background Mesh Effect */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isScanning ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
        <div className="w-full h-full bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-20">
        <ArrowLeft className="w-5 h-5" /> Return Home
      </Link>

      <div className="z-10 w-full max-w-2xl text-center flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Upload Your Resume
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Drag and drop your resume below. Our system will instantly analyze your background and match you with your optimal career paths.
          </p>
        </motion.div>

        {!isScanning ? (
          <Tilt options={defaultOptions} className="w-full">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
              onDragLeave={() => setIsHovering(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center w-full h-80 rounded-[2rem] border-2 border-dashed transition-all duration-300 backdrop-blur-xl cursor-crosshair
                ${isHovering 
                  ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)]' 
                  : file ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }
              `}
            >
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 text-emerald-400"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white">{file.name}</h3>
                      <p className="text-emerald-500/80 text-sm mt-1 uppercase tracking-widest font-bold">File Ready</p>
                    </div>
                    <button 
                      onClick={executeNeuralScan}
                      className="mt-6 px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)] transition-all"
                    >
                      Initiate Scan
                    </button>
                  </motion.div>
                ) : (
                    <label className="flex flex-col items-center gap-4 text-slate-400 cursor-pointer">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center border transition-colors ${isHovering ? 'bg-blue-500/20 border-blue-400' : 'bg-slate-800/50 border-white/10'}`}>
                        <UploadCloud className={`w-10 h-10 ${isHovering ? 'text-blue-400' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-lg font-medium text-white">Drop your PDF here</p>
                      <p className="text-sm">or click to manually browse system directories</p>
                      <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleSelectFile} />
                    </label>
                )}
              </AnimatePresence>
            </div>
          </Tilt>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-80 rounded-[2rem] border border-blue-500/30 bg-blue-900/10 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Holographic scanning line effect */}
            <motion.div 
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute w-full h-1 bg-blue-400 shadow-[0_0_30px_10px_rgba(96,165,250,0.5)] z-0"
            />
            <Cpu className="w-16 h-16 text-blue-400 animate-pulse mb-6 relative z-10" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest relative z-10">Extracting Skills</h2>
            <p className="text-blue-400 font-mono text-xs mt-3 opacity-80 uppercase relative z-10 animate-pulse">Analyzing career profile...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
