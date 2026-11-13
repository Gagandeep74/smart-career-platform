import os
import re

def create_tsx_component(html_filepath, out_filepath, route_target, component_name):
    print(f"Reading: {html_filepath}")
    with open(html_filepath, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Extract Body classes
    body_class_match = re.search(r'<body class="([^"]+)">', html_content)
    body_classes = body_class_match.group(1) if body_class_match else "text-on-surface min-h-screen"
    
    # Extract Head Style block to include in the JSX (Stitch includes classes like .glass-card, .architect-grid)
    style_content = ""
    style_match = re.search(r'<style>(.*?)</style>', html_content, re.DOTALL)
    if style_match:
        style_content = style_match.group(1).replace('\n', ' ')

    # Fast DOM intercept
    body_html_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL)
    if not body_html_match:
        print(f"Could not find body in {html_filepath}")
        return
    
    body_html = body_html_match.group(1)
    # Ensure backticks are escaped inside innerHTML template
    body_html = body_html.replace('`', '\\`')

    # JSX Shell
    tsx_shell = f"""'use client';

import {{ useEffect }} from 'react';
import {{ useRouter }} from 'next/navigation';

export default function {component_name}() {{
  const router = useRouter();

  useEffect(() => {{
    const handleNavigation = (e: MouseEvent) => {{
      const target = e.target as HTMLElement;
      // Route any interactive element
      const interactiveEl = target.closest('button, a');
      if (interactiveEl) {{
         e.preventDefault();
         router.push('{route_target}');
      }}
    }};
    
    document.addEventListener('click', handleNavigation);
    return () => document.removeEventListener('click', handleNavigation);
  }}, [router]);

  return (
    <div className="{body_classes} dark relative" style={{{{ backgroundColor: '#111318' }}}}>
      <style dangerouslySetInnerHTML={{{{ __html: `{style_content}` }}}} />
      <div dangerouslySetInnerHTML={{{{ __html: `{body_html}` }}}} />
    </div>
  );
}}
"""
    os.makedirs(os.path.dirname(out_filepath), exist_ok=True)
    with open(out_filepath, 'w', encoding='utf-8') as f:
        f.write(tsx_shell)
    print(f"Successfully generated: {out_filepath}")


# File 1: Dashboard -> /friendly-dashboard
create_tsx_component(
    r'frontend-friendly\code.html',
    r'frontend\src\app\friendly-dashboard\page.tsx',
    '/friendly', # If they click home/logout go back to landing
    'FriendlyDashboard'
)

# File 2: Landing/Login -> /friendly
create_tsx_component(
    r'frontend-friendly\code2.html',
    r'frontend\src\app\friendly\page.tsx',
    '/friendly-dashboard', # If they click login, go to the dashboard
    'FriendlyLanding'
)
