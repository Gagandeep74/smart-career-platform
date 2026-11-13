import re
import os

with open(r'c:\Users\gupta\Desktop\mini project\smart-career-platform\frontend-v2\code.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Extract body
match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.IGNORECASE | re.DOTALL)
if match:
    body_content = match.group(1)
else:
    print("Could not find body tags!")
    exit(1)

# Convert class to className
body_content = body_content.replace('class=', 'className=')

tsx_content = f"""'use client';

import {{ useEffect }} from 'react';
import {{ useRouter }} from 'next/navigation';

export default function ArchitectDashboard() {{
  const router = useRouter();

  useEffect(() => {{
    const handleNavigation = (e: MouseEvent) => {{
      const target = e.target as HTMLElement;
      // Route any 'A' or 'BUTTON' clicks directly to the login flow
      const interactiveEl = target.closest('button, a');
      if (interactiveEl) {{
         e.preventDefault();
         router.push('/login');
      }}
    }};
    
    document.addEventListener('click', handleNavigation);
    return () => document.removeEventListener('click', handleNavigation);
  }}, [router]);

  return (
    <div 
      className="font-body text-on-surface selection:bg-primary/30 selection:text-primary-fixed overflow-x-hidden relative min-h-screen"
      style={{{{ backgroundColor: '#0c0e11', backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }}}}
      dangerouslySetInnerHTML={{{{ __html: `{body_content}` }}}}
    />
  );
}}
"""

with open(r'c:\Users\gupta\Desktop\mini project\smart-career-platform\frontend\src\app\architect\page.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx_content)

print('Successfully generated interactive page.tsx')
