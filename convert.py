import re
import os

with open(r'c:\Users\gupta\Desktop\mini project\smart-career-platform\frontend-v2\code.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Extract everything between <body> and </body>
match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.IGNORECASE | re.DOTALL)
if match:
    body_content = match.group(1).replace('`', '\\`')
else:
    body_content = '<h1>Error parsing HTML body</h1>'

# Ensure the architect directory exists
os.makedirs(r'c:\Users\gupta\Desktop\mini project\smart-career-platform\frontend\src\app\architect', exist_ok=True)

# Write the Next.js page component
tsx_content = f"""
export default function ArchitectDashboard() {{
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

print('Successfully created architect/page.tsx')
