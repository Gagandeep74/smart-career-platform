// Utility wrapper factoring Authentication across API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Gets the current token from browser's local state natively
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  current_role?: string;
  target_role?: string;
}

export const CareerAPI = {

  // --- IDENTITY MODULE --- //
  async signup(data: SignupData) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Signup Failed - Email likely exists.');
    return response.json();
  },

  async updateCertificate(id: number, data: {
    name: string; issuer: string; issue_date: string; expiry_date?: string;
    credential_id?: string; credential_url?: string; skills: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/profile/certificates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Unable to update certificate');
    return response.json();
  },

  async deleteCertificate(id: number) {
    const response = await fetch(`${API_BASE_URL}/profile/certificates/${id}`, {
      method: 'DELETE', headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Unable to delete certificate');
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

  async listApplications() {
    const response = await fetch(`${API_BASE_URL}/applications`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to load saved jobs');
    return response.json();
  },

  async saveApplication(data: {
    external_job_id: string; title: string; company?: string; apply_url?: string;
    status?: string; notes?: string; follow_up_date?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Unable to save job');
    return response.json();
  },

  async updateApplication(id: number, data: {
    external_job_id: string; title: string; company?: string; apply_url?: string;
    status?: string; notes?: string; follow_up_date?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Unable to update application');
    return response.json();
  },

  async deleteApplication(id: number) {
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'DELETE', headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Unable to remove saved job');
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
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload-resume/`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },  // Secure Authorization Hook
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || 'Unable to analyze resume');
    }
    return response.json();
  },

  // --- RECOMMENDATION MODULES --- //
  async getJobRecommendations(userSkills: string[] = []) {
    const response = await fetch(`${API_BASE_URL}/recommend-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ user_skills: userSkills, limit: 50 })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.detail || 'Job recommendations routing failed.');
    }
    return response.json();
  },

  async getRoadmap(userId: number, jobId: number = 1) {
    const response = await fetch(`${API_BASE_URL}/roadmap/${userId}/${jobId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Session Timeout');
    return response.json();
  },

  async pivotCareer(targetRole: string, userSkills: string[] = []) {
    const response = await fetch(`${API_BASE_URL}/roadmap/live-pivot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ target_role: targetRole, user_skills: userSkills })
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.detail || 'Live NLP scraper routing failed.');
    }
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
  },

  async listCertificates() {
    const response = await fetch(`${API_BASE_URL}/profile/certificates`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to load certificates');
    return response.json();
  },

  async importResumeProfile() {
    const response = await fetch(`${API_BASE_URL}/profile/resume-import`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to import profile');
    return response.json();
  },

  async getExpiringCertificates(days = 60) {
    const response = await fetch(`${API_BASE_URL}/profile/certificates/expiring?days=${days}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to load certificate reminders');
    return response.json();
  },

  async getAtsScore(jobId: number) {
    const response = await fetch(`${API_BASE_URL}/profile/ats-score/${jobId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to calculate ATS score');
    return response.json();
  },

  async addCertificate(data: {
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
    skills: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/profile/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Unable to save certificate');
    return response.json();
  },

  async listResumeDocuments() {
    const response = await fetch(`${API_BASE_URL}/resume-documents`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to load resumes');
    return response.json();
  },

  async createResumeDocument(data: { title: string; template: string; content: Record<string, unknown> }) {
    const response = await fetch(`${API_BASE_URL}/resume-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Unable to create resume');
    return response.json();
  },

  async updateResumeDocument(id: number, data: { title: string; template: string; content: Record<string, unknown> }) {
    const response = await fetch(`${API_BASE_URL}/resume-documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Unable to save resume');
    return response.json();
  },

  async listResumeVersions(id: number) {
    const response = await fetch(`${API_BASE_URL}/resume-documents/${id}/versions`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to load resume versions');
    return response.json();
  },

  async createResumeVersion(id: number, label: string) {
    const response = await fetch(`${API_BASE_URL}/resume-documents/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ label }),
    });
    if (!response.ok) throw new Error('Unable to save resume version');
    return response.json();
  },

  async restoreResumeVersion(resumeId: number, versionId: number) {
    const response = await fetch(`${API_BASE_URL}/resume-documents/${resumeId}/versions/${versionId}/restore`, {
      method: 'POST', headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Unable to restore resume version');
    return response.json();
  },

  async improveResume(data: { resume_id?: number; job_description?: string }) {
    const response = await fetch(`${API_BASE_URL}/resume/improve`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Unable to improve resume');
    return response.json();
  },
  async createCoverLetter(data: { title?: string; job_id?: number; application_id?: number; tone?: string; job_description?: string }) {
    const response = await fetch(`${API_BASE_URL}/cover-letters`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Unable to create cover letter');
    return response.json();
  },
  async matchJob(data: { job_id?: number; job_description: string }) {
    const response = await fetch(`${API_BASE_URL}/jobs/match`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Unable to match job');
    return response.json();
  },
  async createInterview(role: string, job_id?: number) {
    const response = await fetch(`${API_BASE_URL}/interviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ role, job_id }) });
    if (!response.ok) throw new Error('Unable to create interview');
    return response.json();
  },
  async answerInterview(sessionId: number, question_index: number, answer: string) {
    const response = await fetch(`${API_BASE_URL}/interviews/${sessionId}/answers`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ question_index, answer }) });
    if (!response.ok) throw new Error('Unable to evaluate answer');
    return response.json();
  },
  async createReminder(data: { title: string; reminder_type?: string; due_at: string; notes?: string }) {
    const response = await fetch(`${API_BASE_URL}/reminders`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Unable to create reminder');
    return response.json();
  },
  async savePortfolio(data: { slug: string; headline: string; bio: string; is_public: boolean }) {
    const response = await fetch(`${API_BASE_URL}/portfolio`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Unable to save portfolio');
    return response.json();
  },
  async optimizeLinkedIn() {
    const response = await fetch(`${API_BASE_URL}/linkedin/optimize`, { method: 'POST', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to optimize LinkedIn profile');
    return response.json();
  },
  async createJobAlert(data: { name: string; role?: string; location?: string; skills?: string[]; frequency?: string }) {
    const response = await fetch(`${API_BASE_URL}/job-alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Unable to create job alert');
    return response.json();
  },
  async getCareerAnalytics() {
    const response = await fetch(`${API_BASE_URL}/analytics/career`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Unable to load career analytics');
    return response.json();
  }
};
