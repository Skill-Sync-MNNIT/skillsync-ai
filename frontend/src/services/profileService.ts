import api from './api';

export interface StudentProfileData {
  _id?: string;
  userId: string;
  name?: string;
  course?: string;
  branch?: string;
  year?: number;
  cpi?: number;
  skills?: string[];
  embeddingStatus?: 'pending' | 'processing' | 'indexed' | 'failed';
  resumeStorageKey?: string;
}

export const profileService = {
  /**
   * Fetch a user's profile by ID.
   */
  fetchProfile: async (userId: string): Promise<StudentProfileData> => {
    const response = await api.get(`/profile/${userId}`);
    return response.data.data;
  },

  /**
   * Update the current user's profile details.
   */
  updateProfile: async (data: {
    name?: string;
    course?: string;
    branch?: string;
    year?: number;
    cpi?: number;
    skills?: string[];
  }) => {
    const response = await api.put('/profile', data);
    return response.data.data;
  },

  /**
   * Upload a PDF resume.
   */
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  /**
   * Get the Cloudinary temporary signed URL to download a resume.
   */
  getResumeUrl: async (userId: string): Promise<string> => {
    const response = await api.get(`/profile/resume/${userId}`);
    return response.data.data.signedUrl;
  },
};
