'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

export default function AuthNavigation() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Only access localStorage on the client securely
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('user_name');
      const token = localStorage.getItem('access_token');
      if (name && token) {
        setUserName(name);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    setUserName(null);
    router.push('/login');
  };

  if (userName) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors border border-blue-100">
          <User className="w-4 h-4" /> {userName}
        </Link>
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Sign In</Link>
      <Link href="/signup" className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">Sign Up</Link>
    </div>
  );
}
