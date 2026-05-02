// Utility wrapper factoring Authentication across API routes
// Uses environment variable in production, falls back to localhost for dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Gets the current token from browser's local state natively
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const CareerAPI = {

  // --- IDENTITY MODULE --- //
  async signup(data: any) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Signup Failed - Email likely exists.');
    return response.json();
  },

  async login(email: string, password: string) {
    // OAuth2PasswordRequestForm expects URLSearchParams format 
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Invalid Identity Credentials');
    }
    
    return response.json();
  },

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeaders() }
    });
    if (!response.ok) throw new Error('Session Expired');
    return response.json();
  },

  // --- NLP MODULE --- //
  async uploadResume(file: File) {
    // Dynamic fetching of authorized ID
    let userId = localStorage.getItem('user_id') || "1";
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload-resume/?user_id=${userId}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },  // Secure Authorization Hook
      body: formData,
    });
    
    if (!response.ok) throw new Error('NLP Parsing Security Restraint');
    return response.json();
  },

  // --- RECOMMENDATION MODULES --- //
  async getJobRecommendations(userId: number) {
    const response = await fetch(`${API_BASE_URL}/recommend-jobs/${userId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Authorization required for ML Match');
    return response.json();
  },

  async getRoadmap(userId: number, jobId: number = 1) {
    const response = await fetch(`${API_BASE_URL}/roadmap/${userId}/${jobId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Session Timeout');
    return response.json();
  },

  async pivotCareer(targetRole: string) {
    const response = await fetch(`${API_BASE_URL}/roadmap/live-pivot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ target_role: targetRole })
    });
    
    if (!response.ok) throw new Error('Live NLP scraper routing failed.');
    return response.json();
  },

  async analyzeCareerPaths(extractedSkills: string[]) {
    const response = await fetch(`${API_BASE_URL}/roadmap/analyze-career-paths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ extracted_skills: extractedSkills })
    });
    
    if (!response.ok) throw new Error('Path analyzer routing failed.');
    return response.json();
  }
};
