'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Target, BrainCircuit, User, LogOut } from 'lucide-react';

function InteractiveBrain() {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.5}>
        <MeshDistortMaterial 
          color="#3b82f6" 
          attach="material" 
          distort={0.4} 
          speed={2} 
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
        />
      </Sphere>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#60a5fa" />
    </Float>
  );
}

export default function V2LandingPage() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('userEmail');
      if (savedUser) setUserName(savedUser.split('@')[0]);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-50 font-sans selection:bg-blue-500/30">
      
      {/* 3D WebGL Background Canvas */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <InteractiveBrain />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          </Suspense>
        </Canvas>
      </div>

      {/* Futuristic Navigation Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            SmartCareer 2.0
          </span>
        </div>
        <div>
          {userName ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-full border border-white/10 shadow-sm backdrop-blur-md">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-bold text-white capitalize">{userName}</span>
              <div className="w-px h-4 bg-white/20 mx-2" />
              <button 
                onClick={() => { localStorage.removeItem('userEmail'); localStorage.removeItem('access_token'); localStorage.removeItem('user_id'); setUserName(null); }} 
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" 
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-sm font-bold backdrop-blur-md">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
        >
          <Zap className="w-3.5 h-3.5" /> AI-Powered Career Advisor
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-6"
        >
          Predict Your <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">
            Market Value.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12"
        >
          Upload your resume to our intelligent career matching platform. We instantly analyze your skills, calculate your best career paths, and create a personalized learning roadmap.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href={userName ? "/upload" : "/login"} className="group flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 transition-all font-bold shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)]">
            Scan My Resume
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href={userName ? "/dashboard" : "/login"} className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold backdrop-blur-md">
            Go to Dashboard
          </Link>
        </motion.div>
      </main>

      {/* Deep UI Gradient Underlay */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-0 pointer-events-none" />
    </div>
  );
}
