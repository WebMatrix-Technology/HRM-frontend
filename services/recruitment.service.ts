import api from './api';

export interface Job {
  _id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  requirements: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  postedBy: any; // User object ref
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  _id: string;
  jobId: Job | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  notes: {
    text: string;
    author: string;
    date: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const recruitmentService = {
  // Jobs
  getJobs: async (params?: { status?: string; department?: string; type?: string }) => {
    const response = await api.get('/recruitment/jobs', { params });
    // Handle both wrapped {success:true, data:[]} and direct [] responses
    return response.data.data || response.data;
  },

  getJobById: async (id: string) => {
    const response = await api.get(`/recruitment/jobs/${id}`);
    return response.data.data || response.data;
  },

  createJob: async (data: Partial<Job>) => {
    const response = await api.post('/recruitment/jobs', data);
    return response.data.data || response.data;
  },

  updateJob: async (id: string, data: Partial<Job>) => {
    const response = await api.put(`/recruitment/jobs/${id}`, data);
    return response.data.data || response.data;
  },

  // Candidates
  applyForJob: async (jobId: string, data: Partial<Candidate> | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.post(`/recruitment/jobs/${jobId}/apply`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data.data || response.data;
  },

  getCandidates: async (params?: { jobId?: string; status?: string }) => {
    const response = await api.get('/recruitment/candidates', { params });
    return response.data.data || response.data;
  },

  updateCandidateStatus: async (id: string, status: string, note?: string) => {
    const response = await api.put(`/recruitment/candidates/${id}/status`, { status, note });
    return response.data.data || response.data;
  },
};
