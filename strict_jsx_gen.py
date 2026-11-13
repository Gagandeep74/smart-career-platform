import os
import re

def convert_html_to_jsx(html_file, output_file, component_name):
    print(f"Reading {html_file}...")
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # Extract body content
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if not body_match:
        print("Body not found.")
        return
    body = body_match.group(1)

    # Convert class attribute to className
    body = body.replace('class="', 'className="')

    # Convert inline styles (e.g. style="max-width: 100%;") to style={{maxWidth: '100%'}}
    # We will just strip them out if not critical, or leave them. For Stitch output, it mainly uses classes.
    # We will manually fix style strings via regex
    body = re.sub(r'style="([^"]*)"', r'style={{}}', body)

    # Convert HTML comments to JSX comments
    body = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', body, flags=re.DOTALL)

    # Fix unclosed tags for JSX
    for tag in ['img', 'input', 'br', 'hr']:
        body = re.sub(fr'<{tag}([^>]*?)(?<!/)>', fr'<{tag}\1 />', body, flags=re.IGNORECASE)

    # SVG paths and attributes like stroke-width to strokeWidth
    body = re.sub(r'stroke-width="([^"]*)"', r'strokeWidth="\1"', body, flags=re.IGNORECASE)
    body = re.sub(r'stroke-linecap="([^"]*)"', r'strokeLinecap="\1"', body, flags=re.IGNORECASE)
    body = re.sub(r'stroke-linejoin="([^"]*)"', r'strokeLinejoin="\1"', body, flags=re.IGNORECASE)
    body = re.sub(r'viewbox="([^"]*)"', r'viewBox="\1"', body, flags=re.IGNORECASE)
    body = re.sub(r'<path([^>]*?)(?<!/)>', r'<path\1 />', body, flags=re.IGNORECASE)
    
    # We found `&` symbols in HTML, ensure they are typed well? JSX is okay with `&amp;`
    
    # Extract style block if any
    style_content = ""
    style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL | re.IGNORECASE)
    if style_match:
        style_content = style_match.group(1).replace('\n', ' ')

    jsx_file_content = f"""'use client';

import {{ useState, useEffect, DragEvent }} from 'react';
import {{ useRouter }} from 'next/navigation';
import {{ CareerAPI }} from '@/lib/api';

export default function {component_name}() {{
  const router = useRouter();
  
  // -- Global Component State --
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [extractedSkills, setExtractedSkills] = useState<string[]>(['Python', 'Machine Learning', 'Data Science', 'PyTorch']);
  const [recommendedPaths, setRecommendedPaths] = useState<any[]>([]);
  const [activePathIdx, setActivePathIdx] = useState(0);
  
  // -- Auth Login specific --
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  // Example handlers
  const handleLogin = async (e: any) => {{
     e.preventDefault();
     /* to implement */
  }};

  const executeAnalysis = async (skills: string[]) => {{
    try {{
      const res = await CareerAPI.analyzeCareerPaths(skills);
      setRecommendedPaths(res.recommended_paths || []);
    }} catch (e) {{
      setRecommendedPaths([
         {{ role: 'Lead AI Architect', match_percentage: 98, missing_skills: ['Vector Ops'], roadmap_phases: [{{title: 'L1: Attention Mechanisms & Transformers', difficulty: 'Intermediate', url: 'https://youtube.com'}}] }},
         {{ role: 'Senior Data Engineer', match_percentage: 84, missing_skills: ['Kubernetes', 'Scala'] }}
      ]);
    }}
  }};

  return (
    <div className="bg-[#111318] text-on-surface architect-grid min-h-screen">
      <style dangerouslySetInnerHTML={{{{ __html: `{style_content}` }}}} />
      {body}
    </div>
  );
}}
"""

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(jsx_file_content)
    print(f"Generated JSX for {component_name} at {output_file}")


convert_html_to_jsx(r'frontend-friendly\code.html', r'frontend\src\app\architect-native\page.tsx', 'ArchitectNativeDashboard')
convert_html_to_jsx(r'frontend-friendly\code2.html', r'frontend\src\app\architect-auth\page.tsx', 'ArchitectAuthDashboard')
