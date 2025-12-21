import api from './api';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  position: string;
  description: string;
  requirements: string[];
  location: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salaryRange?: string;
  status: 'OPEN' | 'CLOSED';
  postedAt: string;
  applications?: JobApplication[];
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resume?: string;
  coverLetter?: string;
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  appliedAt: string;
  jobPosting?: JobPosting;
}

export const recruitmentService = {
  // Job Postings
  createJobPosting: async (data: Omit<JobPosting, 'id' | 'postedAt' | 'status'>): Promise<JobPosting> => {
    const response = await api.post('/recruitment/jobs', data);
    return response.data.data;
  },

  getJobPostings: async (status?: JobPosting['status']): Promise<JobPosting[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/recruitment/jobs${params}`);
    return response.data.data;
  },

  getJobPostingById: async (id: string): Promise<JobPosting> => {
    const response = await api.get(`/recruitment/jobs/${id}`);
    return response.data.data;
  },

  updateJobPosting: async (id: string, data: Partial<JobPosting>): Promise<JobPosting> => {
    const response = await api.put(`/recruitment/jobs/${id}`, data);
    return response.data.data;
  },

  // Applications
  applyForJob: async (data: {
    jobPostingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    resume?: string;
    coverLetter?: string;
  }): Promise<JobApplication> => {
    const response = await api.post('/recruitment/applications', data);
    return response.data.data;
  },

  getApplications: async (jobPostingId?: string, status?: JobApplication['status']): Promise<JobApplication[]> => {
    const params = new URLSearchParams();
    if (jobPostingId) params.append('jobPostingId', jobPostingId);
    if (status) params.append('status', status);

    const response = await api.get(`/recruitment/applications?${params}`);
    return response.data.data;
  },

  updateApplicationStatus: async (id: string, status: JobApplication['status']): Promise<JobApplication> => {
    const response = await api.put(`/recruitment/applications/${id}/status`, { status });
    return response.data.data;
  },
};


